import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      maxlength: [120, 'Action is too long'],
    },
   entity: {
  type: String,
  enum: {
    values: ['transaction', 'wallet', 'budget', 'recurring', 'sharedWallet'],
    message: '{VALUE} is not a valid entity type',
  },
  required: true,
  index: true,
},
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'entityId is required'],
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      trim: true,
      maxlength: [45, 'IP is too long'],
      default: null,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [512, 'User agent is too long'],
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

activityLogSchema.index({ userId: 1, createdAt: -1 })
activityLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 })

activityLogSchema.virtual('summary').get(function summaryGetter() {
  return `${this.action} on ${this.entity}`
})

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)

export default ActivityLog
