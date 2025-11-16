// services/apiService.ts - REAL BACKEND API CLIENT

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
let TOKEN: string | null = null;

// Helper to handle API responses
const handleResponse = async (response: Response) => {
    // .json() can only be called once, so we need to handle no-content responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true, data: {} };
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
};

// Main fetch function
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (TOKEN) {
        headers['Authorization'] = `Bearer ${TOKEN}`;
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    return handleResponse(response);
};

// --- AUTH ---
export const setAuthToken = (token: string | null) => {
    TOKEN = token;
};

export const get = async (endpoint: string) => apiFetch(endpoint, { method: 'GET' });
export const post = async (endpoint: string, data?: any) => apiFetch(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
export const put = async (endpoint: string, data?: any) => apiFetch(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
export const del = async (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' });

export const login = (credentials: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const register = (userData: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const getCurrentUser = async () => {
    const { data } = await apiFetch('/auth/me');
    return data;
};
export const updatePassword = (passwords: any) => apiFetch('/auth/updatepassword', { method: 'PUT', body: JSON.stringify(passwords) });


// --- TRIPS ---
export const searchTrips = async (from: string, to: string, date: string, companyId?: string) => {
    const params = new URLSearchParams({ from, to, date });
    if (companyId) {
        params.append('companyId', companyId);
    }
    const { data } = await apiFetch(`/trips/search?${params.toString()}`);
    return data;
};
export const getTripDetails = async (tripId: string) => {
    const { data } = await apiFetch(`/trips/${tripId}`);
    return data;
};
export const getTripManifest = async (tripId: string) => {
    const { data } = await apiFetch(`/trips/${tripId}/manifest`);
    return data;
};
export const confirmBoarding = async (tripId: string, ticketId: string) => {
    const { data } = await apiFetch(`/trips/${tripId}/boardings`, {
        method: 'POST',
        body: JSON.stringify({ ticketId }),
    });
    return data;
};
export const departTrip = (tripId: string) => apiFetch(`/trips/${tripId}/depart`, { method: 'POST' });
export const arriveTrip = (tripId: string) => apiFetch(`/trips/${tripId}/arrive`, { method: 'POST' });

// --- BOOKINGS ---
export const createBooking = async (bookingData: any) => {
    const { data } = await apiFetch('/bookings', { method: 'POST', body: JSON.stringify(bookingData) });
    return data;
};
export const getMyBookings = async () => {
    const { data } = await apiFetch('/bookings');
    return data;
};

// --- PAYMENTS ---
export const initiateMomoPayment = (paymentData: any) => apiFetch('/payments/momo/initiate', { method: 'POST', body: JSON.stringify(paymentData) });


// --- PUBLIC CONTENT ---
export const getCompanies = async () => {
    const { data } = await apiFetch('/companies');
    return data;
};
export const getCompanyById = async (id: string) => {
    const { data } = await apiFetch(`/companies/${id}`);
    return data;
};
export const getCompanyProfileDetails = async (id: string) => {
    const { data } = await apiFetch(`/companies/${id}/details`);
    return data;
};
export const getSetting = (key: string) => apiFetch(`/settings/${key}`);
export const getAllDestinations = async () => {
    const { data } = await apiFetch('/destinations');
    return data;
};

// Routes APIs
export const getCities = async () => {
    const { data } = await apiFetch('/routes/cities');
    return data;
};

export const getPopularRoutes = async () => {
    const { data } = await apiFetch('/routes/popular');
    return data;
};

export const searchRoutes = async (params: any) => {
    const queryString = new URLSearchParams(params).toString();
    const { data } = await apiFetch(`/routes/search?${queryString}`);
    return data;
};

export const createRoute = (routeData: any) => apiFetch('/routes', { method: 'POST', body: JSON.stringify(routeData) });
export const updateRoute = (id: string, routeData: any) => apiFetch(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(routeData) });
export const deleteRoute = (id: string) => apiFetch(`/routes/${id}`, { method: 'DELETE' });
export const getActiveAds = () => apiFetch('/advertisements');


// --- USER PROFILE ---
export const updateAvatar = (avatarData: string) => apiFetch('/users/me/avatar', { method: 'PUT', body: JSON.stringify({ avatarData }) });
export const updateMyProfile = (profileData: any) => apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(profileData) });


// --- WALLET ---
export const getWalletHistory = async () => {
    const { data } = await apiFetch('/wallet/history');
    return data;
};
export const getWalletBalance = async () => {
    const { data } = await apiFetch('/wallet/balance');
    return data;
};
export const topUpWallet = (amount: number) => apiFetch('/wallet/topup', { method: 'POST', body: JSON.stringify({ amount }) });
export const setWalletPin = (pin: string) => apiFetch('/wallet/set-pin', { method: 'PUT', body: JSON.stringify({ pin }) });
export const verifyWalletPin = (pin: string) => apiFetch('/wallet/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) });
export const walletTransfer = (data: { toSerialCode: string, amount: number, pin: string }) => 
    apiFetch('/wallet/transfer', { method: 'POST', body: JSON.stringify(data) });
export const walletTransferBySerial = (data: { toSerialCode: string, amount: number, pin: string }) => 
    apiFetch('/wallet/transfer-by-serial', { method: 'POST', body: JSON.stringify(data) });

// --- MESSAGES ---
export const submitContactMessage = (messageData: any) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(messageData) });
export const adminGetMessages = async () => {
    const { data } = await apiFetch('/messages');
    return data;
};
export const adminUpdateMessage = (id: string, updateData: any) => apiFetch(`/messages/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });


// --- ADMIN ---
export const adminGetCompanies = async () => {
    const { data } = await apiFetch('/admin/companies');
    return data;
};
export const adminCreateCompany = (companyData: any) => apiFetch('/admin/companies', { method: 'POST', body: JSON.stringify(companyData) });
export const adminUpdateCompany = (id: string, companyData: any) => apiFetch(`/admin/companies/${id}`, { method: 'PUT', body: JSON.stringify(companyData) });
export const adminDeleteCompany = (id: string) => apiFetch(`/admin/companies/${id}`, { method: 'DELETE' });
export const adminGetCompanyDetails = async (id: string) => {
    const { data } = await apiFetch(`/admin/companies/${id}`);
    return data;
};
export const adminActivateCompany = (id: string) => apiFetch(`/admin/companies/${id}/activate`, { method: 'PUT' });
export const adminDeactivateCompany = (id: string) => apiFetch(`/admin/companies/${id}/deactivate`, { method: 'PUT' });

export const adminGetAllDrivers = async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const { data } = await apiFetch(`/admin/drivers${queryString ? `?${queryString}` : ''}`);
    return data;
};
export const adminCreateDriver = (driverData: any) => apiFetch('/admin/drivers', { method: 'POST', body: JSON.stringify(driverData) });
export const adminUpdateDriver = (id: string, driverData: any) => apiFetch(`/admin/drivers/${id}`, { method: 'PUT', body: JSON.stringify(driverData) });
export const adminDeleteDriver = (id: string) => apiFetch(`/admin/drivers/${id}`, { method: 'DELETE' });
export const adminGetDriverHistory = async (driverId: string) => {
    const { data } = await apiFetch(`/admin/drivers/${driverId}/history`);
    return data;
};
export const getDriverPerformance = async (id: string, period?: string) => {
    const queryString = period ? `?period=${period}` : '';
    const { data } = await apiFetch(`/drivers/${id}/performance${queryString}`);
    return data;
};
export const assignDriverToTrip = (driverId: string, tripId: string) => 
    apiFetch('/drivers/assign', { method: 'POST', body: JSON.stringify({ driverId, tripId }) });


export const adminGetAllAgents = async () => {
    const { data } = await apiFetch('/admin/agents');
    return data;
};
export const adminCreateAgent = (agentData: any) => apiFetch('/admin/agents', { method: 'POST', body: JSON.stringify(agentData) });
export const adminUpdateAgent = (id: string, agentData: any) => apiFetch(`/admin/agents/${id}`, { method: 'PUT', body: JSON.stringify(agentData) });
export const adminDeleteAgent = (id: string) => apiFetch(`/admin/agents/${id}`, { method: 'DELETE' });
export const adminGetAgentDetails = async (id: string) => {
    const { data } = await apiFetch(`/admin/agents/${id}`);
    return data;
};
export const adminActivateAgent = (id: string) => apiFetch(`/admin/agents/${id}/activate`, { method: 'PUT' });
export const adminDeactivateAgent = (id: string) => apiFetch(`/admin/agents/${id}/deactivate`, { method: 'PUT' });

export const adminGetAllUsers = async (filters?: any) => {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const { data } = await apiFetch(`/admin/users${queryString ? `?${queryString}` : ''}`);
    return data;
};
export const adminGetUserDetails = async (id: string) => {
    const { data } = await apiFetch(`/admin/users/${id}`);
    return data;
};
export const adminActivateUser = (id: string) => apiFetch(`/admin/users/${id}/activate`, { method: 'PUT' });
export const adminDeactivateUser = (id: string) => apiFetch(`/admin/users/${id}/deactivate`, { method: 'PUT' });
export const adminGetAllPassengers = async (filters?: any) => {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const { data } = await apiFetch(`/admin/passengers${queryString ? `?${queryString}` : ''}`);
    return data;
};

export const adminGetDashboardAnalytics = async () => {
    const { data } = await apiFetch('/admin/analytics');
    return data;
};
export const adminGetFinancials = async () => {
    const { data } = await apiFetch('/admin/financials');
    return data;
};

export const adminUpdateSetting = (key: string, value: string) => apiFetch(`/admin/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) });

