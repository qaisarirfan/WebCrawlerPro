import { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { defaultUrls } from '../utils/defaultUrls';
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Link as LinkIcon,
  Error as ErrorIcon,
  RemoveCircleOutline as MinusCircleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import StatusBadge, { CrawlerJobStatus } from './StatusBadge';

interface UrlListProps {
  refreshTrigger: number;
}

interface UrlWithState {
  url: string;
  status: CrawlerJobStatus;
  message?: string;
}

const UrlList: React.FC<UrlListProps> = ({ refreshTrigger }) => {
  const [urls, setUrls] = useState<UrlWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingDefaults, setImportingDefaults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/crawler/get-urls');
      // Convert simple URL strings to objects with state
      setUrls(response.data.map((url: string) => ({ url, status: 'idle' })));
      setError(null);
    } catch (err: any) {
      setError('Failed to load URLs');
      console.error('Error fetching URLs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!refreshing) {
      setRefreshing(true);
      await fetchUrls();
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const importDefaultUrls = async () => {
    setImportingDefaults(true);
    try {
      // Add each default URL
      for (const url of defaultUrls) {
        if (!urls.some(item => item.url === url)) {
          try {
            await axios.post('/api/crawler/add-url', { url });
          } catch (err: any) {
            console.error(`Failed to add URL ${url}:`, err);
          }
        }
      }
      // Refresh the list
      await fetchUrls();
    } catch (err: any) {
      setError('Failed to import default URLs');
      console.error('Error importing default URLs:', err);
    } finally {
      setImportingDefaults(false);
    }
  };

  // Function to crawl a single URL
  const crawlSingleUrl = async (url: string, index: number) => {
    // Update URL status to crawling
    const updatedUrls = [...urls];
    updatedUrls[index] = { ...updatedUrls[index], status: 'crawling' };
    setUrls(updatedUrls);

    try {
      const response = await axios.post('/api/crawler/crawl-url', { url });
      
      // Update URL status to success
      const newUpdatedUrls = [...urls];
      newUpdatedUrls[index] = { 
        ...newUpdatedUrls[index], 
        status: 'success',
        message: response.data.message
      };
      setUrls(newUpdatedUrls);
    } catch (err: any) {
      console.error(`Failed to crawl URL ${url}:`, err);
      
      // Update URL status to error
      const newUpdatedUrls = [...urls];
      newUpdatedUrls[index] = { 
        ...newUpdatedUrls[index], 
        status: 'error',
        message: err.response?.data?.message || 'Failed to crawl URL'
      };
      setUrls(newUpdatedUrls);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [refreshTrigger]);

  // Manual status check function
  const checkCrawlerStatus = async () => {
    try {
      const response = await axios.get('/api/crawler/status');
      const status = response.data;
      
      // If crawler is not running, reset all URLs that were in crawling state
      if (!status.isRunning) {
        setUrls(prev => prev.map(item => 
          item.status === 'crawling' 
            ? { ...item, status: 'idle' } 
            : item
        ));
      }
    } catch (error: any) {
      console.error('Error checking crawler status:', error);
    }
  };

  // Check crawler status on mount and when URLs change
  useEffect(() => {
    // Initial check
    if (urls.some(url => url.status === 'crawling')) {
      checkCrawlerStatus();
    }
  }, [urls]);

  // Get status color classes
  const getStatusIndicator = (status: CrawlerJobStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
      case 'crawling':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    }
  };

  return (
    <Paper elevation={1} sx={{ height: '100%' }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight="medium">
          URLs to Crawl
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh URL list">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing || loading}
              color="primary"
              size="small"
            >
              <RefreshIcon 
                fontSize="small"
                sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} 
              />
            </IconButton>
          </Tooltip>
          
          <Button
            startIcon={importingDefaults ? 
              <CircularProgress size={16} /> : 
              <DownloadIcon fontSize="small" />
            }
            onClick={importDefaultUrls}
            disabled={importingDefaults}
            variant="outlined"
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Import Default URLs
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '200px' 
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            sx={{ mt: 1 }}
          >
            {error}
          </Alert>
        ) : urls.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            textAlign: 'center'
          }}>
            <MinusCircleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography color="text.secondary">
              No URLs added yet. Add some URLs above or import the default list.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {urls.length} {urls.length === 1 ? 'URL' : 'URLs'}
            </Typography>
            
            <Box sx={{ 
              maxHeight: '300px', 
              overflow: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1 
            }}>
              <List disablePadding>
                {urls.map((item, index) => (
                  <>
                    {index > 0 && <Divider />}
                    <ListItem
                      key={index}
                      sx={{ 
                        py: 1.5,
                        bgcolor: item.status === 'crawling' ? 
                          theme => theme.palette.mode === 'dark' ? 
                            'rgba(30, 136, 229, 0.08)' : 'rgba(30, 136, 229, 0.04)' 
                          : 'transparent',
                        '&:hover': {
                          bgcolor: theme => theme.palette.mode === 'dark' ? 
                            'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <LinkIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      
                      <ListItemText 
                        primary={
                          <Typography variant="body2" fontWeight="medium" title={item.url}>
                            {item.url}
                          </Typography>
                        }
                        secondary={item.message && (
                          <Typography 
                            variant="caption" 
                            component="span"
                            color={
                              item.status === 'success' ? 'success.main' : 
                              item.status === 'error' ? 'error.main' : 
                              'text.secondary'
                            }
                          >
                            {item.message}
                          </Typography>
                        )}
                        primaryTypographyProps={{ 
                          noWrap: true,
                          sx: { mr: 2 } 
                        }}
                        secondaryTypographyProps={{ 
                          noWrap: true 
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                        <StatusBadge status={item.status} />
                        
                        <Tooltip title="Crawl this URL individually">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => crawlSingleUrl(item.url, index)}
                              disabled={item.status === 'crawling' || urls.some(u => u.status === 'crawling')}
                              color="primary"
                              sx={{
                                opacity: item.status === 'crawling' || urls.some(u => u.status === 'crawling') ? 0.5 : 1
                              }}
                            >
                              {item.status === 'crawling' ? (
                                <CircularProgress size={20} thickness={5} />
                              ) : (
                                <RefreshIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </>
                ))}
              </List>
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default UrlList;
