const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://saha-food-backend.vercel.app/api";

const buildHeaders = (token, isFormData = false) => ({
  ...(isFormData ? {} : { "Content-Type": "application/json" }),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }),
  requestForgotPasswordOtp: (payload) =>
    request("/auth/forgot-password/request-otp", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }),
  resetPasswordWithOtp: (payload) =>
    request("/auth/forgot-password/reset", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    }),
  profile: (token) =>
    request("/auth/profile", {
      headers: buildHeaders(token),
    }),
  updateProfile: (payload, token) =>
    request("/auth/profile", {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }),
  getAddresses: (token) =>
    request("/users/addresses", {
      headers: buildHeaders(token),
    }),
  addAddress: (payload, token) =>
    request("/users/addresses", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }),
  updateAddress: (id, payload, token) =>
    request(`/users/addresses/${id}`, {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }),
  deleteAddress: (id, token) =>
    request(`/users/addresses/${id}`, {
      method: "DELETE",
      headers: buildHeaders(token),
    }),
  placeOrder: (payload, token) =>
    request("/orders", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }),
  placeBulkOrder: (payload, token) =>
    request("/orders/bulk", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }),
  getMyOrders: (token) =>
    request("/orders/my", {
      headers: buildHeaders(token),
    }),
  deleteMyOrder: (orderId, token) =>
    request(`/orders/my/${orderId}`, {
      method: "DELETE",
      headers: buildHeaders(token),
    }),
  getAllOrders: (token) =>
    request("/orders", {
      headers: buildHeaders(token),
    }),
  updateOrderStatus: (orderId, status, token) =>
    request(`/orders/${orderId}/status`, {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify({ status }),
    }),
  getAdminDashboard: (token) =>
    request("/orders/admin/dashboard", {
      headers: buildHeaders(token),
    }),
  createPaymentOrder: (amount, token) =>
    request("/payments/create-order", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({ amount }),
    }),
  verifyPayment: (payload, token) =>
    request("/payments/verify", {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }),
  getMenu: () => request("/menu"),
  getBanners: (includeAll = false) =>
    request(includeAll ? "/banners?includeAll=true" : "/banners"),
  createMenu: (payload, token) =>
    request("/menu", {
      method: "POST",
      headers: buildHeaders(token, true),
      body: payload,
    }),
  updateMenu: (id, payload, token) =>
    request(`/menu/${id}`, {
      method: "PUT",
      headers: buildHeaders(token, true),
      body: payload,
    }),
  deleteMenu: (id, token) =>
    request(`/menu/${id}`, {
      method: "DELETE",
      headers: buildHeaders(token),
    }),
  createBanner: (payload, token) =>
    request("/banners", {
      method: "POST",
      headers: buildHeaders(token, true),
      body: payload,
    }),
  updateBanner: (id, payload, token) =>
    request(`/banners/${id}`, {
      method: "PUT",
      headers: buildHeaders(token, true),
      body: payload,
    }),
  deleteBanner: (id, token) =>
    request(`/banners/${id}`, {
      method: "DELETE",
      headers: buildHeaders(token),
    }),
};
