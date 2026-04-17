import { FiTag, FiClock, FiTrendingUp, FiLoader } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { useCanteen } from "../context/CanteenContext";
import { createFoodRequest, getUsers, getOffers, mockUsers } from "../lib/canteenApi";

const promotions = [
  { id: "offer-1", title: "Rice & Curry Student Combo", discount: "10% OFF", description: "Available every weekday for lunch orders.", icon: "🍱", time: "12:00 PM - 2:00 PM", badge: "BESTSELLER" },
  { id: "offer-2", title: "Fresh Juice Happy Hour", discount: "Buy 1 Get 1", description: "2.30 PM to 4.00 PM on selected juice items.", icon: "🥤", time: "2:30 PM - 4:00 PM", badge: "LIMITED TIME" },
  { id: "offer-3", title: "Large Orders Discount", discount: "LKR 25 OFF", description: "For orders above LKR 1000.", icon: "📦", time: "All Day", badge: "AVAILABLE" },
  { id: "offer-4", title: "Dessert Bonus", discount: "FREE Item", description: "Get one dessert free after 3 PM.", icon: "🍰", time: "3:00 PM - 5:00 PM", badge: "POPULAR" },
  { id: "offer-5", title: "Weekend Special", discount: "15% OFF", description: "Extra discount on all items during weekends.", icon: "⭐", time: "Saturday & Sunday", badge: "WEEKEND" },
  { id: "offer-6", title: "Bulk Order Promo", discount: "LKR 50 OFF", description: "Order for 5+ people and get special discount.", icon: "👥", time: "All Day", badge: "GROUP" },
];

const LOCAL_REQUESTS_KEY = "canteen-local-requests";
const ACTIVE_USER_KEY = "canteen-active-user-id";

const badgeColors = {
  BESTSELLER: "rose",
  "LIMITED TIME": "amber",
  AVAILABLE: "emerald",
  POPULAR: "purple",
  WEEKEND: "blue",
  GROUP: "indigo",
};

