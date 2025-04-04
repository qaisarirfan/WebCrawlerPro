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
  Tooltip,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Link as LinkIcon,
  Error as ErrorIcon,
  RemoveCircleOutline as MinusCircleIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import StatusBadge, { CrawlerJobStatus } from "./StatusBadge";

interface UrlListProps {
  refreshTrigger: number;
}

interface UrlWithState {
  url: string;
  status: CrawlerJobStatus;
  message?: string;
}

const UrlList: React.FC<UrlListProps> = ({ refreshTrigger }) => {
  const theme = useTheme();
  const [urls, setUrls] = useState<UrlWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingDefaults, setImportingDefaults] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/crawler/get-urls");
      setUrls(response.data.map((url: string) => ({ url, status: "idle" })));
      setError(null);
    } catch (err: any) {
      setError("Failed to load URLs");
      console.error("Error fetching URLs:", err);
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
      await Promise.all(
        defaultUrls.map((url) =>
          !urls.some((item) => item.url === url)
            ? axios.post("/api/crawler/add-url", { url })
            : Promise.resolve()
        )
      );
      await fetchUrls();
    } catch (err: any) {
      setError("Failed to import default URLs");
      console.error("Error importing default URLs:", err);
    } finally {
      setImportingDefaults(false);
    }
  };

  const crawlSingleUrl = async (url: string, index: number) => {
    const updatedUrls = [...urls];
    updatedUrls[index] = { ...updatedUrls[index], status: "crawling" };
    setUrls(updatedUrls);

    try {
      const response = await axios.post("/api/crawler/crawl-url", { url });
      const newUpdatedUrls = [...urls];
      newUpdatedUrls[index] = {
        ...newUpdatedUrls[index],
        status: "success",
        message: response.data.message,
      };
      setUrls(newUpdatedUrls);
    } catch (err: any) {
      const newUpdatedUrls = [...urls];
      newUpdatedUrls[index] = {
        ...newUpdatedUrls[index],
        status: "error",
        message: err.response?.data?.message || "Failed to crawl URL",
      };
      setUrls(newUpdatedUrls);
    }
  };

  const checkCrawlerStatus = async () => {
    try {
      const response = await axios.get("/api/crawler/status");
      if (!response.data.isRunning) {
        setUrls((prev) =>
          prev.map((item) =>
            item.status === "crawling" ? { ...item, status: "idle" } : item
          )
        );
      }
    } catch (error: any) {
      console.error("Error checking crawler status:", error);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [refreshTrigger]);

  useEffect(() => {
    if (urls.some((url) => url.status === "crawling")) {
      checkCrawlerStatus();
    }
  }, [urls]);

  const renderLoadingSkeleton = () => (
    <Box sx={{ p: 2 }}>
      {[...Array(5)].map((_, index) => (
        <Fragment key={index}>
          {index > 0 && <Divider sx={{ my: 1 }} />}
          <Box sx={{ display: "flex", alignItems: "center", py: 1.5 }}>
            <Skeleton
              variant="circular"
              width={24}
              height={24}
              sx={{ mr: 2 }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton
                variant="text"
                width="60%"
                height={16}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        </Fragment>
      ))}
    </Box>
  );

  return (
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight="medium">
          URLs to Crawl
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            </IconButton>
          </Tooltip>

          <Button
            startIcon={
              importingDefaults ? (
                <CircularProgress size={16} />
              ) : (
                <DownloadIcon fontSize="small" />
              )
            }
            onClick={importDefaultUrls}
            disabled={importingDefaults}
            variant="outlined"
            size="small"
            sx={{ whiteSpace: "nowrap" }}
          >
            Import Defaults
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          renderLoadingSkeleton()
        ) : error ? (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : urls.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
              textAlign: "center",
            }}
          >
            <MinusCircleIcon
              sx={{
                fontSize: 48,
                color: "text.secondary",
                mb: 2,
                opacity: 0.6,
              }}
            />
            <Typography variant="body1" color="text.secondary">
              No URLs added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add URLs manually or import the default list
            </Typography>
            <Button
              startIcon={<DownloadIcon />}
              onClick={importDefaultUrls}
              disabled={importingDefaults}
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
            >
              {importingDefaults ? "Importing..." : "Import Default URLs"}
            </Button>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                px: 2,
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {urls.length} {urls.length === 1 ? "URL" : "URLs"}
              </Typography>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto" }}>
              <List disablePadding>
                {urls.map((item, index) => (
                  <Fragment key={index}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        py: 1.5,
                        bgcolor:
                          item.status === "crawling"
                            ? theme.palette.mode === "dark"
                              ? "rgba(30, 136, 229, 0.08)"
                              : "rgba(30, 136, 229, 0.04)"
                            : "transparent",
                        "&:hover": {
                          bgcolor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <LinkIcon color="primary" fontSize="small" />
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            noWrap
                            sx={{
                              display: "block",
                              width: "calc(100% - 100px)",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            {item.url}
                          </Typography>
                        }
                        secondary={
                          item.message && (
                            <Typography
                              variant="caption"
                              noWrap
                              color={
                                item.status === "success"
                                  ? "success.main"
                                  : item.status === "error"
                                  ? "error.main"
                                  : "text.secondary"
                              }
                            >
                              {item.message}
                            </Typography>
                          )
                        }
                      />

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          ml: 1,
                          minWidth: 120,
                          justifyContent: "flex-end",
                        }}
                      >
                        <StatusBadge status={item.status} />

                        <Tooltip
                          title={
                            item.status === "crawling"
                              ? "Crawling in progress"
                              : "Crawl this URL individually"
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => crawlSingleUrl(item.url, index)}
                              disabled={
                                item.status === "crawling" ||
                                urls.some((u) => u.status === "crawling")
                              }
                              color="primary"
                              sx={{
                                opacity:
                                  item.status === "crawling" ||
                                  urls.some((u) => u.status === "crawling")
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              {item.status === "crawling" ? (
                                <CircularProgress size={20} />
                              ) : (
                                <RefreshIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </Fragment>
                ))}
              </List>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default UrlList;