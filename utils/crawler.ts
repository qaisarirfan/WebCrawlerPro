import axios from 'axios';
import * as cheerio from 'cheerio';
import { WhatsAppLink, CrawlerStatus } from '../types/crawler';
import { saveWhatsAppLinks, saveStatus, getStatus } from './fileSystem';

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

// Fetch and parse a webpage to extract WhatsApp group links
const crawlUrl = async (url: string): Promise<WhatsAppLink[]> => {
  try {
    // Update status
    currentStatus.currentUrl = url;
    saveStatus(currentStatus);
    
    // Fetch page content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout:
 30000
    });
    
    const $ = cheerio.load(response.data);
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
    while ((match = whatsappLinkRegex.exec(bodyText)) !== null) {
      const link = extractInviteLink(match[0]);
      if (link) {
        waLinks.push(link);
      }
    }
    
    // Get domain for file naming
    const domain = new URL(url).hostname;
    
    // Save the links
    if (waLinks.length > 0) {
      saveWhatsAppLinks(domain, waLinks);
    }
    
    return waLinks;
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    currentStatus.errors.push(`Failed to crawl ${url}: ${error.message}`);
    saveStatus(currentStatus);
    return [];
  }
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
  
  // Process URLs sequentially
  for (let i = 0; i < urls.length; i++) {
    if (stopRequested) {
      break;
    }
    
    try {
      await crawlUrl(urls[i]);
      currentStatus.processedUrls++;
      currentStatus.progress = (currentStatus.processedUrls / currentStatus.totalUrls) * 100;
      currentStatus.lastUpdate = new Date();
      saveStatus(currentStatus);
    } catch (error) {
      console.error(`Error processing URL ${urls[i]}:`, error);
      currentStatus.errors.push(`Error processing URL ${urls[i]}: ${error.message}`);
      saveStatus(currentStatus);
    }
  }
  
  // Mark crawler as stopped
  isCrawlerRunning = false;
  currentStatus.isRunning = false;
  currentStatus.lastUpdate = new Date();
  saveStatus(currentStatus);
};

// Stop the crawler
export const stopCrawler = (): void => {
  stopRequested = true;
  currentStatus.lastUpdate = new Date();
  saveStatus(currentStatus);
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
