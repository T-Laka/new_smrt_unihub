// ============================================================
// SLIIT Student Transport — Registration Validation
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Validation Rules
const validationRules = {
    name: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/,
        messages: {
            required: 'Full name is required',
            minLength: 'Name must be at least 3 characters',
            maxLength: 'Name cannot exceed 50 characters',
            pattern: 'Name can only contain letters and spaces'
        }
    },
    studentId: {
        required: true,
        pattern: /^[A-Z]{2}\d{8}$/,
        messages: {
            required: 'Student ID is required',
            pattern: 'Invalid format. Use: IT21XXXXXX'
        }
    },
    email: {
        required: true,
        pattern: /^[a-zA-Z0-9._%+-]+@(my\.sliit\.lk|sliit\.lk)$/,
        messages: {
            required: 'Email is required',
            pattern: 'Please use a valid SLIIT email (@my.sliit.lk or @sliit.lk)'
        }
    },
    phone: {
        required: true,
        pattern: /^0[0-9]{9}$/,
        stripSpaces: true,
        messages: {
            required: 'Phone number is required',
            pattern: 'Enter a valid Sri Lankan phone number (10 digits starting with 0)'
        }
    },
    password: {
        required: true,
        minLength: 8,
        messages: {
            required: 'Password is required',
            minLength: 'Password must be at least 8 characters',
            weak: 'Password is too weak'
        }
    },
    securityQuestion: {
        required: true,
        messages: {
            required: 'Please select a security question'
        }
    },
    securityAnswer: {
        required: true,
        minLength: 2,
        messages: {
            required: 'Security answer is required',
            minLength: 'Answer looks too short'
        }
    },
    confirm_password: {
        required: true,
        match: 'password',
        messages: {
            required: 'Please confirm your password',
            match: 'Passwords do not match'
        }
    },
    terms: {
        required: true,
        messages: {
            required: 'You must agree to the terms and conditions'
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    if (!form) return;

    // Add real-time validation listeners
    setupRealtimeValidation();

    // Password strength indicator
    setupPasswordStrength();

    // Form submission
    form.addEventListener('submit', handleSubmit);
});

// Setup real-time validation
function setupRealtimeValidation() {
    const fields = ['name', 'studentId', 'email', 'phone', 'securityQuestion', 'securityAnswer', 'password', 'confirmPassword'];

    fields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input) return;

        // Validate on blur
        input.addEventListener('blur', function() {
            validateField(this);
        });

        // Clear error on focus
        input.addEventListener('focus', function() {
            clearFieldError(this);
        });

        // Real-time validation while typing (with debounce)
        let timeout;
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.value.length > 0) {
                    validateField(this);
                }
            }, 500);
        });
    });

    // Special handling for confirm password
    const confirmPassword = document.getElementById('confirmPassword');
    const password = document.getElementById('password');

    if (confirmPassword && password) {
        password.addEventListener('input', function() {
            if (confirmPassword.value) {
                validateField(confirmPassword);
            }
        });
    }
}

// Validate a single field
function validateField(input) {
    const fieldName = input.name;
    let value = input.type === 'checkbox' ? input.checked : input.value.trim();
    const rules = validationRules[fieldName];

    if (!rules) return true;

    const formGroup = input.closest('.form-group');

    // Strip spaces if specified (for phone numbers)
    let valueForPattern = value;
    if (rules.stripSpaces && typeof value === 'string') {
        valueForPattern = value.replace(/\s/g, '');
    }

    // Required check
    if (rules.required && !value) {
        showFieldError(input, rules.messages.required);
        return false;
    }

    // Skip other validations if empty and not required
    if (!value) {
        clearFieldError(input);
        return true;
    }

    // Min length check (use original value with spaces for display)
    if (rules.minLength && valueForPattern.length < rules.minLength) {
        showFieldError(input, rules.messages.minLength);
        return false;
    }

    // Max length check
    if (rules.maxLength && valueForPattern.length > rules.maxLength) {
        showFieldError(input, rules.messages.maxLength);
        return false;
    }

    // Pattern check (use valueForPattern for fields that strip spaces)
    if (rules.pattern && !rules.pattern.test(valueForPattern)) {
        showFieldError(input, rules.messages.pattern);
        return false;
    }

    // Match check (for confirm password)
    if (rules.match) {
        const matchField = document.querySelector(`[name="${rules.match}"]`);
        if (matchField && value !== matchField.value) {
            showFieldError(input, rules.messages.match);
            return false;
        }
    }

    // Password strength check
    if (fieldName === 'password') {
        const strength = calculatePasswordStrength(value);
        if (strength.score < 2) {
            showFieldError(input, rules.messages.weak);
            return false;
        }
    }

    // All validations passed
    showFieldSuccess(input);
    return true;
}

