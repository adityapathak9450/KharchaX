import Wallet from '../models/Wallet.model.js'
import Transaction from '../models/Transaction.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../middleware/error.middleware.js'
import activityService from '../services/activity.service.js'

export const getWallets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, search } = req.query

  const skip = (page - 1) * limit

  const query = {
    userId: req.user.id,
    isArchived: false
  }

  if (type) {
    query.type = type
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  /*
    ==================================================
    GET WALLETS
    ==================================================
  */

  const wallets = await Wallet.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean()

  /*
    ==================================================
    ADD TRANSACTION COUNT TO EACH WALLET
    ==================================================
  */

  const walletsWithCounts = await Promise.all(
    wallets.map(async (wallet) => {

      const transactionCount = await Transaction.countDocuments({
        wallet: wallet._id,
        userId: req.user.id
      })

      return {
        ...wallet,
        transactionCount
      }
    })
  )

  /*
    ==================================================
    TOTAL COUNT
    ==================================================
  */

  const total = await Wallet.countDocuments(query)

  /*
    ==================================================
    RESPONSE
    ==================================================
  */

  res.json({
    success: true,
    data: {
      wallets: walletsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

export const getWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isArchived: false
  }).populate('members.userId', 'name email')

  if (!wallet) {
    throw new AppError('Wallet not found', 404)
  }

  res.json({
    success: true,
    data: { wallet }
  })
})

export const createWallet = asyncHandler(async (req, res) => {
  const { name, type, balance = 0, color, icon, description } = req.body

  const wallet = await Wallet.create({
    name,
    type,
    balance,
    color: color || '#6366f1',
    icon: icon || 'wallet',
    description: description || '',
    userId: req.user.id,
    isShared: type === 'shared',
    members: type === 'shared' ? [{ userId: req.user.id, role: 'owner' }] : []
  })

  // Log activity for real-time updates
  await activityService.logWalletActivity(req.user.id, wallet, 'created', {
    initialBalance: balance,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  })

  res.status(201).json({
    success: true,
    message: 'Wallet created successfully',
    data: { wallet }
  })
})

export const updateWallet = asyncHandler(async (req, res) => {
  const updates = { ...req.body }
  delete updates.userId // Prevent user change
  delete updates.isShared // Prevent shared flag change

  const wallet = await Wallet.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user.id,
      isArchived: false
    },
    updates,
    { new: true, runValidators: true }
  )

  if (!wallet) {
    throw new AppError('Wallet not found', 404)
  }

  res.json({
    success: true,
    message: 'Wallet updated successfully',
    data: { wallet }
  })
})

export const deleteWallet = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isArchived: false
  })

  if (!wallet) {
    throw new AppError('Wallet not found', 404)
  }

  // Check if wallet has transactions
  const transactionCount = await Transaction.countDocuments({
    wallet: wallet._id,
    userId: req.user.id
  })

  if (transactionCount > 0) {
    // Archive instead of delete if there are transactions
    wallet.isArchived = true
    await wallet.save()
    
    return res.json({
      success: true,
      message: 'Wallet archived due to existing transactions',
      data: { wallet }
    })
  }

  await Wallet.findByIdAndDelete(wallet._id)

  res.json({
    success: true,
    message: 'Wallet deleted successfully'
  })
})

export const transferFunds = asyncHandler(async (req, res) => {
  const { fromWalletId, toWalletId, amount, notes } = req.body

  if (fromWalletId === toWalletId) {
    throw new AppError('Cannot transfer to the same wallet', 400)
  }

  if (amount <= 0) {
    throw new AppError('Transfer amount must be greater than zero', 400)
  }

  const [fromWallet, toWallet] = await Promise.all([
    Wallet.findOne({
      _id: fromWalletId,
      userId: req.user.id,
      isArchived: false
    }),
    Wallet.findOne({
      _id: toWalletId,
      userId: req.user.id,
      isArchived: false
    })
  ])

  if (!fromWallet || !toWallet) {
    throw new AppError('One or both wallets not found', 404)
  }

  if (fromWallet.balance < amount) {
    throw new AppError('Insufficient balance in source wallet', 400)
  }

  // Update wallet balances
  fromWallet.balance -= amount
  toWallet.balance += amount

  await Promise.all([
    fromWallet.save(),
    toWallet.save()
  ])

  // Create transfer transactions
  const session = await Wallet.startSession()
  session.startTransaction()

  try {
    await Transaction.create([{
      amount,
      type: 'expense',
      category: null, // Transfer category
      wallet: fromWalletId,
      userId: req.user.id,
      notes: notes || `Transfer to ${toWallet.name}`,
      date: new Date(),
      tags: ['transfer']
    }], { session })

    await Transaction.create([{
      amount,
      type: 'income',
      category: null, // Transfer category
      wallet: toWalletId,
      userId: req.user.id,
      notes: notes || `Transfer from ${fromWallet.name}`,
      date: new Date(),
      tags: ['transfer']
    }], { session })

    await session.commitTransaction()

    // Log transfer activity for real-time updates
    await activityService.logTransferActivity(req.user.id, fromWallet, toWallet, amount, {
      notes: notes || `Transfer from ${fromWallet.name} to ${toWallet.name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }

  res.json({
    success: true,
    message: 'Transfer completed successfully',
    data: {
      fromWallet: { balance: fromWallet.balance },
      toWallet: { balance: toWallet.balance }
    }
  })
})

export const getWalletBalance = asyncHandler(async (req, res) => {
  const wallet = await Wallet.findOne({
    _id: req.params.id,
    userId: req.user.id,
    isArchived: false
  }).select('balance name type currency')

  if (!wallet) {
    throw new AppError('Wallet not found', 404)
  }

  res.json({
    success: true,
    data: { 
      wallet: {
        id: wallet._id,
        name: wallet.name,
        type: wallet.type,
        currency: wallet.currency,
        balance: wallet.balance
      }
    }
  })
})

export const getWalletTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, category, startDate, endDate } = req.query
  const skip = (page - 1) * limit

  const query = {
    wallet: req.params.id,
    userId: req.user.id
  }

  if (type) {
    query.type = type
  }

  if (category) {
    query.category = category
  }

  if (startDate || endDate) {
    query.date = {}
    if (startDate) query.date.$gte = new Date(startDate)
    if (endDate) query.date.$lte = new Date(endDate)
  }

  const transactions = await Transaction.find(query)
    .populate('category', 'name color icon')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  const total = await Transaction.countDocuments(query)

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})
