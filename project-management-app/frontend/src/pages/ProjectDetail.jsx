import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/Badges';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
  const [error, setError] = useState('');

  const canManage = user.role === 'Admin' || user.role === 'ProjectManager';

  const load = () => {
    api.get(`/projects/${id}`).then((res) => setProject(res.data.data));
    api.get('/tasks', { params: { project: id, limit: 50 } }).then((res) => setTasks(res.data.data));
    if (canManage) api.get('/users', { params: { limit: 100 } }).then((res) => setUsers(res.data.data));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...newTask, project: id });
      setShowTaskForm(false);
      setNewTask({ title: '', description: '', assignedTo: '', priority: 'Medium', dueDate: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (!project) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <button className="btn secondary" onClick={() => navigate('/projects')} style={{ marginBottom: '1rem' }}>
        ← Back to Projects
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ marginTop: 0 }}>{project.name}</h2>
          {canManage && (
            <button className="btn danger" onClick={handleDeleteProject}>
              Delete Project
            </button>
          )}
        </div>
        <p>{project.description}</p>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          Status: {project.status} · PM: {project.projectManager?.name || 'Unassigned'} ·{' '}
          {project.deadline && `Due ${new Date(project.deadline).toLocaleDateString()}`}
        </div>
        <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Members: {project.members?.map((m) => m.name).join(', ') || 'None'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Tasks</h3>
        {canManage && (
          <button className="btn" onClick={() => setShowTaskForm((s) => !s)}>
            {showTaskForm ? 'Cancel' : '+ New Task'}
          </button>
        )}
      </div>

      {showTaskForm && (
        <form className="card" onSubmit={handleCreateTask}>
          <label>Title</label>
          <input required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
          <label>Description</label>
          <textarea rows={2} value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          <label>Assign To</label>
          <select value={newTask.assignedTo} onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
          <label>Priority</label>
          <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <label>Due Date</label>
          <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
          <button className="btn" type="submit">Create Task</button>
        </form>
      )}

      <div className="grid">
        {tasks.map((t) => (
          <div key={t._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{t.title}</strong>
              <PriorityBadge priority={t.priority} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{t.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={t.status} />
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                {t.assignedTo?.name || 'Unassigned'}
              </span>
            </div>
            {t.dueDate && (
              <div style={{ fontSize: '0.8rem', marginTop: '0.4rem' }}>
                Due {new Date(t.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && <p>No tasks yet for this project.</p>}
      </div>
    </div>
  );
}
