import { useEffect, useMemo, useState } from 'react';
import { FiLoader, FiMapPin, FiNavigation2, FiUserCheck } from 'react-icons/fi';
import { useCanteen } from '../context/CanteenContext';
import {
  getOpenRequests,
  getMyRequests,
  getHelperRequests,
  getOffersByRequest,
  submitHelperOffer,
  acceptRequestByHelper,
  updateUserProfile,
  assignHelper,
  updateRequestStatus,
  updateRequestByRequester,
  cancelRequest as cancelRequestApi,
  updateTracking as updateTrackingApi,
} from '../lib/canteenApi';

const STATUS_STEPS = ['OPEN', 'ASSIGNED', 'PICKED', 'DELIVERED', 'COMPLETED'];
const SLIIT_CENTER = { lat: 6.9147, lng: 79.9729 };

const getMapEmbedUrl = (lat, lng) => {
  const safeLat = Number.isFinite(Number(lat)) ? Number(lat) : SLIIT_CENTER.lat;
  const safeLng = Number.isFinite(Number(lng)) ? Number(lng) : SLIIT_CENTER.lng;
  const delta = 0.0045;
  const bbox = [safeLng - delta, safeLat - delta, safeLng + delta, safeLat + delta]
    .map((value) => value.toFixed(6))
    .join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${safeLat.toFixed(6)}%2C${safeLng.toFixed(6)}`;
};

export default function CanteenRequestPage() {
  const [openRequests, setOpenRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [helperRequests, setHelperRequests] = useState([]);
  const [offersByRequest, setOffersByRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [offerModal, setOfferModal] = useState({ open: false, request: null });
  const [serviceCharge, setServiceCharge] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [trackingInputs, setTrackingInputs] = useState({});
  const [editRequestId, setEditRequestId] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: '', note: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [roleForm, setRoleForm] = useState({ isHelper: false, serviceCharge: 0 });
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleAlert, setRoleAlert] = useState('');
  const { selectedCanteen } = useCanteen();

  const LOCAL_REQUEST_KEYS = ['canteen-local-requests'];

  const canteenSlug = useMemo(() => {
    const name = String(selectedCanteen?.name || selectedCanteen?.id || '').toLowerCase();
    if (name.includes('basement')) return 'basement';
    return 'anohana';
  }, [selectedCanteen]);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      setCurrentUser(user);
      setRoleForm({ isHelper: Boolean(user.isHelper), serviceCharge: Number(user.serviceCharge || 0) });
    }
  }, []);

  const loadRequests = async () => {
    if (!currentUser?._id) return;
    try {
      setIsLoading(true);
      const [openRes, myRes, helperRes] = await Promise.all([
        getOpenRequests(canteenSlug),
        getMyRequests(currentUser._id),
        getHelperRequests(currentUser._id),
      ]);

      const localRequests = LOCAL_REQUEST_KEYS.flatMap((key) => {
        try {
          return JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
          return [];
        }
      });

      const myLocalRequests = localRequests
        .filter((request) => String(request.requesterId) === String(currentUser._id))
        .map((request) => ({
          ...request,
          foodItem: request.foodName || request.foodItem || 'Food item',
          status: request.status === 'CANCELLED' ? 'CANCELLED' : STATUS_STEPS.includes(request.status) ? request.status : 'OPEN',
          localOnly: true,
        }));

      setOpenRequests(openRes.data || []);
      setMyRequests([...(myRes.data || []), ...myLocalRequests]);
      setHelperRequests(helperRes.data || []);

      const offersMap = {};
      await Promise.all(
        (myRes.data || []).map(async (request) => {
          try {
            const offersRes = await getOffersByRequest(request._id);
            offersMap[request._id] = offersRes.data || [];
          } catch {
            offersMap[request._id] = [];
          }
        })
      );
      setOffersByRequest(offersMap);
    } catch (error) {
      console.error('Request load failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?._id) return;
    loadRequests();
    const interval = setInterval(loadRequests, 3000);
    return () => clearInterval(interval);
  }, [currentUser, canteenSlug]);

  const openOfferModal = (request) => {
    setOfferModal({ open: true, request });
    setServiceCharge(String(currentUser?.serviceCharge || ''));
    setOfferMessage('');
  };

  const confirmAssignedRequest = async (requestId) => {
    if (!currentUser?._id) return;
    try {
      await acceptRequestByHelper(requestId, { helperId: currentUser._id });
      await loadRequests();
    } catch (error) {
      console.error('Confirm request failed:', error);
    }
  };

  const handleSaveRole = async () => {
    if (!currentUser?._id) return;
    try {
      setRoleSaving(true);
      setRoleAlert('');
      const response = await updateUserProfile(currentUser._id, {
        isHelper: roleForm.isHelper,
        serviceCharge: Number(roleForm.serviceCharge || 0),
      });
      const nextUser = { ...currentUser, ...response.data };
      localStorage.setItem('currentUser', JSON.stringify(nextUser));
      setCurrentUser(nextUser);
      setRoleAlert('Helper settings saved.');
    } catch (error) {
      setRoleAlert(error.message || 'Failed to update role.');
    } finally {
      setRoleSaving(false);
    }
  };

  const submitOffer = async () => {
    if (!offerModal.request || !currentUser?._id || !currentUser?.isHelper) return;
    try {
      await submitHelperOffer({
        requestId: offerModal.request._id,
        helperId: currentUser._id,
        serviceCharge: Number(serviceCharge),
        message: offerMessage,
      });
      setOfferModal({ open: false, request: null });
      await loadRequests();
    } catch (error) {
      console.error('Submit offer failed:', error);
    }
  };

  const selectHelper = async (requestId, helperId) => {
    if (!currentUser?._id) return;
    try {
      await assignHelper(requestId, { requesterId: currentUser._id, helperId });
      await loadRequests();
    } catch (error) {
      console.error('Assign helper failed:', error);
    }
  };

  const doUpdateStatus = async (requestId, status) => {
    if (!currentUser?._id) return;
    try {
      const payload = { status };
      if (status === 'DELIVERED') payload.requesterId = currentUser._id;
      else payload.helperId = currentUser._id;
      await updateRequestStatus(requestId, payload);
      await loadRequests();
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const updateLocalRequest = (requestId, updater) => {
    LOCAL_REQUEST_KEYS.forEach((key) => {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        let changed = false;
        const nextList = list.map((request) => {
          if (String(request._id || request.id) === String(requestId)) {
            changed = true;
            return { ...request, ...(updater(request) || {}) };
          }
          return request;
        });
        if (changed) localStorage.setItem(key, JSON.stringify(nextList));
      } catch {
        // ignore local storage parse issues
      }
    });
  };

  const saveEditedRequest = async (request, isLocalOnly) => {
    if (!currentUser?._id) return;
    if (isLocalOnly) {
      updateLocalRequest(request._id, () => ({
        quantity: Number(editForm.quantity || request.quantity || 1),
        note: editForm.note || '',
      }));
      setEditRequestId(null);
      await loadRequests();
      return;
    }
    try {
      await updateRequestByRequester(request._id, {
        requesterId: currentUser._id,
        quantity: Number(editForm.quantity || 1),
        note: editForm.note || '',
      });
      setEditRequestId(null);
      await loadRequests();
    } catch (error) {
      console.error('Edit request failed:', error);
    }
  };

  const doCancelRequest = async (request, isLocalOnly) => {
    if (!currentUser?._id) return;
    if (isLocalOnly) {
      updateLocalRequest(request._id, () => ({ status: 'CANCELLED' }));
      await loadRequests();
      return;
    }
    try {
      await cancelRequestApi(request._id, { requesterId: currentUser._id });
      await loadRequests();
    } catch (error) {
      console.error('Cancel request failed:', error);
    }
  };

  const doUpdateTracking = async (requestId) => {
    if (!currentUser?._id) return;
    const input = trackingInputs[requestId] || {};
    if (!input.location) return;
    try {
      await updateTrackingApi(requestId, {
        helperId: currentUser._id,
        location: input.location,
        note: input.note || '',
        lat: input.lat,
        lng: input.lng,
      });
      setTrackingInputs((prev) => ({ ...prev, [requestId]: { location: '', note: '', lat: null, lng: null } }));
      await loadRequests();
    } catch (error) {
      console.error('Tracking update failed:', error);
    }
  };

  const useCurrentLocation = (requestId) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = position.coords;
      setTrackingInputs((prev) => {
        const current = prev[requestId] || { location: '', note: '', lat: null, lng: null };
        return {
          ...prev,
          [requestId]: {
            ...current,
            location: current.location || 'Live GPS update',
            lat: coords.latitude,
            lng: coords.longitude,
          },
        };
      });
    });
  };

  const renderStep = (status, step) => {
    const currentIndex = STATUS_STEPS.indexOf(status);
    const stepIndex = STATUS_STEPS.indexOf(step);
    const isComplete = stepIndex <= currentIndex;
    return (
      <div key={step} className="canteenpro-step">
        <div className={`canteenpro-step-dot ${isComplete ? 'complete' : ''}`}>
          {isComplete ? '✓' : stepIndex + 1}
        </div>
        <span>{step}</span>
      </div>
    );
  };

  return (
    <section className="section-block">
      <div className="container canteenpro-shell canteenpro-requests-shell">
        <article className="surface canteenpro-hero canteenpro-hero-requests">
          <div>
            <p className="canteenpro-kicker">Request & Tracking</p>
            <h2>{selectedCanteen?.name || 'Canteen'} Assistance Console</h2>
            <p>Manage live canteen requests, helper offers, and delivery tracking updates from one control center.</p>
          </div>
          <div className="canteenpro-stat-grid">
            <div className="canteenpro-stat-card"><strong>{openRequests.length}</strong><span>Open Requests</span></div>
            <div className="canteenpro-stat-card"><strong>{myRequests.length}</strong><span>My Requests</span></div>
            <div className="canteenpro-stat-card"><strong>{helperRequests.length}</strong><span>Helper Jobs</span></div>
            <div className="canteenpro-stat-card"><strong>{isLoading ? 'Live' : 'Ready'}</strong><span>Status</span></div>
          </div>
        </article>

        <article className="surface canteenpro-role-card">
          <div>
            <h3><FiUserCheck /> Helper Profile Switch</h3>
            <p>Turn helper mode on to receive requests and set your delivery charge.</p>
          </div>
          <div className="canteenpro-role-actions">
            <button
              type="button"
              className={`button button-small ${roleForm.isHelper ? 'button-primary' : 'button-ghost'}`}
              onClick={() => setRoleForm((prev) => ({ ...prev, isHelper: !prev.isHelper }))}
            >
              {roleForm.isHelper ? 'Helper ON' : 'Helper OFF'}
            </button>
            <input
              type="number"
              min="0"
              value={roleForm.serviceCharge}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, serviceCharge: Number(event.target.value || 0) }))}
              disabled={!roleForm.isHelper}
              placeholder="Service LKR"
            />
            <button type="button" className="button button-small button-secondary" onClick={handleSaveRole} disabled={roleSaving}>
              {roleSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
          {roleAlert ? <p className="canteenpro-inline-note">{roleAlert}</p> : null}
        </article>

        <div className="canteenpro-requests-grid">
          <section className="surface canteenpro-section-card">
            <div className="canteenpro-panel-head">
              <h3>Public Requests</h3>
              <p>{isLoading ? 'Refreshing...' : 'Live feed'}</p>
            </div>
            {openRequests.length === 0 ? (
              <div className="canteenpro-empty"><p>No open requests right now.</p></div>
            ) : (
              <div className="canteenpro-card-stack">
                {openRequests
                  .filter((request) => String(request.requester?._id || request.requester) !== String(currentUser?._id))
                  .map((request) => (
                    <article key={request._id} className="canteenpro-request-card">
                      <div>
                        <h4>{request.foodItem}</h4>
                        <p>Quantity: {request.quantity}</p>
                        <small>{request.note || 'No note'}</small>
                        <span>Requester: {request.requester?.name || 'Student'}</span>
                      </div>
                      <div className="canteenpro-inline-actions">
                        <button
                          type="button"
                          className="button button-small button-primary"
                          onClick={() => openOfferModal(request)}
                          disabled={!currentUser?.isHelper}
                          title={currentUser?.isHelper ? 'Submit helper offer' : 'Enable helper mode first'}
                        >
                          Send Offer
                        </button>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </section>

          <section className="surface canteenpro-section-card">
            <div className="canteenpro-panel-head">
              <h3>My Helper Jobs</h3>
              <p>Update live location and delivery progress</p>
            </div>
            {helperRequests.length === 0 ? (
              <div className="canteenpro-empty"><p>No assigned jobs yet.</p></div>
            ) : (
              <div className="canteenpro-card-stack">
                {helperRequests.map((request) => {
                  const status = STATUS_STEPS.includes(request.status) ? request.status : 'ASSIGNED';
                  const isAccepted = Boolean(request.helperAccepted);
                  const trackingEnabled = isAccepted && ['PICKED', 'DELIVERED'].includes(status);
                  const trackingValue = trackingInputs[request._id] || { location: '', note: '', lat: null, lng: null };
                  return (
                    <article key={request._id} className="canteenpro-request-card">
                      <div className="canteenpro-row-between">
                        <div>
                          <h4>{request.foodItem}</h4>
                          <p>Quantity: {request.quantity}</p>
                          <small>Requester: {request.requester?.name || 'Student'}</small>
                        </div>
                        <span className="canteenpro-pill in">{status}</span>
                      </div>

                      <p className="canteenpro-inline-note">
                        {isAccepted ? 'Requester selected you and you confirmed this job.' : 'Requester selected you. Confirm this job before pickup.'}
                      </p>

                      {status === 'ASSIGNED' && !isAccepted ? (
                        <button
                          type="button"
                          className="button button-small button-primary"
                          onClick={() => confirmAssignedRequest(request._id)}
                        >
                          Confirm I Can Deliver
                        </button>
                      ) : null}

                      <div className="canteenpro-track-box">
                        <p><FiMapPin /> Share live location</p>
                        <div className="canteenpro-inline-actions wrap">
                          <button
                            type="button"
                            className="button button-small button-ghost"
                            onClick={() => useCurrentLocation(request._id)}
                            disabled={!trackingEnabled}
                          >
                            <FiNavigation2 /> Use My Location
                          </button>
                        </div>
                        <input
                          type="text"
                          value={trackingValue.location}
                          disabled={!trackingEnabled}
                          onChange={(event) => setTrackingInputs((prev) => ({
                            ...prev,
                            [request._id]: { ...trackingValue, location: event.target.value },
                          }))}
                          placeholder="Example: Near canteen entrance"
                        />
                        <input
                          type="text"
                          value={trackingValue.note}
                          disabled={!trackingEnabled}
                          onChange={(event) => setTrackingInputs((prev) => ({
                            ...prev,
                            [request._id]: { ...trackingValue, note: event.target.value },
                          }))}
                          placeholder="Optional note"
                        />
                        <button
                          type="button"
                          className="button button-small button-secondary"
                          onClick={() => doUpdateTracking(request._id)}
                          disabled={!trackingEnabled}
                        >
                          Update Location
                        </button>
                      </div>

                      <div className="canteenpro-inline-actions">
                        {status === 'ASSIGNED' && isAccepted ? (
                          <button type="button" className="button button-small button-primary" onClick={() => doUpdateStatus(request._id, 'PICKED')}>
                            Mark Picked
                          </button>
                        ) : null}
                        {status === 'PICKED' ? <span className="canteenpro-inline-note">Requester will mark DELIVERED after receiving the order.</span> : null}
                        {status === 'DELIVERED' ? (
                          <button type="button" className="button button-small button-primary" onClick={() => doUpdateStatus(request._id, 'COMPLETED')}>
                            Mark Completed (Cash Received)
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="surface canteenpro-section-card wide">
            <div className="canteenpro-panel-head">
              <h3>My Requests</h3>
              <p>Track helper offers and completion status</p>
            </div>
            {myRequests.length === 0 ? (
              <div className="canteenpro-empty"><p>You have not created any requests yet.</p></div>
            ) : (
              <div className="canteenpro-request-grid">
                {myRequests.map((request) => {
                  const selectedHelperId = request.selectedHelper?._id || request.selectedHelper || request.helperId;
                  const isLocalOnly = request.localOnly === true || String(request._id || '').startsWith('local-');
                  const offers = isLocalOnly ? [] : offersByRequest[request._id] || [];
                  const hasSelectedHelper = Boolean(selectedHelperId);
                  const helperAccepted = Boolean(request.helperAccepted);
                  const rawStatus = request.status;
                  const stepStatus = STATUS_STEPS.includes(rawStatus) ? rawStatus : 'OPEN';
                  const isCancelled = rawStatus === 'CANCELLED';
                  const displayStatus = isCancelled ? 'CANCELLED' : stepStatus;
                  const mapLat = Number(request.tracking?.lastLat);
                  const mapLng = Number(request.tracking?.lastLng);
                  const hasMapCoords = Number.isFinite(mapLat) && Number.isFinite(mapLng);
                  const showTrackingMap = hasSelectedHelper && !isCancelled && ['ASSIGNED', 'PICKED', 'DELIVERED', 'COMPLETED'].includes(stepStatus);

                  return (
                    <article key={request._id} className="canteenpro-my-request-card">
                      <div className="canteenpro-row-between">
                        <div>
                          <h4>{request.foodItem}</h4>
                          <p>Quantity: {request.quantity}</p>
                          <small>{request.note || request.message || 'No note'}</small>
                        </div>
                        <span className={`canteenpro-pill ${isCancelled ? 'out' : 'in'}`}>{displayStatus}</span>
                      </div>

                      <div className="canteenpro-step-row">
                        {STATUS_STEPS.map((step) => renderStep(stepStatus, step))}
                      </div>

                      {stepStatus === 'OPEN' && !isCancelled ? (
                        <div className="canteenpro-inline-actions">
                          <button
                            type="button"
                            className="button button-small button-ghost"
                            onClick={() => {
                              setEditRequestId(request._id);
                              setEditForm({ quantity: request.quantity || 1, note: request.note || '' });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button-small"
                            onClick={() => doCancelRequest(request, isLocalOnly)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}

                      {editRequestId === request._id ? (
                        <div className="canteenpro-inline-edit">
                          <input
                            type="number"
                            min="1"
                            value={editForm.quantity}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, quantity: event.target.value }))}
                            placeholder="Quantity"
                          />
                          <input
                            type="text"
                            value={editForm.note}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, note: event.target.value }))}
                            placeholder="Note"
                          />
                          <div className="canteenpro-inline-actions">
                            <button type="button" className="button button-small button-secondary" onClick={() => saveEditedRequest(request, isLocalOnly)}>
                              Save
                            </button>
                            <button type="button" className="button button-small button-ghost" onClick={() => setEditRequestId(null)}>
                              Close
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="canteenpro-offer-board">
                        <div className="canteenpro-row-between">
                          <h5>Helper Offers</h5>
                          {hasSelectedHelper ? <span className="canteenpro-inline-note">Selected</span> : null}
                        </div>

                        {hasSelectedHelper ? (
                          <p className="canteenpro-inline-note">
                            {helperAccepted
                              ? `Helper confirmed request. Service charge: LKR ${Number(request.selectedServiceCharge || 0)}`
                              : 'Waiting for selected helper confirmation.'}
                          </p>
                        ) : null}

                        {offers.length === 0 ? (
                          <p className="canteenpro-inline-note">No offers yet.</p>
                        ) : (
                          <div className="canteenpro-card-stack">
                            {offers.map((offer) => {
                              const isSelected = String(offer.helperId?._id || offer.helperId) === String(selectedHelperId);
                              return (
                                <article key={offer._id} className={`canteenpro-helper-offer ${isSelected ? 'selected' : ''}`}>
                                  <div>
                                    <h6>{offer.helperId?.name || 'Helper'}</h6>
                                    <p>Email: {offer.helperId?.email || '-'}</p>
                                    <p>IT: {offer.helperId?.itNumber || '-'}</p>
                                    <p>Phone: {offer.helperId?.phoneNumber || '-'}</p>
                                    <p>Charge: LKR {offer.serviceCharge}</p>
                                    {offer.message ? <small>"{offer.message}"</small> : null}
                                  </div>
                                  {!hasSelectedHelper && stepStatus === 'OPEN' ? (
                                    <button
                                      type="button"
                                      className="button button-small button-primary"
                                      onClick={() => selectHelper(request._id, offer.helperId?._id || offer.helperId)}
                                    >
                                      Select
                                    </button>
                                  ) : null}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {showTrackingMap ? (
                        <div className="canteenpro-track-summary">
                          <p><FiMapPin /> Last location: {request.tracking?.lastLocation || 'Waiting for helper update...'}</p>
                          {request.tracking.lastNote ? <small>{request.tracking.lastNote}</small> : null}
                          <small>{hasMapCoords ? 'Live GPS from helper' : 'Showing SLIIT area map (default center)'}</small>
                          <div className="canteenpro-map-wrap">
                            <iframe
                              title={`Request ${request._id} tracking map`}
                              src={getMapEmbedUrl(mapLat, mapLng)}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        </div>
                      ) : null}

                      {stepStatus === 'PICKED' && !isCancelled ? (
                        <button type="button" className="button button-primary button-full" onClick={() => doUpdateStatus(request._id, 'DELIVERED')}>
                          Mark Delivered (I Received Order)
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {offerModal.open && offerModal.request ? (
        <div className="canteenpro-modal-overlay">
          <div className="canteenpro-modal small">
            <div className="canteenpro-modal-head">
              <div>
                <h3>Send Helper Offer</h3>
                <p>{offerModal.request.foodItem}</p>
              </div>
              <button type="button" className="button button-small button-ghost" onClick={() => setOfferModal({ open: false, request: null })}>
                Cancel
              </button>
            </div>
            <div className="canteenpro-modal-body">
              <article className="canteenpro-form-card">
                <label>
                  <span>Service Charge (LKR)</span>
                  <input type="number" min="0" value={serviceCharge} onChange={(event) => setServiceCharge(event.target.value)} />
                </label>
                <label>
                  <span>Message (optional)</span>
                  <textarea rows={2} value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} placeholder="Add a message for requester" />
                </label>
                <button type="button" className="button button-primary" onClick={submitOffer}>Submit Offer</button>
                {!currentUser?.isHelper ? <p className="canteenpro-inline-note">Enable helper mode to submit offers.</p> : null}
              </article>
            </div>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="canteenpro-floating-loader">
          <FiLoader className="spin" />
          Syncing requests...
        </div>
      ) : null}
    </section>
  );
}
