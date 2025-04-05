import React from "react";
import { alpha, useColorScheme, useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Brightness4, Brightness7 } from "@mui/icons-material";

const ThemeToggle: React.FC = () => {
  const theme = useTheme();
  const { mode, setMode } = useColorScheme();

  return (
    <Tooltip
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <IconButton
        onClick={() => setMode(mode === "dark" ? "light" : "dark")}
        color="inherit"
        aria-label="Toggle Dark Mode"
        sx={{
          ml: 1,
          bgcolor:
            mode === "dark"
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.common.black, 0.04),
          "&:hover": {
            bgcolor:
              mode === "dark"
                ? alpha(theme.palette.common.white, 0.12)
                : alpha(theme.palette.common.black, 0.08),
          },
        }}
      >
        {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
