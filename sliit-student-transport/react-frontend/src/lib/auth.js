export function readStoredUser() {
  const rawUser = localStorage.getItem('user') || localStorage.getItem('currentUser');

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('driver');
    return null;
  }
}

export function storeAuthenticatedUser(userData) {
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('currentUser', JSON.stringify(userData));
  window.dispatchEvent(new Event('auth-changed'));
}

export function clearAuthenticatedUser() {
  localStorage.removeItem('user');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('driver');
  localStorage.removeItem('currentRide');
  localStorage.removeItem('rememberedEmail');
  window.dispatchEvent(new Event('auth-changed'));
}

export function resolveDashboardPath(role) {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'driver') {
    return '/driver-dashboard';
  }

  return '/rider-dashboard';
}