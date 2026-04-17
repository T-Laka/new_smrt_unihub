import { useEffect, useState } from "react";
import { FiUser, FiMail, FiPhone, FiToggleRight, FiToggleLeft, FiDollarSign, FiSave, FiLoader, FiHeart, FiTrendingUp } from "react-icons/fi";
import { getUserById, getUsers, updateUserProfile } from "../lib/canteenApi";
import { readStoredUser, storeAuthenticatedUser } from "../lib/auth";

const HelperProfilePage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [formData, setFormData] = useState({ isHelper: false, serviceCharge: 0 });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: "", message: "" }), 3000);
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const sessionUser = readStoredUser();

        if (!sessionUser?._id) {
          showAlert("error", "Please log in again to view your helper profile");
          return;
        }

        try {
          const response = await getUserById(sessionUser._id);
          const dbUser = response.data;
          setCurrentUser(dbUser);
          setFormData({ isHelper: dbUser.isHelper || false, serviceCharge: dbUser.serviceCharge || 0 });
          storeAuthenticatedUser({ ...sessionUser, ...dbUser });
          return;
        } catch (error) {
          if (error?.response?.status !== 404) {
            throw error;
          }
        }

        // Fallback for stale local user IDs: recover by email/student identity.
        const usersResponse = await getUsers();
        const matchedUser = (usersResponse.data || []).find((user) =>
          (sessionUser.email && user.email === sessionUser.email) ||
          (sessionUser.studentId && user.studentId === sessionUser.studentId)
        );

        if (!matchedUser?._id) {
          showAlert("error", "Unable to find your account. Please log in again.");
          return;
        }

        setCurrentUser(matchedUser);
        setFormData({ isHelper: matchedUser.isHelper || false, serviceCharge: matchedUser.serviceCharge || 0 });
        storeAuthenticatedUser({ ...sessionUser, ...matchedUser });
      } catch {
        showAlert("error", "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    loadUserProfile();
  }, []);

  const handleToggleHelper = () => {
    setFormData((prev) => ({ ...prev, isHelper: !prev.isHelper, serviceCharge: !prev.isHelper ? prev.serviceCharge : 0 }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      setSaving(true);
      const response = await updateUserProfile(currentUser._id, { isHelper: formData.isHelper, serviceCharge: formData.serviceCharge });
      const updatedUser = { ...currentUser, ...(response.data || {}), isHelper: formData.isHelper, serviceCharge: formData.serviceCharge };
      setCurrentUser(updatedUser);
      storeAuthenticatedUser(updatedUser);
      showAlert("success", formData.isHelper ? "Helper role activated! You can now browse and accept delivery requests." : "Helper role deactivated.");
    } catch (error) {
      showAlert("error", error.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="section-block">
        <div className="container canteenpro-shell">
          <div className="surface canteenpro-empty">
            <FiLoader className="spin" />
            <p>Loading helper profile...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-block">
      <div className="container canteenpro-shell canteenpro-profile-shell">
        <article className="surface canteenpro-hero canteenpro-hero-profile">
          <div>
            <p className="canteenpro-kicker">Helper Profile</p>
            <h2>Manage Your Delivery Identity</h2>
            <p>Activate helper mode, tune service charge, and track your potential earnings in real time.</p>
          </div>
          <div className="canteenpro-stat-grid">
            <div className="canteenpro-stat-card"><strong>{formData.isHelper ? "Active" : "Inactive"}</strong><span>Helper Mode</span></div>
            <div className="canteenpro-stat-card"><strong>Rs. {Number(formData.serviceCharge || 0)}</strong><span>Current Charge</span></div>
            <div className="canteenpro-stat-card"><strong>Rs. {Number(formData.serviceCharge || 0) * 10}</strong><span>10 Deliveries</span></div>
            <div className="canteenpro-stat-card"><strong>Rs. {Number(formData.serviceCharge || 0) * 20}</strong><span>20 Deliveries</span></div>
          </div>
        </article>

        {alert.message ? (
          <div className={`surface canteenpro-alert ${alert.type === "error" ? "error" : "ok"}`}>
            <p>{alert.message}</p>
          </div>
        ) : null}

        {currentUser ? (
          <div className="canteenpro-profile-grid">
            <article className="surface canteenpro-profile-card">
              <div className="canteenpro-profile-head">
                <div className="canteenpro-avatar"><FiUser /></div>
                <div>
                  <h3>{currentUser.name}</h3>
                  <p>{currentUser.itNumber || currentUser.studentId || "Student"}</p>
                </div>
              </div>

              <div className="canteenpro-contact-list">
                <p><FiMail /> {currentUser.email || "Email not available"}</p>
                <p><FiPhone /> {currentUser.phoneNumber || currentUser.phone || "Phone not set"}</p>
              </div>

              <div className="canteenpro-benefit-list">
                <h4><FiTrendingUp /> Why Enable Helper Mode?</h4>
                <ul>
                  <li>Earn flexible income between classes.</li>
                  <li>Help nearby students during rush hours.</li>
                  <li>Build trust as a fast and reliable helper.</li>
                  <li>No minimum delivery count required.</li>
                </ul>
              </div>
            </article>

            <article className="surface canteenpro-profile-card">
              <div className="canteenpro-row-between">
                <div>
                  <h3><FiHeart /> Helper Controls</h3>
                  <p>Switch helper mode and define charge per request.</p>
                </div>
                <button type="button" className="canteenpro-toggle-icon" onClick={handleToggleHelper} aria-label="Toggle helper mode">
                  {formData.isHelper ? <FiToggleRight /> : <FiToggleLeft />}
                </button>
              </div>

              <div className={`canteenpro-status-banner ${formData.isHelper ? "active" : "inactive"}`}>
                {formData.isHelper ? "Helper mode active. You are visible to requesters." : "Helper mode inactive. Turn on to accept jobs."}
              </div>

              <label>
                <span><FiDollarSign /> Service Charge per Delivery (Rs.)</span>
                <input
                  type="number"
                  value={formData.serviceCharge}
                  onChange={(event) => setFormData((prev) => ({ ...prev, serviceCharge: Math.max(0, Number(event.target.value)) }))}
                  min="0"
                  step="10"
                  disabled={!formData.isHelper}
                />
              </label>

              <div className="canteenpro-earning-grid">
                {[5, 10, 20].map((count) => (
                  <article key={count}>
                    <span>{count} deliveries</span>
                    <strong>Rs. {Number(formData.serviceCharge || 0) * count}</strong>
                  </article>
                ))}
              </div>

              <button type="button" className="button button-primary button-full" onClick={handleSave} disabled={saving}>
                {saving ? <><FiLoader className="spin" /> Saving...</> : <><FiSave /> Save Changes</>}
              </button>
            </article>
          </div>
        ) : (
          <div className="surface canteenpro-empty">
            <p>No user profile found. Please sign in and try again.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HelperProfilePage;
