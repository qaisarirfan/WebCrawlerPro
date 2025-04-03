import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/CrawlerInterface.module.css';

interface UrlInputProps {
  onUrlAdded: () => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ onUrlAdded }) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post('/api/crawler/add-url', { url: url.trim() });
      setSuccess('URL added successfully');
      setUrl('');
      onUrlAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.urlInputContainer}>
      <h2 className={styles.sectionTitle}>Add URL to Crawl</h2>
      
      <form onSubmit={handleSubmit} className={styles.urlForm}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL (e.g., https://example.com)"
            disabled={isSubmitting}
            className={styles.urlInput}
          />
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={styles.addButton}
          >
            {isSubmitting ? (
              <span className={styles.loadingSpinner}></span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Add
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
        
        {success && (
          <div className={styles.successMessage}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {success}
          </div>
        )}
      </form>
    </div>
  );
};

export default UrlInput;
