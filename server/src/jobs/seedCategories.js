import Category from '../models/Category.model.js'
import { DEFAULT_CATEGORIES } from '../constants/categories.js'

/**
 * Ensures built-in categories exist (userId: null). Safe to call on every server start.
 * Inserts any missing defaults by name (handles partial data or manual deletes).
 */
export async function seedDefaultCategories() {
  const added = []

  for (const c of DEFAULT_CATEGORIES) {
    const exists = await Category.exists({ userId: null, name: c.name, isDefault: true })
    if (exists) continue
    await Category.create({
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      isDefault: true,
      userId: null,
    })
    added.push(c.name)
  }

  const count = await Category.countDocuments({ userId: null, isDefault: true })
  return { seeded: added.length > 0, added, count }
}
