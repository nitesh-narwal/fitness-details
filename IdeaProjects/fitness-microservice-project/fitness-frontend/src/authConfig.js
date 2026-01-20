export const authConfig = {
  clientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
  authorizationEndpoint: import.meta.env.VITE_KEYCLOAK_AUTH_URL,
  tokenEndpoint: import.meta.env.VITE_KEYCLOAK_TOKEN_URL,
  redirectUri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
  scope: import.meta.env.VITE_OAUTH_SCOPE,
  onRefreshTokenExpire: (event) => {
    window.location.reload();
    console.warn('Refresh token expired, logging in again...');
    event.logIn();
  },
  autoLogin: false,
  decodeToken: true,
  preLogin: () => {
    console.log('🔐 Starting login...');
    const currentPath = window.location.pathname;
    if (currentPath !== '/') {
      localStorage.setItem('preLoginPath', currentPath);
    }
  },
  postLogin: () => {
    console.log('✅ Login successful!');
    const savedPath = localStorage.getItem('preLoginPath');
    localStorage.removeItem('preLoginPath');
    if (savedPath && savedPath !== '/') {
      window.location.href = savedPath;
    } else {
      window.location.href = '/dashboard';
    }
  },
  storage: 'session',
};

// API Configuration - ONLY Gateway exposed
export const API_CONFIG = {
  // Single secure entry point
  API_GATEWAY_URL: import.meta.env.VITE_API_GATEWAY_URL,
  
  // Keycloak
  KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL,
  KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM,
  
  // Registration endpoints
  REGISTRATION_ENDPOINT: '/api/auth/register',
  VERIFY_EMAIL_ENDPOINT: '/api/auth/verify-email',
  RESEND_VERIFICATION_ENDPOINT: '/api/auth/resend-verification',
};

// Helper functions
export const hasValidToken = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return !!token;
};

export const getAuthToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

export const clearAuthData = () => {
  sessionStorage.clear();
  localStorage.removeItem('token');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('preLoginPath');
  localStorage.removeItem('weeklyCalorieGoal');
};