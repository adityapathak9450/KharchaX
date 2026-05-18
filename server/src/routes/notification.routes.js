import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notification.controller.js'

const router = Router()

// All notification routes require authentication
router.use(authenticate)

// GET  /api/notifications               → paginated list
// GET  /api/notifications/unread-count  → badge count
// PUT  /api/notifications/read-all      → mark all as read
// DELETE /api/notifications             → clear all
// PUT  /api/notifications/:id/read      → mark one as read
// DELETE /api/notifications/:id         → delete one

router.get('/',              getNotifications)
router.get('/unread-count',  getUnreadCount)
router.put('/read-all',      markAllRead)
router.delete('/',           clearAllNotifications)
router.put('/:id/read',      markOneRead)
router.delete('/:id',        deleteNotification)

export default router
