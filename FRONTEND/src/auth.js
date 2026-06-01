export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getRole() {
  return getCurrentUser()?.role || null;
}

export function isLoggedIn() {
  return !!localStorage.getItem("token");
}
