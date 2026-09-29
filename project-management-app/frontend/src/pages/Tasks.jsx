import { useEffect, useState } from 'react';
import api from '../api/axios';
import { PriorityBadge, StatusBadge } from '../components/Badges';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api
      .get('/tasks', { params: { status, priority, search, limit: 50 } })
      .then((res) => setTasks(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load tasks'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, search]);

  const updateStatus = async (taskId, newStatus) => {
    await api.put(`/tasks/${taskId}`, { status: newStatus });
    load();
  };

  const submitComment = async (taskId) => {
    if (!commentText.trim()) return;
    await api.post(`/tasks/${taskId}/comments`, { text: commentText });
    setCommentText('');
    const res = await api.get(`/tasks/${taskId}`);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
  };

  return (
    <div className="container">
      <h2>My Tasks</h2>
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 0, flex: 1, minWidth: 160 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">All statuses</option>
          <option value="ToDo">To Do</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ marginBottom: 0 }}>
          <option value="">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      {tasks.map((t) => (
        <div key={t._id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{t.title}</strong>
            <PriorityBadge priority={t.priority} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{t.description}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <StatusBadge status={t.status} />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.project?.name}</span>
          </div>

          <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem' }}>
            {['ToDo', 'InProgress', 'Completed'].map((s) => (
              <button
                key={s}
                className={`btn ${t.status === s ? '' : 'secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                onClick={() => updateStatus(t._id, s)}
              >
                {s === 'ToDo' ? 'To Do' : s === 'InProgress' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>

          <button
            className="btn secondary"
            style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}
            onClick={() => setExpanded(expanded === t._id ? null : t._id)}
          >
            {expanded === t._id ? 'Hide comments' : `Comments (${t.comments?.length || 0})`}
          </button>

          {expanded === t._id && (
            <div style={{ marginTop: '0.6rem' }}>
              {(t.comments || []).map((c, idx) => (
                <div key={idx} style={{ fontSize: '0.85rem', padding: '0.3rem 0', borderTop: '1px solid var(--border)' }}>
                  <strong>{c.author?.name || 'User'}:</strong> {c.text}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
                <button className="btn" onClick={() => submitComment(t._id)}>Post</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {tasks.length === 0 && <p>No tasks found.</p>}
    </div>
  );
}
