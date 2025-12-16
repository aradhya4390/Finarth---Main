import React, { createContext, useState, useEffect } from 'react';
import { updateProfileApi } from '../utils/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      // ignore
    }
  }, []);

  // Update profile for current user (name, email, avatar, password)
  const updateProfile = async (updates) => {
    // Try server-side profile update first; if it fails, fall back to localStorage-only update
    try {
      const res = await updateProfileApi(updates);
      // Expecting the API to return the updated user object and optionally a token
      const updated = res.user || res;
      // Update session
      const session = { email: updated.email, name: updated.name, avatar: updated.avatar, isLoggedIn: true };
      if (res.token) session.token = res.token;
      localStorage.setItem('currentUser', JSON.stringify(session));
      // Also update local users list so frontend fallback remains consistent
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const idx = users.findIndex(u => u.email === updated.email);
        if (idx !== -1) users[idx] = { ...users[idx], ...updated };
        else users.push({ ...updated });
        localStorage.setItem('users', JSON.stringify(users));
      } catch (e) {
        // ignore local users update failure
      }
      setUser(session);
      return session;
    } catch (apiErr) {
      // Fallback: update localStorage-only users/session
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const current = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!current) throw new Error('No current user');

        const idx = users.findIndex(u => u.email === current.email);
        if (idx === -1) throw new Error('User record not found');

        // Merge updates into stored user record (note: stored users use plain password property)
        const merged = { ...users[idx], ...updates };
        users[idx] = merged;
        localStorage.setItem('users', JSON.stringify(users));

        // Update session object (do not store password in session)
        const session = { email: merged.email, name: merged.name, avatar: merged.avatar, isLoggedIn: true };
        localStorage.setItem('currentUser', JSON.stringify(session));
        setUser(session);
        return session;
      } catch (err) {
        throw err;
      }
    }
  };

  const signup = async ({ name, email, password }) => {
    // simple localStorage-backed signup for demo / dev
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const exists = users.find(u => u.email === email);
    if (exists) {
      const err = new Error('User with this email already exists');
      err.response = { data: { message: 'User already exists' } };
      throw err;
    }

    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // set session
    const session = { email: newUser.email, name: newUser.name, isLoggedIn: true };
    localStorage.setItem('currentUser', JSON.stringify(session));
    setUser(session);
    return session;
  };

  const login = async (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      const err = new Error('Invalid credentials');
      err.response = { data: { message: 'Invalid email or password' } };
      throw err;
    }

    const session = { email: found.email, name: found.name, isLoggedIn: true };
    localStorage.setItem('currentUser', JSON.stringify(session));
    setUser(session);
    return session;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
