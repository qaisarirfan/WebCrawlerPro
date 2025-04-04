import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import { Close as CloseIcon, Link as LinkIcon } from "@mui/icons-material";
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

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <LinkIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Add URL to Crawl</Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="URL"
            variant="outlined"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            margin="normal"
            helperText="Enter a full URL including protocol (e.g., https://example.com)"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} color="secondary" variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={adding}
            startIcon={adding ? <CircularProgress size={20} /> : null}
          >
            {adding ? "Adding..." : "Add URL"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddUrlModal;