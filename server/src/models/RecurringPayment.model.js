import mongoose from 'mongoose'

const recurringPaymentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [160, 'Name is too long'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: '{VALUE} is not a valid type',
      },
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: {
        values: ['daily', 'weekly', 'monthly', 'yearly'],
        message: '{VALUE} is not a valid frequency',
      },
      required: true,
    },
    nextDueDate: {
      type: Date,
      required: [true, 'Next due date is required'],
      index: true,
    },
    lastProcessed: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    reminderDays: {
      type: Number,
      default: 3,
      min: [0, 'Reminder days cannot be negative'],
      max: [90, 'Reminder days is too large'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

recurringPaymentSchema.index({ userId: 1, isActive: 1, nextDueDate: 1 })
recurringPaymentSchema.index({ wallet: 1 })

recurringPaymentSchema.virtual('isDueSoon').get(function isDueSoonGetter() {
  if (!this.nextDueDate || !this.isActive) return false
  const now = new Date()
  const ms = this.nextDueDate.getTime() - now.getTime()
  const days = ms / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= (this.reminderDays ?? 3)
})

const RecurringPayment =
  mongoose.models.RecurringPayment || mongoose.model('RecurringPayment', recurringPaymentSchema)

export default RecurringPayment
