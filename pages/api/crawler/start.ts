import type { NextApiRequest, NextApiResponse } from 'next';
import { startCrawler, isRunning } from '../../../utils/crawler';
import { getUrls } from '../../../utils/fileSystem';
import { GenericResponse } from '../../../types/crawler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check if crawler is already running
    if (isRunning()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Crawler is already running' 
      });
    }

    // Get URLs to crawl
    const urls = getUrls();
    
    if (urls.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No URLs to crawl. Please add some URLs first.' 
      });
    }

    // Start crawler in the background
    startCrawler(urls).catch(error => {
      console.error('Crawler error:', error);
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Crawler started successfully' 
    });
  } catch (error) {
    console.error('Error starting crawler:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to start crawler: ${error.message}` 
    });
  }
}
