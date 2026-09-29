import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';

const COLORS = ['#9ca3af', '#3b82f6', '#16a34a'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  if (error) return <div className="container error-banner">{error}</div>;
  if (!data) return <div className="container">Loading dashboard...</div>;

  const pieData = [
    { name: 'To Do', value: data.taskStatistics.toDo },
    { name: 'In Progress', value: data.taskStatistics.inProgress },
    { name: 'Completed', value: data.taskStatistics.completed },
  ];

  return (
    <div className="container">
      <h2>Dashboard</h2>

      <div className="grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ color: 'var(--muted)' }}>Total Tasks</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{data.taskStatistics.total}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--muted)' }}>Pending</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{data.taskStatistics.pending}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--muted)' }}>Completed</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>
            {data.taskStatistics.completed}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3>Completed vs Pending</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Team Performance (completion rate %)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.teamPerformance}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="completionRate" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Project Progress</h3>
        {data.projectProgress.length === 0 && <p>No projects yet.</p>}
        {data.projectProgress.map((p) => (
          <div key={p.projectId} style={{ marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>{p.name}</span>
              <span>{p.percentComplete}% ({p.completedTasks}/{p.totalTasks})</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 999, height: 8 }}>
              <div
                style={{
                  width: `${p.percentComplete}%`,
                  background: '#4f46e5',
                  height: 8,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Upcoming Deadlines</h3>
        {data.upcomingDeadlines.length === 0 && <p>No upcoming task deadlines.</p>}
        {data.upcomingDeadlines.map((t) => (
          <div key={t._id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
            <strong>{t.title}</strong> — {t.project?.name} — due{' '}
            {new Date(t.dueDate).toLocaleDateString()} — assigned to {t.assignedTo?.name || 'Unassigned'}
          </div>
        ))}
      </div>
    </div>
  );
}
