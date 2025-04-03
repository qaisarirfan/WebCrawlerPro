import fs from 'fs';
import path from 'path';
import { CrawlResult, WhatsAppLink } from '../types/crawler';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
const configPath = path.join(dataDir, 'crawler-config.json');
const statusPath = path.join(dataDir, 'crawler-status.json');

export const initFileSystem = () => {
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
    const data = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(data);
    return config.urls || [];
  } catch (error) {
    console.error('Error reading URL configuration:', error);
    return [];
  }
};

export const saveWhatsAppLinks = (domain: string, links: WhatsAppLink[]): void => {
  initFileSystem();
  
  // Sanitize domain for filename
  const sanitizedDomain = domain.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filePath = path.join(dataDir, `${sanitizedDomain}.json`);
  
  // Load existing data if file exists
  let existingLinks: WhatsAppLink[] = [];
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      existingLinks = JSON.parse(data);
    } catch (error) {
      console.error(`Error reading existing links for ${domain}:`, error);
    }
  }
  
  // Merge links and remove duplicates based on code
  const uniqueCodes = new Set();
  const uniqueLinks = [...existingLinks, ...links].filter(link => {
    if (uniqueCodes.has(link.code)) {
      return false;
    }
    uniqueCodes.add(link.code);
    return true;
  });
  
  // Save the updated links
  fs.writeFileSync(filePath, JSON.stringify(uniqueLinks, null, 2));
};

export const saveStatus = (status: any): void => {
  initFileSystem();
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
};

export const getStatus = (): any => {
  initFileSystem();
  if (!fs.existsSync(statusPath)) {
    return null;
  }
  try {
    const data = fs.readFileSync(statusPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading crawler status:', error);
    return null;
  }
};
