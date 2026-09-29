import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '' });
  const [error, setError] = useState('');

  const canCreate = user.role === 'Admin' || user.role === 'ProjectManager';

  const loadProjects = (page = 1) => {
    api
      .get('/projects', { params: { search, status, page, limit: 9 } })
      .then((res) => {
        setProjects(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load projects'));
  };

  useEffect(() => {
    loadProjects(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowForm(false);
      setNewProject({ name: '', description: '', deadline: '' });
      loadProjects(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Projects</h2>
        {canCreate && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <label>Name</label>
          <input
            required
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <label>Description</label>
          <textarea
            rows={2}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
          <label>Deadline</label>
          <input
            type="date"
            value={newProject.deadline}
            onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
          />
          <button className="btn" type="submit">Create Project</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="OnHold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      <div className="grid">
        {projects.map((p) => (
          <Link key={p._id} to={`/projects/${p._id}`} className="card" style={{ color: 'inherit' }}>
            <h3 style={{ marginTop: 0 }}>{p.name}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{p.description || 'No description'}</p>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Status: {p.status} {p.deadline && `· Due ${new Date(p.deadline).toLocaleDateString()}`}
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
              PM: {p.projectManager?.name || 'Unassigned'} · {p.members?.length || 0} members
            </div>
          </Link>
        ))}
        {projects.length === 0 && <p>No projects found.</p>}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`btn ${p === pagination.page ? '' : 'secondary'}`}
              onClick={() => loadProjects(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
