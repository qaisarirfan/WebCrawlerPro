export interface CrawlerStatus {
  isRunning: boolean;
  currentUrl?: string;
  progress: number;
  totalUrls: number;
  processedUrls: number;
  startTime?: Date;
  lastUpdate?: Date;
  errors: string[];
  enqueuedUrls: EnqueuedUrl[];
  pendingUrls: number;
}

export interface EnqueuedUrl {
  url: string;
  enqueuedAt: Date;
  status: 'pending' | 'processing' | 'done' | 'failed';
}

export interface UrlItem {
  url: string;
  status: 'pending' | 'crawled' | 'error';
  lastCrawled?: Date;
}

export interface CrawlerConfig {
  maxConcurrency: number;
  maxRequestsPerCrawl: number;
  maxRequestRetries: number;
  requestHandlerTimeoutSecs: number;
  navigationTimeoutSecs: number;
  sameDomainDelaySecs: number;
  useHeadless: boolean;
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
