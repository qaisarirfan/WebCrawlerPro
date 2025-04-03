import type { NextApiRequest, NextApiResponse } from 'next';
import { getUrls, saveUrls } from '../../../utils/fileSystem';
import { AddUrlRequest, GenericResponse } from '../../../types/crawler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenericResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { url } = req.body as AddUrlRequest;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL is required' 
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid URL format' 
      });
    }

    // Get existing URLs
    const existingUrls = getUrls();
    
    // Check if URL already exists
    if (existingUrls.includes(url)) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL already exists in the crawl list' 
      });
    }

    // Add new URL and save
    const updatedUrls = [...existingUrls, url];
    saveUrls(updatedUrls);

    return res.status(200).json({ 
      success: true, 
      message: 'URL added successfully' 
    });
  } catch (error) {
    console.error('Error adding URL:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to add URL: ${error.message}` 
    });
  }
}
