import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'TeamMember' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create account</h2>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Full name</label>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <label>Role</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="TeamMember">Team Member</option>
          <option value="ProjectManager">Project Manager</option>
        </select>
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
