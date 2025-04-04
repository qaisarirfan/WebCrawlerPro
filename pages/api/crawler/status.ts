import type { NextApiRequest, NextApiResponse } from 'next';
import { getCrawlerStatus } from '../../../utils/crawler-updated';
import { CrawlerStatus } from '../../../types/crawler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CrawlerStatus>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      isRunning: false,
      progress: 0,
      totalUrls: 0,
      processedUrls: 0,
      errors: ['Method not allowed'],
      enqueuedUrls: [],
      pendingUrls: 0
    });
  }

  try {
    const status = getCrawlerStatus();
    return res.status(200).json(status);
  } catch (error: any) {
    console.error('Error getting crawler status:', error);
    return res.status(500).json({
      isRunning: false,
      progress: 0,
      totalUrls: 0,
      processedUrls: 0,
      errors: [`Failed to get crawler status: ${error?.message || 'Unknown error'}`],
      enqueuedUrls: [],
      pendingUrls: 0
    });
  }
}
