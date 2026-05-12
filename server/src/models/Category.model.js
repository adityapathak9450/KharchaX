import mongoose from 'mongoose'

/**
 * User-defined and system categories. The 10 global defaults live in
 * `constants/categories.js` and are inserted by `jobs/seedCategories.js` when missing.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [80, 'Category name is too long'],
    },
    icon: {
      type: String,
      required: [true, 'Icon is required'],
      trim: true,
      maxlength: [64, 'Icon key is too long'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Color must be a valid hex value'],
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense', 'both'],
        message: '{VALUE} is not a valid category type',
      },
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

categorySchema.index({ userId: 1, name: 1 }, { unique: true })
categorySchema.index({ userId: 1, isDefault: 1 })

categorySchema.virtual('isSystem').get(function isSystemGetter() {
  return this.userId == null
})

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema)

export default Category
