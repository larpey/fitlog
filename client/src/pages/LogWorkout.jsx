import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExerciseCard from '../components/ExerciseCard';

function LogWorkout() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // set default name to today's date
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setName('Workout - ' + today);
  }, []);

  // timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' + sec : sec);
  }

  function addExercise() {
    setExercises([...exercises, { name: '', sets: [{ weight: 0, reps: 0 }] }]);
  }

  function updateExercise(i, ex) {
    const newExercises = [...exercises];
    newExercises[i] = ex;
    setExercises(newExercises);
  }

  function removeExercise(i) {
    setExercises(exercises.filter((_, idx) => idx !== i));
  }

  function handleFinish() {
    setError('');

    if (!name.trim()) {
      setError('Session name is required');
      return;
    }
    if (exercises.length === 0) {
      setError('Add at least one exercise');
      return;
    }
    for (let i = 0; i < exercises.length; i++) {
      if (!exercises[i].name.trim()) {
        setError('All exercises need a name');
        return;
      }
      if (exercises[i].sets.length === 0) {
        setError('Add at least one set to ' + exercises[i].name);
        return;
      }
    }

    // build payload
    const payload = {
      name: name.trim(),
      durationMinutes: Math.floor(elapsed / 60),
      notes: notes,
      exercises: exercises.map(ex => ({
        name: ex.name.trim(),
        sets: ex.sets.map(s => ({
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0
        }))
      }))
    };

    const token = localStorage.getItem('token');
    axios.post(import.meta.env.VITE_API_BASE + '/api/workouts', payload, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(() => {
        navigate('/');
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          setError(err.response.data.error);
        } else {
          setError('Failed to save workout');
        }
      });
  }

  return (
    <div className="page">
      <header className="top-bar">
        <button className="back-link" onClick={() => navigate('/')}>&lt; New Session</button>
        <div className="timer">
          <div className="timer-label">Timer</div>
          <div className="timer-value">{formatTime(elapsed)}</div>
        </div>
      </header>

      <label className="field-label small">SESSION NAME</label>
      <input
        className="text-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {exercises.map((ex, i) => (
        <ExerciseCard
          key={i}
          exercise={ex}
          onChange={(updated) => updateExercise(i, updated)}
          onRemove={() => removeExercise(i)}
        />
      ))}

      <button className="add-exercise-btn" onClick={addExercise}>+ Add Exercise</button>

      <label className="field-label small">SESSION NOTES</label>
      <textarea
        className="text-input"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="How did it feel? Anything to remember for next time?"
        rows="3"
      />

      {error ? <div className="error-msg">{error}</div> : null}

      <button className="primary-btn block" onClick={handleFinish}>Finish Session</button>
    </div>
  );
}

export default LogWorkout;
