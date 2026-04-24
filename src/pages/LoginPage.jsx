import { useState } from 'react';
import { loginUser } from '../utils/storage';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = () => {
    if (!username.trim() || !password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setError('');
    // Small delay so button feels responsive
    setTimeout(() => {
      const res = loginUser(username.trim(), password);
      setLoading(false);
      if (res.success) {
        onLogin({ user_id: res.user_id, username: res.username, full_name: res.full_name });
      } else {
        setError(res.error || 'Login failed');
      }
    }, 300);
  };

  return (
    <div className="lp-root">
      <div className="lp-card">
        <div className="lp-logo">SE</div>
        <h1 className="lp-company">Saras Equipments Pvt. Ltd.</h1>
        <p className="lp-sub">Proforma Invoice System</p>

        {error && <div className="lp-error">{error}</div>}

        <div className="lp-field">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>

        <div className="lp-field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <button
          className="lp-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login →'}
        </button>

        <p className="lp-hint">
          Default password for all accounts: <strong>SARAS</strong>
        </p>
      </div>
    </div>
  );
}