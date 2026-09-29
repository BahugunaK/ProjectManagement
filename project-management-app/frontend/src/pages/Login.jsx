import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign in</h2>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label>Password</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
