import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div>
        <strong style={{ marginRight: '1.5rem' }}>ProjectFlow</strong>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/projects">Projects</NavLink>
        <NavLink to="/tasks">My Tasks</NavLink>
      </div>
      <div>
        <span style={{ marginRight: '1rem', color: 'var(--muted)' }}>
          {user.name} · {user.role}
        </span>
        <button
          className="btn secondary"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
