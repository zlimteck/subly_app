import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './VerifyEmail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent multiple verification attempts
      if (hasVerified.current) return;
      hasVerified.current = true;

      try {
        const response = await axios.get(`${API_URL}/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');

        // If user is logged in, refresh their data
        if (user) {
          await refreshUser();
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          // If not logged in, redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
          'Failed to verify email. The link may be invalid or expired.'
        );
      }
    };

    if (token && !hasVerified.current) {
      verifyEmail();
    }
  }, [token, navigate, user, refreshUser]);

  const handleGoToLogin = () => {
    navigate(user ? '/dashboard' : '/login');
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-box">
        <div className="verify-email-header">
          <h1 className="verify-email-title">
            <span className="terminal-prompt">root@subly:~$</span> verify email
          </h1>
        </div>

        <div className="verify-email-content">
          {status === 'loading' && (
            <div className="verify-status verify-loading">
              <Loader className="verify-icon rotating" size={64} />
              <p className="verify-message">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-status verify-success">
              <CheckCircle className="verify-icon" size={64} />
              <p className="verify-message">{message}</p>
              <p className="verify-redirect">
                {user ? 'Redirecting to dashboard...' : 'Redirecting to login...'}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-status verify-error">
              <XCircle className="verify-icon" size={64} />
              <p className="verify-message">{message}</p>
              <button onClick={handleGoToLogin} className="verify-btn">
                {user ? 'Go to Dashboard' : 'Go to Login'}
              </button>
            </div>
          )}
        </div>

        <div className="verify-footer">
          <p className="verify-footer-text">
            <span className="terminal-cursor">_</span> Subly - Track your subscriptions
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;