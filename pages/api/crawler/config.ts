import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
const configPath = path.join(dataDir, 'crawler-settings.json');

// Default crawler configuration
const defaultConfig = {
  maxConcurrency: 10,
  maxRequestsPerCrawl: 1000,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 60,
  navigationTimeoutSecs: 30,
  sameDomainDelaySecs: 1,
  useHeadless: false
};

// Ensure data directory exists
const initFileSystem = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Save configuration to file
const saveConfig = (config: any): void => {
  initFileSystem();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

// Get configuration from file or return default
const getConfig = (): any => {
  initFileSystem();
  if (!fs.existsSync(configPath)) {
    saveConfig(defaultConfig);
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET request to retrieve current configuration
  if (req.method === 'GET') {
    const config = getConfig();
    return res.status(200).json(config);
  }
  
  // POST request to update configuration
  else if (req.method === 'POST') {
    try {
      const newConfig = req.body;
      
      // Validate inputs
      if (
        typeof newConfig.maxConcurrency !== 'number' ||
        typeof newConfig.maxRequestsPerCrawl !== 'number' ||
        typeof newConfig.maxRequestRetries !== 'number' ||
        typeof newConfig.requestHandlerTimeoutSecs !== 'number' ||
        typeof newConfig.navigationTimeoutSecs !== 'number' ||
        typeof newConfig.sameDomainDelaySecs !== 'number'
      ) {
        return res.status(400).json({ message: 'Invalid configuration format' });
      }
      
      // Enforce minimum values
      const sanitizedConfig = {
        maxConcurrency: Math.max(1, Math.min(50, newConfig.maxConcurrency)),
        maxRequestsPerCrawl: Math.max(1, newConfig.maxRequestsPerCrawl),
        maxRequestRetries: Math.max(0, Math.min(10, newConfig.maxRequestRetries)),
        requestHandlerTimeoutSecs: Math.max(1, newConfig.requestHandlerTimeoutSecs),
        navigationTimeoutSecs: Math.max(1, newConfig.navigationTimeoutSecs),
        sameDomainDelaySecs: Math.max(0, newConfig.sameDomainDelaySecs),
        useHeadless: Boolean(newConfig.useHeadless)
      };
      
      saveConfig(sanitizedConfig);
      return res.status(200).json({ message: 'Configuration saved successfully' });
    } catch (error) {
      console.error('Error saving crawler config:', error);
      return res.status(500).json({ message: 'Error saving configuration' });
    }
  }
  
  // Handle other HTTP methods
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}