import SharedWallet from '../models/SharedWallet.model.js'
import Wallet from '../models/Wallet.model.js'
import Transaction from '../models/Transaction.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../middleware/error.middleware.js'
import activityService from '../services/activity.service.js'

export const getSharedWallets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const skip = (page - 1) * limit

  const sharedWallets = await SharedWallet.find({
    $or: [
      { createdBy: req.user.id },
      { 'members.userId': req.user.id }
    ]
  })
    .populate('walletId', 'name type balance')
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  const total = await SharedWallet.countDocuments({
    $or: [
      { createdBy: req.user.id },
      { 'members.userId': req.user.id }
    ]
  })

  res.json({
    success: true,
    data: {
      sharedWallets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

export const createSharedWallet = asyncHandler(async (req, res) => {
  const { name, walletId } = req.body

  // Check if wallet exists and belongs to user
  const wallet = await Wallet.findOne({
    _id: walletId,
    userId: req.user.id
  })

  if (!wallet) {
    throw new AppError('Wallet not found or you don\'t have permission', 404)
  }

  // Make wallet shared
  wallet.isShared = true

  // Add owner to wallet members if not already added
  const ownerExists = wallet.members.some(
    member => member.userId.toString() === req.user.id
  )

  if (!ownerExists) {
    wallet.members.push({
      userId: req.user.id,
      role: 'owner'
    })
  }

  await wallet.save()

  // Create shared wallet document
  const sharedWallet = await SharedWallet.create({
    name,
    walletId,
    createdBy: req.user.id,
    members: [
      {
        userId: req.user.id,
        role: 'owner'
      }
    ]
  })

  // Log activity
  try {
    await activityService.logActivity(
      req.user.id,
      'created_shared_wallet',
      'sharedWallet',
      sharedWallet._id,
      {
        walletName: wallet.name,
        sharedWalletName: name
      }
    )
  } catch (error) {
    console.error('Activity log failed:', error.message)
  }

  const populatedSharedWallet = await SharedWallet.findById(sharedWallet._id)
    .populate('walletId', 'name type balance')
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email')

  res.status(201).json({
    success: true,
    message: 'Shared wallet created successfully',
    data: {
      sharedWallet: populatedSharedWallet
    }
  })
})

export const joinSharedWallet = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body

  const sharedWallet = await SharedWallet.findOne({ inviteCode })
    .populate('walletId', 'name type balance')

  if (!sharedWallet) {
    throw new AppError('Invalid invite code', 404)
  }

  // Check if user is already a member
  const isMember = sharedWallet.members.some(
    member => member.userId.toString() === req.user.id
  )

  if (isMember) {
    throw new AppError('You are already a member of this shared wallet', 400)
  }

  // Add user as member
  sharedWallet.members.push({
    userId: req.user.id,
    role: 'viewer'
  })

  await sharedWallet.save()
 const wallet = await Wallet.findById(sharedWallet.walletId._id);

wallet.members.push({
  userId: req.user.id,
  role: 'viewer'
});

await wallet.save();

  // Log activity
  await activityService.logActivity(req.user.id, 'joined_shared_wallet', 'wallet', sharedWallet._id, {
    sharedWalletName: sharedWallet.name
  })

  res.json({
    success: true,
    message: 'Joined shared wallet successfully',
    data: { sharedWallet }
  })
})

export const addMemberToSharedWallet = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { userId, role = 'member' } = req.body

  const sharedWallet = await SharedWallet.findOne({
    _id: id,
    createdBy: req.user.id
  })

  if (!sharedWallet) {
    throw new AppError('Shared wallet not found or you don\'t have permission', 404)
  }

  // Check if user is already a member
  const isMember = sharedWallet.members.some(
    member => member.userId.toString() === userId
  )

  if (isMember) {
    throw new AppError('User is already a member', 400)
  }

sharedWallet.members.push({ userId, role })
await sharedWallet.save()

// ALSO add to actual wallet
const wallet = await Wallet.findById(sharedWallet.walletId)

const alreadyExists = wallet.members.some(
  member => member.userId.toString() === userId
)

if (!alreadyExists) {
  wallet.members.push({
    userId,
    role
  })

  await wallet.save()
}

  // Log activity
  await activityService.logActivity(req.user.id, 'added_member_shared_wallet', 'wallet', sharedWallet._id, {
    sharedWalletName: sharedWallet.name,
    addedUserId: userId
  })

  res.json({
    success: true,
    message: 'Member added successfully',
    data: { sharedWallet }
  })
})

