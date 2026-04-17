import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { resolveDashboardPath, storeAuthenticatedUser } from '../lib/auth';
import {
  getPasswordChecks,
  getPasswordStrength,
  isValidEmail,
  isValidPhone,
  isValidStudentId
} from '../lib/validation';

const securityQuestionOptions = [
  'What is your favorite school subject?',
  'What is your mother\'s first name?',
  'What city were you born in?',
  'What is the name of your first pet?',
  'What was your childhood nickname?'
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    role: 'rider',
    securityQuestion: securityQuestionOptions[0],
    securityAnswer: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState({});
  const passwordStrength = useMemo(() => getPasswordStrength(formState.password), [formState.password]);
  const passwordChecks = useMemo(() => getPasswordChecks(formState.password), [formState.password]);

  const errors = {
    name: !formState.name.trim() ? 'Full name is required.' : formState.name.trim().length < 3 ? 'Name must be at least 3 characters.' : '',
    studentId: !formState.studentId.trim()
      ? 'Student ID is required.'
      : !isValidStudentId(formState.studentId)
        ? 'Use format IT######## (example: IT21234567).'
        : '',
    email: !formState.email.trim() ? 'Email is required.' : !isValidEmail(formState.email) ? 'Enter a valid email address.' : '',
    phone: !formState.phone.trim()
      ? 'Phone number is required.'
      : !isValidPhone(formState.phone)
        ? 'Use Sri Lankan format like 07XXXXXXXX or +947XXXXXXXX.'
        : '',
    securityQuestion: !formState.securityQuestion ? 'Security question is required.' : '',
    securityAnswer: !formState.securityAnswer.trim()
      ? 'Security answer is required.'
      : formState.securityAnswer.trim().length < 2
        ? 'Security answer is too short.'
        : '',
    password: !formState.password
      ? 'Password is required.'
      : Object.values(passwordChecks).every(Boolean)
        ? ''
        : 'Password must meet all password rules below.',
    confirmPassword: !formState.confirmPassword
      ? 'Please confirm your password.'
      : formState.password !== formState.confirmPassword
        ? 'Passwords do not match.'
        : '',
    acceptedTerms: formState.acceptedTerms ? '' : 'You must accept the terms and privacy policy.'
  };

  const isFormValid = Object.values(errors).every((value) => !value);

  function touchField(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({
      name: true,
      studentId: true,
      email: true,
      phone: true,
      securityQuestion: true,
      securityAnswer: true,
      password: true,
      confirmPassword: true,
      acceptedTerms: true
    });

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await apiRequest('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formState.name,
          studentId: formState.studentId,
          email: formState.email,
          phone: formState.phone,
          role: formState.role,
          securityQuestion: formState.securityQuestion,
          securityAnswer: formState.securityAnswer,
          password: formState.password
        })
      });

      const userData = result.user || result;
      storeAuthenticatedUser(userData);
      navigate(resolveDashboardPath(userData.role || formState.role));
    } catch (error) {
      setErrorMessage(error.message || 'Unable to register right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Create Account"
        title="Join SLIIT Transport"
        subtitle="Create your free account and start sharing rides today."
      />

      <section className="section-block">
        <div className="container auth-grid">
          <div className="surface info-panel">
            <h2>How the platform works</h2>
            <p>Register as a rider, or choose driver if you want to offer rides to fellow students.</p>
            <ul className="feature-list">
              <li>Verified student accounts.</li>
              <li>Shared trip cost and messaging.</li>
              <li>Role-aware dashboards after login.</li>
            </ul>
          </div>

          <form className="surface form-card" onSubmit={handleSubmit}>
            <h2>Create Your Account</h2>
            <p className="form-note">All fields are required.</p>

            {errorMessage ? <div className="notice error">{errorMessage}</div> : null}

            <div className="field-grid two-col">
              <label>
                <span className="field-label-row">Full Name</span>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  onBlur={() => touchField('name')}
                  placeholder="Your full name"
                  className={touched.name && errors.name ? 'input-error' : ''}
                  required
                />
                {touched.name && errors.name ? <span className="field-error">{errors.name}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Student ID</span>
                <input
                  type="text"
                  value={formState.studentId}
                  onChange={(event) => setFormState((current) => ({ ...current, studentId: event.target.value }))}
                  onBlur={() => touchField('studentId')}
                  placeholder="IT21000000"
                  className={touched.studentId && errors.studentId ? 'input-error' : ''}
                  required
                />
                <span className="field-helper">Use the student ID from your SLIIT profile.</span>
                {touched.studentId && errors.studentId ? <span className="field-error">{errors.studentId}</span> : null}
              </label>
            </div>

            <label>
              <span className="field-label-row">Email Address</span>
              <input
                type="email"
                value={formState.email}
                onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                onBlur={() => touchField('email')}
                placeholder="student@my.sliit.lk"
                className={touched.email && errors.email ? 'input-error' : ''}
                required
              />
              {touched.email && errors.email ? <span className="field-error">{errors.email}</span> : null}
            </label>

            <label>
              <span className="field-label-row">Phone Number</span>
              <input
                type="tel"
                value={formState.phone}
                onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
                onBlur={() => touchField('phone')}
                placeholder="07X XXX XXXX"
                className={touched.phone && errors.phone ? 'input-error' : ''}
                required
              />
              {touched.phone && errors.phone ? <span className="field-error">{errors.phone}</span> : null}
            </label>

            <label>
              Account Type
              <select
                value={formState.role}
                onChange={(event) => setFormState((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="rider">Rider</option>
                <option value="driver">Driver</option>
              </select>
            </label>

            <label>
              <span className="field-label-row">Security Question</span>
              <select
                value={formState.securityQuestion}
                onChange={(event) => setFormState((current) => ({ ...current, securityQuestion: event.target.value }))}
                onBlur={() => touchField('securityQuestion')}
                className={touched.securityQuestion && errors.securityQuestion ? 'input-error' : ''}
              >
                {securityQuestionOptions.map((question) => (
                  <option key={question} value={question}>
                    {question}
                  </option>
                ))}
              </select>
              {touched.securityQuestion && errors.securityQuestion ? <span className="field-error">{errors.securityQuestion}</span> : null}
            </label>

            <label>
              <span className="field-label-row">Security Answer</span>
              <input
                type="text"
                value={formState.securityAnswer}
                onChange={(event) => setFormState((current) => ({ ...current, securityAnswer: event.target.value }))}
                onBlur={() => touchField('securityAnswer')}
                placeholder="Enter your answer"
                className={touched.securityAnswer && errors.securityAnswer ? 'input-error' : ''}
                required
              />
              <span className="field-helper">You will use this answer to reset password later.</span>
              {touched.securityAnswer && errors.securityAnswer ? <span className="field-error">{errors.securityAnswer}</span> : null}
            </label>

            <div className="field-grid two-col">
              <label>
                <span className="field-label-row">Password</span>
                <input
                  type="password"
                  value={formState.password}
                  onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                  onBlur={() => touchField('password')}
                  placeholder="Create a password"
                  className={touched.password && errors.password ? 'input-error' : ''}
                  required
                />
                <div className="password-strength">
                  <span className={`strength-bar ${passwordStrength.className}`} />
                  <span className="strength-label">{passwordStrength.label}</span>
                </div>
                <div className="validation-grid">
                  <span className={`validation-item ${passwordChecks.minLength ? 'ok' : ''}`}>At least 8 characters</span>
                  <span className={`validation-item ${passwordChecks.hasUpper ? 'ok' : ''}`}>1 uppercase letter</span>
                  <span className={`validation-item ${passwordChecks.hasLower ? 'ok' : ''}`}>1 lowercase letter</span>
                  <span className={`validation-item ${passwordChecks.hasNumber ? 'ok' : ''}`}>1 number</span>
                  <span className={`validation-item ${passwordChecks.hasSymbol ? 'ok' : ''}`}>1 symbol</span>
                </div>
                {touched.password && errors.password ? <span className="field-error">{errors.password}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Confirm Password</span>
                <input
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(event) => setFormState((current) => ({ ...current, confirmPassword: event.target.value }))}
                  onBlur={() => touchField('confirmPassword')}
                  placeholder="Confirm password"
                  className={touched.confirmPassword && errors.confirmPassword ? 'input-error' : ''}
                  required
                />
                {touched.confirmPassword && errors.confirmPassword ? <span className="field-error">{errors.confirmPassword}</span> : null}
              </label>
            </div>

            <label className="inline-check">
              <input
                type="checkbox"
                checked={formState.acceptedTerms}
                onChange={(event) => {
                  setFormState((current) => ({ ...current, acceptedTerms: event.target.checked }));
                  touchField('acceptedTerms');
                }}
                required
              />
              I agree to the platform terms and privacy policy.
            </label>
            {touched.acceptedTerms && errors.acceptedTerms ? <span className="field-error">{errors.acceptedTerms}</span> : null}

            <button type="submit" className="button button-primary button-full" disabled={loading || !isFormValid}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="form-footer-link">
              Already have an account? <Link to="/login">Login instead</Link>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}