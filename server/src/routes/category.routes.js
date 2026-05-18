import { Router } from 'express';
import Category from '../models/Category.model.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schema for creating categories
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(['income', 'expense', 'both']).default('expense'),
});

// GET /api/categories - Get all categories (defaults + user's custom)
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get default categories and user's custom categories
    const [defaultCategories, userCategories] = await Promise.all([
      Category.find({ isDefault: true }).sort({ name: 1 }),
      Category.find({ userId }).sort({ name: 1 })
    ]);

    const allCategories = [...defaultCategories, ...userCategories];

    res.json({
      success: true,
      data: allCategories
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/categories - Create custom category
router.post('/', async (req, res, next) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    const userId = req.user._id;

    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      name: validatedData.name,
      userId
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      ...validatedData,
      userId,
      isDefault: false
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
});

// DELETE /api/categories/:id - Delete custom category
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find category and ensure it belongs to user and is not default
    const category = await Category.findOne({
      _id: id,
      userId,
      isDefault: false
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be deleted'
      });
    }

    // Check if category is being used by any transactions
    const Transaction = (await import('../models/Transaction.model.js')).default;
    const transactionCount = await Transaction.countDocuments({
      category: id,
      userId
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is being used by transactions'
      });
    }

    await Category.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

export default router;
