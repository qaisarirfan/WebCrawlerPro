import type { NextApiRequest, NextApiResponse } from 'next';
import { stopCrawler, isRunning } from '../../../utils/crawler';
import { GenericResponse } from '../../../types/crawler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Check if crawler is running
    if (!isRunning()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Crawler is not running' 
      });
    }

    // Stop the crawler
    stopCrawler();

    return res.status(200).json({ 
      success: true, 
      message: 'Crawler stop requested successfully' 
    });
  } catch (error) {
    console.error('Error stopping crawler:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to stop crawler: ${error.message}` 
    });
  }
}