export const adminCreateDestination = (data: any) => apiFetch('/admin/destinations', { method: 'POST', body: JSON.stringify(data) });
export const adminUpdateDestination = (id: number, data: any) => apiFetch(`/admin/destinations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const adminDeleteDestination = (id: number) => apiFetch(`/admin/destinations/${id}`, { method: 'DELETE' });

export const adminGetAds = () => apiFetch('/advertisements/all');
export const adminCreateAd = (adData: any) => apiFetch('/advertisements', { method: 'POST', body: JSON.stringify(adData) });
export const adminUpdateAd = (id: number, adData: any) => apiFetch(`/advertisements/${id}`, { method: 'PUT', body: JSON.stringify(adData) });
export const adminDeleteAd = (id: number) => apiFetch(`/advertisements/${id}`, { method: 'DELETE' });


// --- COMPANY ---
export const companyGetMyDrivers = async () => {
    const { data } = await apiFetch('/companies/mydrivers');
    return data;
}
export const companyCreateDriver = (driverData: any) => apiFetch('/companies/mydrivers', { method: 'POST', body: JSON.stringify(driverData) });
export const companyUpdateDriver = (id: string, driverData: any) => apiFetch(`/companies/mydrivers/${id}`, { method: 'PUT', body: JSON.stringify(driverData) });
export const companyDeleteDriver = (id: string) => apiFetch(`/companies/mydrivers/${id}`, { method: 'DELETE' });
export const companyGetDriverHistory = async (driverId: string) => {
    const { data } = await apiFetch(`/companies/mydrivers/${driverId}/history`);
    return data;
};
export const getCompanyDashboard = async () => {
    const { data } = await apiFetch('/companies/my-dashboard');
    return data;
}
export const companyGetMyTrips = async (filters?: any) => {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const { data } = await apiFetch(`/companies/my-trips${queryString ? `?${queryString}` : ''}`);
    return data;
};
export const companyCreateTrip = (tripData: any) => apiFetch('/companies/my-trips', { method: 'POST', body: JSON.stringify(tripData) });
export const companyUpdateTrip = (id: string, tripData: any) => apiFetch(`/companies/my-trips/${id}`, { method: 'PUT', body: JSON.stringify(tripData) });
export const companyDeleteTrip = (id: string) => apiFetch(`/companies/my-trips/${id}`, { method: 'DELETE' });
export const companyGetAnalytics = async (period?: string) => {
    const queryString = period ? `?period=${period}` : '';
    const { data } = await apiFetch(`/companies/analytics${queryString}`);
    return data;
};
export const companyGetWalletBalance = async () => {
    const { data } = await apiFetch('/companies/wallet/balance');
    return data;
};
export const companyGetMyBuses = async () => {
    const { data } = await apiFetch('/companies/mybuses');
    return data;
};
export const companyCreateBus = (busData: any) => apiFetch('/companies/mybuses', { method: 'POST', body: JSON.stringify(busData) });
export const companyUpdateBus = (id: string, busData: any) => apiFetch(`/companies/mybuses/${id}`, { method: 'PUT', body: JSON.stringify(busData) });
export const companyDeleteBus = (id: string) => apiFetch(`/companies/mybuses/${id}`, { method: 'DELETE' });

export const companyGetMyRoutes = async () => {
    const { data } = await apiFetch('/companies/myroutes');
    return data;
};
export const companyCreateRoute = (routeData: any) => apiFetch('/companies/myroutes', { method: 'POST', body: JSON.stringify(routeData) });
export const companyUpdateRoute = (id: string, routeData: any) => apiFetch(`/companies/myroutes/${id}`, { method: 'PUT', body: JSON.stringify(routeData) });
export const companyDeleteRoute = (id: string) => apiFetch(`/companies/myroutes/${id}`, { method: 'DELETE' });

export const companyGetMyPassengers = async () => {
    const { data } = await apiFetch('/companies/mypassengers');
    return data;
};
export const companyGetMyFinancials = async () => {
    const { data } = await apiFetch('/companies/myfinancials');
    return data;
};

// Bus-Driver Assignment APIs
export const companyGetBusAssignments = async () => {
    const { data } = await apiFetch('/companies/bus-assignments');
    return data;
};
export const companyCreateBusAssignment = (assignmentData: any) => 
    apiFetch('/companies/bus-assignments', { method: 'POST', body: JSON.stringify(assignmentData) });
export const companyEndBusAssignment = (assignmentId: number) => 
    apiFetch(`/companies/bus-assignments/${assignmentId}/end`, { method: 'PUT' });

// Company Gallery APIs
export const companyGetGallery = async (filters?: any) => {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const { data } = await apiFetch(`/companies/gallery${queryString ? `?${queryString}` : ''}`);
    return data;
};
export const companyUploadGalleryImage = (imageData: any) => 
    apiFetch('/companies/gallery', { method: 'POST', body: JSON.stringify(imageData) });
export const companyUpdateGalleryImage = (imageId: number, updates: any) => 
    apiFetch(`/companies/gallery/${imageId}`, { method: 'PUT', body: JSON.stringify(updates) });
export const companyDeleteGalleryImage = (imageId: number) => 
    apiFetch(`/companies/gallery/${imageId}`, { method: 'DELETE' });

// Company Withdrawal APIs
export const companyRequestWithdrawal = (withdrawalData: any) => 
    apiFetch('/wallet/company/withdraw', { method: 'POST', body: JSON.stringify(withdrawalData) });
export const companyGetWithdrawalHistory = async () => {
    const { data } = await apiFetch('/wallet/company/withdrawals');
    return data;
};

// Bus Stations APIs
export const getBusStations = async () => {
    const { data } = await apiFetch('/routes/stations');
    return data;
};
export const getBusStationsByCity = async (cityId: string) => {
    const { data } = await apiFetch(`/routes/cities/${cityId}/stations`);
    return data;
};

// Driver Advanced APIs
export const driverGetTripSeatMap = async (tripId: number) => {
    const { data } = await apiFetch(`/driver/trips/${tripId}/seat-map`);
    return data;
};
export const driverGetTripPassengers = async (tripId: number) => {
    const { data } = await apiFetch(`/driver/trips/${tripId}/passengers`);
    return data;
};
export const driverConfirmBoarding = (tripId: number, bookingId: number, status: 'checked_in' | 'no_show', notes?: string) => 
    apiFetch(`/driver/trips/${tripId}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ bookingId, checkInStatus: status, notes })
    });
