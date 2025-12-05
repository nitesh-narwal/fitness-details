export const authConfig = {
  clientId: 'oauth2-pkce-client',
  authorizationEndpoint: 'http://localhost:8181/realms/fitness-app/protocol/openid-connect/auth',
  tokenEndpoint: 'http://localhost:8181/realms/fitness-app/protocol/openid-connect/token',
  redirectUri: 'http://localhost:5173/',
  scope: 'openid profile email',
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
  API_GATEWAY_URL: 'http://localhost:8084',
  
  // Keycloak
  KEYCLOAK_URL: 'http://localhost:8181',
  KEYCLOAK_REALM: 'fitness-app',
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