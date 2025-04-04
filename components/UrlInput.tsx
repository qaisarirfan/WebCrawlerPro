import { useState } from 'react';
import axios from 'axios';
import { PlusCircleIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add URL to Crawl</h2>
      </div>
      
      <div className="p-4">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                disabled={isSubmitting}
                className="w-full p-2 pl-3 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <PlusCircleIcon className="h-5 w-5 mr-1" />
                  <span>Add URL</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
              <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UrlInput;
