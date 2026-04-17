import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../lib/api';
import { resolveDashboardPath, storeAuthenticatedUser } from '../lib/auth';
import { getPasswordChecks, isValidEmail } from '../lib/validation';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ email: '', password: '', rememberMe: false });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotCard, setShowForgotCard] = useState(false);
  const [forgotState, setForgotState] = useState({
    email: '',
    securityQuestion: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [questionLoaded, setQuestionLoaded] = useState(false);

  const emailError = !formState.email.trim()
    ? 'Email is required.'
    : !isValidEmail(formState.email)
      ? 'Enter a valid email address.'
      : '';

  const passwordError = !formState.password
    ? 'Password is required.'
    : formState.password.length < 8
      ? 'Password must be at least 8 characters.'
      : '';

  const isFormValid = !emailError && !passwordError;
  const forgotPasswordChecks = getPasswordChecks(forgotState.newPassword);

  const forgotEmailError = !forgotState.email.trim()
    ? 'Email is required.'
    : !isValidEmail(forgotState.email)
      ? 'Enter a valid email address.'
      : '';

  const forgotSecurityAnswerError = questionLoaded && !forgotState.securityAnswer.trim()
    ? 'Security answer is required.'
    : '';

  const forgotNewPasswordError = questionLoaded
    ? !forgotState.newPassword
      ? 'New password is required.'
      : Object.values(forgotPasswordChecks).every(Boolean)
        ? ''
        : 'New password does not meet password requirements.'
    : '';

  const forgotConfirmError = questionLoaded
    ? !forgotState.confirmPassword
      ? 'Please confirm your new password.'
      : forgotState.confirmPassword !== forgotState.newPassword
        ? 'Passwords do not match.'
        : ''
    : '';

  const canLoadQuestion = !forgotEmailError;
  const canCompleteReset = !forgotSecurityAnswerError && !forgotNewPasswordError && !forgotConfirmError;

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const result = await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formState.email,
          password: formState.password
        })
      });

      const userData = result.user || result;
      storeAuthenticatedUser(userData);
      navigate(resolveDashboardPath(userData.role));
    } catch (error) {
      setErrorMessage(error.message || 'Unable to log in right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSecurityQuestion(event) {
    event.preventDefault();
    setForgotError('');
    setForgotMessage('');

    if (!canLoadQuestion) {
      setForgotError(forgotEmailError);
      return;
    }

    setForgotLoading(true);
    try {
      const result = await apiRequest('/api/users/forgot-password/security-question', {
        method: 'POST',
        body: JSON.stringify({ email: forgotState.email })
      });

      setQuestionLoaded(true);
      setForgotMessage(result.message || 'Security question loaded.');
      setForgotState((current) => ({ ...current, securityQuestion: result.securityQuestion || '' }));
    } catch (error) {
      setQuestionLoaded(false);
      setForgotState((current) => ({
        ...current,
        securityQuestion: '',
        securityAnswer: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setForgotError(error.message || 'Unable to load security question.');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setForgotError('');
    setForgotMessage('');

    if (!canCompleteReset) {
      setForgotError(forgotSecurityAnswerError || forgotNewPasswordError || forgotConfirmError);
      return;
    }

    setForgotLoading(true);
    try {
      const result = await apiRequest('/api/users/forgot-password/security-reset', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotState.email,
          securityAnswer: forgotState.securityAnswer,
          newPassword: forgotState.newPassword
        })
      });

      setForgotMessage(result.message || 'Password reset successful. You can now log in.');
      setQuestionLoaded(false);
      setForgotState({ email: '', securityQuestion: '', securityAnswer: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setForgotError(error.message || 'Unable to reset password.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Account Access"
        title="Welcome Back"
        subtitle="Log in to access your SLIIT Transport account."
      />

      <section className="section-block">
        <div className="container auth-grid">
          <div className="surface info-panel">
            <h2>Secure access for students</h2>
            <p>Use your registered email address to access your dashboard, messages, and ride history.</p>
            <div className="callout-box subtle">
              <strong>Need help?</strong>
              <p>Use the password reset area below if you need to recover access to your account.</p>
            </div>
          </div>

          <div className="surface form-card">
            <h2>Login to Your Account</h2>
            <p className="form-note">Enter your credentials to continue.</p>

            {errorMessage ? <div className="notice error">{errorMessage}</div> : null}

            <form onSubmit={handleSubmit} className="stacked-form">
              <label>
                <span className="field-label-row">Email Address</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                  onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                  placeholder="student@my.sliit.lk"
                  autoComplete="email"
                  className={touched.email && emailError ? 'input-error' : ''}
                  aria-invalid={touched.email && emailError ? 'true' : 'false'}
                  required
                />
                <span className="field-helper">Use the same email you registered with.</span>
                {touched.email && emailError ? <span className="field-error">{emailError}</span> : null}
              </label>

              <label>
                <span className="field-label-row">Password</span>
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formState.password}
                    onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
                    onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={touched.password && passwordError ? 'input-error' : ''}
                    aria-invalid={touched.password && passwordError ? 'true' : 'false'}
                    required
                  />
                  <button type="button" className="field-action" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {touched.password && passwordError ? <span className="field-error">{passwordError}</span> : null}
              </label>

              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={formState.rememberMe}
                  onChange={(event) => setFormState((current) => ({ ...current, rememberMe: event.target.checked }))}
                />
                Remember me on this device
              </label>

              <button type="submit" className="button button-primary button-full" disabled={loading || !isFormValid}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <button type="button" className="text-button" onClick={() => setShowForgotCard((value) => !value)}>
              Forgot password?
            </button>

            {showForgotCard ? (
              <div className="callout-box subtle">
                <strong>Password reset</strong>
                <p>Provide your account email, answer your security question, and set a new password.</p>

                {forgotError ? <div className="notice error">{forgotError}</div> : null}
                {forgotMessage ? <div className="notice success">{forgotMessage}</div> : null}

                <form className="stacked-form" onSubmit={handleLoadSecurityQuestion}>
                  <label>
                    <span className="field-label-row">Account Email</span>
                    <input
                      type="email"
                      value={forgotState.email}
                      onChange={(event) => {
                        const email = event.target.value;
                        setForgotState((current) => ({
                          ...current,
                          email,
                          securityQuestion: '',
                          securityAnswer: '',
                          newPassword: '',
                          confirmPassword: ''
                        }));
                        setQuestionLoaded(false);
                      }}
                      placeholder="student@my.sliit.lk"
                      className={forgotEmailError ? 'input-error' : ''}
                    />
                    {forgotEmailError ? <span className="field-error">{forgotEmailError}</span> : null}
                  </label>

                  <button type="submit" className="button button-secondary button-full" disabled={forgotLoading || !canLoadQuestion}>
                    {forgotLoading ? 'Loading question...' : 'Load Security Question'}
                  </button>
                </form>

                {questionLoaded ? (
                  <form className="stacked-form" onSubmit={handleResetPassword}>
                    <label>
                      <span className="field-label-row">Security Question</span>
                      <input type="text" value={forgotState.securityQuestion} readOnly />
                    </label>

                    <label>
                      <span className="field-label-row">Security Answer</span>
                      <input
                        type="text"
                        value={forgotState.securityAnswer}
                        onChange={(event) => setForgotState((current) => ({ ...current, securityAnswer: event.target.value }))}
                        placeholder="Enter your answer"
                        className={forgotSecurityAnswerError ? 'input-error' : ''}
                      />
                      {forgotSecurityAnswerError ? <span className="field-error">{forgotSecurityAnswerError}</span> : null}
                    </label>

                    <label>
                      <span className="field-label-row">New Password</span>
                      <input
                        type="password"
                        value={forgotState.newPassword}
                        onChange={(event) => setForgotState((current) => ({ ...current, newPassword: event.target.value }))}
                        placeholder="Create new password"
                        className={forgotNewPasswordError ? 'input-error' : ''}
                      />
                      {forgotNewPasswordError ? <span className="field-error">{forgotNewPasswordError}</span> : null}
                    </label>

                    <label>
                      <span className="field-label-row">Confirm New Password</span>
                      <input
                        type="password"
                        value={forgotState.confirmPassword}
                        onChange={(event) => setForgotState((current) => ({ ...current, confirmPassword: event.target.value }))}
                        placeholder="Confirm new password"
                        className={forgotConfirmError ? 'input-error' : ''}
                      />
                      {forgotConfirmError ? <span className="field-error">{forgotConfirmError}</span> : null}
                    </label>

                    <button type="submit" className="button button-primary button-full" disabled={forgotLoading || !canCompleteReset}>
                      {forgotLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                ) : null}
              </div>
            ) : null}

            <p className="form-footer-link">
              Need an account? <Link to="/register">Register here</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}