import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8B5A2B',      // Copper/bronze
      light: '#B8860B',     // Dark goldenrod
      dark: '#5C4033',      // Dark copper
      contrastText: '#FDF8F0'
    },
    secondary: {
      main: '#CD853F',      // Peru/rust
      light: '#DEB887',     // Burlywood
      dark: '#A0522D',      // Sienna
    },
    background: {
      default: '#F4E4C9',   // Parchment cream
      paper: '#FAF3E6',     // Warm cream
    },
    text: {
      primary: '#2D2520',   // Dark brown
      secondary: '#5C4B3A', // Medium brown
    },
    divider: '#D4C4A8',     // Light tan
    error: {
      main: '#C62828',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    warning: {
      main: '#E65100',
      light: '#FF9800',
      dark: '#E65100',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    info: {
      main: '#5C4B3A',
      light: '#8B7355',
      dark: '#3E3228',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      color: '#2D2520',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#2D2520',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: '#2D2520',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#2D2520',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#2D2520',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#2D2520',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(45, 37, 32, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(45, 37, 32, 0.25)',
          },
        },
        outlined: {
          borderColor: '#8B5A2B',
          '&:hover': {
            borderColor: '#5C4033',
            backgroundColor: 'rgba(139, 90, 43, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          border: '1px solid #D4C4A8',
          boxShadow: '0 2px 8px rgba(45, 37, 32, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#8B5A2B',
          boxShadow: '0 2px 4px rgba(45, 37, 32, 0.2)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FDF8F0',
          borderRadius: 12,
          border: '1px solid #D4C4A8',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: '#F4E4C9',
          borderBottom: '1px solid #D4C4A8',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#D4C4A8',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(139, 90, 43, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(139, 90, 43, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(139, 90, 43, 0.16)',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.Mui-selected': {
            color: '#8B5A2B',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#8B5A2B',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        filled: {
          backgroundColor: 'rgba(139, 90, 43, 0.12)',
          color: '#5C4033',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(139, 90, 43, 0.2)',
          borderRadius: 4,
        },
        bar: {
          backgroundColor: '#8B5A2B',
          borderRadius: 4,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#8B5A2B',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(139, 90, 43, 0.08)',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FDF8F0',
          border: '1px solid #D4C4A8',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(139, 90, 43, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(139, 90, 43, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(139, 90, 43, 0.16)',
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#D4C4A8',
            },
            '&:hover fieldset': {
              borderColor: '#8B5A2B',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#8B5A2B',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          color: '#1B5E20',
        },
        standardError: {
          backgroundColor: 'rgba(198, 40, 40, 0.1)',
          color: '#B71C1C',
        },
        standardWarning: {
          backgroundColor: 'rgba(230, 81, 0, 0.1)',
          color: '#E65100',
        },
        standardInfo: {
          backgroundColor: 'rgba(92, 75, 58, 0.1)',
          color: '#3E3228',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#2D2520',
          color: '#FDF8F0',
        },
      },
    },
  },
});
