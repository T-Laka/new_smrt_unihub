// ============================================================
// SLIIT Student Transport — Login Validation
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');
    const forgotCard = document.getElementById('forgotCard');
    const forgotLink = document.getElementById('forgotLink');
    const closeForgot = document.getElementById('closeForgot');
    const fetchQuestionBtn = document.getElementById('fetchQuestionBtn');
    if (!form) return;

    // Check for logout parameter - force clear session
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
        localStorage.removeItem('user');
        localStorage.removeItem('driver');
        localStorage.removeItem('currentRide');
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, 'login.html');
    }

    // Check if already logged in
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            if (userData && userData._id) {
                redirectToDashboard(userData);
                return;
            }
        } catch (e) {
            // Invalid user data, clear it
            localStorage.removeItem('user');
            localStorage.removeItem('driver');
        }
    }

    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }

    // Add validation listeners
    setupValidation();

    // Forgot password toggle
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleForgotCard(true);
        });
    }

    if (closeForgot) {
        closeForgot.addEventListener('click', function(e) {
            e.preventDefault();
            toggleForgotCard(false);
        });
    }

    if (fetchQuestionBtn) {
        fetchQuestionBtn.addEventListener('click', handleFetchQuestion);
    }

    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Forgot password submission
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotSubmit);
    }
});

// Setup validation
function setupValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Clear errors on input
    [emailInput, passwordInput].forEach(input => {
        if (!input) return;

        input.addEventListener('input', function() {
            clearFieldError(this);
            clearServerError();
        });

        input.addEventListener('focus', function() {
            clearFieldError(this);
        });
    });
}

// Validate email
function validateEmail(email) {
    if (!email) {
        return { valid: false, message: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }

    return { valid: true };
}

// Validate password
function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'Password is required' };
    }

    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters' };
    }

    return { valid: true };
}

function validateStudentId(studentId) {
    if (!studentId) {
        return { valid: false, message: 'Student ID is required' };
    }

    if (studentId.length < 6) {
        return { valid: false, message: 'Student ID looks too short' };
    }

    return { valid: true };
}

function validateSecurityAnswer(answer) {
    if (!answer) {
        return { valid: false, message: 'Security answer is required' };
    }

    if (answer.length < 2) {
        return { valid: false, message: 'Answer looks too short' };
    }

    return { valid: true };
}

// Show field error
function showFieldError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    formGroup.classList.add('invalid');

    const errorDiv = formGroup.querySelector('.error');
    if (errorDiv) {
        errorDiv.textContent = '⚠️ ' + message;
        errorDiv.style.color = '#ef4444';
    }
}

// Clear field error
function clearFieldError(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    formGroup.classList.remove('invalid');

    const errorDiv = formGroup.querySelector('.error');
    if (errorDiv) {
        errorDiv.textContent = '';
    }
}

// Show server error
function showServerError(message) {
    const form = document.getElementById('login-form');
    let errorAlert = document.querySelector('.server-error');

    if (!errorAlert) {
        errorAlert = document.createElement('div');
        errorAlert.className = 'server-error';
        form.insertBefore(errorAlert, form.firstChild);
    }

    errorAlert.textContent = '⚠️ ' + message;
}

function showServerSuccess(message) {
    const form = document.getElementById('login-form');
    let successAlert = document.querySelector('.server-success');

    if (!successAlert) {
        successAlert = document.createElement('div');
        successAlert.className = 'server-success';
        form.insertBefore(successAlert, form.firstChild);
    }

    successAlert.textContent = '✅ ' + message;
}

// Clear server error
function clearServerError() {
    const errorAlert = document.querySelector('.server-error');
    if (errorAlert) {
        errorAlert.remove();
    }

    const successAlert = document.querySelector('.server-success');
    if (successAlert) {
        successAlert.remove();
    }
}

