import React, { useState, useEffect } from 'react';
import { XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { CrawlerConfig } from '../types/crawler';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
}

const defaultConfig: CrawlerConfig = {
  maxConcurrency: 5,
  maxRequestsPerCrawl: 100,
  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 60,
  navigationTimeoutSecs: 30,
  sameDomainDelaySecs: 1,
  useHeadless: false,
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isRunning }) => {
  const [config, setConfig] = useState<CrawlerConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/crawler/config');
        if (response.data && Object.keys(response.data).length > 0) {
          setConfig(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch crawler configuration:', error);
        setError('Failed to load settings. Please try again.');
      }
    };

    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : Number(value),
    });
  };

  const saveSettings = async () => {
    if (isRunning) {
      setError('Cannot change settings while crawler is running.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await axios.post('/api/crawler/config', config);
      onClose();
    } catch (error) {
      console.error('Failed to save crawler configuration:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl transform transition-all">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Crawler Settings
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-2">
            {error && (
              <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Concurrency
                </label>
                <input
                  type="number"
                  name="maxConcurrency"
                  value={config.maxConcurrency}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  disabled={isRunning}
                  className="mt-1 block w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum number of pages to crawl concurrently
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Requests Per Crawl
                </label>
                <input
                  type="number"
                  name="maxRequestsPerCrawl"
                  value={config.maxRequestsPerCrawl}
                  onChange={handleInputChange}
                  min="1"
                  disabled={isRunning}
                  className="mt-1 block w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum number of pages to crawl in one session
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Request Retries
                </label>
                <input
                  type="number"
                  name="maxRequestRetries"
                  value={config.maxRequestRetries}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  disabled={isRunning}
                  className="mt-1 block w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Maximum retries for failed requests
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Request Handler Timeout (seconds)
                </label>
                <input
                  type="number"
                  name="requestHandlerTimeoutSecs"
                  value={config.requestHandlerTimeoutSecs}
                  onChange={handleInputChange}
                  min="5"
                  disabled={isRunning}
                  className="mt-1 block w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Timeout for request processing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Navigation Timeout (seconds)
                </label>
                <input
                  type="number"
                  name="navigationTimeoutSecs"
                  value={config.navigationTimeoutSecs}
                  onChange={handleInputChange}
                  min="5"
                  disabled={isRunning}
                  className="mt-1 block w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Timeout for page navigation (headless browser only)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Same Domain Delay (seconds)
                </label>
                <input
                  type="number"
                  name="sameDomainDelaySecs"
                  value={config.sameDomainDelaySecs}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  disabled={isRunning}
                  className="mt-1 block w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Delay between requests to the same domain
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="useHeadless"
                  checked={config.useHeadless}
                  onChange={handleInputChange}
                  disabled={isRunning}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Use Headless Browser (slower but handles JavaScript)
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="mr-2 inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
              onClick={saveSettings}
              disabled={isRunning || saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;