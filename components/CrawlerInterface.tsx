import { useState, useEffect } from 'react';
import axios from 'axios';
import { CrawlerStatus } from '../types/crawler';
import CrawlerControls from './CrawlerControls';
import CrawlerSettings from './CrawlerSettings';
import StatusDisplay from './StatusDisplay';
import UrlInput from './UrlInput';
import UrlList from './UrlList';
import ThemeToggle from './ThemeToggle';
import SettingsModal from './SettingsModal';
import AddUrlModal from './AddUrlModal';
import CrawledDataList from './CrawledDataList';
import { Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/outline';
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-indigo-600 dark:text-indigo-400 mr-3"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <div>
              <h1 className="text-2xl font-semibold">Web Crawler Interface</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control and monitor web crawling operations to extract WhatsApp group links
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <button
              onClick={() => setIsAddUrlModalOpen(true)}
              className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 transition-colors"
              title="Add URL"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="rounded-full p-2 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-400 transition-colors"
              title="Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <CrawlerControls 
                isRunning={status.isRunning} 
                refreshStatus={fetchStatus} 
              />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <StatusDisplay status={status} />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <UrlInput onUrlAdded={handleUrlAdded} />
              <UrlList refreshTrigger={refreshUrlsTrigger} />
            </div>
          </div>
          
          <div>
            <CrawledDataList />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        isRunning={status.isRunning} 
      />
      
      <AddUrlModal 
        isOpen={isAddUrlModalOpen} 
        onClose={() => setIsAddUrlModalOpen(false)} 
        onUrlAdded={handleUrlAdded} 
      />
    </div>
  );
};

export default CrawlerInterface;
