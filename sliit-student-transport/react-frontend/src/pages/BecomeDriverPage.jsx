import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { isValidPhone, isValidStudentId } from '../lib/validation';

const benefits = [
  'Flexible ride sharing with fellow SLIIT students.',
  'Grow your driver reputation with verified trips.',
  'Track requests, routes, and earnings from one dashboard.'
];

export default function BecomeDriverPage() {
  const [formState, setFormState] = useState({
    fullName: '',
    studentId: '',
    phone: '',
    vehicleType: '',
    licenseNumber: '',
    seats: '3',
    vehicleDescription: ''
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    fullName: !formState.fullName.trim() ? 'Full name is required.' : formState.fullName.trim().length < 3 ? 'Name must be at least 3 characters.' : '',
    studentId: !formState.studentId.trim()
      ? 'Student ID is required.'
      : !isValidStudentId(formState.studentId)
        ? 'Use format IT########.'
        : '',
    phone: !formState.phone.trim() ? 'Phone number is required.' : !isValidPhone(formState.phone) ? 'Use 07XXXXXXXX or +947XXXXXXXX.' : '',
    vehicleType: !formState.vehicleType.trim() ? 'Vehicle type is required.' : formState.vehicleType.trim().length < 2 ? 'Enter a clearer vehicle type.' : '',
    licenseNumber: !formState.licenseNumber.trim() ? 'License number is required.' : formState.licenseNumber.trim().length < 6 ? 'License number looks too short.' : '',
    seats: Number(formState.seats) < 1 ? 'Seat count must be at least 1.' : '',
    vehicleDescription: !formState.vehicleDescription.trim()
      ? 'Vehicle description is required.'
      : formState.vehicleDescription.trim().length < 20
        ? 'Add at least 20 characters for better rider confidence.'
        : ''
  };

  const isFormValid = Object.values(errors).every((value) => !value);

  function touchField(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    setTouched({
      fullName: true,
      studentId: true,
      phone: true,
      vehicleType: true,
      licenseNumber: true,
      seats: true,
      vehicleDescription: true
    });

    if (!isFormValid) {
      return;
    }

    setSubmitted(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Driver Registration"
        title="Become a Driver"
        subtitle="Offer rides to verified SLIIT students and earn on your schedule."
      />

      <section className="section-block">
        <div className="container layout-two-col">
          <div className="surface info-panel">
            <h2>Why become a driver?</h2>
            <ul className="feature-list">
              {benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
            </ul>
            <div className="callout-box">
              <strong>Approval workflow</strong>
              <p>Driver submissions can be reviewed by the admin panel before going live.</p>
            </div>
          </div>

          <form className="surface form-card" onSubmit={handleSubmit}>
            <h2>Driver Registration</h2>
            <p className="form-note">Complete the form to create your driver profile.</p>

            {submitted ? <div className="notice success">Driver application received. We will review your details shortly.</div> : null}

            <div className="field-grid two-col">
              <label>
                <span className="field-label-row">Full Name</span>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(event) => setFormState((current) => ({ ...current, fullName: event.target.value }))}
                  onBlur={() => touchField('fullName')}
                  placeholder="Your full name"
                  className={touched.fullName && errors.fullName ? 'input-error' : ''}
                  required
                />
                {touched.fullName && errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}
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
                {touched.studentId && errors.studentId ? <span className="field-error">{errors.studentId}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Phone Number</span>
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
                  onBlur={() => touchField('phone')}
                  placeholder="07XXXXXXXX"
                  className={touched.phone && errors.phone ? 'input-error' : ''}
                  required
                />
                {touched.phone && errors.phone ? <span className="field-error">{errors.phone}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Vehicle Type</span>
                <input
                  type="text"
                  value={formState.vehicleType}
                  onChange={(event) => setFormState((current) => ({ ...current, vehicleType: event.target.value }))}
                  onBlur={() => touchField('vehicleType')}
                  placeholder="Sedan, hatchback, van..."
                  className={touched.vehicleType && errors.vehicleType ? 'input-error' : ''}
                  required
                />
                {touched.vehicleType && errors.vehicleType ? <span className="field-error">{errors.vehicleType}</span> : null}
              </label>
              <label>
                <span className="field-label-row">License Number</span>
                <input
                  type="text"
                  value={formState.licenseNumber}
                  onChange={(event) => setFormState((current) => ({ ...current, licenseNumber: event.target.value }))}
                  onBlur={() => touchField('licenseNumber')}
                  placeholder="Driver license number"
                  className={touched.licenseNumber && errors.licenseNumber ? 'input-error' : ''}
                  required
                />
                {touched.licenseNumber && errors.licenseNumber ? <span className="field-error">{errors.licenseNumber}</span> : null}
              </label>
              <label>
                <span className="field-label-row">Available Seats</span>
                <select
                  value={formState.seats}
                  onChange={(event) => setFormState((current) => ({ ...current, seats: event.target.value }))}
                  onBlur={() => touchField('seats')}
                >
                  <option value="1">1 Seat</option>
                  <option value="2">2 Seats</option>
                  <option value="3">3 Seats</option>
                  <option value="4">4 Seats</option>
                </select>
              </label>
            </div>

            <label>
              <span className="field-label-row">Vehicle Description</span>
              <textarea
                rows="4"
                value={formState.vehicleDescription}
                onChange={(event) => setFormState((current) => ({ ...current, vehicleDescription: event.target.value }))}
                onBlur={() => touchField('vehicleDescription')}
                placeholder="Vehicle make, model, color, AC availability, and any useful details"
                className={touched.vehicleDescription && errors.vehicleDescription ? 'input-error' : ''}
              />
              <span className="field-helper">{formState.vehicleDescription.trim().length}/20 minimum recommended characters</span>
              {touched.vehicleDescription && errors.vehicleDescription ? <span className="field-error">{errors.vehicleDescription}</span> : null}
            </label>

            <button type="submit" className="button button-primary button-full" disabled={!isFormValid}>
              Submit Driver Application
            </button>
          </form>
        </div>
      </section>
    </>
  );
}