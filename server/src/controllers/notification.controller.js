import Notification from '../models/Notification.model.js'
import { AppError } from '../middleware/error.middleware.js'

// ─── GET /notifications ────────────────────────────────────────────────────
// Query params: page, limit, type, isRead
export async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.min(50, parseInt(req.query.limit) || 20)
    const skip   = (page - 1) * limit

    const filter = { userId }
    if (req.query.type)   filter.type   = req.query.type
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true'
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false }),
    ])

    res.json({
      success: true,
      message: 'Notifications fetched',
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasMore: skip + notifications.length < total,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

// ─── GET /notifications/unread-count ──────────────────────────────────────
export async function getUnreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    })
    res.json({ success: true, message: 'OK', data: { count } })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /notifications/:id/read ──────────────────────────────────────────
export async function markOneRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true },
    )

    if (!notification) {
      return next(new AppError('Notification not found', 404))
    }

    res.json({ success: true, message: 'Marked as read', data: { notification } })
  } catch (err) {
    next(err)
  }
}

// ─── PUT /notifications/read-all ──────────────────────────────────────────
export async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true },
    )

    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
      data: { modifiedCount: result.modifiedCount },
    })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /notifications/:id ────────────────────────────────────────────
export async function deleteNotification(req, res, next) {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    })

    if (!notification) {
      return next(new AppError('Notification not found', 404))
    }

    res.json({ success: true, message: 'Notification deleted', data: null })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /notifications (clear all) ────────────────────────────────────
export async function clearAllNotifications(req, res, next) {
  try {
    const result = await Notification.deleteMany({ userId: req.user.id })
    res.json({
      success: true,
      message: `${result.deletedCount} notification(s) cleared`,
      data: { deletedCount: result.deletedCount },
    })
  } catch (err) {
    next(err)
  }
}
