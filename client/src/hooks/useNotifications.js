import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'

// ─── API calls ─────────────────────────────────────────────────────────────

const fetchNotifications = async ({ page = 1, limit = 20, isRead } = {}) => {
  const params = { page, limit }
  if (isRead !== undefined) params.isRead = isRead
  const { data } = await api.get('/notifications', { params })
  return data.data
}

const fetchUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count')
  return data.data.count
}

const markOneReadApi = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`)
  return data.data.notification
}

const markAllReadApi = async () => {
  const { data } = await api.put('/notifications/read-all')
  return data.data
}

const deleteNotificationApi = async (id) => {
  await api.delete(`/notifications/${id}`)
}

const clearAllApi = async () => {
  const { data } = await api.delete('/notifications')
  return data.data
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Fetch paginated notifications list.
 * Refetches every 60 s so the list stays fresh even without socket events.
 */
export function useNotifications({ page = 1, limit = 20, isRead } = {}) {
  return useQuery({
    queryKey: ['notifications', { page, limit, isRead }],
    queryFn: () => fetchNotifications({ page, limit, isRead }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

/**
 * Fetch just the unread badge count.
 * Lightweight — used in Header bell icon.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

/** Mark a single notification as read (optimistic). */
export function useMarkOneRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markOneReadApi,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      // Snapshot for rollback
      const prev = queryClient.getQueriesData({ queryKey: ['notifications'] })
      // Optimistically mark read in all cached pages
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old
        if (Array.isArray(old.notifications)) {
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n._id === id ? { ...n, isRead: true } : n,
            ),
            unreadCount: Math.max(0, (old.unreadCount || 1) - 1),
          }
        }
        return old
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        ctx.prev.forEach(([key, val]) => queryClient.setQueryData(key, val))
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/** Mark ALL notifications as read. */
export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/** Delete a single notification (optimistic). */
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNotificationApi,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueriesData({ queryKey: ['notifications'] })
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (old) => {
        if (!old || !Array.isArray(old.notifications)) return old
        const removed = old.notifications.find((n) => n._id === id)
        return {
          ...old,
          notifications: old.notifications.filter((n) => n._id !== id),
          unreadCount: removed && !removed.isRead
            ? Math.max(0, (old.unreadCount || 1) - 1)
            : old.unreadCount,
        }
      })
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        ctx.prev.forEach(([key, val]) => queryClient.setQueryData(key, val))
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/** Clear all notifications for the user. */
export function useClearAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearAllApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
