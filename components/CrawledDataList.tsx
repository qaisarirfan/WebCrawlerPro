import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
} from "@mui/material";
import {
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

interface WhatsAppLink {
  code: string;
  url: string;
}

interface DataFile {
  domain: string;
  path: string;
  links: WhatsAppLink[];
}

const CrawledDataList: React.FC = () => {
  const [dataLinks, setDataLinks] = useState<WhatsAppLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/crawler/data-files");
      const files = response.data;

      console.log(files);

      if (files.length > 0) {
        setDataLinks(files);
        if (!activeTab) {
          setActiveTab(files[0].domain);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch crawled data:", error);
      setError("Failed to load crawled data. Please try again.");
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!refreshing) {
      setRefreshing(true);
      setError("");
      try {
        await fetchData();
      } finally {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={192}
        >
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  const header = (
    <Box
      sx={{
        px: 3,
        pt: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="h6" component="h3">
        Crawled WhatsApp Links
      </Typography>
      <Button
        onClick={handleRefresh}
        disabled={refreshing}
        startIcon={
          <RefreshIcon
            sx={{
              animation: refreshing ? "spin 1s linear infinite" : "none",
            }}
          />
        }
        size="small"
      >
        Refresh Data
      </Button>
    </Box>
  );

  if (error) {
    return (
      <Paper>
        {header}
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Paper>
    );
  }

  if (dataLinks.length === 0) {
    return (
      <Paper>
        {header}
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            No crawled data available yet. Start crawling to collect data.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper>
      {header}
      <Box sx={{ p: 3 }}>
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invite Code</TableCell>
                <TableCell>URL</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dataLinks.map((link, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2">{link.code}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {link.url}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => openLink(link.url)}
                      size="small"
                      color="primary"
                      title="Open link"
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

export default CrawledDataList;
