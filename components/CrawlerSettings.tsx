import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

interface CrawlerSettingsProps {
  isRunning: boolean;
}

interface CrawlerConfig {
  maxConcurrency: number;
  maxRequestsPerCrawl: number;
  maxRequestRetries: number;
  requestHandlerTimeoutSecs: number;
  navigationTimeoutSecs: number;
  sameDomainDelaySecs: number;
  useHeadless: boolean;
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

const CrawlerSettings: React.FC<CrawlerSettingsProps> = ({ isRunning }) => {
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState<CrawlerConfig>(defaultConfig);
  const [isSaving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get("/api/crawler/config");
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error("Failed to load crawler configuration:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setConfig((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value, 10)
          : value,
    }));
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      await axios.post("/api/crawler/config", config);
      setSaveMessage("Configuration saved successfully.");

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to save crawler configuration:", error);
      setSaveMessage("Failed to save configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="crawler-settings-content"
          id="crawler-settings-header"
        >
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Crawler Settings</Typography>
        </AccordionSummary>

        <AccordionDetails>
          <form onSubmit={saveConfig}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { sm: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <TextField
                label="Max Concurrency"
                type="number"
                name="maxConcurrency"
                value={config.maxConcurrency}
                onChange={handleInputChange}
                disabled={isRunning}
                inputProps={{ min: 1, max: 20 }}
                helperText="Number of pages crawled concurrently (1-20)"
                fullWidth
                margin="normal"
              />

              <TextField
                label="Max Requests Per Crawl"
                type="number"
                name="maxRequestsPerCrawl"
                value={config.maxRequestsPerCrawl}
                onChange={handleInputChange}
                disabled={isRunning}
                inputProps={{ min: 1 }}
                helperText="Maximum number of pages to crawl"
                fullWidth
                margin="normal"
              />

              <TextField
                label="Max Request Retries"
                type="number"
                name="maxRequestRetries"
                value={config.maxRequestRetries}
                onChange={handleInputChange}
                disabled={isRunning}
                inputProps={{ min: 0, max: 10 }}
                helperText="Number of retries for failed requests (0-10)"
                fullWidth
                margin="normal"
              />

              <TextField
                label="Request Handler Timeout (sec)"
                type="number"
                name="requestHandlerTimeoutSecs"
                value={config.requestHandlerTimeoutSecs}
                onChange={handleInputChange}
                disabled={isRunning}
                inputProps={{ min: 10, max: 300 }}
                helperText="Timeout for page processing in seconds (10-300)"
                fullWidth
                margin="normal"
              />

              <TextField
                label="Navigation Timeout (sec)"
                type="number"
                name="navigationTimeoutSecs"
                value={config.navigationTimeoutSecs}
                onChange={handleInputChange}
                disabled={isRunning}
                inputProps={{ min: 10, max: 120 }}
                helperText="Timeout for page navigation in seconds (10-120)"
                fullWidth
                margin="normal"
              />

              <TextField
                label="Same Domain Delay (sec)"
                type="number"
                name="sameDomainDelaySecs"
                value={config.sameDomainDelaySecs}
                onChange={handleInputChange}
                disabled={isRunning}
                inputProps={{ min: 0, max: 60 }}
                helperText="Delay between requests to same domain (0-60)"
                fullWidth
                margin="normal"
              />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  name="useHeadless"
                  checked={config.useHeadless}
                  onChange={handleInputChange}
                  disabled={isRunning}
                />
              }
              label="Use Headless Browser"
              sx={{ mt: 2 }}
            />
            <Typography variant="caption" display="block" gutterBottom>
              Use full browser for JavaScript rendering (slower but more
              comprehensive)
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 2,
              }}
            >
              {saveMessage && (
                <Alert
                  severity={
                    saveMessage.includes("success") ? "success" : "error"
                  }
                  sx={{ flexGrow: 1 }}
                >
                  {saveMessage}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={
                  isSaving ? <CircularProgress size={20} /> : <SaveIcon />
                }
                disabled={isRunning || isSaving}
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </Box>
          </form>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CrawlerSettings;
