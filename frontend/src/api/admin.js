import apiClient from './client'

export const departmentApi = {
  getAll: () => apiClient.get('/departments'),
  create: (data) => apiClient.post('/departments', data),
  update: (id, data) => apiClient.put(`/departments/${id}`, data)
}

export const requestTypeApi = {
  getAll: () => apiClient.get('/request-types'),
  create: (data) => apiClient.post('/request-types', data),
  update: (id, data) => apiClient.put(`/request-types/${id}`, data)
}

export const workflowApi = {
  getAll: () => apiClient.get('/workflows'),
  create: (data) => apiClient.post('/workflows', data),
  update: (id, data) => apiClient.put(`/workflows/${id}`, data)
}

export const userApi = {
  getAll: () => apiClient.get('/admin/users'),
  create: (data) => apiClient.post('/admin/users', data),
  update: (id, data) => apiClient.put(`/admin/users/${id}`, data)
}