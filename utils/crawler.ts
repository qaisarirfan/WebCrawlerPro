import { CheerioCrawler, RequestQueue } from 'crawlee';
import { WhatsAppLink, CrawlerStatus } from '../types/crawler';
import { saveWhatsAppLinks, saveStatus, getStatus } from './fileSystem';
import { defaultUrls } from './defaultUrls';

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

let crawler: CheerioCrawler | null = null;
let requestQueue: RequestQueue | null = null;
let totalRequestsAdded = 0;
let processedRequests = 0;

// Extract invite link code from URL
export const extractInviteLink = (url: string | null | undefined): WhatsAppLink | null => {
  if (!url) return null;
  
  try {
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

// Start the crawler with the given URLs
export const startCrawler = async (urls: string[]): Promise<void> => {
  if (isCrawlerRunning) {
    return;
  }
  
  isCrawlerRunning = true;
  stopRequested = false;
  totalRequestsAdded = urls.length;
  processedRequests = 0;
  
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
  
  // Initialize Crawler
  crawler = new CheerioCrawler({
    // Use the request queue we created
    requestQueue,
    
    // Use maxRequestsPerCrawl to limit the number of requests
    // Using a high number but not too high to avoid overloading
    maxRequestsPerCrawl: 1000,
    
    // Set a reasonable concurrency
    maxConcurrency: 10,
    
    // Add timeout for each request
    requestHandlerTimeoutSecs: 60,
    
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
        
        // Save the extracted links
        if (waLinks.length > 0) {
          const domain = new URL(request.url).hostname;
          saveWhatsAppLinks(domain, waLinks);
        }
        
        // Enqueue links for crawling (only for the same domain)
        if (!stopRequested) {
          const enqueuedUrls = await enqueueLinks({
            strategy: 'same-domain',
            // Exclude some problematic URLs
            exclude: ['https://www.hindustantimes.com'],
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
  
  try {
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
