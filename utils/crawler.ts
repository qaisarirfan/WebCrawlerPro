import { CheerioCrawler } from 'crawlee';
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
  
  // Initialize status
  currentStatus = {
    isRunning: true,
    progress: 0,
    totalUrls: urls.length,
    processedUrls: 0,
    errors: [],
    startTime: new Date(),
    lastUpdate: new Date()
  };
  saveStatus(currentStatus);
  
  // Initialize Crawler
  crawler = new CheerioCrawler({
    // Use maxRequestsPerCrawl to limit the number of requests
    // Using a high number but not too high to avoid overloading
    maxRequestsPerCrawl: 1000,
    
    // Set a reasonable concurrency
    maxConcurrency: 10,
    
    // Add timeout for each request
    requestHandlerTimeoutSecs: 60,
    
    // Handle each request
    async requestHandler({ $, enqueueLinks, request }) {
      // Update status
      console.log(`Crawling: ${request.url}`);
      currentStatus.currentUrl = request.url;
      currentStatus.lastUpdate = new Date();
      saveStatus(currentStatus);
      
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
          await enqueueLinks({
            strategy: 'same-domain',
            // Exclude some problematic URLs
            exclude: ['https://www.hindustantimes.com'],
          });
        }
        
        // Update progress
        currentStatus.processedUrls++;
        currentStatus.progress = (currentStatus.processedUrls / currentStatus.totalUrls) * 100;
        saveStatus(currentStatus);
        
      } catch (error) {
        console.error(`Error processing ${request.url}:`, error);
        currentStatus.errors.push(`Error processing ${request.url}: ${error.message}`);
        saveStatus(currentStatus);
      }
    },
    
    // Handle failed requests
    failedRequestHandler({ request, error }) {
      console.error(`Request ${request.url} failed: ${error.message}`);
      currentStatus.errors.push(`Failed to crawl ${request.url}: ${error.message}`);
      currentStatus.processedUrls++;
      currentStatus.progress = (currentStatus.processedUrls / currentStatus.totalUrls) * 100;
      saveStatus(currentStatus);
    }
  });
  
  try {
    // Start the crawler with the provided URLs
    await crawler.run(urls);
  } catch (error) {
    console.error('Crawler error:', error);
    currentStatus.errors.push(`Crawler error: ${error.message}`);
  } finally {
    // Mark crawler as stopped
    isCrawlerRunning = false;
    currentStatus.isRunning = false;
    currentStatus.lastUpdate = new Date();
    saveStatus(currentStatus);
    crawler = null;
  }
};

// Stop the crawler
export const stopCrawler = (): void => {
  if (crawler) {
    stopRequested = true;
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