export const removeMemberFromSharedWallet = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params

  const sharedWallet = await SharedWallet.findOne({
    _id: id,
    createdBy: req.user.id
  })

  if (!sharedWallet) {
    throw new AppError('Shared wallet not found or you don\'t have permission', 404)
  }

  // Can't remove owner
  const memberToRemove = sharedWallet.members.find(
    member => member.userId.toString() === memberId
  )

  if (!memberToRemove) {
    throw new AppError('Member not found', 404)
  }

  if (memberToRemove.role === 'owner') {
    throw new AppError('Cannot remove owner from shared wallet', 400)
  }

  sharedWallet.members = sharedWallet.members.filter(
    member => member.userId.toString() !== memberId
  )

  await sharedWallet.save()
  // Remove from actual wallet too
const wallet = await Wallet.findById(sharedWallet.walletId)

wallet.members = wallet.members.filter(
  member => member.userId.toString() !== memberId
)

await wallet.save()

  // Log activity
  await activityService.logActivity(req.user.id, 'removed_member_shared_wallet', 'wallet', sharedWallet._id, {
    sharedWalletName: sharedWallet.name,
    removedUserId: memberId
  })

  res.json({
    success: true,
    message: 'Member removed successfully',
    data: { sharedWallet }
  })
})

export const getSharedWalletTransactions = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { page = 1, limit = 20 } = req.query
  const skip = (page - 1) * limit

  // Check if user is member of shared wallet
  const sharedWallet = await SharedWallet.findOne({
    _id: id,
    $or: [
      { createdBy: req.user.id },
      { 'members.userId': req.user.id }
    ]
  }).populate('walletId')
  .populate('members.userId', 'name email')

  if (!sharedWallet) {
    throw new AppError('Shared wallet not found or access denied', 404)
  }

  const transactions = await Transaction.find({
    wallet: sharedWallet.walletId._id
  })
    .populate('category', 'name color icon')
    .populate('userId', 'name email')
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  const total = await Transaction.countDocuments({
    wallet: sharedWallet.walletId._id
  })

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

export const getSharedWalletSettlements = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Check if user is member of shared wallet
  const sharedWallet = await SharedWallet.findOne({
    _id: id,
    $or: [
      { createdBy: req.user.id },
      { 'members.userId': req.user.id }
    ]
  }).populate('walletId')
  .populate('members.userId', 'name email')

  if (!sharedWallet) {
    throw new AppError('Shared wallet not found or access denied', 404)
  }

  // Calculate settlements based on transactions
  const transactions = await Transaction.find({
    wallet: sharedWallet.walletId._id,
    type: 'expense'
  }).populate('userId', 'name email')

  const settlements = {}
  const totalExpenses = {}

  // Calculate each member's share
  transactions.forEach(transaction => {
    const userId = transaction.userId._id.toString()
    const amount = transaction.amount

    if (!totalExpenses[userId]) {
      totalExpenses[userId] = 0
    }
    totalExpenses[userId] += amount
  })

  // Calculate settlements (simplified - equal split)
  const memberCount = sharedWallet.members.length
  const totalAmount = Object.values(totalExpenses).reduce((sum, amount) => sum + amount, 0)
  const perPersonShare = totalAmount / memberCount

  sharedWallet.members.forEach(member => {
    const userId = member.userId.toString()
    const userTotal = totalExpenses[userId] || 0
    const balance = userTotal - perPersonShare

    if (balance !== 0) {
      settlements[userId] = {
        userId,
        userName: member.userId.name || 'Unknown',
        balance,
        shouldReceive: balance > 0 ? balance : 0,
shouldPay: balance < 0 ? Math.abs(balance) : 0
      }
    }
  })

  res.json({
    success: true,
    data: { settlements }
  })
})

export const getSharedWalletById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const sharedWallet = await SharedWallet.findOne({
    _id: id,
    $or: [
      { createdBy: req.user.id },
      { 'members.userId': req.user.id }
    ]
  })
    .populate('walletId', 'name type balance')
    .populate('createdBy', 'name email')
    .populate('members.userId', 'name email')

  if (!sharedWallet) {
    throw new AppError('Shared wallet not found', 404)
  }

  res.json({
    success: true,
    data: {
      sharedWallet
    }
  })
})