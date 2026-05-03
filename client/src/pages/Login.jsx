import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    axios.post('/api/auth/login', { email: email, password: password })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/');
        // page reload to update App's token check
        window.location.reload();
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          setError(err.response.data.error);
        } else {
          setError('Login failed');
        }
      });
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>FitLog</h1>
        <p>Track your lifts. See your progress.</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <div className="auth-tab active">Login</div>
          <Link to="/register" className="auth-tab">Register</Link>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label">Email</label>
          <input
            className="text-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label className="field-label">Password</label>
          <input
            className="text-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error ? <div className="error-msg">{error}</div> : null}

          <button type="submit" className="primary-btn">Log In</button>
        </form>

        <p className="auth-footer">No account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}

export default Login;
