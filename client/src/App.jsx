import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LogWorkout from './pages/LogWorkout';
import WorkoutDetail from './pages/WorkoutDetail';

function App() {
  // check if logged in
  const token = localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/log" element={token ? <LogWorkout /> : <Navigate to="/login" />} />
      <Route path="/workout/:id" element={token ? <WorkoutDetail /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
