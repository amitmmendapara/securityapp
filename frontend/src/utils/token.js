// utils/token.js — Access token stored in MEMORY only.
//
// WHY memory instead of localStorage?
//   localStorage is readable by any JS on the page (XSS risk).
//   Keeping the token in a module-level variable means:
//     ✅ XSS scripts cannot access it
//     ✅ No persistence between tabs / hard refreshes (intentional — use refresh token for that)
//     ✅ Cleared automatically when the page closes
//
// The REFRESH TOKEN is never handled here — it lives in an httpOnly cookie
// that the browser manages automatically. JS never touches it.

let _accessToken = null;

export const saveToken  = (token) => { _accessToken = token; };
export const getToken   = ()      => _accessToken;
export const removeToken = ()     => { _accessToken = null; };
export const isLoggedIn = ()      => Boolean(_accessToken);
