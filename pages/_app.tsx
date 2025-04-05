import { AppProps } from 'next/app';
import Head from "next/head";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMemo, useState, useEffect, createContext } from "react";
import { indigo, pink, blue, deepPurple, grey } from "@mui/material/colors";
import type { PaletteMode } from "@mui/material";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store/store';

// Create a context to allow theme toggling from any component
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "light" as PaletteMode,
});

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<PaletteMode>("light");

  // Toggle function for theme switching
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem("theme", newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  // Update the theme only on the client side
  useEffect(() => {
    setMounted(true);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme") as PaletteMode | null;
    if (savedTheme) {
      setMode(savedTheme);
      return;
    }

    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? "dark" : "light");
    };

    setMode(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  // Create a theme instance with responsive typography
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "light" ? indigo[700] : deepPurple[300],
          },
          secondary: {
            main: pink[mode === "light" ? 500 : 300],
          },
          background: {
            default: mode === "light" ? grey[200] : grey[900],
            paper: mode === "light" ? "#fff" : grey[800],
          },
          info: {
            main: blue[mode === "light" ? 600 : 400],
          },
          text: {
            primary: mode === "light" ? grey[900] : grey[50],
            secondary: mode === "light" ? grey[700] : grey[400],
          },
        },
        typography: {
          fontFamily: [
            '"Inter"',
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
          ].join(","),
          button: {
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            defaultProps: {
              disableElevation: true,
            },
            styleOverrides: {
              root: {
                textTransform: "none",
                padding: "8px 16px",
              },
              contained: {
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow:
                  mode === "light"
                    ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                    : "0 1px 3px rgba(255, 255, 255, 0.1)",
                transition: "box-shadow 0.3s ease",
                "&:hover": {
                  boxShadow:
                    mode === "light"
                      ? "0 4px 12px rgba(0, 0, 0, 0.15)"
                      : "0 4px 12px rgba(255, 255, 255, 0.1)",
                },
              },
            },
          },
          MuiPaper: {
            defaultProps: {
              elevation: 0,
            },
            styleOverrides: {
              root: {
                backgroundImage: "none", // Disable gradient background
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: "outlined",
              size: "small",
            },
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === "light" ? "#fff" : grey[900],
                color: mode === "light" ? grey[900] : grey[50],
                boxShadow: "none",
                borderBottom: `1px solid ${
                  mode === "light" ? grey[200] : grey[700]
                }`,
              },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: {
                borderColor: mode === "light" ? grey[200] : grey[700],
              },
            },
          },
        },
      }),
    [mode]
  );

  if (!mounted) {
    // Avoid rendering with incorrect theme
    return <div style={{ visibility: "hidden" }} />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <Head>
              <title>Web Crawler Interface</title>
              <meta
                name="description"
                content="A modern interface to control web crawling operations"
              />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="theme-color" content={theme.palette.primary.main} />
              <link rel="icon" href="/favicon.ico" />
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
              />
              <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                rel="stylesheet"
              />
            </Head>
            <Component {...pageProps} />
          </ThemeProvider>
        </ColorModeContext.Provider>
      </PersistGate>
    </Provider>
  );
}

export default MyApp;