import { createContext, useContext, useEffect, useState } from 'react';
import { AccountAPI } from '../storage/api.js';

const Ctx = createContext(null);
export const useAccount = () => useContext(Ctx);

export function AccountProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = guest

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) { setUser(null); return; }
    AccountAPI.me().then((r) => setUser(r.user)).catch(() => {
      localStorage.removeItem('user_token');
      setUser(null);
    });
  }, []);

  const login = (data) => { localStorage.setItem('user_token', data.token); setUser(data.user); };
  const logout = () => { localStorage.removeItem('user_token'); setUser(null); };
  const updateUser = (u) => setUser(u);

  return <Ctx.Provider value={{ user, login, logout, updateUser }}>{children}</Ctx.Provider>;
}
