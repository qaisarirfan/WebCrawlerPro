export interface CrawlerStatus {
  isRunning: boolean;
  currentUrl?: string;
  progress: number;
  totalUrls: number;
  processedUrls: number;
  startTime?: Date;
  lastUpdate?: Date;
  errors: string[];
}

export interface UrlItem {
  url: string;
  status: 'pending' | 'crawled' | 'error';
  lastCrawled?: Date;
}

export interface CrawlerConfig {
  urls: string[];
  maxConcurrency?: number;
  maxRequestsPerCrawl?: number;
}

export interface CrawlResult {
  url: string;
  links: string[];
  timestamp: Date;
}

export interface AddUrlRequest {
  url: string;
}

export interface GenericResponse {
  success: boolean;
  message: string;
}

export interface WhatsAppLink {
  code: string;
  url: string;
}
