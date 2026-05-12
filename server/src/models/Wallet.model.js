import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: {
        values: ['owner', 'editor', 'viewer'],
        message: '{VALUE} is not a valid member role',
      },
      required: true,
      default: 'viewer',
    },
  },
  { _id: false },
)

const walletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Wallet name is required'],
      trim: true,
      maxlength: [120, 'Wallet name is too long'],
    },
    type: {
      type: String,
      enum: {
        values: ['bank', 'cash', 'upi', 'business', 'shared'],
        message: '{VALUE} is not a valid wallet type',
      },
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    color: {
      type: String,
      trim: true,
      default: '#6366f1',
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^$/, 'Color must be a valid hex value'],
    },
    icon: {
      type: String,
      trim: true,
      default: 'wallet',
      maxlength: [64, 'Icon key is too long'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    members: {
      type: [memberSchema],
      default: [],
      validate: {
        validator(arr) {
          return arr.length <= 100
        },
        message: 'Too many wallet members',
      },
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: [8, 'Currency code is too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description is too long'],
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

walletSchema.index({ userId: 1, isArchived: 1 })
walletSchema.index({ userId: 1, name: 1 })

walletSchema.virtual('memberCount').get(function memberCountGetter() {
  return Array.isArray(this.members) ? this.members.length : 0
})

const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema)

export default Wallet
