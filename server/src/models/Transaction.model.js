import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: '{VALUE} is not a valid transaction type',
      },
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator(tags) {
          return tags.length <= 50 && tags.every((t) => typeof t === 'string' && t.length <= 40)
        },
        message: 'Invalid tags',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [4000, 'Notes are too long'],
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    attachments: {
      type: [String],
      default: [],
      validate: {
        validator(urls) {
          return urls.length <= 20
        },
        message: 'Too many attachments',
      },
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringPayment',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

transactionSchema.index({ date: -1 })
transactionSchema.index({ userId: 1, wallet: 1, date: -1, category: 1 })

transactionSchema.virtual('signedAmount').get(function signedAmountGetter() {
  if (this.type === 'expense') return -Math.abs(this.amount)
  return Math.abs(this.amount)
})

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema)

export default Transaction
