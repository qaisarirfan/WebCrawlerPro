import { AppProps } from "next/app";
import Head from "next/head";
import {
  createTheme,
  ThemeProvider,
  useColorScheme,
  useTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMemo } from "react";
import { indigo, pink, blue, deepPurple, grey } from "@mui/material/colors";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../store/store";

import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

function MyApp({ Component, pageProps }: AppProps) {
  const { mode } = useColorScheme();
  const defaultTheme = useTheme();

  // Create a theme instance with responsive typography
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: "class",
        },
        colorSchemes: {
          dark: {
            palette: {
              mode: "dark",
              primary: {
                main: deepPurple[300],
              },
              secondary: {
                main: pink[300],
              },
              background: {
                default: grey[900],
                paper: grey[800],
              },
              info: {
                main: blue[400],
              },
              text: {
                primary: grey[50],
                secondary: grey[400],
              },
            },
          },
          light: {
            palette: {
              mode: "light",
              primary: {
                main: indigo[700],
              },
              secondary: {
                main: pink[500],
              },
              background: {
                default: grey[200],
                paper: defaultTheme.palette.common.white,
              },
              info: {
                main: blue[600],
              },
              text: {
                primary: grey[900],
                secondary: grey[700],
              },
            },
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

  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <InitColorSchemeScript attribute="class" />
          <CssBaseline enableColorScheme />
          <Head>
            <title>Web Crawler Interface</title>
            <meta
              name="description"
              content="A modern interface to control web crawling operations"
            />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
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
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
