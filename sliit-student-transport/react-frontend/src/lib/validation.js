export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidStudentId(studentId) {
  return /^IT\d{8}$/i.test(studentId.trim());
}

export function isValidPhone(phone) {
  return /^(?:\+94|0)\d{9}$/.test(phone.replace(/\s+/g, ''));
}

export function getPasswordChecks(password) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password)
  };
}

export function scorePassword(password) {
  const checks = Object.values(getPasswordChecks(password));
  return checks.filter(Boolean).length;
}

export function getPasswordStrength(password) {
  const score = scorePassword(password);

  if (password.length === 0) return { label: 'Weak', className: 'weak' };
  if (score <= 2) return { label: 'Weak', className: 'weak' };
  if (score === 3) return { label: 'Fair', className: 'fair' };
  if (score === 4) return { label: 'Good', className: 'good' };
  return { label: 'Strong', className: 'strong' };
}

export function isFutureOrToday(dateValue) {
  if (!dateValue) return false;

  const inputDate = new Date(`${dateValue}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return inputDate >= today;
}
