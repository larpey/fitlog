import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE;

// formula for estimated 1 rep max (Epley)
function get1RM(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: 'Bearer ' + token };

    // get this workout
    axios.get(API + '/api/workouts/' + id, { headers })
      .then((res) => {
        setWorkout(res.data);
        // also get all workouts to check for PRs
        return axios.get(API + '/api/workouts', { headers });
      })
      .then((res) => {
        setAllWorkouts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load workout');
        setLoading(false);
        console.log(err);
      });
  }, [id]);

  // get volume for an exercise
  function getExVolume(ex) {
    let total = 0;
    for (let i = 0; i < ex.sets.length; i++) {
      total += ex.sets[i].weight * ex.sets[i].reps;
    }
    return total;
  }

  // get best 1RM in an exercise
  function getBest1RM(ex) {
    let best = 0;
    for (let i = 0; i < ex.sets.length; i++) {
      const r = get1RM(ex.sets[i].weight, ex.sets[i].reps);
      if (r > best) best = r;
    }
    return best;
  }

  // check if this is a PR
  function isPR(name, current) {
    if (current === 0) return false;
    let bestOther = 0;
    for (let i = 0; i < allWorkouts.length; i++) {
      if (allWorkouts[i]._id === workout._id) continue;
      for (let j = 0; j < allWorkouts[i].exercises.length; j++) {
        const ex = allWorkouts[i].exercises[j];
        if (ex.name.toLowerCase() === name.toLowerCase()) {
          const r = getBest1RM(ex);
          if (r > bestOther) bestOther = r;
        }
      }
    }
    return current > bestOther;
  }

  function handleDuplicate() {
    const token = localStorage.getItem('token');
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const newName = workout.name.split(' - ')[0] + ' - ' + today;
    const payload = {
      name: newName,
      durationMinutes: 0,
      notes: '',
      exercises: workout.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps }))
      }))
    };
    axios.post(API + '/api/workouts', payload, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then((res) => {
        navigate('/workout/' + res.data._id);
      })
      .catch((err) => {
        setError('Failed to duplicate');
        console.log(err);
      });
  }

  function handleDelete() {
    if (!window.confirm('Delete this workout?')) return;
    const token = localStorage.getItem('token');
    axios.delete(API + '/api/workouts/' + id, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        setError('Failed to delete');
        console.log(err);
      });
  }

  if (loading) return <div className="page"><div className="empty-state">Loading...</div></div>;
  if (error) return <div className="page"><div className="error-msg">{error}</div></div>;
  if (!workout) return null;

  // calculate total volume
  let totalVolume = 0;
  for (let i = 0; i < workout.exercises.length; i++) {
    totalVolume += getExVolume(workout.exercises[i]);
  }

  // find max exercise volume for the bars
  let maxExVolume = 1;
  for (let i = 0; i < workout.exercises.length; i++) {
    const v = getExVolume(workout.exercises[i]);
    if (v > maxExVolume) maxExVolume = v;
  }

  return (
    <div className="page">
      <header className="top-bar">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>&lt; {workout.name}</button>
          <div className="sub">
            {new Date(workout.date).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric'
            })}
          </div>
        </div>
        <button className="text-btn" onClick={handleDuplicate}>Duplicate</button>
      </header>

      <div className="summary-row">
        <div className="summary-card">
          <div className="stat-label">DURATION</div>
          <div className="stat-value">{workout.durationMinutes}m</div>
        </div>
        <div className="summary-card">
          <div className="stat-label">EXERCISES</div>
          <div className="stat-value">{workout.exercises.length}</div>
        </div>
        <div className="summary-card">
          <div className="stat-label">VOLUME</div>
          <div className="stat-value">{totalVolume.toLocaleString()}</div>
        </div>
      </div>

      {workout.exercises.map((ex, i) => {
        const vol = getExVolume(ex);
        const best = getBest1RM(ex);
        const pr = isPR(ex.name, best);
        const widthPct = Math.round((vol / maxExVolume) * 100);

        return (
          <div className="detail-card" key={i}>
            <div className="detail-card-header">
              <div className="detail-name-wrap">
                <span className="detail-name">{ex.name}</span>
                {pr ? <span className="pr-badge">PR</span> : null}
              </div>
              <span className="est-1rm">est 1RM {best}</span>
            </div>
            <div className="detail-sets">
              {ex.sets.length} sets - {ex.sets.map(s => s.weight + '×' + s.reps).join(', ')}
            </div>
            <div className="detail-volume">Volume: {vol.toLocaleString()} lbs</div>
            <div className="volume-bar">
              <div className="volume-bar-fill" style={{ width: widthPct + '%' }}></div>
            </div>
          </div>
        );
      })}

      {workout.notes ? (
        <div>
          <h3 className="section-h3">Session Notes</h3>
          <div className="notes-box">{workout.notes}</div>
        </div>
      ) : null}

      <button className="secondary-btn block" onClick={handleDuplicate}>
        Duplicate as Template
      </button>
      <button className="danger-btn block" onClick={handleDelete}>
        Delete Workout
      </button>
    </div>
  );
}

export default WorkoutDetail;
