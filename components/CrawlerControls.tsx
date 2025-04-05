import { useState } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Alert, 
  Stack, 
  CircularProgress 
} from '@mui/material';
import { 
  PlayArrow as PlayIcon, 
  Stop as StopIcon, 
  Error as ErrorIcon 
} from '@mui/icons-material';
import { useStartCrawlerMutation, useStopCrawlerMutation } from '../store/apiSlice';

interface CrawlerControlsProps {
  isRunning: boolean;
  refreshStatus: () => Promise<any> | void;
}

const CrawlerControls: React.FC<CrawlerControlsProps> = ({ isRunning, refreshStatus }) => {
  const [error, setError] = useState<string | null>(null);
  
  // Use RTK Query mutations
  const [startCrawler, { isLoading: isStarting }] = useStartCrawlerMutation();
  const [stopCrawler, { isLoading: isStopping }] = useStopCrawlerMutation();

  const handleStart = async () => {
    setError(null);
    
    try {
      await startCrawler().unwrap();
      // The status will automatically refresh due to RTK Query cache invalidation
    } catch (err: any) {
      setError(err.data?.message || 'Failed to start crawler');
    }
  };

  const handleStop = async () => {
    setError(null);
    
    try {
      await stopCrawler().unwrap();
      // The status will automatically refresh due to RTK Query cache invalidation
    } catch (err: any) {
      setError(err.data?.message || 'Failed to stop crawler');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight="medium">
        Crawler Controls
      </Typography>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={isStarting ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
          onClick={handleStart}
          disabled={isRunning || isStarting}
          fullWidth
          sx={{
            py: 1,
            backgroundColor: isRunning || isStarting ? 'action.disabledBackground' : 'primary.main'
          }}
        >
          Start Crawler
        </Button>
        
        <Button
          variant="contained"
          color="error"
          startIcon={isStopping ? <CircularProgress size={20} color="inherit" /> : <StopIcon />}
          onClick={handleStop}
          disabled={!isRunning || isStopping}
          fullWidth
          sx={{ py: 1 }}
        >
          Stop Crawler
        </Button>
      </Stack>
      
      {error && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          sx={{ mt: 2 }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CrawlerControls;