// Show field error
function showFieldError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    formGroup.classList.remove('valid');
    formGroup.classList.add('invalid');

    const errorDiv = formGroup.querySelector('.error');
    if (errorDiv) {
        errorDiv.textContent = '⚠️ ' + message;
        errorDiv.style.color = '#ef4444';
    }

    input.setAttribute('aria-invalid', 'true');
}

// Show field success
function showFieldSuccess(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    formGroup.classList.remove('invalid');
    formGroup.classList.add('valid');

    const errorDiv = formGroup.querySelector('.error');
    if (errorDiv) {
        errorDiv.textContent = '';
    }

    input.setAttribute('aria-invalid', 'false');
}

// Clear field error
function clearFieldError(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    formGroup.classList.remove('invalid', 'valid');

    const errorDiv = formGroup.querySelector('.error');
    if (errorDiv) {
        errorDiv.textContent = '';
    }

    input.removeAttribute('aria-invalid');
}

// Setup password strength indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', function() {
        const strength = calculatePasswordStrength(this.value);
        updateStrengthIndicator(strength);
    });
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    const feedback = [];

    if (!password) {
        return { score: 0, label: 'Enter a password', class: '' };
    }

    // Length checks
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Determine strength level
    let label, strengthClass;

    if (score <= 2) {
        label = 'Weak - Add numbers & symbols';
        strengthClass = 'weak';
    } else if (score <= 3) {
        label = 'Fair - Add uppercase & symbols';
        strengthClass = 'fair';
    } else if (score <= 4) {
        label = 'Good - Almost there!';
        strengthClass = 'good';
    } else {
        label = 'Strong - Great password!';
        strengthClass = 'strong';
    }

    return { score, label, class: strengthClass };
}

// Update strength indicator UI
function updateStrengthIndicator(strength) {
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');

    if (!fill || !text) return;

    // Remove all classes
    fill.className = 'strength-fill';
    text.className = 'strength-text';

    // Add appropriate class
    if (strength.class) {
        fill.classList.add(strength.class);
        text.classList.add(strength.class);
    }

    text.textContent = strength.label;
}

// Toggle password visibility
function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    const button = input.parentElement.querySelector('.toggle-password');

    if (input.type === 'password') {
        input.type = 'text';
        if (button) button.textContent = '🙈';
    } else {
        input.type = 'password';
        if (button) button.textContent = '👁️';
    }
}

// Validate entire form
function validateForm() {
    const form = document.getElementById('register-form');
    let isValid = true;

    // Validate each field
    const fields = form.querySelectorAll('input[required], select[required]');
    fields.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });

    return isValid;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    if (!validateForm()) {
        // Scroll to first error
        const firstError = document.querySelector('.form-group.invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Get form data
    const formData = {
        name: document.getElementById('name').value.trim(),
        studentId: document.getElementById('studentId').value.trim().toUpperCase(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phone: document.getElementById('phone').value.trim().replace(/\s/g, ''),
        password: document.getElementById('password').value,
        securityQuestion: document.getElementById('securityQuestion').value,
        securityAnswer: document.getElementById('securityAnswer').value.trim(),
        role: 'rider'
    };

    // Show loading state
    setLoadingState(true);

    try {
        const response = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Success - show success message
            showSuccessMessage();
        } else {
            // Server error
            handleServerError(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        handleServerError('Connection error. Please check your internet connection.');
    } finally {
        setLoadingState(false);
    }
}

// Set loading state
function setLoadingState(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    if (isLoading) {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
    } else {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Show success message
function showSuccessMessage() {
    const form = document.getElementById('register-form');
    const successMessage = document.getElementById('successMessage');
    const footerLink = document.querySelector('.form-footer-link');

    form.style.display = 'none';
    if (footerLink) footerLink.style.display = 'none';
    successMessage.classList.add('show');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle server error
function handleServerError(message) {
    // Show error at the top of the form
    const form = document.getElementById('register-form');
    let errorAlert = document.querySelector('.server-error');

    if (!errorAlert) {
        errorAlert = document.createElement('div');
        errorAlert.className = 'server-error';
        errorAlert.style.cssText = `
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9rem;
        `;
        form.insertBefore(errorAlert, form.firstChild);
    }

    errorAlert.textContent = '⚠️ ' + message;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorAlert) {
            errorAlert.remove();
        }
    }, 5000);
}

// Format phone number as user types
document.getElementById('phone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');

    // Limit to 10 digits
    if (value.length > 10) {
        value = value.substring(0, 10);
    }

    // Format: 07X XXX XXXX
    if (value.length > 3 && value.length <= 6) {
        value = value.substring(0, 3) + ' ' + value.substring(3);
    } else if (value.length > 6) {
        value = value.substring(0, 3) + ' ' + value.substring(3, 6) + ' ' + value.substring(6);
    }

    e.target.value = value;
});

// Auto-uppercase student ID
document.getElementById('studentId')?.addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});

// Make togglePassword available globally
window.togglePassword = togglePassword;
