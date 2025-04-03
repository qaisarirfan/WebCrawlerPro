import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/CrawlerInterface.module.css';

interface CrawlerControlsProps {
  isRunning: boolean;
  refreshStatus: () => void;
}

const CrawlerControls: React.FC<CrawlerControlsProps> = ({ isRunning, refreshStatus }) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/crawler/start');
      refreshStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start crawler');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/crawler/stop');
      refreshStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to stop crawler');
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className={styles.controlsContainer}>
      <h2 className={styles.sectionTitle}>Crawler Controls</h2>
      
      <div className={styles.buttonGroup}>
        <button 
          className={`${styles.button} ${styles.startButton}`}
          onClick={handleStart}
          disabled={isRunning || isStarting}
        >
          {isStarting ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Start Crawler
            </>
          )}
        </button>
        
        <button 
          className={`${styles.button} ${styles.stopButton}`}
          onClick={handleStop}
          disabled={!isRunning || isStopping}
        >
          {isStopping ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
              Stop Crawler
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default CrawlerControls;
