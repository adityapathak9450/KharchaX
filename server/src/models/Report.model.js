import mongoose from 'mongoose'

const periodSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
      default: null,
    },
    year: {
      type: Number,
      min: [1970, 'Year is invalid'],
      max: [2100, 'Year is invalid'],
      required: [true, 'Year is required for the report period'],
    },
  },
  { _id: false },
)

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['monthly', 'yearly', 'wallet', 'budget', 'category'],
        message: '{VALUE} is not a valid report type',
      },
      required: true,
      index: true,
    },
    period: {
      type: periodSchema,
      required: [true, 'Period is required'],
    },
    fileUrl: {
      type: String,
      trim: true,
      maxlength: [2048, 'fileUrl is too long'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'ready', 'failed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    generatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

reportSchema.index({ userId: 1, type: 1, status: 1 })
reportSchema.index({ userId: 1, 'period.year': 1, 'period.month': 1 })

reportSchema.virtual('periodLabel').get(function periodLabelGetter() {
  const y = this.period?.year
  const m = this.period?.month
  if (!y) return ''
  if (m == null) return `${y}`
  return `${y}-${String(m).padStart(2, '0')}`
})

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema)

export default Report
