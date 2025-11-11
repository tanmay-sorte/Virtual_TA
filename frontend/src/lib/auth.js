// src/lib/auth.js

const SESSION_AUTH_KEY = 'isAuthed';

export function isAuthenticated() {
  try {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  } catch {
    // sessionStorage can throw in some environments (very rare)
    return false;
  }
}

export function setAuthenticated(value) {
  try {
    sessionStorage.setItem(SESSION_AUTH_KEY, value ? 'true' : 'false');
  } catch {
    // ignore
  }
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
  } catch {
    // ignore
  }
}

// let refreshing = false;
// let waiters = [];

// function notifyWaiters() {
//   waiters.forEach((resolve) => resolve());
//   waiters = [];
// }

// export async function apiFetch(input, init = {}) {
//   const doFetch = () =>
//     fetch(input, { credentials: 'include', ...init });

//   let res = await doFetch();

//   if (res.status !== 401) return res;

//   // try refresh once
//   if (!refreshing) {
//     refreshing = true;
//     try {
//       const r = await fetch('/v1/auth/refresh', {
//         method: 'POST',
//         credentials: 'include',
//       });
//       if (!r.ok) {
//         // refresh failed; let caller handle 401
//         return res;
//       }
//       notifyWaiters();
//     } catch {
//       return res;
//     } finally {
//       refreshing = false;
//     }
//   } else {
//     // wait for ongoing refresh
//     await new Promise((resolve) => waiters.push(resolve));
//   }

//   // retry once after refresh
//   res = await doFetch();
//   return res;
// }