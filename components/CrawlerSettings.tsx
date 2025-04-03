import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/CrawlerInterface.module.css';

interface CrawlerSettingsProps {
  isRunning: boolean;
}

interface CrawlerConfig {
  maxConcurrency: number;
  maxRequestsPerCrawl: number;
  maxRequestRetries: number;
  requestHandlerTimeoutSecs: number;
  navigationTimeoutSecs: number;
  sameDomainDelaySecs: number;
  useHeadless: boolean;
}

const defaultConfig: CrawlerConfig = {
  maxConcurrency: 5,
  maxRequestsPerCrawl: 100,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 60,
  navigationTimeoutSecs: 30,
  sameDomainDelaySecs: 1,
  useHeadless: false
};

const CrawlerSettings: React.FC<CrawlerSettingsProps> = ({ isRunning }) => {
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState<CrawlerConfig>(defaultConfig);
  const [isSaving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load configuration when component mounts
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/crawler/config');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Failed to load crawler configuration:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value, 10) : value)
    }));
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    
    try {
      await axios.post('/api/crawler/config', config);
      setSaveMessage('Configuration saved successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to save crawler configuration:', error);
      setSaveMessage('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div 
        className={styles.settingsHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className={styles.sectionTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Crawler Settings
        </h2>
        <div className={`${styles.expandArrow} ${expanded ? styles.expanded : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {expanded && (
        <form className={styles.settingsForm} onSubmit={saveConfig}>
          <div className={styles.formGroup}>
            <label htmlFor="maxConcurrency">Max Concurrency</label>
            <input
              type="number"
              className={styles.formControl}
              id="maxConcurrency"
              name="maxConcurrency"
              value={config.maxConcurrency}
              onChange={handleInputChange}
              min="1"
              max="20"
              disabled={isRunning}
            />
            <small>Number of pages crawled concurrently (1-20)</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="maxRequestsPerCrawl">Max Requests Per Crawl</label>
            <input
              type="number"
              className={styles.formControl}
              id="maxRequestsPerCrawl"
              name="maxRequestsPerCrawl"
              value={config.maxRequestsPerCrawl}
              onChange={handleInputChange}
              min="1"
              disabled={isRunning}
            />
            <small>Maximum number of pages to crawl</small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="maxRequestRetries">Max Request Retries</label>
            <input
              type="number"
              className={styles.formControl}
              id="maxRequestRetries"
              name="maxRequestRetries"
              value={config.maxRequestRetries}
              onChange={handleInputChange}
              min="0"
              max="10"
              disabled={isRunning}
            />
            <small>Number of retries for failed requests (0-10)</small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="requestHandlerTimeoutSecs">Request Handler Timeout</label>
            <input
              type="number"
              className={styles.formControl}
              id="requestHandlerTimeoutSecs"
              name="requestHandlerTimeoutSecs"
              value={config.requestHandlerTimeoutSecs}
              onChange={handleInputChange}
              min="10"
              max="300"
              disabled={isRunning}
            />
            <small>Timeout for page processing in seconds (10-300)</small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="navigationTimeoutSecs">Navigation Timeout</label>
            <input
              type="number"
              className={styles.formControl}
              id="navigationTimeoutSecs"
              name="navigationTimeoutSecs"
              value={config.navigationTimeoutSecs}
              onChange={handleInputChange}
              min="10"
              max="120"
              disabled={isRunning}
            />
            <small>Timeout for page navigation in seconds (10-120)</small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="sameDomainDelaySecs">Same Domain Delay</label>
            <input
              type="number"
              className={styles.formControl}
              id="sameDomainDelaySecs"
              name="sameDomainDelaySecs"
              value={config.sameDomainDelaySecs}
              onChange={handleInputChange}
              min="0"
              max="60"
              disabled={isRunning}
            />
            <small>Delay between requests to the same domain in seconds (0-60)</small>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.formCheckbox}
                name="useHeadless"
                checked={config.useHeadless}
                onChange={handleInputChange}
                disabled={isRunning}
              />
              Use Headless Browser
            </label>
            <small>Use full browser for JavaScript rendering (slower but more comprehensive)</small>
          </div>
          
          <div className={styles.formActions}>
            {saveMessage && (
              <span className={saveMessage.includes('success') ? styles.successMessage : styles.errorMessage}>
                {saveMessage}
              </span>
            )}
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={isRunning || isSaving}
            >
              {isSaving ? (
                <>
                  <span className={styles.loadingSpinner}></span> 
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CrawlerSettings;