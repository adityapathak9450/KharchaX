import Budget from '../models/Budget.model.js'
import Transaction from '../models/Transaction.model.js'
import Category from '../models/Category.model.js'
import activityService from './activity.service.js'

class BudgetService {
  async checkBudgets(userId, categoryId, month, year) {
    try {
      // Find budget for this category, month, and year
      const budget = await Budget.findOne({
        userId,
        category: categoryId,
        month,
        year
      }).populate('category', 'name color icon')

      if (!budget) {
        return { alerts: [], budget: null }
      }

      // Calculate total spent for this category in the month
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)

      const totalSpent = await Transaction.aggregate([
        {
          $match: {
            userId,
            category: categoryId,
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

      const spent = totalSpent.length > 0 ? totalSpent[0].total : 0
      const utilization = (spent / budget.amount) * 100
      const remaining = budget.amount - spent

      // Update budget spent amount
      budget.spent = spent
      await budget.save()

      const alerts = []

      // Check for different alert levels
      if (utilization >= 100) {
        alerts.push({
          type: 'exceeded',
          budget,
          spent,
          remaining,
          utilization,
          message: `Budget exceeded! You've spent ${utilization.toFixed(1)}% of ${budget.name}`
        })
      } else if (utilization >= budget.alertAt) {
        alerts.push({
          type: 'warning',
          budget,
          spent,
          remaining,
          utilization,
          message: `Budget warning! You've spent ${utilization.toFixed(1)}% of ${budget.name}`
        })
      } else if (utilization >= 80) {
        alerts.push({
          type: 'near_limit',
          budget,
          spent,
          remaining,
          utilization,
          message: `Budget limit approaching! You've spent ${utilization.toFixed(1)}% of ${budget.name}`
        })
      }

      // Log budget alerts if any
      if (alerts.length > 0) {
        for (const alert of alerts) {
          await activityService.logBudgetAlert(userId, budget, alert.type, {
            spent,
            remaining,
            utilization
          })
        }
      }

      return { alerts, budget, spent, utilization, remaining }

    } catch (error) {
      console.error('Budget check error:', error)
      return { alerts: [], budget: null }
    }
  }

  async updateAllBudgetSpentAmounts(userId) {
    try {
      const budgets = await Budget.find({ userId }).populate('category', 'name color icon')
      
      for (const budget of budgets) {
        const startDate = new Date(budget.year, budget.month - 1, 1)
        const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59, 999)

        const totalSpent = await Transaction.aggregate([
          {
            $match: {
              userId,
              category: budget.category._id,
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

        const spent = totalSpent.length > 0 ? totalSpent[0].total : 0
        budget.spent = spent
        await budget.save()

        // Check for alerts
        const utilization = (spent / budget.amount) * 100
        if (utilization >= budget.alertAt) {
          await activityService.logBudgetAlert(userId, budget, 'warning', {
            spent,
            remaining: budget.amount - spent,
            utilization
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
      const budgets = await Budget.find({ userId })
        .populate('category', 'name color icon')
        .sort({ year: -1, month: -1 })

      const summary = {
        totalBudgets: budgets.length,
        totalAllocated: budgets.reduce((sum, b) => sum + b.amount, 0),
        totalSpent: budgets.reduce((sum, b) => sum + (b.spent || 0), 0),
        activeBudgets: budgets.filter(b => b.spent < b.amount).length,
        exceededBudgets: budgets.filter(b => b.spent >= b.amount).length,
        budgets: budgets.map(budget => ({
          id: budget._id,
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent || 0,
          remaining: budget.amount - (budget.spent || 0),
          utilization: budget.amount > 0 ? ((budget.spent || 0) / budget.amount) * 100 : 0,
          category: budget.category,
          month: budget.month,
          year: budget.year,
          alertAt: budget.alertAt,
          isExceeded: (budget.spent || 0) >= budget.amount,
          isWarning: (budget.spent || 0) >= (budget.amount * budget.alertAt / 100)
        }))
      }

      return summary

    } catch (error) {
      console.error('Budget summary error:', error)
      return {
        totalBudgets: 0,
        totalAllocated: 0,
        totalSpent: 0,
        activeBudgets: 0,
        exceededBudgets: 0,
        budgets: []
      }
    }
  }

  async getBudgetPerformance(userId, months = 6) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      const performance = await Budget.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$year' },
              month: { $month: '$month' }
            },
            totalBudget: { $sum: '$amount' },
            totalSpent: { $sum: '$spent' },
            budgetCount: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ])

      return performance.map(p => ({
        year: p._id.year,
        month: p._id.month,
        totalBudget: p.totalBudget,
        totalSpent: p.totalSpent,
        totalSaved: p.totalBudget - p.totalSpent,
        budgetCount: p.budgetCount,
        utilization: p.totalBudget > 0 ? (p.totalSpent / p.totalBudget) * 100 : 0
      }))

    } catch (error) {
      console.error('Budget performance error:', error)
      return []
    }
  }
}

export default new BudgetService()
