import {
  CheerioCrawler,
  RequestQueue,
  PlaywrightCrawler,
  BasicCrawler,
} from "crawlee";
import {
  WhatsAppLink,
  CrawlerStatus,
  CrawlerConfig,
  EnqueuedUrl,
} from "../types/crawler";
import {
  saveWhatsAppLinks,
  saveStatus,
  getStatus,
  saveEnqueuedUrls,
  getEnqueuedUrls,
  saveErrors,
  getErrors,
} from "./fileSystem";
import { defaultUrls } from "./defaultUrls";
import fs from "fs";
import path from "path";

// Regular expressions to find WhatsApp invite links
// This pattern matches standard WhatsApp group invite links
const whatsappLinkRegex =
  /https:\/\/chat\.whatsapp\.com(?:\/invite)?\/([A-Za-z0-9]{22})/gm;
// Additional patterns for other possible WhatsApp invite URL formats
const whatsappLinkAltRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com)\/(?:join|send)\/?([A-Za-z0-9_-]+)/gm;

// Global variables to track crawler state
const savedStatus = getStatus();
// Initialize crawler running state from saved status
let isCrawlerRunning = savedStatus?.isRunning || false;
let stopRequested = false;

// Initialize crawler status from persisted state if available
const savedEnqueuedUrls = getEnqueuedUrls();
const savedErrors = getErrors();

// Helper function to add error and persist errors
const addError = (errorMessage: string) => {
  currentStatus.errors.push(errorMessage);
  // Keep errors at a manageable size
  if (currentStatus.errors.length > 100) {
    currentStatus.errors = currentStatus.errors.slice(-100);
  }
  // Persist errors to file
  saveErrors(currentStatus.errors);
};

let currentStatus: CrawlerStatus = savedStatus || {
  isRunning: false,
  progress: 0,
  totalUrls: 0,
  processedUrls: 0,
  errors: savedErrors || [],
  enqueuedUrls: savedEnqueuedUrls || [],
  pendingUrls: 0,
};

let crawler: BasicCrawler | CheerioCrawler | PlaywrightCrawler | null = null;
let requestQueue: RequestQueue | null = null;
let totalRequestsAdded = 0;
let processedRequests = 0;

// Get crawler configuration
const getCrawlerConfig = (): CrawlerConfig => {
  const crawlerDir = path.join(process.cwd(), "crawler");
  if (!fs.existsSync(crawlerDir)) {
    fs.mkdirSync(crawlerDir, { recursive: true });
  }

  const configPath = path.join(crawlerDir, "settings.json");

  // Default configuration
  const defaultConfig: CrawlerConfig = {
    maxConcurrency: 5,
    maxRequestsPerCrawl: 100,
    maxRequestRetries: 3,
    requestHandlerTimeoutSecs: 60,
    navigationTimeoutSecs: 30,
    sameDomainDelaySecs: 1,
    useHeadless: false,
  };

  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  try {
    const data = fs.readFileSync(configPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading crawler config:", error);
    return defaultConfig;
  }
};

// Extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    // If URL parsing fails, return a sanitized version of the URL
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];
  }
};

// Create a consistent filename for saving data from a URL
const createConsistentFilename = (url: string): string => {
  const domain = extractDomain(url);
  return domain.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
};

