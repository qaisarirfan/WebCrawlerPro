import { useState } from "react";
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
import CrawlerControls from "./CrawlerControls";
import StatusDisplay from "./StatusDisplay";
import UrlList from "./UrlList";
import ThemeToggle from "./ThemeToggle";
import SettingsModal from "./SettingsModal";
import AddUrlModal from "./AddUrlModal";
import CrawledDataList from "./CrawledDataList";
import QuickStartTutorial from "./QuickStartTutorial";
import { useGetCrawlerStatusQuery } from "../store/apiSlice";

const CrawlerInterface: React.FC = () => {
  // Get crawler status from Redux store with auto polling
  const { data: status, refetch } = useGetCrawlerStatusQuery(undefined, {
    pollingInterval: 3000, // Poll every 3 seconds
  });

  // Local UI state
  const [refreshUrlsTrigger, setRefreshUrlsTrigger] = useState(0);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);

  // Define a properly typed refetchStatus function that returns Promise<void>
  const refetchStatus = async (): Promise<void> => {
    await refetch();
  };

  const handleUrlAdded = () => {
    setRefreshUrlsTrigger((prev) => prev + 1);
    // Call refetch without awaiting
    refetchStatus();
  };

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
                isRunning={status?.isRunning || false}
                refreshStatus={refetchStatus}
              />
            </Paper>

            <Paper sx={{ p: 3 }}>
              <StatusDisplay onRefresh={refetchStatus} />
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
        isRunning={status?.isRunning || false}
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
