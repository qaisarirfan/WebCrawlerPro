import { useState, useEffect } from 'react';
import axios from 'axios';
import { defaultUrls } from '../utils/defaultUrls';
import styles from '../styles/CrawlerInterface.module.css';

interface UrlListProps {
  refreshTrigger: number;
}

const UrlList: React.FC<UrlListProps> = ({ refreshTrigger }) => {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingDefaults, setImportingDefaults] = useState(false);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/crawler/get-urls');
      setUrls(response.data);
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
        if (!urls.includes(url)) {
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

  useEffect(() => {
    fetchUrls();
  }, [refreshTrigger]);

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
            {urls.map((url, index) => (
              <li key={index} className={styles.urlItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <span title={url}>
                  {url.length > 50 ? `${url.substring(0, 50)}...` : url}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default UrlList;
