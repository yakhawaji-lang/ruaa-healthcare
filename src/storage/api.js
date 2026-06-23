// API/storage layer — single axios client used across the app (PlayTix 2.0 style).
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach a JWT to every request: admin token for /admin, account token otherwise.
api.interceptors.request.use((config) => {
  const url = config.url || '';
  const adminToken = localStorage.getItem('admin_token');
  const userToken = localStorage.getItem('user_token');
  if (url.startsWith('/admin') && adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
  else if (url.startsWith('/account') && userToken) config.headers.Authorization = `Bearer ${userToken}`;
  else if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
  return config;
});

/* ---------------- Public ---------------- */
export const PublicAPI = {
  bootstrap: () => api.get('/public/bootstrap').then((r) => r.data),
  page: (slug) => api.get(`/public/pages/${slug}`).then((r) => r.data),
  service: (slug) => api.get(`/public/services/${slug}`).then((r) => r.data),
  sendMessage: (payload) => api.post('/public/messages', payload).then((r) => r.data),
};

/* ---------------- Auth ---------------- */
export const AuthAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

/* ---------------- Account (visitors + insurance) ---------------- */
export const AccountAPI = {
  register: (data) => api.post('/account/register', data).then((r) => r.data),
  login: (email, password) => api.post('/account/login', { email, password }).then((r) => r.data),
  me: () => api.get('/account/me').then((r) => r.data),
  updateMe: (data) => api.put('/account/me', data).then((r) => r.data),
  // visitor
  createRequest: (data) => api.post('/account/requests', data).then((r) => r.data),
  myRequests: () => api.get('/account/requests').then((r) => r.data),
  request: (id) => api.get(`/account/requests/${id}`).then((r) => r.data),
  // insurance
  createCase: (data) => api.post('/account/cases', data).then((r) => r.data),
  updateCase: (id, data) => api.put(`/account/cases/${id}`, data).then((r) => r.data),
  myCases: () => api.get('/account/cases').then((r) => r.data),
  myServices: () => api.get('/account/my-services').then((r) => r.data),
  case: (id) => api.get(`/account/cases/${id}`).then((r) => r.data),
  // medical profile + visits
  profile: () => api.get('/account/profile').then((r) => r.data),
  saveProfile: (data) => api.put('/account/profile', data).then((r) => r.data),
  myVisits: () => api.get('/account/visits').then((r) => r.data),
  myCaseVisits: () => api.get('/account/case-visits').then((r) => r.data),
  allMessages: () => api.get('/account/messages').then((r) => r.data),
  // notifications
  notifications: () => api.get('/account/notifications').then((r) => r.data),
  readNotif: (id) => api.post('/account/notifications/read', { id }).then((r) => r.data),
  readAllNotifs: () => api.post('/account/notifications/read', {}).then((r) => r.data),
  dismissNotif: (id) => api.post('/account/notifications/dismiss', { id }).then((r) => r.data),
  clearNotifs: () => api.post('/account/notifications/clear', {}).then((r) => r.data),
  // correspondence
  sendCaseMessage: (id, payload) => api.post(`/account/cases/${id}/messages`, payload).then((r) => r.data),
  sendRequestMessage: (id, payload) => api.post(`/account/requests/${id}/messages`, payload).then((r) => r.data),
  uploadFile: (data, filename) => api.post('/account/upload', { data, filename }).then((r) => r.data),
};

/* ---------------- Admin ---------------- */
export const AdminAPI = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  analytics: () => api.get('/admin/analytics').then((r) => r.data),
  notifications: () => api.get('/admin/notifications').then((r) => r.data),
  readNotif: (id) => api.post('/admin/notifications/read', { id }).then((r) => r.data),
  readAllNotifs: () => api.post('/admin/notifications/read', {}).then((r) => r.data),
  dismissNotif: (id) => api.post('/admin/notifications/dismiss', { id }).then((r) => r.data),
  clearNotifs: () => api.post('/admin/notifications/clear', {}).then((r) => r.data),
  // web push (PWA phone notifications)
  pushKey: () => api.get('/admin/push/key').then((r) => r.data),
  pushSubscribe: (sub) => api.post('/admin/push/subscribe', sub).then((r) => r.data),
  pushUnsubscribe: (endpoint) => api.post('/admin/push/unsubscribe', { endpoint }).then((r) => r.data),
  // services
  services: () => api.get('/admin/services').then((r) => r.data),
  service: (id) => api.get(`/admin/services/${id}`).then((r) => r.data),
  createService: (data) => api.post('/admin/services', data).then((r) => r.data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data).then((r) => r.data),
  deleteService: (id) => api.delete(`/admin/services/${id}`).then((r) => r.data),
  // pages
  pages: () => api.get('/admin/pages').then((r) => r.data),
  page: (id) => api.get(`/admin/pages/${id}`).then((r) => r.data),
  updatePage: (id, data) => api.put(`/admin/pages/${id}`, data).then((r) => r.data),
  // messages
  messages: () => api.get('/admin/messages').then((r) => r.data),
  markMessage: (id, isRead) => api.put(`/admin/messages/${id}/read`, { is_read: isRead }).then((r) => r.data),
  deleteMessage: (id) => api.delete(`/admin/messages/${id}`).then((r) => r.data),
  // settings
  settings: () => api.get('/admin/settings').then((r) => r.data),
  saveSettings: (items) => api.put('/admin/settings', items).then((r) => r.data),
  // image upload (base64 data URL)
  uploadImage: (data, filename) => api.post('/admin/upload', { data, filename }).then((r) => r.data),
  // hero slides
  heroSlides: () => api.get('/admin/hero').then((r) => r.data),
  heroSlide: (id) => api.get(`/admin/hero/${id}`).then((r) => r.data),
  createHeroSlide: (data) => api.post('/admin/hero', data).then((r) => r.data),
  updateHeroSlide: (id, data) => api.put(`/admin/hero/${id}`, data).then((r) => r.data),
  deleteHeroSlide: (id) => api.delete(`/admin/hero/${id}`).then((r) => r.data),
  // partners
  partners: () => api.get('/admin/partners').then((r) => r.data),
  createPartner: (data) => api.post('/admin/partners', data).then((r) => r.data),
  updatePartner: (id, data) => api.put(`/admin/partners/${id}`, data).then((r) => r.data),
  deletePartner: (id) => api.delete(`/admin/partners/${id}`).then((r) => r.data),
  // service requests
  requests: () => api.get('/admin/requests').then((r) => r.data),
  request: (id) => api.get(`/admin/requests/${id}`).then((r) => r.data),
  updateRequest: (id, data) => api.put(`/admin/requests/${id}`, data).then((r) => r.data),
  deleteRequest: (id) => api.delete(`/admin/requests/${id}`).then((r) => r.data),
  // insurance cases
  cases: () => api.get('/admin/cases').then((r) => r.data),
  case: (id) => api.get(`/admin/cases/${id}`).then((r) => r.data),
  updateCaseDetails: (id, data) => api.put(`/admin/cases/${id}/details`, data).then((r) => r.data),
  deleteCase: (id) => api.delete(`/admin/cases/${id}`).then((r) => r.data),
  allVisits: () => api.get('/admin/visits').then((r) => r.data),
  clients: () => api.get('/admin/clients').then((r) => r.data),
  createClient: (data) => api.post('/admin/clients', data).then((r) => r.data),
  updateClient: (id, data) => api.put(`/admin/clients/${id}`, data).then((r) => r.data),
  setClientActive: (id, isActive) => api.put(`/admin/clients/${id}/active`, { is_active: isActive }).then((r) => r.data),
  setClientPassword: (id, password) => api.put(`/admin/clients/${id}/password`, { password }).then((r) => r.data),
  deleteClient: (id) => api.delete(`/admin/clients/${id}`).then((r) => r.data),
  admins: () => api.get('/admin/admins').then((r) => r.data),
  createAdmin: (data) => api.post('/admin/admins', data).then((r) => r.data),
  updateAdmin: (id, data) => api.put(`/admin/admins/${id}`, data).then((r) => r.data),
  setAdminPassword: (id, password) => api.put(`/admin/admins/${id}/password`, { password }).then((r) => r.data),
  setAdminActive: (id, isActive) => api.put(`/admin/admins/${id}/active`, { is_active: isActive }).then((r) => r.data),
  deleteAdmin: (id) => api.delete(`/admin/admins/${id}`).then((r) => r.data),
  updateCase: (id, data) => api.put(`/admin/cases/${id}`, data).then((r) => r.data),
  // insurance companies
  insurers: () => api.get('/admin/insurers').then((r) => r.data),
  createInsurer: (data) => api.post('/admin/insurers', data).then((r) => r.data),
  updateInsurer: (id, data) => api.put(`/admin/insurers/${id}`, data).then((r) => r.data),
  setInsurerActive: (id, isActive) => api.put(`/admin/insurers/${id}/active`, { is_active: isActive }).then((r) => r.data),
  setInsurerPassword: (id, password) => api.put(`/admin/insurers/${id}/password`, { password }).then((r) => r.data),
  insurerServices: (id) => api.get(`/admin/insurers/${id}/services`).then((r) => r.data),
  setInsurerServices: (id, serviceIds) => api.put(`/admin/insurers/${id}/services`, { service_ids: serviceIds }).then((r) => r.data),
  deleteInsurer: (id) => api.delete(`/admin/insurers/${id}`).then((r) => r.data),
  // visits + patient profile
  createVisit: (data) => api.post('/admin/visits', data).then((r) => r.data),
  updateVisit: (id, data) => api.put(`/admin/visits/${id}`, data).then((r) => r.data),
  deleteVisit: (id) => api.delete(`/admin/visits/${id}`).then((r) => r.data),
  patient: (userId) => api.get(`/admin/patients/${userId}`).then((r) => r.data),
  savePatient: (userId, data) => api.put(`/admin/patients/${userId}`, data).then((r) => r.data),
  // correspondence
  sendCaseMessage: (id, payload) => api.post(`/admin/cases/${id}/messages`, payload).then((r) => r.data),
  sendRequestMessage: (id, payload) => api.post(`/admin/requests/${id}/messages`, payload).then((r) => r.data),
  uploadFile: (data, filename) => api.post('/admin/upload-file', { data, filename }).then((r) => r.data),
};


export default api;
