import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // get user info from local storage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/stats', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load stats');
        setLoading(false);
        console.log(err);
      });
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  }

  // get today's date as a string
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // helper to format relative date
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // calculate volume for a workout
  function getVolume(workout) {
    let total = 0;
    for (let i = 0; i < workout.exercises.length; i++) {
      for (let j = 0; j < workout.exercises[i].sets.length; j++) {
        total += workout.exercises[i].sets[j].weight * workout.exercises[i].sets[j].reps;
      }
    }
    return total;
  }

  return (
    <div className="page">
      <header className="top-bar">
        <div>
          <div className="greeting">Hey, {user.name || (user.email ? user.email.split('@')[0] : 'there')}</div>
          <div className="sub">{today}</div>
        </div>
        <button className="icon-btn" onClick={logout} title="Log out">↪</button>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">THIS MONTH</div>
          <div className="stat-value">{loading ? '–' : (stats ? stats.monthlyWorkoutCount : 0)}</div>
          <div className="stat-sub">workouts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">CURRENT SPLIT</div>
          <div className="stat-value">{user.split || 'PPL'}</div>
          <div className="stat-sub">6 day</div>
        </div>
      </div>

      <Link to="/log" className="primary-btn block">+ Log New Workout</Link>

      <div className="section-header">
        <h2>Recent Sessions</h2>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      {loading ? <div className="empty-state">Loading...</div> : null}

      {!loading && stats && stats.recent.length === 0 ? (
        <div className="empty-state">
          No workouts yet. Tap "Log New Workout" to get started.
        </div>
      ) : null}

      {!loading && stats && stats.recent.map((w) => {
        const exNames = w.exercises.map(e => e.name).join(', ') || 'No exercises';
        const vol = getVolume(w);
        return (
          <Link to={'/workout/' + w._id} key={w._id} className="session-item">
            <div className="session-row">
              <div className="session-title">{w.name} · {formatDate(w.date)}</div>
              <div className="session-meta">{w.durationMinutes || 0} min</div>
            </div>
            <div className="session-exercises">{exNames}</div>
            <div className="session-volume">{vol.toLocaleString()} lbs total volume</div>
          </Link>
        );
      })}
    </div>
  );
}

export default Dashboard;
