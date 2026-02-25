// ===== API SERVICE =====
const BASE_URL = 'https://sohraa-hms-production-803b.up.railway.app';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    credentials: 'include', // Important for cookie-based auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry original request
      const retryResponse = await fetch(url, config);
      if (!retryResponse.ok) {
        const err = await retryResponse.json().catch(() => ({}));
        throw new ApiError(retryResponse.status, err.error?.message || 'Request failed', err.error);
      }
      return retryResponse.json();
    }
    // Redirect to login
    window.location.hash = '#/login';
    throw new ApiError(401, 'Session expired');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(response.status, err.error?.message || `HTTP ${response.status}`, err.error);
  }

  // Handle empty responses (204 No Content, etc.)
  const text = await response.text();
  if (!text) return { success: true };
  return JSON.parse(text);
}

class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function refreshToken() {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ===== AUTH API =====
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  refresh: () =>
    request('/auth/refresh', { method: 'POST' }),
};

// ===== PROPERTIES API =====
export const propertiesApi = {
  getAll: () => request('/properties'),
  getById: (id) => request(`/properties/${id}`),
  create: (data) => request('/properties', { method: 'POST', body: data }),
  update: (id, data) => request(`/properties/${id}`, { method: 'PATCH', body: data }),
  delete: (id) => request(`/properties/${id}`, { method: 'DELETE' }),
  getAvailability: (propertyId, from, to) =>
    request(`/properties/${propertyId}/availability?from=${from}&to=${to}`),
};

// ===== ROOMS API =====
export const roomsApi = {
  getByProperty: (propertyId) => request(`/properties/${propertyId}/rooms`),
  getById: (roomId) => request(`/properties/rooms/${roomId}`),
  create: (propertyId, data) => request(`/properties/${propertyId}/rooms`, { method: 'POST', body: data }),
  update: (roomId, data) => request(`/properties/rooms/${roomId}`, { method: 'PATCH', body: data }),
  delete: (roomId) => request(`/properties/rooms/${roomId}`, { method: 'DELETE' }),
};

// ===== ROOM TYPES API =====
export const roomTypesApi = {
  getByProperty: (propertyId) => request(`/properties/${propertyId}/room-types`),
  getById: (roomTypeId) => request(`/properties/room-types/${roomTypeId}`),
  create: (propertyId, data) => request(`/properties/${propertyId}/room-types`, { method: 'POST', body: data }),
  update: (roomTypeId, data) => request(`/properties/room-types/${roomTypeId}`, { method: 'PATCH', body: data }),
  delete: (roomTypeId) => request(`/properties/room-types/${roomTypeId}`, { method: 'DELETE' }),
};

// ===== PROPERTY BLOCKS API =====
export const blocksApi = {
  getByProperty: (propertyId) => request(`/properties/${propertyId}/blocks`),
  getById: (blockId) => request(`/properties/blocks/${blockId}`),
  create: (propertyId, data) => request(`/properties/${propertyId}/blocks`, { method: 'POST', body: data }),
  update: (blockId, data) => request(`/properties/blocks/${blockId}`, { method: 'PATCH', body: data }),
  delete: (blockId) => request(`/properties/blocks/${blockId}`, { method: 'DELETE' }),
};

// ===== BOOKINGS API =====
export const bookingsApi = {
  getById: (bookingId) => request(`/properties/bookings/${bookingId}`),
  create: (propertyId, data) => request(`/properties/${propertyId}/bookings`, { method: 'POST', body: data }),
  update: (bookingId, data) => request(`/properties/bookings/${bookingId}`, { method: 'PATCH', body: data }),
  delete: (bookingId) => request(`/properties/bookings/${bookingId}`, { method: 'DELETE' }),
  checkIn: (bookingId) => request(`/properties/bookings/${bookingId}/checkin`, { method: 'POST' }),
  checkOut: (bookingId) => request(`/properties/bookings/${bookingId}/checkout`, { method: 'POST' }),
};

// ===== BOOKING ITEMS API =====
export const bookingItemsApi = {
  add: (bookingId, data) => request(`/bookings/${bookingId}/items`, { method: 'POST', body: data }),
  update: (bookingId, itemId, data) => request(`/bookings/${bookingId}/items/${itemId}`, { method: 'PATCH', body: data }),
  remove: (bookingId, itemId) => request(`/bookings/${bookingId}/items/${itemId}`, { method: 'DELETE' }),
  checkRoomAvailability: (roomId, from, to) =>
    request(`/bookings/rooms/${roomId}/availability?from=${from}&to=${to}`),
};