export const driverGetStats = async () => {
    const { data } = await apiFetch('/driver/stats');
    return data;
};

// Wallet Advanced APIs
export const getWalletTransactions = async (filters?: any) => {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const { data } = await apiFetch(`/wallet/transactions${queryString ? `?${queryString}` : ''}`);
    return data;
};
export const getWalletAnalytics = async () => {
    const { data } = await apiFetch('/wallet/analytics');
    return data;
};

// Agent Advanced APIs
export const agentLookupPassengerBySerial = async (serialCode: string) => {
    const { data } = await apiFetch(`/agents/lookup/${serialCode}`);
    return data;
};
export const agentDepositBySerial = (depositData: { passengerSerialCode: string, amount: number, pin: string }) => 
    apiFetch('/wallet/agent/deposit-by-serial', {
        method: 'POST',
        body: JSON.stringify(depositData)
    });


// --- DRIVER ---
export const driverGetMyTrips = async () => {
    const { data } = await apiFetch('/drivers/my-trips');
    return data;
};
export const driverGetMyHistory = async () => {
    const { data } = await apiFetch('/drivers/my-history');
    return data;
};
export const driverUpdateMyStatus = async (status: 'Active' | 'Unavailable') => {
    const { data } = await apiFetch('/drivers/my-status', {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
    return data;
};
export const driverUpdateLocation = async (latitude: number, longitude: number) => {
    const { data } = await apiFetch('/drivers/location', {
        method: 'PUT',
        body: JSON.stringify({ latitude, longitude }),
    });
    return data;
};
export const driverGetMyProfile = async () => {
    const { data } = await apiFetch('/drivers/my-profile');
    return data;
};
export const driverUpdateMyProfile = (profileData: any) => 
    apiFetch('/drivers/my-profile', { method: 'PUT', body: JSON.stringify(profileData) });


// --- AGENT ---
export const agentLookupPassenger = async (serialCode: string) => {
    const { data } = await apiFetch(`/agents/lookup/${serialCode}`);
    return data;
};
export const agentMakeDeposit = (depositData: { passengerSerial: string, amount: number, pin?: string }) => {
    return apiFetch('/agents/deposit', { method: 'POST', body: JSON.stringify(depositData) });
};
export const agentGetMyTransactions = async () => {
    const { data } = await apiFetch('/agents/my-transactions');
    return data;
};
export const getAgentDashboard = async () => {
    const { data } = await apiFetch('/agents/my-dashboard');
    return data;
};
export const agentGetPassengerHistory = async (serialCode: string) => {
    const { data } = await apiFetch(`/agents/passenger-history/${serialCode}`);
    return data;
};
export const agentGetCommissionHistory = async () => {
    const { data } = await apiFetch('/agents/commission-history');
    return data;
};

// --- LOYALTY ---
export const getLoyaltyHistory = async () => {
    const { data } = await apiFetch('/loyalty/history');
    return data;
}

// --- PRICE ALERTS ---
export const createPriceAlert = (alertData: any) => apiFetch('/price-alerts', { method: 'POST', body: JSON.stringify(alertData) });
export const getMyPriceAlerts = async () => {
    const { data } = await apiFetch('/price-alerts');
    return data;
}
export const deletePriceAlert = (id: number) => apiFetch(`/price-alerts/${id}`, { method: 'DELETE' });

// Enhanced Booking APIs
export const cancelBooking = (id: string) => apiFetch(`/bookings/${id}/cancel`, { method: 'PUT' });

// Notifications APIs
export const getNotifications = async () => {
    const { data } = await apiFetch('/notifications');
    return data;
};
export const markNotificationAsRead = (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsAsRead = () => apiFetch('/notifications/read-all', { method: 'PUT' });

// Reviews APIs
export const createReview = (reviewData: any) => apiFetch('/reviews', { method: 'POST', body: JSON.stringify(reviewData) });
export const getReviews = async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const { data } = await apiFetch(`/reviews${queryString ? `?${queryString}` : ''}`);
    return data;
};

// System Health APIs
export const getSystemHealth = async () => {
    const { data } = await apiFetch('/admin/health');
    return data;
};
export const getSystemLogs = async (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const { data } = await apiFetch(`/admin/logs${queryString ? `?${queryString}` : ''}`);
    return data;
};

// --- OTHER SERVICES ---
export const getLostAndFoundItems = async () => {
    const { data } = await apiFetch('/lost-and-found');
    return data;
}
export const reportLostItem = (itemData: any) => apiFetch('/lost-and-found', { method: 'POST', body: JSON.stringify(itemData) });

export const createPackageRequest = (packageData: any) => apiFetch('/packages', { method: 'POST', body: JSON.stringify(packageData) });
export const trackPackage = async (trackingId: string) => {
    const { data } = await apiFetch(`/packages/${trackingId}`);
    return data;
};

export const createCharterRequest = (charterData: any) => apiFetch('/charters', { method: 'POST', body: JSON.stringify(charterData) });

// --- NOTIFICATIONS ---
export const subscribePush = (subscription: any) => apiFetch('/notifications/subscribe', { method: 'POST', body: JSON.stringify(subscription) });


// --- DEBUG ---
export const seedDatabase = () => apiFetch('/debug/seed', { method: 'POST' });

// --- PASSENGER ---
export const passengerGetMyBookings = async (filters?: any) => {
    const queryString = filters ? new URLSearchParams(filters).toString() : '';
    const { data } = await apiFetch(`/bookings/my-bookings${queryString ? `?${queryString}` : ''}`);
    return data;
};
export const passengerGetBookingDetails = async (bookingId: string) => {
    const { data } = await apiFetch(`/bookings/${bookingId}`);
    return data;
};
export const passengerCancelBooking = (bookingId: string, reason?: string) => 
    apiFetch(`/bookings/${bookingId}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) });
export const passengerGetMyProfile = async () => {
    const { data } = await apiFetch('/passengers/my-profile');
    return data;
};
export const passengerUpdateMyProfile = (profileData: any) => 
    apiFetch('/passengers/my-profile', { method: 'PUT', body: JSON.stringify(profileData) });
