import mongoose from 'mongoose'

const budgetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Budget name is required'],
      trim: true,
      maxlength: [120, 'Budget name is too long'],
    },
    amount: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [0.01, 'Budget limit must be greater than zero'],
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1970, 'Year is invalid'],
      max: [2100, 'Year is invalid'],
    },
    alertAt: {
      type: Number,
      default: 80,
      min: [1, 'Alert threshold must be at least 1%'],
      max: [100, 'Alert threshold cannot exceed 100%'],
    },
    isExceeded: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      trim: true,
      default: '#6366f1',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Color must be a valid hex value'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

budgetSchema.index({ userId: 1, year: 1, month: 1 })
budgetSchema.index({ userId: 1, category: 1, year: 1, month: 1 }, { unique: true })

budgetSchema.virtual('utilizationPercent').get(function utilizationPercentGetter() {
  if (!this.amount || this.amount <= 0) return 0
  return Math.min(100, Math.round((this.spent / this.amount) * 1000) / 10)
})

budgetSchema.virtual('shouldAlert').get(function shouldAlertGetter() {
  return this.utilizationPercent >= (this.alertAt ?? 80)
})

const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema)

export default Budget
