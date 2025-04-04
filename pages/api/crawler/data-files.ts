import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface WhatsAppLink {
  code: string;
  url: string;
}

interface DataFile {
  domain: string;
  path: string;
  links: WhatsAppLink[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept GET requests for this endpoint
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      return res.status(200).json([]);
    }

    // Read all JSON files from the data directory
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json') && file !== 'crawler-config.json' && file !== 'crawler-status.json' && file !== 'crawler-settings.json');

    // Parse each file and extract WhatsApp links
    const dataFiles: DataFile[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const links = JSON.parse(content) as WhatsAppLink[];
        
        if (Array.isArray(links) && links.length > 0) {
          // Use the filename without extension as the domain name
          const domain = file.replace('.json', '');
          
          dataFiles.push({
            domain,
            path: filePath,
            links
          });
        }
      } catch (error) {
        console.error(`Error parsing file ${file}:`, error);
        // Skip files that can't be parsed
        continue;
      }
    }

    // Sort by domain name
    dataFiles.sort((a, b) => a.domain.localeCompare(b.domain));

    return res.status(200).json(dataFiles);
  } catch (error) {
    console.error('Error in data-files API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}