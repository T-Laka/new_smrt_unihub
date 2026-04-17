// ============================================================
// SLIIT Student Transport — Driver Registration
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('driver-form');
    const loginPrompt = document.getElementById('loginPrompt');
    const alreadyDriver = document.getElementById('alreadyDriver');
    const successMessage = document.getElementById('successMessage');
    const footerLink = document.querySelector('.form-footer-link');

    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        // Not logged in - show login prompt
        if (form) form.style.display = 'none';
        if (loginPrompt) loginPrompt.style.display = 'block';
        if (footerLink) footerLink.style.display = 'none';
        return;
    }

    // Check if already a driver
    if (user.role === 'driver') {
        if (form) form.style.display = 'none';
        if (alreadyDriver) alreadyDriver.style.display = 'block';
        if (footerLink) footerLink.style.display = 'none';
        return;
    }

    // Setup validation listeners
    setupValidation();

    // Form submission
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

// Setup validation
function setupValidation() {
    const inputs = document.querySelectorAll('#driver-form input, #driver-form select');

    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearFieldError(this);
            clearServerError();
        });

        input.addEventListener('focus', function() {
            clearFieldError(this);
        });
    });

    // Auto-uppercase vehicle number
    const vehicleNumber = document.getElementById('vehicleNumber');
    if (vehicleNumber) {
        vehicleNumber.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }

    // Auto-uppercase license number
    const licenseNumber = document.getElementById('licenseNumber');
    if (licenseNumber) {
        licenseNumber.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }
}

// Validate form
function validateForm() {
    let isValid = true;

    // Vehicle Type
    const vehicleType = document.getElementById('vehicleType');
    if (!vehicleType.value) {
        showFieldError(vehicleType, 'Please select a vehicle type');
        isValid = false;
    }

    // Vehicle Number
    const vehicleNumber = document.getElementById('vehicleNumber');
    if (!vehicleNumber.value.trim()) {
        showFieldError(vehicleNumber, 'Vehicle number is required');
        isValid = false;
    } else if (!/^[A-Z]{2,3}-\d{4}$/.test(vehicleNumber.value.trim())) {
        showFieldError(vehicleNumber, 'Format: ABC-1234 or AB-1234');
        isValid = false;
    }

    // Capacity
    const capacity = document.getElementById('capacity');
    if (!capacity.value) {
        showFieldError(capacity, 'Please select passenger capacity');
        isValid = false;
    }

    // License Number
    const licenseNumber = document.getElementById('licenseNumber');
    if (!licenseNumber.value.trim()) {
        showFieldError(licenseNumber, 'License number is required');
        isValid = false;
    }

    return isValid;
}

// Show field error
function showFieldError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    formGroup.classList.add('invalid');

    const errorDiv = formGroup.querySelector('.error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.color = '#ef4444';
    }

    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
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

    input.style.borderColor = '';
    input.style.boxShadow = '';
}

// Show server error
function showServerError(message) {
    const form = document.getElementById('driver-form');
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

    errorAlert.textContent = message;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorAlert) {
            errorAlert.remove();
        }
    }, 5000);
}

// Clear server error
function clearServerError() {
    const errorAlert = document.querySelector('.server-error');
    if (errorAlert) {
        errorAlert.remove();
    }
}

// Set loading state
function setLoadingState(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const inputs = document.querySelectorAll('#driver-form input, #driver-form select');

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

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    clearServerError();

    // Validate form
    if (!validateForm()) {
        const firstError = document.querySelector('.form-group.invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user._id) {
        showServerError('Please login to register as a driver');
        return;
    }

    // Get form data
    const formData = {
        userId: user._id,
        vehicleType: document.getElementById('vehicleType').value,
        vehicleNumber: document.getElementById('vehicleNumber').value.trim().toUpperCase(),
        vehicleModel: document.getElementById('vehicleModel').value.trim() || null,
        licenseNumber: document.getElementById('licenseNumber').value.trim().toUpperCase(),
        capacity: parseInt(document.getElementById('capacity').value)
    };

    // Show loading state
    setLoadingState(true);

    try {
        const response = await fetch(`${API_BASE}/drivers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Update user in localStorage with new role
            user.role = 'driver';
            localStorage.setItem('user', JSON.stringify(user));

            // Save driver info
            localStorage.setItem('driver', JSON.stringify(data));

            // Show success message
            showSuccessMessage();
        } else {
            showServerError(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Driver registration error:', error);
        showServerError('Connection error. Please check your internet connection.');
    } finally {
        setLoadingState(false);
    }
}

// Show success message
function showSuccessMessage() {
    const form = document.getElementById('driver-form');
    const successMessage = document.getElementById('successMessage');
    const footerLink = document.querySelector('.form-footer-link');

    if (form) form.style.display = 'none';
    if (footerLink) footerLink.style.display = 'none';
    if (successMessage) successMessage.classList.add('show');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
