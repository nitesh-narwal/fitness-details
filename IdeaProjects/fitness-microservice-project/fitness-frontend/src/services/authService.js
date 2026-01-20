import axios from 'axios';
import { API_CONFIG } from '../authConfig';

const API_URL = `${API_CONFIG.API_GATEWAY_URL}/api/auth`;

class AuthService {
    async register(userData) {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    }

    async resendVerification(email) {
        const response = await axios.post(`${API_URL}/resend-verification?email=${encodeURIComponent(email)}`);
        return response.data;
    }

    async login(email, password) {
        // Use Keycloak's token endpoint
        const tokenUrl = `${API_CONFIG.KEYCLOAK_URL}/realms/${API_CONFIG.KEYCLOAK_REALM}/protocol/openid-connect/token`;

        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('client_id', 'fitness-app');
        params.append('username', email);
        params.append('password', password);

        const response = await axios.post(tokenUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('refresh_token', response.data.refresh_token);
        }

        return response.data;
    }

    async isRegistrationEnabled() {
        try {
            const response = await axios.get(`${API_URL}/registration-enabled`);
            return response.data.enabled;
        } catch {
            return true; // Default to enabled if endpoint fails
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
    }

    getCurrentToken() {
        return localStorage.getItem('token');
    }

    isAuthenticated() {
        const token = this.getCurrentToken();
        if (!token) return false;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }
}

export default new AuthService();
