import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "results.json");

    // Check if data directory exists
    if (!fs.existsSync(dataDir) || !fs.existsSync(filePath)) {
      return res.status(200).json([]);
    }

    const content = fs.readFileSync(filePath, "utf8");
    const links = JSON.parse(content) as WhatsAppLink[];

    return res.status(200).json(links);
  } catch (error) {
    console.error("Error in data-files API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