// Toggle password visibility
function togglePassword() {
    const input = document.getElementById('password');
    const button = input.parentElement.querySelector('.toggle-password');

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Set loading state
function setLoadingState(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const inputs = document.querySelectorAll('#login-form input');

    if (isLoading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        inputs.forEach(input => input.disabled = true);
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        inputs.forEach(input => input.disabled = false);
    }
}

function toggleForgotCard(show) {
    const card = document.getElementById('forgotCard');
    if (!card) return;
    card.classList.toggle('show', !!show);
}

function setQuestionLoadingState(isLoading) {
    const btn = document.getElementById('fetchQuestionBtn');
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    if (isLoading) {
        btn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'flex';
    } else {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

function setResetLoadingState(isLoading) {
    const resetBtn = document.getElementById('resetSubmitBtn');
    if (!resetBtn) return;
    const btnText = resetBtn.querySelector('.btn-text');
    const btnLoader = resetBtn.querySelector('.btn-loader');
    const inputs = document.querySelectorAll('#forgot-form input');

    if (isLoading) {
        resetBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'flex';
        inputs.forEach(input => input.disabled = true);
    } else {
        resetBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
        inputs.forEach(input => input.disabled = false);
    }
}

async function handleFetchQuestion() {
    clearServerError();

    const email = document.getElementById('resetEmail')?.value.trim();
    const studentId = document.getElementById('resetStudentId')?.value.trim();

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showFieldError(document.getElementById('resetEmail'), emailValidation.message);
        return;
    }

    const studentValidation = validateStudentId(studentId);
    if (!studentValidation.valid) {
        showFieldError(document.getElementById('resetStudentId'), studentValidation.message);
        return;
    }

    setQuestionLoadingState(true);

    try {
        const response = await fetch(`${API_BASE}/users/security-question?email=${encodeURIComponent(email)}&studentId=${encodeURIComponent(studentId)}`);
        const data = await response.json();

        if (response.ok) {
            const questionInput = document.getElementById('resetQuestion');
            if (questionInput) {
                questionInput.value = data.securityQuestion || '';
            }
            showServerSuccess('Security question loaded. Please enter your answer.');
        } else {
            showServerError(data.message || 'Unable to load security question');
        }
    } catch (error) {
        console.error('Question fetch error:', error);
        showServerError('Connection error. Please try again.');
    } finally {
        setQuestionLoadingState(false);
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    clearServerError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showFieldError(document.getElementById('email'), emailValidation.message);
        return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showFieldError(document.getElementById('password'), passwordValidation.message);
        return;
    }

    // Show loading state
    setLoadingState(true);

    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save user to localStorage
            localStorage.setItem('user', JSON.stringify(data));

            // Remember email if checked
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Check if user is a driver
            if (data.role === 'driver') {
                await loadDriverInfo(data._id);
            }

            // Redirect to appropriate dashboard
            redirectToDashboard(data);
        } else {
            showServerError(data.message || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showServerError('Connection error. Please check your internet connection.');
    } finally {
        setLoadingState(false);
    }
}

async function handleForgotSubmit(e) {
    e.preventDefault();
    clearServerError();

    const email = document.getElementById('resetEmail')?.value.trim();
    const studentId = document.getElementById('resetStudentId')?.value.trim();
    const securityAnswer = document.getElementById('resetAnswer')?.value.trim();
    const securityQuestion = document.getElementById('resetQuestion')?.value.trim();
    const newPassword = document.getElementById('resetPassword')?.value;
    const confirmPassword = document.getElementById('resetConfirm')?.value;

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showFieldError(document.getElementById('resetEmail'), emailValidation.message);
        return;
    }

    const studentValidation = validateStudentId(studentId);
    if (!studentValidation.valid) {
        showFieldError(document.getElementById('resetStudentId'), studentValidation.message);
        return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        showFieldError(document.getElementById('resetPassword'), passwordValidation.message);
        return;
    }

    if (!securityQuestion) {
        showServerError('Please load your security question first.');
        return;
    }

    const answerValidation = validateSecurityAnswer(securityAnswer);
    if (!answerValidation.valid) {
        showFieldError(document.getElementById('resetAnswer'), answerValidation.message);
        return;
    }

    if (newPassword !== confirmPassword) {
        showFieldError(document.getElementById('resetConfirm'), 'Passwords do not match');
        return;
    }

    setResetLoadingState(true);

    try {
        const response = await fetch(`${API_BASE}/users/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, studentId, newPassword, securityAnswer })
        });

        const data = await response.json();

        if (response.ok) {
            showServerSuccess(data.message || 'Password updated successfully. You can log in now.');
            document.getElementById('forgot-form').reset();
            toggleForgotCard(false);
        } else {
            showServerError(data.message || 'Unable to reset password');
        }
    } catch (error) {
        console.error('Reset error:', error);
        showServerError('Connection error. Please try again.');
    } finally {
        setResetLoadingState(false);
    }
}

// Load driver info if user is a driver
async function loadDriverInfo(userId) {
    try {
        const response = await fetch(`${API_BASE}/drivers/user/${userId}`);
        if (response.ok) {
            const driver = await response.json();
            localStorage.setItem('driver', JSON.stringify(driver));
        }
    } catch (error) {
        console.error('Error loading driver info:', error);
    }
}

// Redirect to dashboard based on role
function redirectToDashboard(user) {
    if (user.role === 'admin') {
        window.location.href = 'admin.html';
    } else if (user.role === 'driver') {
        window.location.href = 'driver-dashboard.html';
    } else {
        window.location.href = 'rider-dashboard.html';
    }
}

// Make togglePassword available globally
window.togglePassword = togglePassword;
