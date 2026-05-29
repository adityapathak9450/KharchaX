import mongoose from 'mongoose'
import Budget from '../models/Budget.model.js'
import Transaction from '../models/Transaction.model.js'
import activityService from './activity.service.js'

// Always convert to ObjectId — safe whether input is string or ObjectId already
function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value
  return new mongoose.Types.ObjectId(String(value))
}

class BudgetService {

  async checkBudgets(userId, categoryId, month, year) {
    try {
      // ── Normalise to ObjectId so $match always works ──────────────────────
      const userObjId     = toObjectId(userId)
      const categoryObjId = toObjectId(categoryId)

      const budget = await Budget.findOne({
        userId:   userObjId,
        category: categoryObjId,
        month,
        year,
      }).populate('category', 'name color icon')

      if (!budget) return { alerts: [], budget: null }

      const startDate = new Date(year, month - 1, 1)
      const endDate   = new Date(year, month,     0, 23, 59, 59, 999)

      const totalSpent = await Transaction.aggregate([
        {
          $match: {
            userId:   userObjId,      // ← ObjectId, not string
            category: categoryObjId,  // ← ObjectId, not string
            type: 'expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])

      const spent       = totalSpent[0]?.total ?? 0
      const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      const remaining   = budget.amount - spent

      // ── Update via findByIdAndUpdate — do NOT call save() on a populated doc
      //    (save() after populate() would replace category ObjectId with object)
      await Budget.findByIdAndUpdate(budget._id, {
        spent,
        isExceeded: spent >= budget.amount,
      })

      const alerts = []

      if (utilization >= 100) {
        alerts.push({
          type: 'exceeded', budget, spent, remaining, utilization,
          message: `Budget exceeded! You've spent ${utilization.toFixed(1)}% of ${budget.name}`,
        })
      } else if (utilization >= (budget.alertAt ?? 80)) {
        alerts.push({
          type: 'warning', budget, spent, remaining, utilization,
          message: `Budget warning! You've used ${utilization.toFixed(1)}% of ${budget.name}`,
        })
      } else if (utilization >= 80) {
        alerts.push({
          type: 'near_limit', budget, spent, remaining, utilization,
          message: `Approaching limit: ${utilization.toFixed(1)}% of ${budget.name} used`,
        })
      }

      for (const alert of alerts) {
        await activityService.logBudgetAlert(userId, budget, alert.type, {
          spent, remaining, utilization,
        })
      }

      return { alerts, budget, spent, utilization, remaining }

    } catch (error) {
      console.error('Budget check error:', error)
      return { alerts: [], budget: null }
    }
  }

  async updateAllBudgetSpentAmounts(userId) {
    try {
      const userObjId = toObjectId(userId)
      const budgets   = await Budget.find({ userId: userObjId })
                                    .populate('category', 'name color icon')

      for (const budget of budgets) {
        const startDate     = new Date(budget.year, budget.month - 1, 1)
        const endDate       = new Date(budget.year, budget.month,     0, 23, 59, 59, 999)
        const categoryObjId = toObjectId(budget.category._id)

        const totalSpent = await Transaction.aggregate([
          {
            $match: {
              userId:   userObjId,
              category: categoryObjId,
              type: 'expense',
              date: { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])

        const spent       = totalSpent[0]?.total ?? 0
        const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

        // ── Safe update — no save() on populated doc ──────────────────────
        await Budget.findByIdAndUpdate(budget._id, {
          spent,
          isExceeded: spent >= budget.amount,
        })

        if (utilization >= (budget.alertAt ?? 80)) {
          await activityService.logBudgetAlert(userId, budget, 'warning', {
            spent,
            remaining: budget.amount - spent,
            utilization,
          })
        }
      }

      return { updated: budgets.length }

    } catch (error) {
      console.error('Update budget spent amounts error:', error)
      return { updated: 0 }
    }
  }

  async getBudgetSummary(userId) {
    try {
      const budgets = await Budget.find({ userId: toObjectId(userId) })
        .populate('category', 'name color icon')
        .sort({ year: -1, month: -1 })

      return {
        totalBudgets:    budgets.length,
        totalAllocated:  budgets.reduce((s, b) => s + b.amount, 0),
        totalSpent:      budgets.reduce((s, b) => s + (b.spent || 0), 0),
        activeBudgets:   budgets.filter(b => b.spent < b.amount).length,
        exceededBudgets: budgets.filter(b => b.spent >= b.amount).length,
        budgets: budgets.map(b => ({
          id:          b._id,
          name:        b.name,
          amount:      b.amount,
          spent:       b.spent || 0,
          remaining:   b.amount - (b.spent || 0),
          utilization: b.amount > 0 ? ((b.spent || 0) / b.amount) * 100 : 0,
          category:    b.category,
          month:       b.month,
          year:        b.year,
          alertAt:     b.alertAt,
          isExceeded:  (b.spent || 0) >= b.amount,
          isWarning:   (b.spent || 0) >= (b.amount * (b.alertAt ?? 80) / 100),
        })),
      }

    } catch (error) {
      console.error('Budget summary error:', error)
      return { totalBudgets: 0, totalAllocated: 0, totalSpent: 0,
               activeBudgets: 0, exceededBudgets: 0, budgets: [] }
    }
  }

  async getBudgetPerformance(userId, months = 6) {
    try {
      const endDate   = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const performance = await Budget.aggregate([
        { $match: { userId: toObjectId(userId), createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id:          { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            totalBudget:  { $sum: '$amount' },
            totalSpent:   { $sum: '$spent'  },
            budgetCount:  { $sum: 1         },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ])

      return performance.map(p => ({
        year:        p._id.year,
        month:       p._id.month,
        totalBudget: p.totalBudget,
        totalSpent:  p.totalSpent,
        totalSaved:  p.totalBudget - p.totalSpent,
        budgetCount: p.budgetCount,
        utilization: p.totalBudget > 0 ? (p.totalSpent / p.totalBudget) * 100 : 0,
      }))

    } catch (error) {
      console.error('Budget performance error:', error)
      return []
    }
  }
}

export default new BudgetService()