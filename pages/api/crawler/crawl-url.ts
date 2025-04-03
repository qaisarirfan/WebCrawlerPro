import type { NextApiRequest, NextApiResponse } from 'next';
import { isRunning, crawlSingleUrl } from '../../../utils/crawler';

interface RequestBody {
  url: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests for this endpoint
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Check if crawler is already running
    if (isRunning()) {
      return res.status(400).json({
        success: false,
        message: 'Crawler is already running. Please wait for it to finish or stop it first.'
      });
    }

    const { url } = req.body as RequestBody;

    // Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }

    // Start crawling the specific URL
    crawlSingleUrl(url).catch(error => {
      console.error('Error crawling URL:', error);
    });

    return res.status(200).json({
      success: true,
      message: `Crawler started for URL: ${url}`
    });
  } catch (error) {
    console.error('Error in crawl-url API:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}