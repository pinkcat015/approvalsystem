import apiClient from './client'

export const requestApi = {
  create: (data) => apiClient.post('/requests', data),

  submit: (id) => apiClient.post(`/requests/${id}/submit`),

  processAction: (id, data) => apiClient.post(`/requests/${id}/action`, data),

  cancel: (id, reason) =>
    apiClient.post(`/requests/${id}/cancel`, null, { params: { reason } }),

  getMyRequests: (params) => apiClient.get('/requests/my', { params }),

  getById: (id) => apiClient.get(`/requests/${id}`)
}