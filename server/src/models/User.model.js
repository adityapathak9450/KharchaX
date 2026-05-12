import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const REFRESH_TOKEN_EXPIRES = '7d'
const ACCESS_TOKEN_EXPIRES = '15m'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name is too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
      maxlength: [2048, 'Avatar URL is too long'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyToken: {
      type: String,
      default: null,
      select: false,
    },
    verifyTokenExpiry: {
      type: Date,
      default: null,
    },
    resetToken: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
      maxlength: [8, 'Currency code is too long'],
    },
    theme: {
      type: String,
      enum: {
        values: ['light', 'dark', 'system'],
        message: '{VALUE} is not a valid theme',
      },
      default: 'system',
    },
    preferences: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

userSchema.virtual('initials').get(function initialsGetter() {
  if (!this.name || typeof this.name !== 'string') return ''
  const parts = this.name.trim().split(/\s+/)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
})

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.password)
}

userSchema.methods.generateJWT = function generateJWT() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign({ sub: this._id.toString(), email: this.email }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  })
}

userSchema.methods.generateRefreshToken = function generateRefreshToken() {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured')
  }
  return jwt.sign({ sub: this._id.toString(), type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  })
}

userSchema.pre('save', async function hashPasswordPreSave(next) {
  if (!this.isModified('password')) return next()
  try {
    this.password = await bcrypt.hash(this.password, 12)
    return next()
  } catch (err) {
    return next(err)
  }
})

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.password
    delete ret.verifyToken
    delete ret.resetToken
    delete ret.refreshTokens
    return ret
  },
})

userSchema.set('toObject', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.password
    delete ret.verifyToken
    delete ret.resetToken
    delete ret.refreshTokens
    return ret
  },
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
