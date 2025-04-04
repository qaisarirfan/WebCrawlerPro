import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo, useState, useEffect } from 'react';
import { teal, pink, grey, blue } from '@mui/material/colors';

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Update the theme only on the client side
  useEffect(() => {
    setMounted(true);
    // Check user's preferred color scheme
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setMode(isDark ? 'dark' : 'light');
    
    // Listen for theme changes from next-themes
    const observer = new MutationObserver(() => {
      const htmlEl = document.documentElement;
      if (htmlEl.classList.contains('dark')) {
        setMode('dark');
      } else {
        setMode('light');
      }
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Create a theme instance
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: teal[500],
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
        },
      }),
    [mode],
  );

  if (!mounted) {
    // Avoid rendering with incorrect theme
    return <div style={{ visibility: 'hidden' }} />;
  }

  return (
    <NextThemeProvider attribute="class">
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Head>
          <title>Web Crawler Interface</title>
          <meta name="description" content="A modern interface to control web crawling operations" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} />
      </MuiThemeProvider>
    </NextThemeProvider>
  );
}

export default MyApp;
