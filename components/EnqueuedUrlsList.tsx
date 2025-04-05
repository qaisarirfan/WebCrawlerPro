import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as PendingIcon,
  Sync as ProcessingIcon,
  Check as DoneIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { EnqueuedUrl } from '../types/crawler';
import { useGetCrawlerStatusQuery } from '../store/apiSlice';

// No props needed as we're using Redux
interface EnqueuedUrlsListProps {}

const EnqueuedUrlsList: React.FC<EnqueuedUrlsListProps> = () => {
  const theme = useTheme();
  const { data: status, isLoading, error } = useGetCrawlerStatusQuery();

  // Format the URL for display by truncating it if needed
  const formatUrl = (url: string) => {
    if (url.length > 45) {
      return `${url.substring(0, 45)}...`;
    }
    return url;
  };

  // Get the appropriate icon for the status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'processing':
        return <ProcessingIcon fontSize="small" sx={{ color: 'info.main' }} />;
      case 'done':
        return <DoneIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'failed':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
      default:
        return <PendingIcon fontSize="small" sx={{ color: 'warning.main' }} />;
    }
  };

  // Get color for status chip
  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'done':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format how long ago the URL was enqueued
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const enqueuedDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - enqueuedDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
          Error loading crawler queue data. Please refresh the page.
        </Typography>
      </Box>
    );
  }

  // If we don't have status data yet, show a placeholder
  if (!status) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Crawler status not available. Please wait...
        </Typography>
      </Box>
    );
  }

  // Get enqueued URLs and pending URLs count from the Redux store
  const enqueuedUrls = status.enqueuedUrls || [];
  const pendingUrls = status.pendingUrls || 0;

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="medium">
          Crawler Queue
        </Typography>
        <Chip 
          label={`${pendingUrls} URLs pending`} 
          color={pendingUrls > 0 ? 'primary' : 'default'} 
          size="small" 
          variant="outlined"
        />
      </Box>
      
      {enqueuedUrls.length > 0 ? (
        <Paper
          variant="outlined"
          sx={{
            maxHeight: '300px',
            overflowY: 'auto',
            bgcolor: theme.palette.background.paper,
          }}
        >
          <List dense>
            {enqueuedUrls.map((item, index) => (
              <React.Fragment key={`${item.url}-${index}`}>
                <ListItem sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {getStatusIcon(item.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Tooltip title={item.url}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {formatUrl(item.url)}
                        </Typography>
                      </Tooltip>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                          {getTimeAgo(item.enqueuedAt)}
                        </Typography>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status)}
                          size="small"
                          sx={{ 
                            height: 20, 
                            fontSize: '0.6rem',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
                {index < enqueuedUrls.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No URLs in the queue. Add URLs to start crawling.
        </Typography>
      )}
    </Box>
  );
};

export default EnqueuedUrlsList;