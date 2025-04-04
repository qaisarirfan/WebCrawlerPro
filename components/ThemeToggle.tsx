import React, { useContext } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { ColorModeContext } from '../pages/_app';

const ThemeToggle: React.FC = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Tooltip
      title={
        theme.palette.mode === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      <IconButton
        onClick={colorMode.toggleColorMode}
        color="inherit"
        aria-label="Toggle Dark Mode"
        sx={{
          ml: 1,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
          "&:hover": {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;