// Extract invite link code from URL
export const extractInviteLink = (
  url: string | null | undefined
): WhatsAppLink | null => {
  if (!url) return null;

  try {
    // First check for standard WhatsApp group invite links
    const standardMatch = url.match(
      /https:\/\/chat\.whatsapp\.com(?:\/invite)?\/([A-Za-z0-9]{22})/
    );
    if (standardMatch && standardMatch[1]) {
      return {
        code: standardMatch[1],
        url: standardMatch[0],
      };
    }

    // Check for alternative WhatsApp link formats (wa.me, api.whatsapp.com)
    const altMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com)\/(?:join|send)\/?([A-Za-z0-9_-]+)/
    );
    if (altMatch && altMatch[1] && altMatch[1].length >= 8) {
      // Only extract alternative links with a reasonable code length (minimum 8 chars)
      return {
        code: altMatch[1],
        url: altMatch[0].startsWith("http")
          ? altMatch[0]
          : `https://${altMatch[0]}`,
      };
    }

    // Look for invite links that might be in text with formatting or special characters
    const textMatch = url.match(
      /(?:whatsapp\.com|wa\.me)[\/\\:]?(?:invite)?[\/\\:]?([A-Za-z0-9]{8,})/i
    );
    if (textMatch && textMatch[1] && textMatch[1].length >= 8) {
      // Form a proper URL from a potentially malformed one
      const cleanCode = textMatch[1].replace(/[^A-Za-z0-9]/g, "");
      return {
        code: cleanCode,
        url: `https://chat.whatsapp.com/${cleanCode}`,
      };
    }
  } catch (error) {
    console.error("Error extracting invite link:", error);
  }
  return null;
};

// Helper to track processing of a URL
const updateUrlStatus = (
  url: string,
  status: "processing" | "done" | "failed"
) => {
  // Find the URL in our list and update its status
  const urlIndex = currentStatus.enqueuedUrls.findIndex(
    (item) => item.url === url
  );
  if (urlIndex !== -1) {
    currentStatus.enqueuedUrls[urlIndex].status = status;
  } else {
    // If not found (which shouldn't happen), add it
    currentStatus.enqueuedUrls.push({
      url,
      enqueuedAt: new Date(),
      status,
    });

    // Keep list at manageable size
    if (currentStatus.enqueuedUrls.length > 100) {
      currentStatus.enqueuedUrls = currentStatus.enqueuedUrls.slice(-100);
    }
  }

  // Update pending count
  currentStatus.pendingUrls = totalRequestsAdded - processedRequests;
};

// Start crawler for a single URL
export const crawlSingleUrl = async (url: string): Promise<void> => {
  if (isRunning()) {
    return;
  }

  // Start a crawler that only processes this URL
  return startCrawler([url], true);
};

