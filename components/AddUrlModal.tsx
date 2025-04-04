import React, { useState } from 'react';
import { XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

interface AddUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlAdded: () => void;
}

const AddUrlModal: React.FC<AddUrlModalProps> = ({ isOpen, onClose, onUrlAdded }) => {
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      setError('Invalid URL format. Please enter a valid URL including protocol (e.g., https://example.com)');
      return;
    }

    setAdding(true);
    setError('');

    try {
      await axios.post('/api/crawler/add-url', { url });
      setUrl('');
      onUrlAdded();
      onClose();
    } catch (error: any) {
      console.error('Failed to add URL:', error);
      setError(error.response?.data?.message || 'Failed to add URL. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              Add URL to Crawl
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={handleClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mt-2">
              {error && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  URL
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="block w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter a full URL including protocol (e.g., https://example.com)
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="mr-2 inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add URL'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUrlModal;