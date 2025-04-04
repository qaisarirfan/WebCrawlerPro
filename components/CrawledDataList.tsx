import React, { useState, useEffect } from 'react';
import { LinkIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

interface WhatsAppLink {
  code: string;
  url: string;
}

interface DataFile {
  domain: string;
  path: string;
  links: WhatsAppLink[];
}

// This component will be rendered on the client side
const CrawledDataList: React.FC = () => {
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/crawler/data-files');
      const files = response.data;
      
      if (files.length > 0) {
        setDataFiles(files);
        if (!activeTab) {
          setActiveTab(files[0].domain);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch crawled data:', error);
      setError('Failed to load crawled data. Please try again.');
      setLoading(false);
    }
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!refreshing) {
      setRefreshing(true);
      setError('');
      try {
        await fetchData();
      } finally {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-red-500 dark:text-red-400 text-center">{error}</div>
      </div>
    );
  }

  if (dataFiles.length === 0) {
    return (
      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-gray-500 dark:text-gray-400 text-center">
          No crawled data available yet. Start crawling to collect data.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center px-4 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Crawled WhatsApp Links</h3>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
          title="Refresh crawled data"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>
      
      <div className="border-b border-gray-200 dark:border-gray-700 mt-2">
        <nav className="flex overflow-x-auto" aria-label="Tabs">
          {dataFiles.map((file) => (
            <button
              key={file.domain}
              onClick={() => setActiveTab(file.domain)}
              className={`${
                activeTab === file.domain
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
            >
              {file.domain}
              <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">
                {file.links.length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        {activeTab && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTab} Links
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {dataFiles.find((f) => f.domain === activeTab)?.links.length || 0} links found
              </span>
            </div>

            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Invite Code
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      URL
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dataFiles
                    .find((f) => f.domain === activeTab)
                    ?.links.map((link, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {link.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {link.url}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openLink(link.url)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center"
                          >
                            Open
                            <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrawledDataList;