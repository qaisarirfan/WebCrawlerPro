import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  LinearProgress, 
  Chip, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Stack,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  AccessTime as ClockIcon,
  Error as ErrorIcon,
  Circle as CircleIcon
} from '@mui/icons-material';
import { CrawlerStatus } from '../types/crawler';
import EnqueuedUrlsList from './EnqueuedUrlsList';
import { useGetCrawlerStatusQuery } from '../store/apiSlice';

// No need to pass status as a prop anymore since we're using Redux
interface StatusDisplayProps {
  onRefresh?: () => Promise<any> | void;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ onRefresh }) => {
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const { data: status, isLoading, error, refetch } = useGetCrawlerStatusQuery();

  // Calculate elapsed time when running
  useEffect(() => {
    if (!status || !status.isRunning || !status.startTime) {
      return;
    }

    const startTime = new Date(status.startTime).getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;

      const hours = Math.floor(elapsed / 3600000)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((elapsed % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor((elapsed % 60000) / 1000)
        .toString()
        .padStart(2, "0");

      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const handleRefresh = async () => {
    if (!refreshing) {
      setRefreshing(true);
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Explicitly handle the result of refetch to fix type error
          const result = await refetch();
          // No need to do anything with the result
        }
      } finally {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading crawler status...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="error">
          Error loading crawler status
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => refetch()} 
          sx={{ mt: 2 }}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // If we don't have status data yet, show a placeholder
  if (!status) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Crawler status not available
        </Typography>
        <Button 
          variant="text" 
          onClick={() => refetch()} 
          size="small" 
          sx={{ mt: 1 }}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="medium">
          Crawler Status
        </Typography>

        <Tooltip title="Refresh status">
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            size="small"
            color="primary"
            sx={{ ml: 1 }}
          >
            <RefreshIcon
              fontSize="small"
              sx={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": {
                    transform: "rotate(0deg)",
                  },
                  "100%": {
                    transform: "rotate(360deg)",
                  },
                },
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Status:
          </Typography>
          <Chip
            label={status.isRunning ? "Running" : "Stopped"}
            color={status.isRunning ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        </Box>

        {status.currentUrl && (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Current URL:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                maxWidth: "70%",
                wordBreak: "break-all",
                textAlign: "right",
              }}
              title={status.currentUrl}
            >
              {status.currentUrl.length > 40
                ? `${status.currentUrl.substring(0, 40)}...`
                : status.currentUrl}
            </Typography>
          </Box>
        )}

        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Progress:
            </Typography>
            <Typography variant="body2">
              {status.processedUrls} / {status.totalUrls} URLs (
              {Math.round(status.progress)}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={status.progress}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {status.isRunning && status.startTime && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Running Time:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ClockIcon
                fontSize="small"
                sx={{ mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2">{elapsedTime}</Typography>
            </Box>
          </Box>
        )}

        {status.lastUpdate && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Last Updated:
            </Typography>
            <Typography variant="body2">
              {new Date(status.lastUpdate).toLocaleString()}
            </Typography>
          </Box>
        )}
      </Stack>

      {/* Display enqueued URLs list if the crawler is running and has URLs */}
      {status.isRunning && status.enqueuedUrls && status.enqueuedUrls.length > 0 && (
        <EnqueuedUrlsList />
      )}
      
      {status.errors.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="subtitle2"
            color="error"
            sx={{ mb: 1, display: "flex", alignItems: "center" }}
          >
            <ErrorIcon fontSize="small" sx={{ mr: 0.5 }} />
            Errors ({status.errors.length})
          </Typography>

          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              maxHeight: "150px",
              overflowY: "auto",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(244, 67, 54, 0.1)"
                  : "rgba(244, 67, 54, 0.05)",
            }}
          >
            <List dense disablePadding>
              {status.errors.slice(-5).map((error, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <CircleIcon sx={{ fontSize: 8, color: "error.main" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        color="error.main"
                        sx={{ wordBreak: "break-word" }}
                      >
                        {error}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {status.errors.length > 5 && (
                <ListItem sx={{ justifyContent: "center", py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    + {status.errors.length - 5} more errors
                  </Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default StatusDisplay;
