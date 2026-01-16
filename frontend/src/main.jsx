import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { theme } from './theme';
import './i18n';
import { defaultRules } from './engine/defaultRules';

// Expose for debugging in console
if (typeof window !== 'undefined') {
  window.defaultRules = defaultRules;
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <GameProvider>
              <App />
            </GameProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
