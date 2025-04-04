import { useState, useEffect } from 'react';
import axios from 'axios';
import { defaultUrls } from '../utils/defaultUrls';
import styles from '../styles/CrawlerInterface.module.css';

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

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/crawler/get-urls');
      // Convert simple URL strings to objects with state
      setUrls(response.data.map((url: string) => ({ url, status: 'idle' })));
      setError(null);
    } catch (err) {
      setError('Failed to load URLs');
      console.error('Error fetching URLs:', err);
    } finally {
      setLoading(false);
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
          } catch (err) {
            console.error(`Failed to add URL ${url}:`, err);
          }
        }
      }
      // Refresh the list
      await fetchUrls();
    } catch (err) {
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
    
    // No automatic polling - will rely on manual refresh
    // or the parent component's less frequent polling
  }, [urls]);

  return (
    <div className={styles.urlListContainer}>
      <div className={styles.urlListHeader}>
        <h2 className={styles.sectionTitle}>URLs to Crawl</h2>
        
        <button 
          className={styles.importButton}
          onClick={importDefaultUrls}
          disabled={importingDefaults}
        >
          {importingDefaults ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Import Default URLs
            </>
          )}
        </button>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <span className={styles.loadingSpinner}></span>
          <span>Loading URLs...</span>
        </div>
      ) : error ? (
        <div className={styles.errorMessage}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      ) : urls.length === 0 ? (
        <div className={styles.emptyState}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <p>No URLs added yet. Add some URLs above or import the default list.</p>
        </div>
      ) : (
        <div className={styles.urlListScroll}>
          <div className={styles.urlCount}>
            {urls.length} {urls.length === 1 ? 'URL' : 'URLs'}
          </div>
          <ul className={styles.urlList}>
            {urls.map((item, index) => (
              <li key={index} className={`${styles.urlItem} ${styles[item.status]}`}>
                <div className={styles.urlItemContent}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span title={item.url}>
                    {item.url.length > 40 ? `${item.url.substring(0, 40)}...` : item.url}
                  </span>
                  
                  {item.message && (
                    <span className={styles.urlMessage}>
                      {item.message}
                    </span>
                  )}
                </div>
                
                <button 
                  className={styles.crawlButton}
                  onClick={() => crawlSingleUrl(item.url, index)}
                  disabled={item.status === 'crawling' || urls.some(u => u.status === 'crawling')}
                  title="Crawl this URL individually"
                >
                  {item.status === 'crawling' ? (
                    <span className={styles.loadingSpinner}></span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UrlList;
