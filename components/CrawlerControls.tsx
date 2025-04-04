import { useState } from 'react';
import axios from 'axios';
import { PlayIcon, StopIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

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
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop crawler');
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Crawler Controls</h2>
      
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <button 
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium ${
            isRunning || isStarting
              ? 'bg-indigo-100 text-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-600 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700'
          } transition-colors w-full sm:w-auto`}
          onClick={handleStart}
          disabled={isRunning || isStarting}
        >
          {isStarting ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <PlayIcon className="h-5 w-5" />
              <span>Start Crawler</span>
            </>
          )}
        </button>
        
        <button 
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium ${
            !isRunning || isStopping
              ? 'bg-red-100 text-red-400 dark:bg-red-900/30 dark:text-red-600 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
          } transition-colors w-full sm:w-auto`}
          onClick={handleStop}
          disabled={!isRunning || isStopping}
        >
          {isStopping ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <StopIcon className="h-5 w-5" />
              <span>Stop Crawler</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CrawlerControls;
