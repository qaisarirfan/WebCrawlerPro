import fs from 'fs';
import path from 'path';
import { CrawlResult, WhatsAppLink, EnqueuedUrl, CrawlerStatus } from '../types/crawler';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), "data");
const crawlerDir = path.join(process.cwd(), "crawler");
const configPath = path.join(crawlerDir, "config.json");
const statusPath = path.join(crawlerDir, "status.json");
const enqueuedUrlsPath = path.join(crawlerDir, "enqueued-urls.json");
const errorsPath = path.join(crawlerDir, "errors.json");

export const initFileSystem = () => {
  if (!fs.existsSync(crawlerDir)) {
    fs.mkdirSync(crawlerDir, { recursive: true });
  }
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

export const saveUrls = (urls: string[]): void => {
  initFileSystem();
  fs.writeFileSync(configPath, JSON.stringify({ urls }, null, 2));
};

export const getUrls = (): string[] => {
  initFileSystem();
  if (!fs.existsSync(configPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(data);
    return config.urls || [];
  } catch (error) {
    console.error("Error reading URL configuration:", error);
    return [];
  }
};

// Extract domain root from hostname for consistent filenames
const getConsistentDomainName = (domain: string): string => {
  // Extract the root domain (e.g., example.com from sub.example.com)
  // First remove www. if present
  let cleanDomain = domain.replace(/^www\./, "");

  // Split by dots and take the last two parts if there are at least two parts
  const parts = cleanDomain.split(".");
  if (parts.length >= 2) {
    // For domains like example.co.uk, we'd want to keep "example"
    // For normal domains like example.com, we'd keep "example"
    // Check for common two-part TLDs like .co.uk
    if (parts.length > 2 && parts[parts.length - 2].length <= 3) {
      cleanDomain = parts[parts.length - 3];
    } else {
      cleanDomain = parts[parts.length - 2];
    }
  }

  return cleanDomain.toLowerCase();
};

export const saveWhatsAppLinks = (
  domain: string,
  links: WhatsAppLink[]
): void => {
  initFileSystem();

  // Sanitize domain for filename

  const filePath = path.join(dataDir, `results.json`);

  console.log(`Saving WhatsApp links from ${domain} to results.json`);

  // Load existing data if file exists
  let existingLinks: WhatsAppLink[] = [];
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf8");
      existingLinks = JSON.parse(data);
    } catch (error) {
      console.error(`Error reading existing links for ${domain}:`, error);
    }
  }

  // Merge links and remove duplicates based on code
  const uniqueCodes = new Set();
  const uniqueLinks = [...existingLinks, ...links].filter((link) => {
    if (uniqueCodes.has(link.code)) {
      return false;
    }
    uniqueCodes.add(link.code);
    return true;
  });

  // Save the updated links
  fs.writeFileSync(filePath, JSON.stringify(uniqueLinks, null, 2));
};

export const saveStatus = (status: CrawlerStatus): void => {
  initFileSystem();
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
};

export const getStatus = (): CrawlerStatus | null => {
  initFileSystem();
  if (!fs.existsSync(statusPath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(statusPath, 'utf8');
    return JSON.parse(data) as CrawlerStatus;
  } catch (error) {
    console.error('Error reading crawler status:', error);
    return null;
  }
};

export const saveEnqueuedUrls = (urls: EnqueuedUrl[]): void => {
  initFileSystem();
  fs.writeFileSync(enqueuedUrlsPath, JSON.stringify(urls, null, 2));
};

export const getEnqueuedUrls = (): EnqueuedUrl[] => {
  initFileSystem();
  if (!fs.existsSync(enqueuedUrlsPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(enqueuedUrlsPath, 'utf8');
    return JSON.parse(data) as EnqueuedUrl[];
  } catch (error) {
    console.error('Error reading enqueued URLs:', error);
    return [];
  }
};

export const saveErrors = (errors: string[]): void => {
  initFileSystem();
  fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
};

export const getErrors = (): string[] => {
  initFileSystem();
  if (!fs.existsSync(errorsPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(errorsPath, 'utf8');
    return JSON.parse(data) as string[];
  } catch (error) {
    console.error('Error reading crawler errors:', error);
    return [];
  }
};
