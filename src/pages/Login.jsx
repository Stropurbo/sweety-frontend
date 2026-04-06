import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login/', form);
      login(res.data);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <img src="/assets/images/login.png" alt="" />
        <div className="auth-overlay" />
      </div>

      <div className="auth-center">
        <div className="auth-form-box">
          <div className="auth-brand">
            <img src="/sweety-icon.svg" alt="Sweety" />
            <span>Sweety</span>
          </div>
          <h2>Welcome back 👋</h2>
          <p className="auth-sub">Sign in to continue</p>

          {error && <div className="auth-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label>Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <div className="input-eye">
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
