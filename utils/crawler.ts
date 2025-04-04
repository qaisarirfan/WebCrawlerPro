import { CheerioCrawler, RequestQueue, PlaywrightCrawler, BasicCrawler } from 'crawlee';
import { WhatsAppLink, CrawlerStatus, CrawlerConfig } from '../types/crawler';
import { saveWhatsAppLinks, saveStatus, getStatus } from './fileSystem';
import { defaultUrls } from './defaultUrls';
import fs from 'fs';
import path from 'path';

// Regular expression to find WhatsApp invite links
const whatsappLinkRegex = /https:\/\/chat\.whatsapp\.com(?:\/invite)?\/([A-Za-z0-9]{22})/gm;

// Global variables to track crawler state
let isCrawlerRunning = false;
let stopRequested = false;
let currentStatus: CrawlerStatus = {
  isRunning: false,
  progress: 0,
  totalUrls: 0,
  processedUrls: 0,
  errors: []
};

let crawler: BasicCrawler | CheerioCrawler | PlaywrightCrawler | null = null;
let requestQueue: RequestQueue | null = null;
let totalRequestsAdded = 0;
let processedRequests = 0;

// Get crawler configuration
const getCrawlerConfig = (): CrawlerConfig => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const configPath = path.join(dataDir, 'crawler-settings.json');
  
  // Default configuration
  const defaultConfig: CrawlerConfig = {
    maxConcurrency: 5,
    maxRequestsPerCrawl: 100,
    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 60,
    navigationTimeoutSecs: 30,
    sameDomainDelaySecs: 1,
    useHeadless: false
  };
  
  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }
  
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading crawler config:', error);
    return defaultConfig;
  }
};

// Extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    // If URL parsing fails, return a sanitized version of the URL
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }
};

// Create a consistent filename for saving data from a URL
const createConsistentFilename = (url: string): string => {
  const domain = extractDomain(url);
  return domain.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
};

// Extract invite link code from URL
export const extractInviteLink = (url: string | null | undefined): WhatsAppLink | null => {
  if (!url) return null;
  
  try {
    // Updated regex to match WhatsApp invite links with more flexibility
    const match = url.match(/https:\/\/chat\.whatsapp\.com(?:\/invite)?\/([A-Za-z0-9]{22})/);
    if (match && match[1]) {
      return {
        code: match[1],
        url: match[0]
      };
    }
  } catch (error) {
    console.error('Error extracting invite link:', error);
  }
  return null;
};

// Start crawler for a single URL
export const crawlSingleUrl = async (url: string): Promise<void> => {
  if (isCrawlerRunning) {
    return;
  }
  
  // Start a crawler that only processes this URL
  return startCrawler([url], true);
};

