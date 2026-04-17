import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useCanteen } from '../context/CanteenContext';
import {
  addFood,
  createOffer,
  deleteFood,
  deleteOffer,
  getAllOffers,
  getFoods,
  updateFood,
  updateOffer,
} from '../lib/canteenApi';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80';

const defaultFoodForm = {
  name: '',
  price: '',
  image: '',
  imageName: '',
  quantity: 0,
  inStock: true,
};

const defaultOfferForm = {
  title: '',
  discount: '',
  description: '',
  icon: '🎁',
  startTime: '',
  endTime: '',
  badge: 'OFFER',
  isActive: true,
};

export default function CanteenAdminPage() {
  const { selectedCanteen, setSelectedCanteen, canteens } = useCanteen();
  const [foods, setFoods] = useState([]);
  const [offers, setOffers] = useState([]);
  const [foodForm, setFoodForm] = useState(defaultFoodForm);
  const [offerForm, setOfferForm] = useState(defaultOfferForm);
  const [editingFoodId, setEditingFoodId] = useState('');
  const [editingOfferId, setEditingOfferId] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const foodSummary = useMemo(() => {
    const total = foods.length;
    const inStock = foods.filter((item) => item.inStock).length;
    const outOfStock = total - inStock;
    const avgPrice = total
      ? foods.reduce((sum, item) => sum + Number(item.price || 0), 0) / total
      : 0;

    return {
      total,
      inStock,
      outOfStock,
      avgPrice,
    };
  }, [foods]);

  const offerSummary = useMemo(() => {
    const total = offers.length;
    const active = offers.filter((offer) => offer.isActive).length;
    return {
      total,
      active,
      inactive: total - active,
    };
  }, [offers]);

  const canteenSlug = useMemo(() => {
    const name = String(selectedCanteen?.name || selectedCanteen?.id || '').toLowerCase();
    if (name.includes('basement')) return 'basement';
    return 'anohana';
  }, [selectedCanteen]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    window.setTimeout(() => setAlert({ type: '', message: '' }), 2500);
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read selected image'));
      reader.readAsDataURL(file);
    });

  const handleFoodImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('error', 'Please select a valid image file');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showAlert('error', 'Image size must be 2MB or less');
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      setFoodForm((prev) => ({
        ...prev,
        image: imageDataUrl,
        imageName: file.name,
      }));
    } catch {
      showAlert('error', 'Unable to process selected image');
    }
  };

  const loadData = async () => {
    try {
      const [foodsRes, offersRes] = await Promise.all([getFoods(canteenSlug), getAllOffers(canteenSlug)]);
      setFoods(foodsRes.data || []);
      setOffers(offersRes.data || []);
    } catch (error) {
      console.error('Failed to load canteen admin data', error);
      showAlert('error', 'Failed to load canteen data');
    }
  };

  useEffect(() => {
    loadData();
  }, [canteenSlug]);

  const resetFoodForm = () => {
    setFoodForm(defaultFoodForm);
    setEditingFoodId('');
  };

  const resetOfferForm = () => {
    setOfferForm(defaultOfferForm);
    setEditingOfferId('');
  };

  const handleSelectCanteen = (canteen) => {
    if (!canteen || canteen.id === selectedCanteen?.id) return;
    setSelectedCanteen(canteen);
    resetFoodForm();
    resetOfferForm();
    setFoods([]);
    setOffers([]);
  };

  const handleFoodSubmit = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    try {
      const payload = {
        ...foodForm,
        image: foodForm.image || FALLBACK_IMAGE,
        price: Number(foodForm.price),
        quantity: Number(foodForm.quantity || 0),
        inStock: Boolean(foodForm.inStock),
        canteen: canteenSlug,
      };

      if (editingFoodId) {
        await updateFood(editingFoodId, payload);
        showAlert('success', 'Food item updated');
      } else {
        await addFood(payload);
        showAlert('success', 'Food item added');
      }

      resetFoodForm();
      await loadData();
    } catch (error) {
      showAlert('error', error?.response?.data?.message || 'Unable to save food item');
    } finally {
      setIsBusy(false);
    }
  };

  const handleOfferSubmit = async (event) => {
    event.preventDefault();
    setIsBusy(true);
    try {
      const payload = {
        ...offerForm,
        canteen: canteenSlug,
        isActive: Boolean(offerForm.isActive),
      };

      if (editingOfferId) {
        await updateOffer(editingOfferId, payload);
        showAlert('success', 'Offer updated');
      } else {
        await createOffer(payload);
        showAlert('success', 'Offer created');
      }

      resetOfferForm();
      await loadData();
    } catch (error) {
      showAlert('error', error?.response?.data?.message || 'Unable to save offer');
    } finally {
      setIsBusy(false);
    }
  };

  const editFood = (food) => {
    setEditingFoodId(food._id);
    setFoodForm({
      name: food.name || '',
      price: String(food.price ?? ''),
      image: food.image || '',
      imageName: '',
      quantity: food.quantity ?? 0,
      inStock: Boolean(food.inStock),
    });
  };

  const editOffer = (offer) => {
    setEditingOfferId(offer._id);
    setOfferForm({
      title: offer.title || '',
      discount: offer.discount || '',
      description: offer.description || '',
      icon: offer.icon || '🎁',
      startTime: offer.startTime || '',
      endTime: offer.endTime || '',
      badge: offer.badge || 'OFFER',
      isActive: Boolean(offer.isActive),
    });
  };

  const removeFood = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    try {
      await deleteFood(id);
      showAlert('success', 'Food deleted');
      await loadData();
    } catch (error) {
      showAlert('error', error?.response?.data?.message || 'Unable to delete food');
    }
  };

  const removeOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await deleteOffer(id);
      showAlert('success', 'Offer deleted');
      await loadData();
    } catch (error) {
      showAlert('error', error?.response?.data?.message || 'Unable to delete offer');
    }
  };

  const toggleOfferActive = async (offer) => {
    try {
      await updateOffer(offer._id, { isActive: !offer.isActive });
      await loadData();
    } catch {
      showAlert('error', 'Unable to update offer status');
    }
  };

  const toggleFoodStock = async (food) => {
    try {
      await updateFood(food._id, { inStock: !food.inStock });
      await loadData();
    } catch {
      showAlert('error', 'Unable to update stock status');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin Canteen"
        title="Canteen Control Center"
        subtitle={`Manage products, stock, and promotional campaigns for ${selectedCanteen?.name || 'Anohana Canteen'}.`}
      />

      <section className="section-block">
        <div className="container adminx-grid">
          {alert.message ? (
            <div className={`surface adminx-alert ${alert.type === 'success' ? 'ok' : 'error'}`}>
              <p>{alert.message}</p>
            </div>
          ) : null}

          <article className="surface canteenx-selector">
            <h2>Select Canteen to Manage</h2>
            <p>Choose a canteen and manage only that canteen's food items and offers.</p>
            <div className="canteenx-selector-grid">
              {canteens.map((canteen) => (
                <button
                  key={canteen.id}
                  type="button"
                  onClick={() => handleSelectCanteen(canteen)}
                  className={`canteenx-selector-card ${selectedCanteen?.id === canteen.id ? 'active' : ''}`}
                >
                  <span className="canteenx-selector-title">{canteen.name}</span>
                  <span className="canteenx-selector-sub">{canteen.location}</span>
                  {selectedCanteen?.id === canteen.id ? (
                    <span className="canteenx-selector-tag">Managing Now</span>
                  ) : null}
                </button>
              ))}
            </div>
          </article>

          <article className="surface adminx-hero">
            <div>
              <p className="adminx-kicker">Operations Snapshot</p>
              <h2>{selectedCanteen?.name || 'Anohana'} Live Metrics</h2>
              <p>Upload product images, control stock visibility, and run targeted offers from one panel.</p>
            </div>
            <div className="adminx-chip-grid">
              <div className="adminx-chip">
                <strong>{foodSummary.total}</strong>
                <span>Total Items</span>
              </div>
              <div className="adminx-chip">
                <strong>{foodSummary.inStock}</strong>
                <span>In Stock</span>
              </div>
              <div className="adminx-chip">
                <strong>{foodSummary.outOfStock}</strong>
                <span>Out of Stock</span>
              </div>
              <div className="adminx-chip">
                <strong>LKR {foodSummary.avgPrice.toFixed(0)}</strong>
                <span>Average Price</span>
              </div>
              <div className="adminx-chip">
                <strong>{offerSummary.total}</strong>
                <span>Total Offers</span>
              </div>
              <div className="adminx-chip">
                <strong>{offerSummary.active}</strong>
                <span>Active Offers</span>
              </div>
            </div>
          </article>

          <div className="adminx-forms-grid">
            <article className="surface adminx-form-card">
              <h2>{editingFoodId ? 'Edit Food Item' : 'Add Food Item'}</h2>
              <form onSubmit={handleFoodSubmit} className="field-grid">
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    required
                    value={foodForm.name}
                    onChange={(event) => setFoodForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Price (LKR)</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={foodForm.price}
                    onChange={(event) => setFoodForm((prev) => ({ ...prev, price: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="0"
                    value={foodForm.quantity}
                    onChange={(event) => setFoodForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  />
                </label>

                <div className="adminx-upload-box" style={{ gridColumn: '1 / -1' }}>
                  <label>
                    <span>Food Image (Upload File)</span>
                    <input type="file" accept="image/*" onChange={handleFoodImageChange} />
                  </label>
                  <small>Accepted: jpg, png, webp. Max size: 2MB.</small>
                  <div className="adminx-image-preview-wrap">
                    <img
                      src={foodForm.image || FALLBACK_IMAGE}
                      alt="Food preview"
                      className="adminx-image-preview"
                    />
                    <div>
                      <p>{foodForm.imageName || 'No file selected'}</p>
                      {foodForm.image ? (
                        <button
                          type="button"
                          className="button button-small button-ghost"
                          onClick={() => setFoodForm((prev) => ({ ...prev, image: '', imageName: '' }))}
                        >
                          Remove Image
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <label className="adminx-inline-check" style={{ gridColumn: '1 / -1' }}>
                  <input
                    type="checkbox"
                    checked={foodForm.inStock}
                    onChange={(event) => setFoodForm((prev) => ({ ...prev, inStock: event.target.checked }))}
                  />
                  <span>Mark as In Stock</span>
                </label>

                <div className="adminx-action-row" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="button button-primary" disabled={isBusy}>
                    {editingFoodId ? 'Update Item' : 'Add Item'}
                  </button>
                  {editingFoodId ? (
                    <button type="button" className="button button-secondary" onClick={resetFoodForm}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>
            </article>

            <article className="surface adminx-form-card">
              <h2>{editingOfferId ? 'Edit Offer' : 'Add Offer'}</h2>
              <form onSubmit={handleOfferSubmit} className="field-grid">
                <label>
                  <span>Title</span>
                  <input
                    type="text"
                    required
                    value={offerForm.title}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Discount</span>
                  <input
                    type="text"
                    required
                    value={offerForm.discount}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, discount: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Badge</span>
                  <input
                    type="text"
                    value={offerForm.badge}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, badge: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Icon</span>
                  <input
                    type="text"
                    value={offerForm.icon}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, icon: event.target.value }))}
                  />
                </label>
                <label>
                  <span>Start Time</span>
                  <input
                    type="text"
                    required
                    value={offerForm.startTime}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  />
                </label>
                <label>
                  <span>End Time</span>
                  <input
                    type="text"
                    required
                    value={offerForm.endTime}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, endTime: event.target.value }))}
                  />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Description</span>
                  <textarea
                    rows={3}
                    required
                    value={offerForm.description}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </label>
                <label className="adminx-inline-check" style={{ gridColumn: '1 / -1' }}>
                  <input
                    type="checkbox"
                    checked={offerForm.isActive}
                    onChange={(event) => setOfferForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  <span>Offer is Active</span>
                </label>

                <div className="adminx-action-row" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="button button-primary" disabled={isBusy}>
                    {editingOfferId ? 'Update Offer' : 'Add Offer'}
                  </button>
                  {editingOfferId ? (
                    <button type="button" className="button button-secondary" onClick={resetOfferForm}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>
            </article>
          </div>

          <article className="surface adminx-list-card">
            <div className="adminx-list-head">
              <h2>Food Catalog</h2>
              <p>Click edit to update details. Use toggle stock to quickly mark availability.</p>
            </div>
            {foods.length === 0 ? (
              <p>No food items added for this canteen.</p>
            ) : (
              <div className="adminx-cards-grid">
                {foods.map((food) => (
                  <article key={food._id} className="adminx-food-card">
                    <img src={food.image || FALLBACK_IMAGE} alt={food.name} />
                    <div className="adminx-food-body">
                      <h3>{food.name}</h3>
                      <p>LKR {Number(food.price).toFixed(2)}</p>
                      <div className="adminx-meta-row">
                        <span className={`adminx-stock-pill ${food.inStock ? 'in' : 'out'}`}>
                          {food.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <span>Qty: {food.quantity ?? 0}</span>
                      </div>
                      <div className="adminx-action-row compact">
                        <button type="button" className="button button-small button-secondary" onClick={() => editFood(food)}>Edit</button>
                        <button type="button" className="button button-small" onClick={() => toggleFoodStock(food)}>Toggle Stock</button>
                        <button type="button" className="button button-small" onClick={() => removeFood(food._id)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="surface adminx-list-card">
            <div className="adminx-list-head">
              <h2>Offer Campaigns</h2>
              <p>Activate or deactivate offers instantly based on canteen demand.</p>
            </div>
            {offers.length === 0 ? (
              <p>No offers added for this canteen.</p>
            ) : (
              <div className="adminx-cards-grid">
                {offers.map((offer) => (
                  <article key={offer._id} className="adminx-offer-card">
                    <div className="adminx-offer-top">
                      <span>{offer.icon}</span>
                      <span className={`adminx-stock-pill ${offer.isActive ? 'in' : 'out'}`}>
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3>{offer.title}</h3>
                    <p className="adminx-offer-discount">{offer.discount}</p>
                    <p>{offer.description}</p>
                    <small>{offer.startTime} - {offer.endTime}</small>
                    <div className="adminx-action-row compact">
                      <button type="button" className="button button-small button-secondary" onClick={() => editOffer(offer)}>Edit</button>
                      <button type="button" className="button button-small" onClick={() => toggleOfferActive(offer)}>
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button type="button" className="button button-small" onClick={() => removeOffer(offer._id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  );
}