// Start the crawler with the given URLs
export const startCrawler = async (
  urls: string[],
  singleMode = false
): Promise<void> => {
  if (isCrawlerRunning) {
    return;
  }

  isCrawlerRunning = true;
  stopRequested = false;
  totalRequestsAdded = urls.length;
  processedRequests = 0;

  // Get crawler configuration
  const config = getCrawlerConfig();

  // Initialize status
  currentStatus = {
    isRunning: true,
    progress: 0,
    totalUrls: urls.length, // This will be updated as we discover more URLs
    processedUrls: 0,
    errors: [],
    startTime: new Date(),
    lastUpdate: new Date(),
    enqueuedUrls: urls.map((url) => ({
      url,
      enqueuedAt: new Date(),
      status: "pending",
    })),
    pendingUrls: urls.length,
  };
  saveStatus(currentStatus);

  // Create a request queue with the initial URLs
  requestQueue = await RequestQueue.open();

  // Add the initial URLs to the queue
  for (const url of urls) {
    await requestQueue.addRequest({ url });
  }

  try {
    // Choose either headless browser or basic crawler based on settings
    if (config.useHeadless) {
      // Use Playwright for JavaScript-rendered content
      crawler = new PlaywrightCrawler({
        // Use the request queue we created
        requestQueue,

        // Use configuration from settings
        maxRequestsPerCrawl: config.maxRequestsPerCrawl,
        maxConcurrency: config.maxConcurrency,
        maxRequestRetries: config.maxRequestRetries,
        requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,

        // For headless browser mode
        navigationTimeoutSecs: config.navigationTimeoutSecs,

        // Add delay between requests to the same domain to avoid rate limiting
        sameDomainDelaySecs: config.sameDomainDelaySecs,

        // Handle failed requests
        failedRequestHandler(context: any) {
          const { request, error } = context;
          console.error(
            `Request ${request.url} failed: ${
              error?.message || "Unknown error"
            }`
          );
          addError(
            `Failed to crawl ${request.url}: ${
              error?.message || "Unknown error"
            }`
          );

          // Update URL status to failed
          updateUrlStatus(request.url, "failed");

          // Update progress for failed requests too
          processedRequests++;
          currentStatus.processedUrls = processedRequests;
          currentStatus.pendingUrls = totalRequestsAdded - processedRequests;
          currentStatus.progress = Math.min(
            100,
            Math.round((processedRequests / totalRequestsAdded) * 100)
          );

          saveStatus(currentStatus);
        },

        // Handle each request with Playwright
        async requestHandler({ page, request, enqueueLinks }) {
          // Update status
          console.log(`Crawling with headless browser: ${request.url}`);
          currentStatus.currentUrl = request.url;
          currentStatus.lastUpdate = new Date();

          // Mark this URL as processing
          updateUrlStatus(request.url, "processing");
          saveStatus(currentStatus);

          if (stopRequested) {
            return;
          }

          try {
            // Wait for page to load
            await page.waitForLoadState("networkidle");

            // Get page content
            const content = await page.content();

            // Find WhatsApp links in content using regex patterns
            const waLinks: WhatsAppLink[] = [];
            let match;

            // Search for primary WhatsApp invite links
            whatsappLinkRegex.lastIndex = 0;
            const bodyText = content;

            while ((match = whatsappLinkRegex.exec(bodyText)) !== null) {
              const link = extractInviteLink(match[0]);
              if (link) {
                // Check if this link is already in the array
                if (
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }
            }

            // Search for alternative WhatsApp link formats
            whatsappLinkAltRegex.lastIndex = 0;
            while ((match = whatsappLinkAltRegex.exec(bodyText)) !== null) {
              const link = extractInviteLink(match[0]);
              if (link) {
                // Check if this link is already in the array
                if (
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }
            }

            // Get all attributes that might contain URLs
            const allAttributes: string[] = await page.evaluate<string[]>(
              () => {
                // Create a properly typed array to store the extracted strings
                const results: string[] = [];

                try {
                  // Find all href attributes
                  document.querySelectorAll("a").forEach((a) => {
                    if (a.href) results.push(a.href);
                  });

                  // Find all data attributes that might contain URLs
                  document
                    .querySelectorAll(
                      "[data-url], [data-link], [data-href], [src]"
                    )
                    .forEach((el) => {
                      ["data-url", "data-link", "data-href", "src"].forEach(
                        (attr) => {
                          const value = el.getAttribute(attr);
                          if (value) results.push(value);
                        }
                      );
                    });

                  // Find all onclick attributes that might contain URLs
                  document.querySelectorAll("[onclick]").forEach((el) => {
                    const value = el.getAttribute("onclick");
                    if (value) results.push(value);
                  });
                } catch (error) {
                  console.error("Error extracting attributes:", error);
                }

                return results;
              }
            );

            // Extract WhatsApp links from all collected attributes
            for (const attr of allAttributes) {
              const link = extractInviteLink(attr);
              if (
                link &&
                !waLinks.some((existingLink) => existingLink.code === link.code)
              ) {
                waLinks.push(link);
              }
            }

            // Also search in the page's JavaScript content
            const scripts: string[] = await page.evaluate<string[]>(() => {
              try {
                return Array.from(document.querySelectorAll("script"))
                  .map((s) => s.innerText || "")
                  .filter(
                    (text) => typeof text === "string" && text.length > 0
                  );
              } catch (error) {
                console.error("Error extracting script contents:", error);
                return [];
              }
            });

            for (const script of scripts) {
              if (!script) continue;

              // Check primary regex
              whatsappLinkRegex.lastIndex = 0;
              let match;
              while ((match = whatsappLinkRegex.exec(script)) !== null) {
                const link = extractInviteLink(match[0]);
                if (
                  link &&
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }

              // Check alternative regex
              whatsappLinkAltRegex.lastIndex = 0;
              while ((match = whatsappLinkAltRegex.exec(script)) !== null) {
                const link = extractInviteLink(match[0]);
                if (
                  link &&
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }
            }

            // Save the extracted links with a consistent filename based on domain
            if (waLinks.length > 0) {
              const domain = extractDomain(request.url);
              saveWhatsAppLinks(domain, waLinks);
            }

            // If in single URL mode, don't enqueue additional URLs
            if (!stopRequested && !singleMode) {
              const enqueuedUrls = await enqueueLinks({
                strategy: "same-domain",
                // Exclude some problematic URLs
                exclude: [
                  "https://www.hindustantimes.com",
                  "*/wp-admin/*",
                  "*/wp-login.php*",
                  "*/logout*",
                  "*/sign-out*",
                ],
              });

              // Update the total requests added with newly enqueued URLs
              const enqueuedCount = Array.isArray(enqueuedUrls)
                ? enqueuedUrls.length
                : (enqueuedUrls as any).processedRequests?.length || 0;

              if (enqueuedCount > 0) {
                totalRequestsAdded += enqueuedCount;
                currentStatus.totalUrls = totalRequestsAdded;

                // Add newly enqueued URLs to the status
                const newEnqueuedUrls = Array.isArray(enqueuedUrls)
                  ? enqueuedUrls.map((req: any) => req.url || req)
                  : (enqueuedUrls as any).processedRequests?.map(
                      (req: any) => req.url || req
                    ) || [];

                // Add them to our tracking array
                currentStatus.enqueuedUrls.push(
                  ...newEnqueuedUrls.map((url: string) => ({
                    url,
                    enqueuedAt: new Date(),
                    status: "pending",
                  }))
                );

                // Keep only the most recent 100 URLs to avoid memory issues
                if (currentStatus.enqueuedUrls.length > 100) {
                  currentStatus.enqueuedUrls =
                    currentStatus.enqueuedUrls.slice(-100);
                }

                // Update pending count
                currentStatus.pendingUrls =
                  totalRequestsAdded - processedRequests;
              }
            }

            // Mark URL as done
            updateUrlStatus(request.url, "done");

            // Update progress
            processedRequests++;
            currentStatus.processedUrls = processedRequests;
            currentStatus.pendingUrls = totalRequestsAdded - processedRequests;

            // Get queue info to calculate more accurate progress
            const queueInfo = requestQueue
              ? await requestQueue.getInfo()
              : null;

            // Calculate progress based on processed vs total
            if (queueInfo && queueInfo.totalRequestCount > 0) {
              // Use handledRequestCount from queue info for more accuracy
              const handledCount = queueInfo.handledRequestCount;
              // Progress is the ratio of handled requests to total requests
              currentStatus.progress = Math.min(
                100,
                Math.round(
                  (handledCount /
                    Math.max(totalRequestsAdded, queueInfo.totalRequestCount)) *
                    100
                )
              );
            } else {
              // Fallback calculation if queue info not available
              currentStatus.progress = Math.min(
                100,
                Math.round((processedRequests / totalRequestsAdded) * 100)
              );
            }

            saveStatus(currentStatus);
          } catch (error: any) {
            console.error(`Error processing ${request.url}:`, error);
            currentStatus.errors.push(
              `Error processing ${request.url}: ${
                error.message || "Unknown error"
              }`
            );

            // Mark URL as failed
            updateUrlStatus(request.url, "failed");

            saveStatus(currentStatus);
          }
        },
      });
    } else {
      // Use Cheerio for static HTML parsing (faster)
      crawler = new CheerioCrawler({
        // Use the request queue we created
        requestQueue,

        // Use configuration from settings
        maxRequestsPerCrawl: config.maxRequestsPerCrawl,
        maxConcurrency: config.maxConcurrency,
        maxRequestRetries: config.maxRequestRetries,
        requestHandlerTimeoutSecs: config.requestHandlerTimeoutSecs,

        // For headless browser mode (if enabled)
        navigationTimeoutSecs: config.navigationTimeoutSecs,

        // Add delay between requests to the same domain to avoid rate limiting
        sameDomainDelaySecs: config.sameDomainDelaySecs,

        // Handle each request
        async requestHandler({ $, enqueueLinks, request, crawler }) {
          // Update status
          console.log(`Crawling: ${request.url}`);
          currentStatus.currentUrl = request.url;
          currentStatus.lastUpdate = new Date();

          // Mark URL as processing
          updateUrlStatus(request.url, "processing");
          saveStatus(currentStatus);

          if (stopRequested) {
            return;
          }

          try {
            const waLinks: WhatsAppLink[] = [];

            // Extract links from <a> tags
            $("a").each((_, element) => {
              const href = $(element).attr("href");
              const link = extractInviteLink(href);
              if (
                link &&
                !waLinks.some((existingLink) => existingLink.code === link.code)
              ) {
                waLinks.push(link);
              }
            });

            // Extract links from body text
            const bodyText = $("body").text();
            let match;

            // Search for primary WhatsApp invite links
            whatsappLinkRegex.lastIndex = 0;
            while ((match = whatsappLinkRegex.exec(bodyText)) !== null) {
              const link = extractInviteLink(match[0]);
              if (link) {
                // Check if this link is already in the array
                if (
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }
            }

            // Search for alternative WhatsApp link formats
            whatsappLinkAltRegex.lastIndex = 0;
            while ((match = whatsappLinkAltRegex.exec(bodyText)) !== null) {
              const link = extractInviteLink(match[0]);
              if (link) {
                // Check if this link is already in the array
                if (
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }
            }

            // Also search for WhatsApp links in all elements' attributes
            $(
              "[href], [src], [data-url], [data-link], [data-href], [onclick]"
            ).each((_, element) => {
              const attrs = $(element).attr();
              if (!attrs) return;

              Object.values(attrs).forEach((attrVal) => {
                if (typeof attrVal === "string") {
                  const link = extractInviteLink(attrVal);
                  if (
                    link &&
                    !waLinks.some(
                      (existingLink) => existingLink.code === link.code
                    )
                  ) {
                    waLinks.push(link);
                  }
                }
              });
            });

            // Also search in script content
            $("script").each((_, element) => {
              const scriptContent = $(element).html();
              if (!scriptContent) return;

              // Check primary regex
              whatsappLinkRegex.lastIndex = 0;
              let match;
              while ((match = whatsappLinkRegex.exec(scriptContent)) !== null) {
                const link = extractInviteLink(match[0]);
                if (
                  link &&
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }

              // Check alternative regex
              whatsappLinkAltRegex.lastIndex = 0;
              while (
                (match = whatsappLinkAltRegex.exec(scriptContent)) !== null
              ) {
                const link = extractInviteLink(match[0]);
                if (
                  link &&
                  !waLinks.some(
                    (existingLink) => existingLink.code === link.code
                  )
                ) {
                  waLinks.push(link);
                }
              }
            });

            // Save the extracted links with a consistent filename based on domain
            if (waLinks.length > 0) {
              const domain = extractDomain(request.url);
              saveWhatsAppLinks(domain, waLinks);
            }

            // If in single URL mode, don't enqueue additional URLs
            if (!stopRequested && !singleMode) {
              const enqueuedUrls = await enqueueLinks({
                strategy: "same-domain",
                // Exclude some problematic URLs
                exclude: [
                  "https://www.hindustantimes.com",
                  "*/wp-admin/*",
                  "*/wp-login.php*",
                  "*/logout*",
                  "*/sign-out*",
                ],
              });

              // Update the total requests added with newly enqueued URLs
              const enqueuedCount = Array.isArray(enqueuedUrls)
                ? enqueuedUrls.length
                : (enqueuedUrls as any).processedRequests?.length || 0;

              if (enqueuedCount > 0) {
                totalRequestsAdded += enqueuedCount;
                currentStatus.totalUrls = totalRequestsAdded;

                // Add newly enqueued URLs to the status
                const newEnqueuedUrls = Array.isArray(enqueuedUrls)
                  ? enqueuedUrls.map((req: any) => req.url || req)
                  : (enqueuedUrls as any).processedRequests?.map(
                      (req: any) => req.url || req
                    ) || [];

                // Add them to our tracking array
                currentStatus.enqueuedUrls.push(
                  ...newEnqueuedUrls.map((url: string) => ({
                    url,
                    enqueuedAt: new Date(),
                    status: "pending",
                  }))
                );

                // Keep only the most recent 100 URLs to avoid memory issues
                if (currentStatus.enqueuedUrls.length > 100) {
                  currentStatus.enqueuedUrls =
                    currentStatus.enqueuedUrls.slice(-100);
                }

                // Update pending count
                currentStatus.pendingUrls =
                  totalRequestsAdded - processedRequests;
              }
            }

            // Mark URL as done
            updateUrlStatus(request.url, "done");

            // Update progress
            processedRequests++;
            currentStatus.processedUrls = processedRequests;
            currentStatus.pendingUrls = totalRequestsAdded - processedRequests;

            // Get queue info to calculate more accurate progress
            const queueInfo = requestQueue
              ? await requestQueue.getInfo()
              : null;

            // Calculate progress based on processed vs total (including newly discovered)
            if (queueInfo && queueInfo.totalRequestCount > 0) {
              // Use handledRequestCount from queue info for more accuracy
              const handledCount = queueInfo.handledRequestCount;
              // Progress is the ratio of handled requests to total requests
              currentStatus.progress = Math.min(
                100,
                Math.round(
                  (handledCount /
                    Math.max(totalRequestsAdded, queueInfo.totalRequestCount)) *
                    100
                )
              );
            } else {
              // Fallback calculation if queue info not available
              currentStatus.progress = Math.min(
                100,
                Math.round((processedRequests / totalRequestsAdded) * 100)
              );
            }

            saveStatus(currentStatus);
          } catch (error: any) {
            console.error(`Error processing ${request.url}:`, error);
            currentStatus.errors.push(
              `Error processing ${request.url}: ${
                error.message || "Unknown error"
              }`
            );

            // Mark URL as failed
            updateUrlStatus(request.url, "failed");

            saveStatus(currentStatus);
          }
        },

        // Handle failed requests
        failedRequestHandler(context: any) {
          const { request, error } = context;
          console.error(
            `Request ${request.url} failed: ${
              error?.message || "Unknown error"
            }`
          );
          addError(
            `Failed to crawl ${request.url}: ${
              error?.message || "Unknown error"
            }`
          );

          // Mark URL as failed
          updateUrlStatus(request.url, "failed");

          // Update progress for failed requests too
          processedRequests++;
          currentStatus.processedUrls = processedRequests;
          currentStatus.pendingUrls = totalRequestsAdded - processedRequests;
          currentStatus.progress = Math.min(
            100,
            Math.round((processedRequests / totalRequestsAdded) * 100)
          );

          saveStatus(currentStatus);
        },
      });
    }

    // Start the crawler with the request queue
    await crawler.run();
  } catch (error: any) {
    console.error("Crawler error:", error);
    addError(`Crawler error: ${error.message || "Unknown error"}`);
  } finally {
    // Mark crawler as stopped
    isCrawlerRunning = false;
    currentStatus.isRunning = false;
    currentStatus.lastUpdate = new Date();
    currentStatus.progress = 100; // Ensure progress is 100% when stopped
    currentStatus.pendingUrls = 0; // No more pending URLs
    saveStatus(currentStatus);
    crawler = null;

    // Purge the request queue to clean up
    if (requestQueue) {
      await requestQueue.drop();
      requestQueue = null;
    }
  }
};

// Stop the crawler
export const stopCrawler = (): void => {
  stopRequested = true;
  // Abort the crawler's pool of requests
  crawler?.autoscaledPool?.abort();
  console.log("Crawler stopping...");
  currentStatus.lastUpdate = new Date();
  saveStatus(currentStatus);
};

// Get current crawler status
export const getCrawlerStatus = (): CrawlerStatus => {
  const savedStatus = getStatus();
  if (savedStatus) {
    return savedStatus;
  }
  return currentStatus;
};

// Check if crawler is running
export const isRunning = (): boolean => {
  const status = getStatus();
  return isCrawlerRunning || Boolean(status?.isRunning);
};
