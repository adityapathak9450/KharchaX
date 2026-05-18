import Budget from '../models/Budget.model.js'
import Transaction from '../models/Transaction.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../middleware/error.middleware.js'
import activityService from '../services/activity.service.js'
import { notificationService } from '../services/notification.service.js'

export const getBudgets = asyncHandler(async (req, res) => {
  const { year, month, category } = req.query
  
  const query = { userId: req.user.id }
  
  if (year) query.year = parseInt(year)
  if (month) query.month = parseInt(month)
  if (category) query.category = category

  const budgets = await Budget.find(query)
    .populate('category', 'name color icon')
    .sort({ year: -1, month: -1, name: 1 })

  res.json({
    success: true,
    data: { budgets }
  })
})

export const getBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({
    _id: req.params.id,
    userId: req.user.id
  }).populate('category', 'name color icon')

  if (!budget) {
    throw new AppError('Budget not found', 404)
  }

  res.json({
    success: true,
    data: { budget }
  })
})

export const createBudget = asyncHandler(async (req, res) => {
  const { name, amount, category, month, year, alertAt = 80, color } = req.body

  // Check if budget already exists for this category, month, and year
  const existingBudget = await Budget.findOne({
    userId: req.user.id,
    category,
    month,
    year
  })

  if (existingBudget) {
    throw new AppError('Budget already exists for this category in the selected month', 409)
  }

  const budget = await Budget.create({
    name,
    amount,
    category,
    month,
    year,
    alertAt,
    color: color || '#6366f1',
    userId: req.user.id
  })

  // Calculate current spent amount
  await updateBudgetSpentAmount(budget._id)

  const populatedBudget = await Budget.findById(budget._id).populate(
    'category',
    'name color icon'
  )

  // Log activity for real-time updates
  await activityService.logBudgetActivity(req.user.id, populatedBudget, 'created', {
    initialAmount: amount,
    alertThreshold: alertAt,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })

  res.status(201).json({
    success: true,
    message: 'Budget created successfully',
    data: { budget: populatedBudget }
  })
})

export const updateBudget = asyncHandler(async (req, res) => {
  const updates = { ...req.body }
  delete updates.userId // Prevent user change
  delete updates.spent // Prevent manual spent amount change

  const budget = await Budget.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user.id
    },
    updates,
    { new: true, runValidators: true }
  ).populate('category', 'name color icon')

  if (!budget) {
    throw new AppError('Budget not found', 404)
  }

  // Recalculate spent amount if month/year changed
  if (updates.month || updates.year) {
    await updateBudgetSpentAmount(budget._id)
  }

  res.json({
    success: true,
    message: 'Budget updated successfully',
    data: { budget }
  })
})

export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  })

  if (!budget) {
    throw new AppError('Budget not found', 404)
  }

  res.json({
    success: true,
    message: 'Budget deleted successfully'
  })
})

export const getBudgetSummary = asyncHandler(async (req, res) => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const budgets = await Budget.find({
    userId: req.user.id,
    month: currentMonth,
    year: currentYear
  }).populate('category', 'name color icon')

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const remainingBudget = totalBudget - totalSpent
  const utilizationPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const exceededBudgets = budgets.filter(budget => budget.isExceeded)
  const alertingBudgets = budgets.filter(budget => budget.shouldAlert && !budget.isExceeded)

  res.json({
    success: true,
    data: {
      summary: {
        totalBudget,
        totalSpent,
        remainingBudget,
        utilizationPercent,
        budgetsCount: budgets.length,
        exceededCount: exceededBudgets.length,
        alertingCount: alertingBudgets.length
      },
      budgets,
      exceededBudgets,
      alertingBudgets
    }
  })
})

export const updateBudgetSpent = asyncHandler(async (req, res) => {
  const budget = await Budget.findOne({
    _id: req.params.id,
    userId: req.user.id
  })

  if (!budget) {
    throw new AppError('Budget not found', 404)
  }

  await updateBudgetSpentAmount(budget._id)

  const updatedBudget = await Budget.findById(budget._id).populate(
    'category',
    'name color icon'
  )

  res.json({
    success: true,
    message: 'Budget spent amount updated',
    data: { budget: updatedBudget }
  })
})

// Helper function to update budget spent amount
async function updateBudgetSpentAmount(budgetId) {
  const budget = await Budget.findById(budgetId)
  if (!budget) return

  // Calculate total spent for this budget's category, month, and year
  const startDate = new Date(budget.year, budget.month - 1, 1)
  const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59, 999)

  const totalSpent = await Transaction.aggregate([
    {
      $match: {
        userId: budget.userId,
        category: budget.category,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ])

  const spentAmount = totalSpent.length > 0 ? totalSpent[0].total : 0
  const isExceeded = spentAmount > budget.amount

  if (isExceeded && !budget.isExceeded) {
    await notificationService.createAndEmitNotification({
      userId: budget.userId,
      type: 'budget_exceeded',
      title: 'Budget Exceeded',
      message: `You have exceeded your budget for ${budget.name || 'this category'}`,
      data: { budgetId: budget._id, spent: spentAmount, limit: budget.amount }
    });
  }

  await Budget.findByIdAndUpdate(budgetId, {
    spent: spentAmount,
    isExceeded
  })
}
