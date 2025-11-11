// import React, { createContext, useContext, useEffect, useState } from 'react';

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true); // true until we check /me once

//   useEffect(() => {
//     let isMounted = true;
//     (async () => {
//       try {
//         const res = await fetch('/v1/auth/me', { credentials: 'include' });
//         if (res.ok) {
//           const data = await res.json();
//           if (isMounted) setUser(data.user);
//         } else {
//           if (isMounted) setUser(null);
//         }
//       } catch {
//         if (isMounted) setUser(null);
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     })();
//     return () => { isMounted = false; };
//   }, []);

//   const logout = async () => {
//     try {
//       await fetch('/v1/auth/logout', { method: 'POST', credentials: 'include' });
//     } catch {}
//     setUser(null);
//   };

//   const value = { user, setUser, loading, logout };
//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// }
