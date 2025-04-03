import { useEffect, useState } from 'react';
import { CrawlerStatus } from '../types/crawler';
import styles from '../styles/CrawlerInterface.module.css';

interface StatusDisplayProps {
  status: CrawlerStatus;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status }) => {
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  
  // Calculate elapsed time when running
  useEffect(() => {
    if (!status.isRunning || !status.startTime) {
      return;
    }
    
    const startTime = new Date(status.startTime).getTime();
    
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      const hours = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [status.isRunning, status.startTime]);
  
  return (
    <div className={styles.statusContainer}>
      <h2 className={styles.sectionTitle}>Crawler Status</h2>
      
      <div className={styles.statusCard}>
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>Status:</div>
          <div className={styles.statusValue}>
            <span className={`${styles.statusBadge} ${status.isRunning ? styles.running : styles.stopped}`}>
              {status.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
        
        {status.currentUrl && (
          <div className={styles.statusRow}>
            <div className={styles.statusLabel}>Current URL:</div>
            <div className={styles.statusValue} title={status.currentUrl}>
              {status.currentUrl.length > 40 ? `${status.currentUrl.substring(0, 40)}...` : status.currentUrl}
            </div>
          </div>
        )}
        
        <div className={styles.statusRow}>
          <div className={styles.statusLabel}>Progress:</div>
          <div className={styles.statusValue}>
            {status.processedUrls} / {status.totalUrls} URLs processed ({Math.round(status.progress)}%)
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar}
                style={{ width: `${status.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {status.isRunning && status.startTime && (
          <div className={styles.statusRow}>
            <div className={styles.statusLabel}>Running Time:</div>
            <div className={styles.statusValue}>
              <div className={styles.elapsedTime}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {elapsedTime}
              </div>
            </div>
          </div>
        )}
        
        {status.lastUpdate && (
          <div className={styles.statusRow}>
            <div className={styles.statusLabel}>Last Updated:</div>
            <div className={styles.statusValue}>
              {new Date(status.lastUpdate).toLocaleString()}
            </div>
          </div>
        )}
      </div>
      
      {status.errors.length > 0 && (
        <div className={styles.errorsSection}>
          <h3>Errors ({status.errors.length})</h3>
          <div className={styles.errorsList}>
            {status.errors.slice(-5).map((error, index) => (
              <div key={index} className={styles.errorItem}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            ))}
            {status.errors.length > 5 && (
              <div className={styles.moreErrors}>
                + {status.errors.length - 5} more errors
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;
