import User from '../models/User.model.js'
import Wallet from '../models/Wallet.model.js'
import Category from '../models/Category.model.js'
import Transaction from '../models/Transaction.model.js'
import Budget from '../models/Budget.model.js'
import RecurringPayment from '../models/RecurringPayment.model.js'
import SharedWallet from '../models/SharedWallet.model.js'
import Notification from '../models/Notification.model.js'
import ActivityLog from '../models/ActivityLog.model.js'
import Report from '../models/Report.model.js'

const DEV_EMAIL = 'dev@vaultx.test'
const DEV_PASSWORD = 'DevUser123!'

/**
 * Optional dev dataset for frontend work. Enable with SEED_DEV=true in server/.env
 */
export async function seedDevData() {
  if (process.env.SEED_DEV !== 'true') {
    return { skipped: true }
  }

  const existing = await User.findOne({ email: DEV_EMAIL })
  if (existing) {
    return { skipped: true, reason: 'user_exists' }
  }

  const food = await Category.findOne({ userId: null, name: 'Food' })
  const salary = await Category.findOne({ userId: null, name: 'Salary' })
  const bills = await Category.findOne({ userId: null, name: 'Bills' })
  if (!food || !salary || !bills) {
    console.warn('[seed] Default categories missing; run category seed first.')
    return { skipped: true, reason: 'no_categories' }
  }

  const user = await User.create({
    name: 'Dev User',
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
    isVerified: true,
    currency: 'INR',
    theme: 'system',
    preferences: { notifications: true, weekStartsOn: 1 },
  })

  const mainWallet = await Wallet.create({
    name: 'Main Bank',
    type: 'bank',
    balance: 125000.5,
    color: '#6366f1',
    icon: 'landmark',
    userId: user._id,
    currency: 'INR',
    description: 'Primary operating account',
  })

  const cashWallet = await Wallet.create({
    name: 'Cash',
    type: 'cash',
    balance: 3500,
    color: '#22c55e',
    icon: 'wallet',
    userId: user._id,
    currency: 'INR',
  })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const insertedTxs = await Transaction.insertMany([
    {
      amount: 85000,
      type: 'income',
      category: salary._id,
      wallet: mainWallet._id,
      userId: user._id,
      tags: ['payroll'],
      notes: 'Monthly salary',
      date: monthStart,
    },
    {
      amount: 1200,
      type: 'expense',
      category: food._id,
      wallet: mainWallet._id,
      userId: user._id,
      tags: ['groceries'],
      notes: 'Weekly groceries',
      date: new Date(monthStart.getTime() + 2 * 86400000),
    },
    {
      amount: 4500,
      type: 'expense',
      category: bills._id,
      wallet: mainWallet._id,
      userId: user._id,
      tags: ['utilities'],
      notes: 'Electricity bill',
      date: new Date(monthStart.getTime() + 5 * 86400000),
    },
  ])

  await Budget.create({
    name: 'Food — monthly',
    amount: 15000,
    spent: 1200,
    category: food._id,
    userId: user._id,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    alertAt: 80,
    isExceeded: false,
    color: food.color,
  })

  const nextDue = new Date(now.getTime() + 7 * 86400000)
  await RecurringPayment.create({
    name: 'Rent',
    amount: 18000,
    type: 'expense',
    category: bills._id,
    wallet: mainWallet._id,
    userId: user._id,
    frequency: 'monthly',
    nextDueDate: nextDue,
    lastProcessed: null,
    isActive: true,
    reminderDays: 5,
  })

  const shared = await SharedWallet.create({
    name: 'Flatmates fund',
    walletId: cashWallet._id,
    createdBy: user._id,
    members: [
      { userId: user._id, role: 'owner', joinedAt: now, totalContributed: 2000 },
    ],
    totalBalance: 2000,
    expenses: [
      {
        amount: 800,
        description: 'House supplies',
        paidBy: user._id,
        splitBetween: [user._id],
        date: now,
      },
    ],
  })

  await Notification.insertMany([
    {
      userId: user._id,
      title: 'Welcome to VaultX',
      message: 'Your dev workspace is ready with sample wallets and transactions.',
      type: 'system',
      isRead: false,
      relatedId: user._id,
      relatedModel: 'User',
    },
    {
      userId: user._id,
      title: 'Budget headroom',
      message: 'You are at 8% of your Food budget for this month.',
      type: 'system',
      isRead: false,
      relatedId: mainWallet._id,
      relatedModel: 'Wallet',
    },
  ])

  await ActivityLog.insertMany([
    {
      userId: user._id,
      action: 'wallet.created',
      entity: 'wallet',
      entityId: mainWallet._id,
      metadata: { name: mainWallet.name },
      ip: '127.0.0.1',
      userAgent: 'VaultX-Seed/1.0',
    },
    {
      userId: user._id,
      action: 'transaction.created',
      entity: 'transaction',
      entityId: insertedTxs[1]._id,
      metadata: { amount: 1200, type: 'expense' },
      ip: '127.0.0.1',
      userAgent: 'VaultX-Seed/1.0',
    },
  ])

  await Report.create({
    userId: user._id,
    type: 'monthly',
    period: { month: now.getMonth() + 1, year: now.getFullYear() },
    fileUrl: null,
    status: 'pending',
    filters: { walletIds: [mainWallet._id] },
    generatedAt: null,
  })

  return {
    skipped: false,
    user: { email: DEV_EMAIL, password: DEV_PASSWORD },
    walletIds: [mainWallet._id, cashWallet._id],
    sharedWalletId: shared._id,
  }
}
