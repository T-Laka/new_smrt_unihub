import { useEffect, useState } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";

const RequestFoodModal = ({
  isOpen,
  selectedFood,
  friends = [],
  requesters = [],
  defaultRequesterId = "",
  currentUserDetails = {},
  onClose,
  onSubmit,
}) => {
  const [requesterId, setRequesterId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [message, setMessage] = useState("");
  const [itNumber, setItNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const loggedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const activeUserId = loggedUser._id || defaultRequesterId || "";
    setRequesterId(activeUserId);
    setQuantity(0);
    setServiceCharge(0);
    setMessage("");
    setItNumber(loggedUser.itNumber || loggedUser.itNo || currentUserDetails?.itNumber || "");
    setPhoneNumber(loggedUser.phoneNumber || loggedUser.phone || currentUserDetails?.phoneNumber || "");
    setErrors({});
  }, [isOpen, selectedFood, currentUserDetails, defaultRequesterId]);

  if (!isOpen || !selectedFood) return null;

  const submitRequest = (event) => {
    event.preventDefault();
    const nextErrors = {};
    const qty = Number(quantity);
    const charge = Number(serviceCharge);

    if (requesters.length > 0 && !requesterId) nextErrors.requesterId = "Requester is required.";
    const trimmedIt = String(itNumber || "").trim();
    if (!trimmedIt) nextErrors.itNumber = "IT Number is required.";
    else if (!/^[A-Za-z0-9\-/]+$/.test(trimmedIt)) nextErrors.itNumber = "IT Number format is invalid.";
    const trimmedPhone = String(phoneNumber || "").trim();
    if (!trimmedPhone) nextErrors.phoneNumber = "Phone Number is required.";
    else if (!/^[0-9\-+\s()]{7,}$/.test(trimmedPhone)) nextErrors.phoneNumber = "Phone Number must be at least 7 digits.";
    if (!Number.isFinite(qty) || !Number.isInteger(qty)) nextErrors.quantity = "Quantity must be a whole number greater than 0.";
    else if (qty === 0) nextErrors.quantity = "PLEASE ENTER QTY";
    else if (qty < 0) nextErrors.quantity = "Quantity must be a whole number greater than 0.";
    if (!Number.isFinite(charge) || charge < 0) nextErrors.serviceCharge = "Help charge must be 0 or more.";
    if (String(message || "").length > 250) nextErrors.message = "Message cannot exceed 250 characters.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({ requesterId: requesterId || undefined, quantity: qty, serviceCharge: charge, message, itNumber: trimmedIt, phoneNumber: trimmedPhone });
  };

  const subtotal = Number(selectedFood?.price || 0) * Number(quantity || 0);

  return (
    <div className="canteenpro-modal-overlay">
      <div className="canteenpro-modal small">
        <div className="canteenpro-modal-head">
          <div>
            <h3>Request Food</h3>
            <p>{selectedFood.name}</p>
          </div>
          <button type="button" className="button button-small button-ghost" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <form onSubmit={submitRequest} className="canteenpro-modal-body">
          <article className="canteenpro-form-card">
            <label>
              <span>Requester</span>
              <div className="canteenpro-readonly-field">
                {JSON.parse(localStorage.getItem("currentUser") || "{}").name || currentUserDetails?.name || "Loading..."}
              </div>
              <input type="hidden" value={requesterId} />
            </label>

            <label>
              <span>Quantity</span>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setErrors((prev) => ({ ...prev, quantity: "" }));
                }}
                required
              />
              {errors.quantity ? (
                <small className="error"><FiAlertCircle /> {errors.quantity}</small>
              ) : null}
            </label>

            <label>
              <span>Food Price (LKR)</span>
              <div className="canteenpro-readonly-field">{Number(selectedFood?.price || 0).toFixed(2)}</div>
            </label>

            <label>
              <span>IT Number *</span>
              <input
                type="text"
                value={itNumber}
                onChange={(event) => {
                  setItNumber(event.target.value);
                  setErrors((prev) => ({ ...prev, itNumber: "" }));
                }}
                placeholder="e.g., IT23-001"
                required
              />
              {errors.itNumber ? (
                <small className="error"><FiAlertCircle /> {errors.itNumber}</small>
              ) : null}
            </label>

            <label>
              <span>Phone Number *</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value);
                  setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                }}
                placeholder="e.g., +94 77 123 4567"
                required
              />
              {errors.phoneNumber ? (
                <small className="error"><FiAlertCircle /> {errors.phoneNumber}</small>
              ) : null}
            </label>

            <label>
              <span>Message (optional)</span>
              <textarea
                rows="3"
                value={message}
                maxLength={250}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setErrors((prev) => ({ ...prev, message: "" }));
                }}
                placeholder="Add a message for your friend"
              />
              <div className="canteenpro-counter-row">
                {errors.message ? <small className="error"><FiAlertCircle /> {errors.message}</small> : <span />}
                <small>{String(message || "").length}/250</small>
              </div>
            </label>

            <div className="canteenpro-mini-card">
              <p className="title">Payment Summary</p>
              <span>Food unit price: LKR {Number(selectedFood?.price || 0).toFixed(2)}</span>
              <span>Quantity: {quantity}</span>
              <strong>Total to pay: LKR {subtotal.toFixed(2)}</strong>
            </div>

            <button type="submit" className="button button-primary" disabled={requesters.length > 0 && !requesterId}>
              Send Help Request
            </button>
          </article>
        </form>
      </div>
    </div>
  );
};

export default RequestFoodModal;
