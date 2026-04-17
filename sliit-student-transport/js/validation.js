// validation.js — front-end form validation with improved UX

/**
 * Display a validation error below an input/select.
 */
function showError(input, message) {
    const group = input.closest('.form-group');
    if (!group) return;
    const errorElem = group.querySelector('.error');
    if (errorElem) errorElem.textContent = '⚠️ ' + message;
    input.style.borderColor = '#ef4444';
    input.style.boxShadow   = '0 0 0 4px rgba(239,68,68,0.12)';
}

/**
 * Clear a validation error on an input/select.
 */
function clearError(input) {
    const group = input.closest('.form-group');
    if (!group) return;
    const errorElem = group.querySelector('.error');
    if (errorElem) errorElem.textContent = '';
    input.style.borderColor = '';
    input.style.boxShadow   = '';
}

/** Basic email regex check */
function isEmailValid(email) {
    return /^\S+@\S+\.\S+$/.test(email);
}

/** Phone: 7-15 digits, optional leading + */
function isPhoneValid(phone) {
    return /^\+?\d{7,15}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Run all checks on every form.needs-validation.
 * Returns true if the form is valid.
 */
function validateForm(form) {
    let valid = true;

    // 1. Required fields
    form.querySelectorAll('input[required], select[required]').forEach(input => {
        clearError(input);
        if (!input.value.trim()) {
            showError(input, 'This field is required');
            valid = false;
        }
    });

    // 2. Email format
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput && emailInput.value && !isEmailValid(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address');
        valid = false;
    }

    // 3. Password confirmation
    const pw  = form.querySelector('input[name="password"]');
    const pw2 = form.querySelector('input[name="confirm_password"]');
    if (pw && pw2 && pw.value && pw.value !== pw2.value) {
        showError(pw2, 'Passwords do not match');
        valid = false;
    }

    // 4. Phone number
    const phoneInput = form.querySelector('input[name="phone"]');
    if (phoneInput && phoneInput.value && !isPhoneValid(phoneInput.value)) {
        showError(phoneInput, 'Enter a valid phone number (7–15 digits)');
        valid = false;
    }

    return valid;
}

// Attach to all .needs-validation forms on page load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form.needs-validation').forEach(form => {
        // Clear errors live as user types
        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => clearError(input));
        });

        form.addEventListener('submit', e => {
            if (!validateForm(form)) {
                e.preventDefault();
                // Scroll to first error
                const firstError = form.querySelector('.error:not(:empty)');
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Show success feedback (frontend-only)
                e.preventDefault();
                const btn = form.querySelector('.btn-submit');
                if (btn) {
                    btn.textContent = '✅ Submitted!';
                    btn.style.background = 'linear-gradient(135deg,#10b981,#06b6d4)';
                    setTimeout(() => {
                        btn.textContent = btn.dataset.original || 'Submit';
                        btn.style.background = '';
                    }, 2500);
                }
            }
        });

        // Save original button text
        const submitBtn = form.querySelector('.btn-submit');
        if (submitBtn) submitBtn.dataset.original = submitBtn.textContent;
    });
});

