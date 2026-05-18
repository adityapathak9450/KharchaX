import ActivityLog from '../models/ActivityLog.model.js'
import { getIO } from '../sockets/index.js'

class ActivityService {
  constructor() {
    this.io = null
  }

  getIO() {
    if (!this.io) {
      try {
        this.io = getIO()
      } catch (error) {
        // Socket not initialized yet, will try again later
        console.warn('Socket.io not initialized yet')
      }
    }
    return this.io
  }

  async logActivity(userId, action, entity, entityId, metadata = {}) {
    try {
      const activity = await ActivityLog.create({
        userId,
        action,
        entity,
        entityId,
        metadata,
        ip: metadata.ip || null,
        userAgent: metadata.userAgent || null
      })

      // Emit real-time update to user's socket
      const io = this.getIO()
      if (io && userId) {
        io.to(userId.toString()).emit('activity:new', {
          id: activity._id,
          action,
          entity,
          entityId,
          metadata,
          createdAt: activity.createdAt
        })
      }

      return activity
    } catch (error) {
      console.error('Activity logging error:', error)
      throw error
    }
  }

  async logTransactionActivity(userId, transaction, action) {
    const metadata = {
      amount: transaction.amount,
      type: transaction.type,
      walletName: transaction.wallet?.name || 'Unknown',
      categoryName: transaction.category?.name || 'Uncategorized',
      notes: transaction.notes
    }

    await this.logActivity(
      userId,
      action,
      'transaction',
      transaction._id,
      metadata
    )

    // Emit specific transaction events
    const io = this.getIO()
    if (io && userId) {
      io.to(userId.toString()).emit('transaction:updated', {
        action,
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          wallet: transaction.wallet,
          category: transaction.category,
          date: transaction.date
        }
      })
    }
  }

  async logWalletActivity(userId, wallet, action, metadata = {}) {
    const activityMetadata = {
      walletName: wallet.name,
      walletType: wallet.type,
      balance: wallet.balance,
      ...metadata
    }

    await this.logActivity(
      userId,
      action,
      'wallet',
      wallet._id,
      activityMetadata
    )

    // Emit specific wallet events
    const io = this.getIO()
    if (io && userId) {
      io.to(userId.toString()).emit('wallet:updated', {
        action,
        wallet: {
          id: wallet._id,
          name: wallet.name,
          type: wallet.type,
          balance: wallet.balance
        }
      })
    }
  }

  async logBudgetActivity(userId, budget, action, metadata = {}) {
    const activityMetadata = {
      budgetName: budget.name,
      amount: budget.amount,
      spent: budget.spent,
      category: budget.category?.name || 'Uncategorized',
      ...metadata
    }

    await this.logActivity(
      userId,
      action,
      'budget',
      budget._id,
      activityMetadata
    )

    // Emit specific budget events
    const io = this.getIO()
    if (io && userId) {
      io.to(userId.toString()).emit('budget:updated', {
        action,
        budget: {
          id: budget._id,
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent,
          category: budget.category
        }
      })
    }
  }

  async logBudgetAlert(userId, budget, alertType, metadata = {}) {
    const alertMetadata = {
      budgetName: budget.name,
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.amount - budget.spent,
      utilization: ((budget.spent / budget.amount) * 100).toFixed(1),
      alertType,
      ...metadata
    }

    await this.logActivity(
      userId,
      `budget_alert_${alertType}`,
      'budget',
      budget._id,
      alertMetadata
    )

    // Emit budget alert events
    const io = this.getIO()
    if (io && userId) {
      io.to(userId.toString()).emit('budget:alert', {
        type: alertType,
        budget: {
          id: budget._id,
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent,
          remaining: budget.amount - budget.spent,
          utilization: ((budget.spent / budget.amount) * 100).toFixed(1)
        }
      })
    }
  }

  async logTransferActivity(userId, fromWallet, toWallet, amount, metadata = {}) {
    const transferMetadata = {
      amount,
      fromWalletName: fromWallet.name,
      toWalletName: toWallet.name,
      fromWalletBalance: fromWallet.balance,
      toWalletBalance: toWallet.balance,
      ...metadata
    }

    await this.logActivity(
      userId,
      'wallet_transfer',
      'wallet',
      fromWallet._id,
      transferMetadata
    )

    // Emit transfer events
    if (this.io && userId) {
      this.io.to(userId.toString()).emit('wallet:transfer', {
        fromWallet: {
          id: fromWallet._id,
          name: fromWallet.name,
          balance: fromWallet.balance
        },
        toWallet: {
          id: toWallet._id,
          name: toWallet.name,
          balance: toWallet.balance
        },
        amount
      })
    }
  }

  async getRecentActivities(userId, limit = 20) {
    return await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('entityId')
  }
}

export default new ActivityService()
