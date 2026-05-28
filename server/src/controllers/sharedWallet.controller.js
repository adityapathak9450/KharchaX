import mongoose from 'mongoose'
import SharedWallet from '../models/SharedWallet.model.js'
import Wallet from '../models/Wallet.model.js'
import Transaction from '../models/Transaction.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../middleware/error.middleware.js'
import activityService from '../services/activity.service.js'
import {
  assertSharedWalletMember,
  calculateMemberBalances,
  computeSplitShares,
  resolveSharedExpenseCategory,
  roundMoney,
  suggestSettlements,
  toIdString,
} from '../services/sharedWallet.service.js'

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
  wallet: sharedWallet.walletId._id,
  createdAt: { $gte: sharedWallet.sharedStartedAt }
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

  const sharedWallet = await SharedWallet.findById(id)
    .populate('members.userId', 'name email')
    .populate('settlements.fromUser', 'name email')
    .populate('settlements.toUser', 'name email')

  if (!sharedWallet) {
    throw new AppError('Shared wallet not found', 404)
  }

  assertSharedWalletMember(sharedWallet, req.user.id)

  const balancesMap = calculateMemberBalances(sharedWallet)
  const memberBalances = Object.values(balancesMap).map((entry) => ({
    userId: entry.userId,
    name: entry.name,
    balance: roundMoney(entry.balance),
    owes: entry.balance < -0.01 ? roundMoney(Math.abs(entry.balance)) : 0,
    owed: entry.balance > 0.01 ? roundMoney(entry.balance) : 0,
  }))

  const suggestions = suggestSettlements(balancesMap)
  const totalExpenses = roundMoney(
    (sharedWallet.expenses || []).reduce((sum, e) => sum + Number(e.amount), 0)
  )

  const currentUserId = req.user.id.toString()
  const yourBalance = balancesMap[currentUserId]?.balance ?? 0

  console.log(`[shared-wallet] balances id=${id} range=full members=${memberBalances.length}`)

  res.json({
    success: true,
    data: {
      settlements: suggestions,
      memberBalances,
      recordedSettlements: sharedWallet.settlements || [],
      summary: {
        totalExpenses,
        yourBalance: roundMoney(yourBalance),
        yourOwed: yourBalance > 0.01 ? roundMoney(yourBalance) : 0,
        yourOwes: yourBalance < -0.01 ? roundMoney(Math.abs(yourBalance)) : 0,
      },
    },
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

export const addSharedExpense = asyncHandler(async (req, res) => {
  const { id } = req.params
  const {
    amount,
    description,
    paidBy,
    splitBetween,
    paidFromWallet,
    splitType = 'equal',
    splits = [],
  } = req.body

  const expenseAmount = roundMoney(amount)
  if (expenseAmount <= 0) {
    throw new AppError('Amount must be greater than zero', 400)
  }

  const sharedWallet = await SharedWallet.findById(id)
  if (!sharedWallet) {
    throw new AppError('Shared wallet not found', 404)
  }

  assertSharedWalletMember(sharedWallet, req.user.id)

  const payerId = toIdString(paidBy)
  const currentUserId = req.user.id.toString()
  const memberIds = new Set(
    sharedWallet.members.map((m) => toIdString(m.userId))
  )

  if (!memberIds.has(payerId)) {
    throw new AppError('Payer must be a shared wallet member', 400)
  }

  const normalizedSplitBetween = (splitBetween || []).map((memberId) => toIdString(memberId))
  if (normalizedSplitBetween.some((memberId) => !memberIds.has(memberId))) {
    throw new AppError('All split members must belong to this shared wallet', 400)
  }

  const computedSplits = computeSplitShares(
    expenseAmount,
    splitType,
    normalizedSplitBetween,
    splits
  )

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    if (payerId === currentUserId) {
      if (!paidFromWallet) {
        throw new AppError('Paid from wallet is required when you are the payer', 400)
      }

      const wallet = await Wallet.findOne({
        _id: paidFromWallet,
        userId: req.user.id,
        isArchived: false,
      }).session(session)

      if (!wallet) {
        throw new AppError('Wallet not found or access denied', 404)
      }

      if (wallet.balance < expenseAmount) {
        throw new AppError('Insufficient wallet balance', 400)
      }

      wallet.balance = roundMoney(wallet.balance - expenseAmount)
      await wallet.save({ session })

      const categoryId = await resolveSharedExpenseCategory(req.user.id)

      await Transaction.create(
        [
          {
            userId: req.user.id,
            wallet: wallet._id,
            category: categoryId,
            amount: expenseAmount,
            type: 'expense',
            date: new Date(),
            notes: description
              ? `Shared expense: ${description}`
              : `Shared expense in ${sharedWallet.name}`,
            tags: ['shared-expense', `shared-wallet:${id}`],
          },
        ],
        { session, ordered: true }
      )

      console.log(
        `[shared-wallet] expense deducted wallet=${wallet._id} amount=${expenseAmount}`
      )
    }

    sharedWallet.expenses.push({
      amount: expenseAmount,
      description: description || '',
      paidBy: payerId,
      paidFromWallet: payerId === currentUserId ? paidFromWallet : null,
      splitType,
      splits: computedSplits,
      splitBetween: normalizedSplitBetween,
      date: new Date(),
    })

    sharedWallet.totalBalance = roundMoney(
      (sharedWallet.expenses || []).reduce((sum, e) => sum + Number(e.amount), 0)
    )

    await sharedWallet.save({ session })
    await session.commitTransaction()

    const populatedSharedWallet = await SharedWallet.findById(id)
      .populate('walletId', 'name type balance')
      .populate('createdBy', 'name email')
      .populate('members.userId', 'name email')
      .populate('expenses.paidBy', 'name email')

    res.status(201).json({
      success: true,
      message: 'Shared expense added successfully',
      data: { sharedWallet: populatedSharedWallet },
    })
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
})

export const settleSharedPayment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { toUser, amount, fromWallet, toWallet, note } = req.body

  const settleAmount = roundMoney(amount)
  if (settleAmount <= 0) {
    throw new AppError('Settlement amount must be greater than zero', 400)
  }

  const sharedWallet = await SharedWallet.findById(id).populate(
    'members.userId',
    'name email'
  )

  if (!sharedWallet) {
    throw new AppError('Shared wallet not found', 404)
  }

  assertSharedWalletMember(sharedWallet, req.user.id)

  const fromUserId = req.user.id.toString()
  const toUserId = toIdString(toUser)

  if (fromUserId === toUserId) {
    throw new AppError('Cannot settle with yourself', 400)
  }

  const memberIds = new Set(
    sharedWallet.members.map((m) => toIdString(m.userId))
  )
  if (!memberIds.has(toUserId)) {
    throw new AppError('Settlement recipient must be a group member', 400)
  }

  const balancesMap = calculateMemberBalances(sharedWallet)
  const debtorBalance = balancesMap[fromUserId]?.balance ?? 0
  if (debtorBalance >= -0.01) {
    throw new AppError('You have no outstanding balance to settle', 400)
  }
  if (settleAmount > roundMoney(Math.abs(debtorBalance)) + 0.01) {
    throw new AppError('Settlement amount exceeds your outstanding balance', 400)
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const payerWallet = await Wallet.findOne({
      _id: fromWallet,
      userId: req.user.id,
      isArchived: false,
    }).session(session)

    if (!payerWallet) {
      throw new AppError('Payer wallet not found', 404)
    }

    if (payerWallet.balance < settleAmount) {
      throw new AppError('Insufficient balance in payer wallet', 400)
    }

    let receiverWallet = null
    if (toWallet) {
      receiverWallet = await Wallet.findOne({
        _id: toWallet,
        userId: toUserId,
        isArchived: false,
      }).session(session)
    } else {
      receiverWallet = await Wallet.findOne({
        userId: toUserId,
        isArchived: false,
      })
        .sort({ createdAt: 1 })
        .session(session)
    }

    if (!receiverWallet) {
      throw new AppError('Receiver wallet not found', 404)
    }

    payerWallet.balance = roundMoney(payerWallet.balance - settleAmount)
    receiverWallet.balance = roundMoney(receiverWallet.balance + settleAmount)

    await payerWallet.save({ session })
    await receiverWallet.save({ session })

    const payerCategoryId = await resolveSharedExpenseCategory(req.user.id)
    const receiverCategoryId = await resolveSharedExpenseCategory(toUserId)

    const settlementNote =
      note ||
      `Settlement for ${sharedWallet.name}: ${balancesMap[toUserId]?.name || 'member'}`

    await Transaction.create(
      [
        {
          userId: req.user.id,
          wallet: payerWallet._id,
          category: payerCategoryId,
          amount: settleAmount,
          type: 'expense',
          date: new Date(),
          notes: `Shared settlement paid — ${settlementNote}`,
          tags: ['shared-settlement', `shared-wallet:${id}`],
        },
        {
          userId: toUserId,
          wallet: receiverWallet._id,
          category: receiverCategoryId,
          amount: settleAmount,
          type: 'income',
          date: new Date(),
          notes: `Shared settlement received — ${settlementNote}`,
          tags: ['shared-settlement', `shared-wallet:${id}`],
        },
      ],
      { session, ordered: true }
    )

    sharedWallet.settlements.push({
      fromUser: fromUserId,
      toUser: toUserId,
      fromWallet: payerWallet._id,
      toWallet: receiverWallet._id,
      amount: settleAmount,
      settledBy: fromUserId,
      date: new Date(),
      note: settlementNote,
    })

    await sharedWallet.save({ session })
    await session.commitTransaction()

    console.log(
      `[shared-wallet] settlement from=${fromUserId} to=${toUserId} amount=${settleAmount}`
    )

    const balancesAfter = calculateMemberBalances(sharedWallet)
    const suggestions = suggestSettlements(balancesAfter)

    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully',
      data: {
        settlements: suggestions,
        memberBalances: Object.values(balancesAfter),
        recordedSettlements: sharedWallet.settlements,
      },
    })
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
})