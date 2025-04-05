import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CrawlerStatus, CrawlerConfig, EnqueuedUrl } from '../types/crawler';

// Define the types for the API responses
interface GenericResponse {
  success: boolean;
  message: string;
}

interface DataFilesResponse {
  files: {
    domain: string;
    path: string;
    links: {
      code: string;
      url: string;
    }[];
  }[];
}

interface UrlsResponse {
  urls: {
    url: string;
    status: 'pending' | 'crawled' | 'error';
    lastCrawled?: string;
  }[];
}

// Create the API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Status', 'Urls', 'DataFiles', 'Config'],
  endpoints: (builder) => ({
    // Get crawler status
    getCrawlerStatus: builder.query<CrawlerStatus, void>({
      query: () => 'crawler/status',
      providesTags: ['Status'],
      // Transform the date strings back to Date objects
      transformResponse: (response: CrawlerStatus) => ({
        ...response,
        startTime: response.startTime ? new Date(response.startTime) : undefined,
        lastUpdate: response.lastUpdate ? new Date(response.lastUpdate) : undefined,
        enqueuedUrls: response.enqueuedUrls.map(url => ({
          ...url,
          enqueuedAt: new Date(url.enqueuedAt)
        }))
      }),
    }),

    // Get configuration
    getConfig: builder.query<CrawlerConfig, void>({
      query: () => 'crawler/config',
      providesTags: ['Config'],
    }),

    // Update configuration
    updateConfig: builder.mutation<GenericResponse, CrawlerConfig>({
      query: (config) => ({
        url: 'crawler/config',
        method: 'POST',
        body: config,
      }),
      invalidatesTags: ['Config'],
    }),

    // Start crawler
    startCrawler: builder.mutation<GenericResponse, void>({
      query: () => ({
        url: 'crawler/start',
        method: 'POST',
      }),
      invalidatesTags: ['Status'],
    }),

    // Stop crawler
    stopCrawler: builder.mutation<GenericResponse, void>({
      query: () => ({
        url: 'crawler/stop',
        method: 'POST',
      }),
      invalidatesTags: ['Status'],
    }),

    // Crawl a single URL
    crawlUrl: builder.mutation<GenericResponse, { url: string }>({
      query: (body) => ({
        url: 'crawler/crawl-url',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Status'],
    }),

    // Add a URL
    addUrl: builder.mutation<GenericResponse, { url: string }>({
      query: (body) => ({
        url: 'crawler/add-url',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Urls'],
    }),

    // Get URLs
    getUrls: builder.query<UrlsResponse, void>({
      query: () => 'crawler/get-urls',
      providesTags: ['Urls'],
    }),

    // Get data files
    getDataFiles: builder.query<DataFilesResponse, void>({
      query: () => 'crawler/data-files',
      providesTags: ['DataFiles'],
    }),
  }),
});

// Export the auto-generated hooks
export const {
  useGetCrawlerStatusQuery,
  useGetConfigQuery,
  useUpdateConfigMutation,
  useStartCrawlerMutation,
  useStopCrawlerMutation,
  useCrawlUrlMutation,
  useAddUrlMutation,
  useGetUrlsQuery,
  useGetDataFilesQuery,
} = apiSlice;