// ===== GUESTS API =====
export const guestsApi = {
  getByBooking: (bookingId) => request(`/bookings/${bookingId}/guests`),
  add: (bookingId, data) => request(`/bookings/${bookingId}/guests`, { method: 'POST', body: data }),
  update: (bookingId, guestId, data) => request(`/bookings/${bookingId}/guests/${guestId}`, { method: 'PATCH', body: data }),
};

// ===== PAYMENTS API =====
export const paymentsApi = {
  getByBooking: (bookingId) => request(`/bookings/${bookingId}/payments`),
  record: (bookingId, data) => request(`/bookings/${bookingId}/payments`, { method: 'POST', body: data }),
};

// ===== RATE PLANS API =====
export const ratePlansApi = {
  getByProperty: (propertyId) => request(`/properties/${propertyId}/rate-plans`),
  getById: (ratePlanId) => request(`/properties/rate-plans/${ratePlanId}`),
  create: (propertyId, data) => request(`/properties/${propertyId}/rate-plans`, { method: 'POST', body: data }),
  update: (ratePlanId, data) => request(`/properties/rate-plans/${ratePlanId}`, { method: 'PATCH', body: data }),
  delete: (ratePlanId) => request(`/properties/rate-plans/${ratePlanId}`, { method: 'DELETE' }),
};

// ===== RATE RULES API =====
export const rateRulesApi = {
  getByPlan: (ratePlanId) => request(`/rate-plans/${ratePlanId}/rules`),
  getById: (rateRuleId) => request(`/rate-plans/rules/${rateRuleId}`),
  create: (ratePlanId, data) => request(`/rate-plans/${ratePlanId}/rules`, { method: 'POST', body: data }),
  update: (rateRuleId, data) => request(`/rate-plans/rules/${rateRuleId}`, { method: 'PATCH', body: data }),
  delete: (rateRuleId) => request(`/rate-plans/rules/${rateRuleId}`, { method: 'DELETE' }),
};

// ===== ROOM MAINTENANCE API =====
export const maintenanceApi = {
  getByRoom: (roomId) => request(`/rooms/${roomId}/maintenance`),
  getById: (maintenanceId) => request(`/rooms/maintenance/${maintenanceId}`),
  create: (roomId, data) => request(`/rooms/${roomId}/maintenance`, { method: 'POST', body: data }),
  update: (maintenanceId, data) => request(`/rooms/maintenance/${maintenanceId}`, { method: 'PATCH', body: data }),
  delete: (maintenanceId) => request(`/rooms/maintenance/${maintenanceId}`, { method: 'DELETE' }),
};

// ===== USERS API =====
export const usersApi = {
  getAll: () => request('/users'),
  getById: (userId) => request(`/users/${userId}`),
  create: (data) => request('/users', { method: 'POST', body: data }),
  update: (userId, data) => request(`/users/${userId}`, { method: 'PATCH', body: data }),
  delete: (userId) => request(`/users/${userId}`, { method: 'DELETE' }),
};

// ===== USER PERMISSION OVERRIDES API =====
export const userPermissionsApi = {
  get: (userId) => request(`/users/${userId}/permission-overrides`),
  add: (userId, data) => request(`/users/${userId}/permission-overrides`, { method: 'POST', body: data }),
  remove: (userId, overrideId) => request(`/users/${userId}/permission-overrides/${overrideId}`, { method: 'DELETE' }),
};

// ===== ROLES API =====
export const rolesApi = {
  getAll: () => request('/roles'),
  getById: (roleId) => request(`/roles/${roleId}`),
  create: (data) => request('/roles', { method: 'POST', body: data }),
  update: (roleId, data) => request(`/roles/${roleId}`, { method: 'PATCH', body: data }),
  delete: (roleId) => request(`/roles/${roleId}`, { method: 'DELETE' }),
  getPermissions: (roleId) => request(`/roles/${roleId}/permissions`),
  addPermission: (roleId, data) => request(`/roles/${roleId}/permissions`, { method: 'POST', body: data }),
  removePermission: (roleId, rpId) => request(`/roles/${roleId}/permissions/${rpId}`, { method: 'DELETE' }),
};

// ===== PERMISSIONS API =====
export const permissionsApi = {
  getAll: () => request('/permissions'),
};

// ===== PRICING CONFIG API =====
export const pricingConfigApi = {
  get: (propertyId) => request(`/properties/${propertyId}/pricing-config`),
  update: (propertyId, data) => request(`/properties/${propertyId}/pricing-config`, { method: 'PUT', body: data }),
};