// Start the crawler with the given URLs
export const startCrawler = async (urls: string[], singleMode = false): Promise<void> => {
  if (isCrawlerRunning) {
    return;
  }
  
  isCrawlerRunning = true;
  stopRequested = false;
  totalRequestsAdded = urls.length;
  processedRequests = 0;
  
  // Get crawler configuration
  const config = getCrawlerConfig();
  
  // Initialize status
  currentStatus = {
    isRunning: true,
    progress: 0,
    totalUrls: urls.length, // This will be updated as we discover more URLs
    processedUrls: 0,
    errors: [],
    startTime: new Date(),
    lastUpdate: new Date()
  };
  saveStatus(currentStatus);
  
  // Create a request queue with the initial URLs
  requestQueue = await RequestQueue.open();
  
  // Add the initial URLs to the queue
  for (const url of urls) {
    await requestQueue.addRequest({ url });
  }
  
  try {
    // Choose either headless browser or basic crawler based on settings
    if (config.useHeadless) {
      // Use Playwright for JavaScript-rendered content
      crawler = new PlaywrightCrawler({
        // Use the request queue we created
        requestQueue,
        
        // Use configuration from settings
        maxRequestsPerCrawl: config.maxRequestsPerCrawl,
        maxConcurrency: config.maxConcurrency,
        maxRequestRetries: config.maxRequestRetries,
        requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,
        
        // For headless browser mode
        navigationTimeoutSecs: config.navigationTimeoutSecs,
        
        // Add delay between requests to the same domain to avoid rate limiting
        sameDomainDelaySecs: config.sameDomainDelaySecs,
        
        // Handle failed requests
        failedRequestHandler(context: any) {
          const { request, error } = context;
          console.error(`Request ${request.url} failed: ${error?.message || 'Unknown error'}`);
          currentStatus.errors.push(`Failed to crawl ${request.url}: ${error?.message || 'Unknown error'}`);
          
          // Update progress for failed requests too
          processedRequests++;
          currentStatus.processedUrls = processedRequests;
          currentStatus.progress = Math.min(
            100, 
            Math.round((processedRequests / totalRequestsAdded) * 100)
          );
          
          saveStatus(currentStatus);
        },
        
        // Handle each request with Playwright
        async requestHandler({ page, request, enqueueLinks }) {
          // Update status
          console.log(`Crawling with headless browser: ${request.url}`);
          currentStatus.currentUrl = request.url;
          currentStatus.lastUpdate = new Date();
          
          if (stopRequested) {
            return;
          }
          
          try {
            // Wait for page to load
            await page.waitForLoadState('networkidle');
            
            // Get page content
            const content = await page.content();
            
            // Find WhatsApp links in content using regex
            const waLinks: WhatsAppLink[] = [];
            let match;
            whatsappLinkRegex.lastIndex = 0;
            const bodyText = content;
            
            while ((match = whatsappLinkRegex.exec(bodyText)) !== null) {
              const link = extractInviteLink(match[0]);
              if (link) {
                waLinks.push(link);
              }
            }
            
            // Get all href attributes
            const hrefs = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('a')).map(a => a.href);
            });
            
            // Extract WhatsApp links from href attributes
            for (const href of hrefs) {
              const link = extractInviteLink(href);
              if (link) {
                waLinks.push(link);
              }
            }
            
            // Save the extracted links with a consistent filename based on domain
            if (waLinks.length > 0) {
              const domain = extractDomain(request.url);
              saveWhatsAppLinks(domain, waLinks);
            }
            
            // If in single URL mode, don't enqueue additional URLs
            if (!stopRequested && !singleMode) {
              const enqueuedUrls = await enqueueLinks({
                strategy: 'same-domain',
                // Exclude some problematic URLs
                exclude: [
                  'https://www.hindustantimes.com',
                  '*/wp-admin/*',
                  '*/wp-login.php*',
                  '*/logout*',
                  '*/sign-out*'
                ],
              });
              
              // Update the total requests added with newly enqueued URLs
              const enqueuedCount = Array.isArray(enqueuedUrls) ? enqueuedUrls.length : 
                                   (enqueuedUrls as any).processedRequests?.length || 0;
                                   
              if (enqueuedCount > 0) {
                totalRequestsAdded += enqueuedCount;
                currentStatus.totalUrls = totalRequestsAdded;
              }
            }
            
            // Update progress
            processedRequests++;
            currentStatus.processedUrls = processedRequests;
            
            // Get queue info to calculate more accurate progress
            const queueInfo = requestQueue ? await requestQueue.getInfo() : null;
            
            // Calculate progress based on processed vs total
            if (queueInfo && queueInfo.totalRequestCount > 0) {
              // Use handledRequestCount from queue info for more accuracy
              const handledCount = queueInfo.handledRequestCount;
              // Progress is the ratio of handled requests to total requests
              currentStatus.progress = Math.min(
                100, 
                Math.round((handledCount / Math.max(totalRequestsAdded, queueInfo.totalRequestCount)) * 100)
              );
            } else {
              // Fallback calculation if queue info not available
              currentStatus.progress = Math.min(
                100, 
                Math.round((processedRequests / totalRequestsAdded) * 100)
              );
            }
            
            saveStatus(currentStatus);
            
          } catch (error: any) {
            console.error(`Error processing ${request.url}:`, error);
            currentStatus.errors.push(`Error processing ${request.url}: ${error.message || 'Unknown error'}`);
            saveStatus(currentStatus);
          }
        }
      });
    } else {
      // Use Cheerio for static HTML parsing (faster)
      crawler = new CheerioCrawler({
        // Use the request queue we created
        requestQueue,
        
        // Use configuration from settings
        maxRequestsPerCrawl: config.maxRequestsPerCrawl,
        maxConcurrency: config.maxConcurrency,
        maxRequestRetries: config.maxRequestRetries,
        requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,
        
        // For headless browser mode (if enabled)
        navigationTimeoutSecs: config.navigationTimeoutSecs,
        
        // Add delay between requests to the same domain to avoid rate limiting
        sameDomainDelaySecs: config.sameDomainDelaySecs,
        
        // Handle each request
        async requestHandler({ $, enqueueLinks, request, crawler }) {
          // Update status
          console.log(`Crawling: ${request.url}`);
          currentStatus.currentUrl = request.url;
          currentStatus.lastUpdate = new Date();
          
          if (stopRequested) {
            return;
          }
          
          try {
            const waLinks: WhatsAppLink[] = [];
            
            // Extract links from <a> tags
            $('a').each((_, element) => {
              const link = extractInviteLink($(element).attr('href'));
              if (link) {
                waLinks.push(link);
              }
            });
            
            // Extract links from body text
            const bodyText = $('body').text();
            let match;
            // Reset regex lastIndex before using it again
            whatsappLinkRegex.lastIndex = 0;
            while ((match = whatsappLinkRegex.exec(bodyText)) !== null) {
              const link = extractInviteLink(match[0]);
              if (link) {
                waLinks.push(link);
              }
            }
            
            // Save the extracted links with a consistent filename based on domain
            if (waLinks.length > 0) {
              const domain = extractDomain(request.url);
              saveWhatsAppLinks(domain, waLinks);
            }
            
            // If in single URL mode, don't enqueue additional URLs
            if (!stopRequested && !singleMode) {
              const enqueuedUrls = await enqueueLinks({
                strategy: 'same-domain',
                // Exclude some problematic URLs
                exclude: [
                  'https://www.hindustantimes.com',
                  '*/wp-admin/*',
                  '*/wp-login.php*',
                  '*/logout*',
                  '*/sign-out*'
                ],
              });
              
              // Update the total requests added with newly enqueued URLs
              const enqueuedCount = Array.isArray(enqueuedUrls) ? enqueuedUrls.length : 
                                 (enqueuedUrls as any).processedRequests?.length || 0;
                                 
              if (enqueuedCount > 0) {
                totalRequestsAdded += enqueuedCount;
                currentStatus.totalUrls = totalRequestsAdded;
              }
            }
            
            // Update progress
            processedRequests++;
            currentStatus.processedUrls = processedRequests;
            
            // Get queue info to calculate more accurate progress
            const queueInfo = requestQueue ? await requestQueue.getInfo() : null;
            
            // Calculate progress based on processed vs total (including newly discovered)
            if (queueInfo && queueInfo.totalRequestCount > 0) {
              // Use handledRequestCount from queue info for more accuracy
              const handledCount = queueInfo.handledRequestCount;
              // Progress is the ratio of handled requests to total requests
              currentStatus.progress = Math.min(
                100, 
                Math.round((handledCount / Math.max(totalRequestsAdded, queueInfo.totalRequestCount)) * 100)
              );
            } else {
              // Fallback calculation if queue info not available
              currentStatus.progress = Math.min(
                100, 
                Math.round((processedRequests / totalRequestsAdded) * 100)
              );
            }
            
            saveStatus(currentStatus);
            
          } catch (error: any) {
            console.error(`Error processing ${request.url}:`, error);
            currentStatus.errors.push(`Error processing ${request.url}: ${error.message || 'Unknown error'}`);
            saveStatus(currentStatus);
          }
        },
        
        // Handle failed requests
        failedRequestHandler(context: any) {
          const { request, error } = context;
          console.error(`Request ${request.url} failed: ${error?.message || 'Unknown error'}`);
          currentStatus.errors.push(`Failed to crawl ${request.url}: ${error?.message || 'Unknown error'}`);
          
          // Update progress for failed requests too
          processedRequests++;
          currentStatus.processedUrls = processedRequests;
          currentStatus.progress = Math.min(
            100, 
            Math.round((processedRequests / totalRequestsAdded) * 100)
          );
          
          saveStatus(currentStatus);
        }
      });
    }
    
    // Start the crawler with the request queue
    await crawler.run();
  } catch (error: any) {
    console.error('Crawler error:', error);
    currentStatus.errors.push(`Crawler error: ${error.message || 'Unknown error'}`);
  } finally {
    // Mark crawler as stopped
    isCrawlerRunning = false;
    currentStatus.isRunning = false;
    currentStatus.lastUpdate = new Date();
    currentStatus.progress = 100; // Ensure progress is 100% when stopped
    saveStatus(currentStatus);
    crawler = null;
    
    // Purge the request queue to clean up
    if (requestQueue) {
      await requestQueue.drop();
      requestQueue = null;
    }
  }
};

// Stop the crawler
export const stopCrawler = (): void => {
  if (crawler) {
    stopRequested = true;
    // Abort the crawler's pool of requests
    crawler.autoscaledPool?.abort();
    console.log('Crawler stopping...');
    currentStatus.lastUpdate = new Date();
    saveStatus(currentStatus);
  }
};

// Get current crawler status
export const getCrawlerStatus = (): CrawlerStatus => {
  const savedStatus = getStatus();
  if (savedStatus) {
    return savedStatus;
  }
  return currentStatus;
};

// Check if crawler is running
export const isRunning = (): boolean => {
  return isCrawlerRunning;
};