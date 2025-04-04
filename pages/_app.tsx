import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo, useState, useEffect, createContext } from 'react';
import { indigo, pink, grey, blue } from '@mui/material/colors';

// Create a context to allow theme toggling from any component
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light' as 'light' | 'dark'
});

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Toggle function for theme switching
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        // Save preference to localStorage
        localStorage.setItem('theme', mode === 'light' ? 'dark' : 'light');
      },
      mode
    }),
    [mode],
  );

  // Update the theme only on the client side
  useEffect(() => {
    setMounted(true);
    // First check localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setMode(savedTheme);
    } else {
      // If no saved preference, check system preference
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(isDark ? 'dark' : 'light');
    }
  }, []);

  // Create a theme instance
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: indigo[500],
          },
          secondary: {
            main: pink[400],
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#fff' : '#1e1e1e',
          },
          info: {
            main: blue[500],
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.05)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.2)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 8,
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
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  if (!mounted) {
    // Avoid rendering with incorrect theme
    return <div style={{ visibility: 'hidden' }} />;
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Head>
          <title>Web Crawler Interface</title>
          <meta name="description" content="A modern interface to control web crawling operations" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default MyApp;
