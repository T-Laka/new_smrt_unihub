import axios from "axios";

export const API_BASE_URL = (
  import.meta.env.VITE_NODE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Foods
export const getFoods = (canteen = null) =>
  api.get("/api/foods", { params: canteen ? { canteen } : {} });

export const addFood = (payload) => api.post("/api/foods", payload);
export const updateFood = (id, payload) => api.put(`/api/foods/${id}`, payload);
export const deleteFood = (id) => api.delete(`/api/foods/${id}`);

// Offers (food promotions)
export const getOffers = (canteenOrRequestId = null) => {
  if (!canteenOrRequestId) return Promise.resolve({ data: [] });
  const isCanteen = canteenOrRequestId === "anohana" || canteenOrRequestId === "basement";
  if (isCanteen) return api.get("/api/offers", { params: { canteen: canteenOrRequestId } });
  return api.get(`/api/offers/${canteenOrRequestId}`);
};
export const getAllOffers = (canteen = null) =>
  api.get("/api/offers/admin", { params: canteen ? { canteen } : {} });
export const createOffer = (payload) => api.post("/api/offers", payload);
export const updateOffer = (id, payload) => api.put(`/api/offers/${id}`, payload);
export const deleteOffer = (id) => api.delete(`/api/offers/${id}`);

// Requests
export const createFoodRequest = (payload) =>
  api.post("/api/requests", {
    requesterId: payload?.requesterId,
    foodItem: payload?.foodItem || payload?.foodName || "Food item",
    quantity: payload?.quantity,
    note: payload?.note || payload?.message || "",
    canteen: payload?.canteen || "",
  });
export const getOpenRequests = (canteen) =>
  api.get("/api/requests", { params: canteen ? { canteen } : {} });
export const getMyRequests = (userId) => api.get(`/api/requests/my/${userId}`);
export const getHelperRequests = (userId) => api.get(`/api/requests/helper/${userId}`);
export const getRequestDetails = (id) => api.get(`/api/requests/${id}`);
export const updateRequestByRequester = (id, payload) => api.put(`/api/requests/${id}`, payload);
export const cancelRequest = (id, payload) => api.put(`/api/requests/${id}/cancel`, payload);
export const assignHelper = (id, payload) => api.put(`/api/requests/${id}/assign`, payload);
export const updateRequestStatus = (id, payload) => api.put(`/api/requests/${id}/status`, payload);
export const acceptRequestByHelper = (id, payload) => api.put(`/api/requests/${id}/accept`, payload);
export const updateTracking = (id, payload) => api.put(`/api/requests/${id}/track`, payload);

// Helper offers
export const submitHelperOffer = (payload) => api.post("/api/requests/helper-offers", payload);
export const getOffersByRequest = (requestId) => api.get(`/api/requests/helper-offers/${requestId}`);

// Users
export const getUsers = () => api.get("/api/users");
export const createUser = (payload) => api.post("/api/users", payload);
export const getHelpers = () => api.get("/api/users/helpers/active");
export const getUserById = (userId) => api.get(`/api/users/${userId}`);
export const updateUserProfile = (userId, payload) => api.put(`/api/users/${userId}`, payload);

export const mockUsers = [
  { _id: "66a700000000000000000001", name: "Ayesha Perera", role: "student", isHelper: true },
];
