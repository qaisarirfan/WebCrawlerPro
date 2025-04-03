import { useState, useEffect } from 'react';
import axios from 'axios';
import { CrawlerStatus } from '../types/crawler';
import CrawlerControls from './CrawlerControls';
import CrawlerSettings from './CrawlerSettings';
import StatusDisplay from './StatusDisplay';
import UrlInput from './UrlInput';
import UrlList from './UrlList';
import styles from '../styles/CrawlerInterface.module.css';

const CrawlerInterface: React.FC = () => {
  const [status, setStatus] = useState<CrawlerStatus>({
    isRunning: false,
    progress: 0,
    totalUrls: 0,
    processedUrls: 0,
    errors: []
  });
  const [refreshUrlsTrigger, setRefreshUrlsTrigger] = useState(0);
  const [statusPollingInterval, setStatusPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/crawler/status');
      setStatus(response.data);
      
      // Set up polling if crawler is running, stop polling if it's not
      if (response.data.isRunning && !statusPollingInterval) {
        const interval = setInterval(fetchStatus, 2000);
        setStatusPollingInterval(interval);
      } else if (!response.data.isRunning && statusPollingInterval) {
        clearInterval(statusPollingInterval);
        setStatusPollingInterval(null);
      }
    } catch (error) {
      console.error('Failed to fetch crawler status:', error);
      // Don't update status on error to prevent UI flickering
      // If we have a failed request, ensure we still maintain polling
      if (!statusPollingInterval) {
        const interval = setInterval(fetchStatus, 5000); // Longer retry interval on error
        setStatusPollingInterval(interval);
      }
    }
  };

  const handleUrlAdded = () => {
    setRefreshUrlsTrigger(prev => prev + 1);
  };

  // Initial status fetch
  useEffect(() => {
    fetchStatus();
    
    // Clean up interval on unmount
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Web Crawler Interface
        </h1>
        <p className={styles.description}>
          Control and monitor web crawling operations to extract WhatsApp group links
        </p>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.controlPanel}>
          <CrawlerControls 
            isRunning={status.isRunning} 
            refreshStatus={fetchStatus} 
          />
          <CrawlerSettings isRunning={status.isRunning} />
          <StatusDisplay status={status} />
        </div>
        
        <div className={styles.urlPanel}>
          <UrlInput onUrlAdded={handleUrlAdded} />
          <UrlList refreshTrigger={refreshUrlsTrigger} />
        </div>
      </div>
    </div>
  );
};

export default CrawlerInterface;
