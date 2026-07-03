import apiClient from './client'

export const requestApi = {
  create: (data) => apiClient.post('/requests', data),

  update: (id, data) => apiClient.put(`/requests/${id}`, data),

  submit: (id) => apiClient.post(`/requests/${id}/submit`),

  processAction: (id, data) => apiClient.post(`/requests/${id}/action`, data),

  cancel: (id, reason) =>
    apiClient.post(`/requests/${id}/cancel`, null, { params: { reason } }),

  provideInfo: (id, note) =>
    apiClient.post(`/requests/${id}/provide-info`, null, { params: { note } }),

  getMyRequests: (params) => apiClient.get('/requests/my', { params }),

  getAll: (params) => apiClient.get('/requests/all', { params }),

  getById: (id) => apiClient.get(`/requests/${id}`),

  getPending: (params) => apiClient.get('/requests/pending', { params }),

  deleteAttachment: (id) => apiClient.delete(`/attachments/${id}`),

  uploadAttachment: (id, formData) => apiClient.post(`/requests/${id}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),

  downloadAttachment: (id) => apiClient.get(`/attachments/${id}`, { responseType: 'blob' }),

  exportRequests: (status) => apiClient.get('/requests/export', { params: { status }, responseType: 'blob' })
}

export const delegationApi = {
  create: (data) => apiClient.post('/delegations', data),
  getMy: () => apiClient.get('/delegations/my'),
  getIncoming: () => apiClient.get('/delegations/incoming'),
  cancel: (id) => apiClient.delete(`/delegations/${id}`)
}

export const notificationApi = {
  getAll: () => apiClient.get('/notifications'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id) => apiClient.post(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.post('/notifications/read-all')
}