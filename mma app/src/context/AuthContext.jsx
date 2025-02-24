import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/auth/session', { credentials: 'include' })
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        console.error('Session check failed');
        setLoading(false);
      });
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' })
      .then(() => setUser(null))
      .catch(() => console.error('Logout failed'));
  };

  const updateUser = async (updates) => {
    try {
      const response = await fetch('http://localhost:5000/auth/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Update failed');
      const data = await response.json();
      setUser(data.user); // Sync with backend response
      return data.user;
    } catch (err) {
      console.error('Update Error:', err.message);
      throw err; // Let caller handle
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}