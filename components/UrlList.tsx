import { useState, useEffect } from 'react';
import axios from 'axios';
import { defaultUrls } from '../utils/defaultUrls';
import { 
  ArrowDownTrayIcon, 
  LinkIcon, 
  ExclamationCircleIcon, 
  MinusCircleIcon,
  ArrowPathIcon, 
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface UrlListProps {
  refreshTrigger: number;
}

type UrlStatus = 'idle' | 'crawling' | 'success' | 'error';

interface UrlWithState {
  url: string;
  status: UrlStatus;
  message?: string;
}

const UrlList: React.FC<UrlListProps> = ({ refreshTrigger }) => {
  const [urls, setUrls] = useState<UrlWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingDefaults, setImportingDefaults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/crawler/get-urls');
      // Convert simple URL strings to objects with state
      setUrls(response.data.map((url: string) => ({ url, status: 'idle' })));
      setError(null);
    } catch (err: any) {
      setError('Failed to load URLs');
      console.error('Error fetching URLs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!refreshing) {
      setRefreshing(true);
      await fetchUrls();
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const importDefaultUrls = async () => {
    setImportingDefaults(true);
    try {
      // Add each default URL
      for (const url of defaultUrls) {
        if (!urls.some(item => item.url === url)) {
          try {
            await axios.post('/api/crawler/add-url', { url });
          } catch (err: any) {
            console.error(`Failed to add URL ${url}:`, err);
          }
        }
      }
      // Refresh the list
      await fetchUrls();
    } catch (err: any) {
      setError('Failed to import default URLs');
      console.error('Error importing default URLs:', err);
    } finally {
      setImportingDefaults(false);
    }
  };

  // Function to crawl a single URL
  const crawlSingleUrl = async (url: string, index: number) => {
    // Update URL status to crawling
    const updatedUrls = [...urls];
    updatedUrls[index] = { ...updatedUrls[index], status: 'crawling' };
    setUrls(updatedUrls);

    try {
      const response = await axios.post('/api/crawler/crawl-url', { url });
      
      // Update URL status to success
      const newUpdatedUrls = [...urls];
      newUpdatedUrls[index] = { 
        ...newUpdatedUrls[index], 
        status: 'success',
        message: response.data.message
      };
      setUrls(newUpdatedUrls);
    } catch (err: any) {
      console.error(`Failed to crawl URL ${url}:`, err);
      
      // Update URL status to error
      const newUpdatedUrls = [...urls];
      newUpdatedUrls[index] = { 
        ...newUpdatedUrls[index], 
        status: 'error',
        message: err.response?.data?.message || 'Failed to crawl URL'
      };
      setUrls(newUpdatedUrls);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [refreshTrigger]);

  // Manual status check function
  const checkCrawlerStatus = async () => {
    try {
      const response = await axios.get('/api/crawler/status');
      const status = response.data;
      
      // If crawler is not running, reset all URLs that were in crawling state
      if (!status.isRunning) {
        setUrls(prev => prev.map(item => 
          item.status === 'crawling' 
            ? { ...item, status: 'idle' } 
            : item
        ));
      }
    } catch (error: any) {
      console.error('Error checking crawler status:', error);
    }
  };

  // Check crawler status on mount and when URLs change
  useEffect(() => {
    // Initial check
    if (urls.some(url => url.status === 'crawling')) {
      checkCrawlerStatus();
    }
  }, [urls]);

  // Get status color classes
  const getStatusIndicator = (status: UrlStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
      case 'crawling':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">URLs to Crawl</h2>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
            title="Refresh URL list"
          >
            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            className="inline-flex items-center px-3 py-1.5 border border-indigo-500 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            onClick={importDefaultUrls}
            disabled={importingDefaults}
          >
            {importingDefaults ? (
              <svg className="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                <span className="whitespace-nowrap">Import Default URLs</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : urls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-gray-500 dark:text-gray-400">
            <MinusCircleIcon className="h-12 w-12 mb-3" />
            <p>No URLs added yet. Add some URLs above or import the default list.</p>
          </div>
        ) : (
          <div>
            <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              {urls.length} {urls.length === 1 ? 'URL' : 'URLs'}
            </div>
            
            <div className="overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {urls.map((item, index) => (
                    <li 
                      key={index} 
                      className={`py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        item.status === 'crawling' ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <LinkIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={item.url}>
                              {item.url}
                            </p>
                            
                            {item.message && (
                              <p className={`text-xs mt-0.5 truncate ${
                                item.status === 'success' ? 'text-green-600 dark:text-green-400' : 
                                item.status === 'error' ? 'text-red-600 dark:text-red-400' :
                                'text-gray-500 dark:text-gray-400'
                              }`}>
                                {item.message}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center ml-2 space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusIndicator(item.status)}`}>
                            {item.status === 'idle' && 'Not crawled'}
                            {item.status === 'crawling' && 'Crawling...'}
                            {item.status === 'success' && 'Completed'}
                            {item.status === 'error' && 'Failed'}
                          </span>
                          
                          <button 
                            className={`p-1.5 rounded-md ${
                              item.status === 'crawling' || urls.some(u => u.status === 'crawling')
                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                            } transition-colors`}
                            onClick={() => crawlSingleUrl(item.url, index)}
                            disabled={item.status === 'crawling' || urls.some(u => u.status === 'crawling')}
                            title="Crawl this URL individually"
                          >
                            {item.status === 'crawling' ? (
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <ArrowPathIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UrlList;
