import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title is too long'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message is too long'],
    },
    type: {
      type: String,
      enum: {
        values: ['budget_exceeded', 'recurring_due', 'shared_update', 'large_expense', 'system'],
        message: '{VALUE} is not a valid notification type',
      },
      required: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    relatedModel: {
      type: String,
      trim: true,
      maxlength: [80, 'relatedModel is too long'],
      default: null,
      validate: {
        validator(v) {
          if (v == null || v === '') return true
          return /^[A-Za-z][A-Za-z0-9_]*$/.test(v)
        },
        message: 'relatedModel must be a safe model name',
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

notificationSchema.virtual('isUnread').get(function isUnreadGetter() {
  return !this.isRead
})

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)

export default Notification
