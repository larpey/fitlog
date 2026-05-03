import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    axios.post('/api/auth/register', { email, password, name })
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/');
        window.location.reload();
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          setError(err.response.data.error);
        } else {
          setError('Registration failed');
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
          <Link to="/login" className="auth-tab">Login</Link>
          <div className="auth-tab active">Register</div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label className="field-label">Name</label>
          <input
            className="text-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />

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
            placeholder="At least 6 characters"
          />

          {error ? <div className="error-msg">{error}</div> : null}

          <button type="submit" className="primary-btn">Create Account</button>
        </form>

        <p className="auth-footer">Have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}

export default Register;
