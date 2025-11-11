// import React from 'react';
// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from './AuthProvider';

// export default function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();
//   const location = useLocation();

//   if (loading) {
//     return <div style={{ padding: 16 }}>Checking session…</div>;
//   }

//   if (!user) {
//     const returnUrl = encodeURIComponent(location.pathname + location.search);
//     return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
//   }

//   return children;
// }