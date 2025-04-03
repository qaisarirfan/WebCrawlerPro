import type { NextApiRequest, NextApiResponse } from 'next';
import { getUrls } from '../../../utils/fileSystem';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  if (req.method !== 'GET') {
    return res.status(405).json([]);
  }

  try {
    const urls = getUrls();
    return res.status(200).json(urls);
  } catch (error) {
    console.error('Error getting URLs:', error);
    return res.status(500).json([]);
  }
}
