import React, { useState, useEffect } from "react";
import axios from "axios";
import { CrawlerConfig } from "../types/crawler";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Alert,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

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

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isRunning,
}) => {
  const [config, setConfig] = useState<CrawlerConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("/api/crawler/config");
        if (response.data && Object.keys(response.data).length > 0) {
          setConfig(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch crawler configuration:", error);
        setError("Failed to load settings. Please try again.");
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
      [name]: type === "checkbox" ? checked : Number(value),
    });
  };

  const saveSettings = async () => {
    if (isRunning) {
      setError("Cannot change settings while crawler is running.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await axios.post("/api/crawler/config", config);
      onClose();
    } catch (error) {
      console.error("Failed to save crawler configuration:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Crawler Settings</Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
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

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Max Concurrency"
            name="maxConcurrency"
            type="number"
            value={config.maxConcurrency}
            onChange={handleInputChange}
            disabled={isRunning}
            inputProps={{ min: 1, max: 20 }}
            helperText="Maximum number of pages to crawl concurrently"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Max Requests Per Crawl"
            name="maxRequestsPerCrawl"
            type="number"
            value={config.maxRequestsPerCrawl}
            onChange={handleInputChange}
            disabled={isRunning}
            inputProps={{ min: 1 }}
            helperText="Maximum number of pages to crawl in one session"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Max Request Retries"
            name="maxRequestRetries"
            type="number"
            value={config.maxRequestRetries}
            onChange={handleInputChange}
            disabled={isRunning}
            inputProps={{ min: 0, max: 10 }}
            helperText="Maximum retries for failed requests"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Request Handler Timeout (seconds)"
            name="requestHandlerTimeoutSecs"
            type="number"
            value={config.requestHandlerTimeoutSecs}
            onChange={handleInputChange}
            disabled={isRunning}
            inputProps={{ min: 5 }}
            helperText="Timeout for request processing"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Navigation Timeout (seconds)"
            name="navigationTimeoutSecs"
            type="number"
            value={config.navigationTimeoutSecs}
            onChange={handleInputChange}
            disabled={isRunning}
            inputProps={{ min: 5 }}
            helperText="Timeout for page navigation (headless browser only)"
            fullWidth
            margin="normal"
          />

          <TextField
            label="Same Domain Delay (seconds)"
            name="sameDomainDelaySecs"
            type="number"
            value={config.sameDomainDelaySecs}
            onChange={handleInputChange}
            disabled={isRunning}
            inputProps={{ min: 0, max: 10 }}
            helperText="Delay between requests to the same domain"
            fullWidth
            margin="normal"
          />

          <FormControlLabel
            control={
              <Checkbox
                name="useHeadless"
                checked={config.useHeadless}
                onChange={handleInputChange}
                disabled={isRunning}
              />
            }
            label="Use Headless Browser (slower but handles JavaScript)"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={saveSettings}
          color="primary"
          variant="contained"
          disabled={isRunning || saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsModal;
