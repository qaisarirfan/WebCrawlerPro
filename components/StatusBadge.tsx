import React from 'react';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import { CheckCircle, Error, HourglassEmpty, Schedule } from '@mui/icons-material';

// Status types
export type CrawlerJobStatus = 'idle' | 'crawling' | 'success' | 'error';

// Props interface
interface StatusBadgeProps {
  status: CrawlerJobStatus;
  label?: string;
  tooltipText?: string;
  size?: 'small' | 'medium';
  className?: string;
}

/**
 * A color-coded status badge component for crawler jobs.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  tooltipText,
  size = 'small',
  className = '',
}) => {
  // Define status-specific properties
  const statusConfig = {
    idle: {
      icon: <HourglassEmpty fontSize="small" />,
      color: 'default' as const,
      label: label || 'Not crawled',
      tooltip: tooltipText || 'URL has not been crawled yet'
    },
    crawling: {
      icon: <CircularProgress size={16} thickness={4} />,
      color: 'primary' as const,
      label: label || 'Crawling...',
      tooltip: tooltipText || 'Currently crawling this URL'
    },
    success: {
      icon: <CheckCircle fontSize="small" />,
      color: 'success' as const,
      label: label || 'Completed',
      tooltip: tooltipText || 'Successfully crawled'
    },
    error: {
      icon: <Error fontSize="small" />,
      color: 'error' as const,
      label: label || 'Failed',
      tooltip: tooltipText || 'Failed to crawl this URL'
    }
  };

  const config = statusConfig[status];

  return (
    <Tooltip title={config.tooltip} arrow placement="top">
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size={size}
        className={className}
        variant="filled"
        sx={{
          fontWeight: 500,
          '.MuiChip-icon': {
            marginLeft: '4px',
          },
          animation: status === 'crawling' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 1,
            },
            '50%': {
              opacity: 0.7,
            },
          },
        }}
      />
    </Tooltip>
  );
};

export default StatusBadge;