import React from 'react'
import { useState } from 'react'
import { useChatState } from '../../context/ChatProvider';
import { useNavigate } from 'react-router-dom';
import API from '../../config/api';

export const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setUser } = useChatState();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  console.log("1. Form submitted with:", { username, email, password });

  try {
    const { data } = await API.post('/api/users/register', {
      username,
      email,
      password,
    });
    console.log("2. Backend responded successfully:", data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    navigate('/chats');
  } catch (err) {
    console.error("3. Full error object:", err);
    console.error("4. Response data from backend:", err.response?.data);
    setError(err.response?.data?.message || err.message || 'Registration failed.');
  } finally {
    setLoading(false);
  }
};
  return (
    <form onSubmit={handleRegister} className="space-y-4 text-slate-200">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Username
        </label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="alex_dev"
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Email Address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@example.com"
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
