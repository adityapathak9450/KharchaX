import Notification from '../models/Notification.model.js'
import { emitNotification } from '../sockets/socketEmitter.js'

export const notificationService = {

  createNotification: async ({ userId, type, title, message, data = {} }) => {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      isRead: false
    })
    return notification
  },

  sendRealtimeNotification: (userId, notification) => {
    emitNotification(userId, notification)
  },

  createAndEmitNotification: async ({ userId, type, title, message, data = {} }) => {
    const notification = await notificationService.createNotification({
      userId, type, title, message, data
    })
    notificationService.sendRealtimeNotification(userId, notification)
    return notification
  }

}
