import { apiClient } from './apiClient'

export const sharedWalletAPI = {
  create: (data) =>
    apiClient.post('/shared-wallets', data),

  getAll: () =>
    apiClient.get('/shared-wallets'),

  join: (inviteCode) =>
    apiClient.post('/shared-wallets/join', { inviteCode }),

  transactions: (id) =>
    apiClient.get(`/shared-wallets/${id}/transactions`),

  settlements: (id) =>
    apiClient.get(`/shared-wallets/${id}/settlements`)
}