import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import './Auth.css';

const EmailVerification = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResendVerification = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await authService.resendVerification(email);
            setMessage('Verification email sent successfully. Please check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send verification email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="verification-icon">📧</div>
                <h2>Email Verification</h2>
                <p className="auth-subtitle">
                    Enter your email address to resend the verification link.
                </p>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}

                <form onSubmit={handleResendVerification}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already verified? <Link to="/login">Sign in</Link>
                    </p>
                    <p>
                        Don't have an account? <Link to="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;
