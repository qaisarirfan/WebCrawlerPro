import { useState } from 'react';
import axios from 'axios';
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
      await axios.post('/api/crawler/start');
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
      await axios.post('/api/crawler/stop');
      refreshStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop crawler');
    } finally {
      setIsStopping(false);
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
