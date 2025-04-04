import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  Grid,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { CrawlerStatus } from "../types/crawler";
import CrawlerControls from "./CrawlerControls";
import StatusDisplay from "./StatusDisplay";
import UrlList from "./UrlList";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./SettingsModal";
import AddUrlModal from "./AddUrlModal";
import CrawledDataList from "./CrawledDataList";
import QuickStartTutorial from "./QuickStartTutorial";

const CrawlerInterface: React.FC = () => {
  const [status, setStatus] = useState<CrawlerStatus>({
    isRunning: false,
    progress: 0,
    totalUrls: 0,
    processedUrls: 0,
    errors: [],
  });
  const [refreshUrlsTrigger, setRefreshUrlsTrigger] = useState(0);
  const [statusPollingInterval, setStatusPollingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await axios.get("/api/crawler/status");
      console.log(response);
      setStatus(response.data);

      // Set up polling if crawler is running, stop polling if it's not
      if (response.data.isRunning && !statusPollingInterval) {
        // Poll every 5 minutes (300000ms) instead of every 2 seconds
        const interval = setInterval(fetchStatus, 300000);
        setStatusPollingInterval(interval);
      } else if (!response.data.isRunning && statusPollingInterval) {
        clearInterval(statusPollingInterval);
        setStatusPollingInterval(null);
      }
    } catch (error) {
      console.error("Failed to fetch crawler status:", error);
      // Don't update status on error to prevent UI flickering
      // If we have a failed request, ensure we still maintain polling
      if (!statusPollingInterval) {
        const interval = setInterval(fetchStatus, 300000); // 5 minute retry interval on error
        setStatusPollingInterval(interval);
      }
    }
  };

  const handleUrlAdded = () => {
    setRefreshUrlsTrigger((prev) => prev + 1);
  };

  // Initial status fetch
  useEffect(() => {
    fetchStatus();

    // Clean up interval on unmount
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, []);

  const theme = useTheme();

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        transition: "all 0.3s ease",
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LinkIcon
              sx={{
                fontSize: 36,
                color: "primary.main",
                mr: 2,
              }}
            />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="600">
                Web Crawler Interface
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Control and monitor web crawling operations to extract WhatsApp
                group links
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QuickStartTutorial />
            <ThemeToggle />

            <Tooltip title="Add URL">
              <IconButton
                onClick={() => setIsAddUrlModalOpen(true)}
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(63, 81, 181, 0.15)"
                      : "rgba(63, 81, 181, 0.08)",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(63, 81, 181, 0.25)"
                        : "rgba(63, 81, 181, 0.12)",
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Settings">
              <IconButton
                onClick={() => setIsSettingsModalOpen(true)}
                sx={{
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(63, 81, 181, 0.15)"
                      : "rgba(63, 81, 181, 0.08)",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(63, 81, 181, 0.25)"
                        : "rgba(63, 81, 181, 0.12)",
                  },
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid size={5} gap={2} display="flex" flexDirection="column">
            <Paper sx={{ p: 3 }}>
              <CrawlerControls
                isRunning={status.isRunning}
                refreshStatus={fetchStatus}
              />
            </Paper>

            <Paper sx={{ p: 3 }}>
              <StatusDisplay status={status} onRefresh={fetchStatus} />
            </Paper>

            <UrlList refreshTrigger={refreshUrlsTrigger} />
          </Grid>

          <Grid size={7}>
            <CrawledDataList />
          </Grid>
        </Grid>
      </Container>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isRunning={status.isRunning}
      />

      <AddUrlModal
        isOpen={isAddUrlModalOpen}
        onClose={() => setIsAddUrlModalOpen(false)}
        onUrlAdded={handleUrlAdded}
      />
    </Box>
  );
};

export default CrawlerInterface;