const CanteenOffersPage = () => {
  const { selectedCanteen } = useCanteen();
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [users, setUsers] = useState([]);
  const [requesterId, setRequesterId] = useState("");
  const [helperId, setHelperId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(50);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const canteenSlug = useMemo(() => {
    const name = String(selectedCanteen?.name || selectedCanteen?.id || "").toLowerCase();
    if (name.includes("basement")) return "basement";
    return "anohana";
  }, [selectedCanteen]);

  const loadOffers = async () => {
    setOffersLoading(true);
    try {
      const response = await getOffers(canteenSlug);
      setOffers(response.data || []);
    } catch {
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
    const interval = setInterval(loadOffers, 5000);
    return () => clearInterval(interval);
  }, [canteenSlug]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await getUsers();
        const apiUsers = (res.data || []).filter((u) => u.role !== "admin");
        const nextUsers = apiUsers.length ? apiUsers : mockUsers;
        setUsers(nextUsers);
        const stored = JSON.parse(window.localStorage.getItem("currentUser") || "null");
        const preferredId = stored?._id;
        const storedUserId = window.localStorage.getItem(ACTIVE_USER_KEY);
        const resolved = nextUsers.some((u) => String(u._id) === String(preferredId))
          ? preferredId
          : nextUsers.some((u) => String(u._id) === String(storedUserId))
            ? storedUserId
            : nextUsers[0]?._id || "";
        setRequesterId(resolved);
      } catch {
        setUsers(mockUsers);
        const stored = JSON.parse(window.localStorage.getItem("currentUser") || "null");
        const resolved = mockUsers.some((u) => String(u._id) === String(stored?._id))
          ? stored._id
          : mockUsers[0]?._id || "";
        setRequesterId(resolved);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedOffer) return;
    setHelperId(""); setQuantity(0); setServiceCharge(50); setMessage(""); setFormErrors({});
  }, [selectedOffer]);

  const helperOptions = useMemo(
    () => users.filter((u) => String(u._id) !== String(requesterId)),
    [users, requesterId]
  );

  const showAlert = (type, msg) => {
    setAlert({ type, message: msg });
    window.setTimeout(() => setAlert({ type: "", message: "" }), 2800);
  };

  const saveOfferRequest = async (offer) => {
    const nextErrors = {};
    const qty = Number(quantity);
    const charge = Number(serviceCharge);
    if (!requesterId) nextErrors.requesterId = "Requester is required.";
    if (!Number.isFinite(qty) || !Number.isInteger(qty)) nextErrors.quantity = "Quantity must be a whole number greater than 0.";
    else if (qty === 0) nextErrors.quantity = "PLEASE ENTER QTY";
    else if (qty < 0) nextErrors.quantity = "Quantity must be a whole number greater than 0.";
    if (!Number.isFinite(charge) || charge < 0) nextErrors.serviceCharge = "Service charge must be 0 or more.";
    if (String(message || "").length > 250) nextErrors.message = "Message cannot exceed 250 characters.";
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    window.localStorage.setItem(ACTIVE_USER_KEY, String(requesterId));
    try {
      await createFoodRequest({ requesterId, foodItem: `${offer.title} (Offer)`, quantity: qty, note: message, canteen: canteenSlug });
      showAlert("success", "Offer request sent. You can view it in Requests page.");
      setSelectedOffer(null);
    } catch {
      const requesterName = users.find((u) => String(u._id) === String(requesterId))?.name || "Student";
      const localRequest = {
        id: `local-${Date.now()}`, _id: `local-${Date.now()}`, requesterId,
        foodName: `${offer.title} (Offer)`, itemPrice: 0, userName: requesterName,
        helperName: helperId ? users.find((u) => String(u._id) === String(helperId))?.name || "Pending helper" : "Pending helper",
        status: "pending", quantity: qty, serviceCharge: charge, message, totalAmount: charge,
      };
      const localRequests = JSON.parse(window.localStorage.getItem(LOCAL_REQUESTS_KEY) || "[]");
      window.localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify([localRequest, ...localRequests]));
      showAlert("success", "Offer request saved locally and will appear in Requests page.");
      setSelectedOffer(null);
    }
  };

  const activeOffers = offers.length > 0 ? offers : promotions;

  return (
    <section className="section-block">
      <div className="container canteenpro-shell">
        {alert.message ? (
          <div className={`surface canteenpro-alert ${alert.type === "success" ? "ok" : "error"}`}>
            <p>{alert.message}</p>
          </div>
        ) : null}

        <article className="surface canteenpro-hero canteenpro-hero-offers">
          <div>
            <p className="canteenpro-kicker">Offers Hub</p>
            <h2>Smart Deals at {selectedCanteen?.name || "Campus Canteen"}</h2>
            <p>Check latest student bundles and flash deals, then instantly push a request to the helper network.</p>
          </div>
          <div className="canteenpro-stat-grid">
            <div className="canteenpro-stat-card"><strong>{activeOffers.length}</strong><span>Live Promotions</span></div>
            <div className="canteenpro-stat-card"><strong>{offersLoading ? "..." : offers.length}</strong><span>Synced From DB</span></div>
            <div className="canteenpro-stat-card"><strong>24/7</strong><span>Deal Tracking</span></div>
            <div className="canteenpro-stat-card"><strong>Fast</strong><span>Request Flow</span></div>
          </div>
        </article>

        <article className="surface canteenpro-toolbar">
          <div className="canteenpro-offer-headline">
            <h3><FiTrendingUp /> Trending Promotions</h3>
            <p>Tap any offer card to create a quick request.</p>
          </div>
          <button type="button" className="button button-ghost button-small" onClick={loadOffers}>
            {offersLoading ? <FiLoader className="spin" /> : <FiClock />}
            Refresh Offers
          </button>
        </article>

        <article className="surface canteenpro-panel">
          <div className="canteenpro-offers-grid">
            {activeOffers.map((offer) => (
              <article
                key={offer._id || offer.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedOffer(offer)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setSelectedOffer(offer);
                  }
                }}
                className="canteenpro-offer-card"
              >
                <div className="canteenpro-offer-top">
                  <span className={`canteenpro-badge ${badgeColors[offer.badge] || "slate"}`}>{offer.badge}</span>
                  <strong>{offer.icon}</strong>
                </div>
                <h4>{offer.title}</h4>
                <p className="canteenpro-offer-discount"><FiTag /> {offer.discount}</p>
                <p className="canteenpro-offer-desc">{offer.description}</p>
                <p className="canteenpro-offer-time"><FiClock /> {offer.time || (offer.startTime ? `${offer.startTime} - ${offer.endTime}` : "All Day")}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface canteenpro-note-card">
          <h3>Deal Tip</h3>
          <p>Use your request note wisely, mention preferred pickup window so helpers can accept quickly.</p>
        </article>
      </div>

      {selectedOffer ? (
        <div className="canteenpro-modal-overlay">
          <div className="canteenpro-modal">
            <div className="canteenpro-modal-head">
              <div>
                <span className={`canteenpro-badge ${badgeColors[selectedOffer.badge] || "slate"}`}>{selectedOffer.badge}</span>
                <h3>{selectedOffer.title}</h3>
              </div>
              <button type="button" className="button button-ghost button-small" onClick={() => setSelectedOffer(null)}>
                Close
              </button>
            </div>

            <div className="canteenpro-modal-body">
              <article className="canteenpro-mini-card">
                <p className="title">Discount</p>
                <strong>{selectedOffer.discount}</strong>
              </article>

              <article className="canteenpro-mini-card">
                <p className="title">Offer Info</p>
                <span>{selectedOffer.description}</span>
              </article>

              <article className="canteenpro-mini-card">
                <p className="title">Available Time</p>
                <span>{selectedOffer.time || (selectedOffer.startTime ? `${selectedOffer.startTime} - ${selectedOffer.endTime}` : "All Day")}</span>
              </article>

              <article className="canteenpro-form-card">
                <h4>Send Offer Request</h4>

                <label>
                  <span>Requester</span>
                  <select
                    value={requesterId}
                    onChange={(event) => {
                      setRequesterId(event.target.value);
                      setFormErrors((prev) => ({ ...prev, requesterId: "" }));
                    }}
                  >
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                  {formErrors.requesterId ? <small className="error">{formErrors.requesterId}</small> : null}
                </label>

                <label>
                  <span>Helper (optional)</span>
                  <select value={helperId} onChange={(event) => setHelperId(event.target.value)}>
                    <option value="">Any nearby friend can accept</option>
                    {helperOptions.map((user) => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </label>

                <div className="canteenpro-field-row">
                  <label>
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={quantity}
                      onChange={(event) => {
                        setQuantity(event.target.value);
                        setFormErrors((prev) => ({ ...prev, quantity: "" }));
                      }}
                    />
                    {formErrors.quantity ? <small className="error">{formErrors.quantity}</small> : null}
                  </label>

                  <label>
                    <span>Service Charge</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={serviceCharge}
                      onChange={(event) => {
                        setServiceCharge(event.target.value);
                        setFormErrors((prev) => ({ ...prev, serviceCharge: "" }));
                      }}
                    />
                    {formErrors.serviceCharge ? <small className="error">{formErrors.serviceCharge}</small> : null}
                  </label>
                </div>

                <label>
                  <span>Message (optional)</span>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setFormErrors((prev) => ({ ...prev, message: "" }));
                    }}
                    placeholder="Add a note for helper"
                  />
                  <div className="canteenpro-counter-row">
                    {formErrors.message ? <small className="error">{formErrors.message}</small> : <span />}
                    <small>{String(message || "").length}/250</small>
                  </div>
                </label>

                <button type="button" className="button button-primary" onClick={() => saveOfferRequest(selectedOffer)}>
                  Send Offer Request
                </button>
              </article>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CanteenOffersPage;
