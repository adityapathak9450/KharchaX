import mongoose from 'mongoose'
import crypto from 'node:crypto'

const expenseEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description is too long'],
      default: '',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paidFromWallet: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Wallet',
  required: true,
},
    splitBetween: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      validate: {
        validator(arr) {
          return arr.length <= 50
        },
        message: 'Too many split members',
      },
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  { _id: true },
)

const sharedMemberSchema = new mongoose.Schema(
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
        message: '{VALUE} is not a valid role',
      },
      default: 'viewer',
    },
    joinedAt: {
      type: Date,
      default: () => new Date(),
    },
    totalContributed: {
      type: Number,
      default: 0,
      min: [0, 'Contribution cannot be negative'],
    },
  },
  { _id: false },
)

const sharedWalletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name is too long'],
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Wallet reference is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: {
      type: [sharedMemberSchema],
      default: [],
      validate: {
        validator(arr) {
          return arr.length <= 200
        },
        message: 'Too many members',
      },
    },
    totalBalance: {
      type: Number,
      default: 0,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      minlength: [8, 'Invite code is too short'],
      maxlength: [32, 'Invite code is too long'],
    },
    sharedStartedAt: {
  type: Date,
  default: Date.now
},
    expenses: {
      type: [expenseEntrySchema],
      default: [],
      validate: {
        validator(arr) {
          return arr.length <= 5000
        },
        message: 'Too many expense entries',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

sharedWalletSchema.virtual('memberCount').get(function memberCountGetter() {
  return Array.isArray(this.members) ? this.members.length : 0
})

sharedWalletSchema.pre('validate', function generateInviteCode(next) {
  if (!this.inviteCode || this.inviteCode.length < 8) {
    this.inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase()
  }
  next()
})

const SharedWallet = mongoose.models.SharedWallet || mongoose.model('SharedWallet', sharedWalletSchema)

export default SharedWallet
