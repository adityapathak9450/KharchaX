import RecurringPayment from '../models/RecurringPayment.model.js'
import Transaction from '../models/Transaction.model.js'
import Wallet from '../models/Wallet.model.js'
import mongoose from 'mongoose'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../middleware/error.middleware.js'
import activityService from '../services/activity.service.js'
import { emitRecurringDue } from '../sockets/socketEmitter.js'

// Helper: calculate next due date based on frequency
function calculateNextDueDate(currentDate, frequency) {
  const next = new Date(currentDate)
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
    default:
      throw new Error(`Invalid frequency: ${frequency}`)
  }
  return next
}

export const getRecurringPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive, frequency } = req.query
  const skip = (page - 1) * limit

  const filter = { userId: req.user.id }
  if (isActive !== undefined) filter.isActive = isActive === 'true'
  if (frequency) filter.frequency = frequency

  const recurringPayments = await RecurringPayment.find(filter)
    .populate('category', 'name color icon')
    .populate('wallet', 'name type')
    .sort({ nextDueDate: 1 })
    .skip(skip)
    .limit(parseInt(limit))

  const total = await RecurringPayment.countDocuments(filter)

  res.json({
    success: true,
    data: {
      recurringPayments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

export const createRecurringPayment = asyncHandler(async (req, res) => {
  console.log("=== CREATE RECURRING PAYMENT BODY ===")
  console.log(req.body)

  console.log("=== USER ===")
  console.log(req.user)

  const { name, amount, type, category, wallet, frequency, nextDueDate, reminderDays } = req.body

  // Convert amount to number
  const amountNum = parseFloat(amount)

  console.log("=== VALIDATED DATA ===")
  console.log({
    name,
    amount: amountNum,
    type,
    category,
    wallet,
    frequency,
    nextDueDate,
    reminderDays
  })

  // Verify wallet belongs to user
  const walletDoc = await Wallet.findOne({ _id: wallet, userId: req.user.id })
  if (!walletDoc) {
    throw new AppError('Wallet not found or access denied', 404)
  }

  const recurringPayment = await RecurringPayment.create({
    name,
    amount: amountNum,
    type,
    category,
    wallet,
    userId: req.user.id,
    frequency,
    nextDueDate: new Date(nextDueDate),
    reminderDays: reminderDays || 3
  })

  // Log activity
  await activityService.logActivity(req.user.id, 'created_recurring_payment', 'recurring', recurringPayment._id, {
    name,
    amount,
    frequency
  })

  const populated = await RecurringPayment.findById(recurringPayment._id)
    .populate('category', 'name color icon')
    .populate('wallet', 'name type')

  res.status(201).json({
    success: true,
    message: 'Recurring payment created successfully',
    data: { recurringPayment: populated }
  })
})

export const updateRecurringPayment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updates = req.body

  const recurringPayment = await RecurringPayment.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    updates,
    { new: true, runValidators: true }
  ).populate('category', 'name color icon')
    .populate('wallet', 'name type')

  if (!recurringPayment) {
    throw new AppError('Recurring payment not found', 404)
  }

  // Log activity
  await activityService.logActivity(req.user.id, 'updated_recurring_payment', 'recurring', id, {
    name: recurringPayment.name
  })

  res.json({
    success: true,
    message: 'Recurring payment updated successfully',
    data: { recurringPayment }
  })
})

export const pauseResumeRecurringPayment = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { isActive } = req.body

  const recurringPayment = await RecurringPayment.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { isActive },
    { new: true }
  ).populate('category', 'name color icon')
    .populate('wallet', 'name type')

  if (!recurringPayment) {
    throw new AppError('Recurring payment not found', 404)
  }

  await activityService.logActivity(req.user.id, isActive ? 'resumed_recurring_payment' : 'paused_recurring_payment', 'recurring', id, {
    name: recurringPayment.name
  })

  res.json({
    success: true,
    message: `Recurring payment ${isActive ? 'resumed' : 'paused'} successfully`,
    data: { recurringPayment }
  })
})

export const markAsPaid = asyncHandler(async (req, res) => {
  const { id } = req.params

  const recurringPayment = await RecurringPayment.findOne({ _id: id, userId: req.user.id })
  if (!recurringPayment) {
    throw new AppError('Recurring payment not found', 404)
  }

  // Create transaction
  const transaction = await Transaction.create({
    userId: req.user.id,
    wallet: recurringPayment.wallet,
    category: recurringPayment.category,
    amount: recurringPayment.amount,
    type: recurringPayment.type,
    description: `${recurringPayment.name} (Recurring)`,
    date: new Date()
  })

  // Update wallet balance
  const wallet = await Wallet.findById(recurringPayment.wallet)
  if (wallet) {
    if (recurringPayment.type === 'income') {
      wallet.balance += recurringPayment.amount
    } else {
      wallet.balance -= recurringPayment.amount
    }
    await wallet.save()
  }

  // Update recurring payment
  recurringPayment.lastProcessed = new Date()
  recurringPayment.nextDueDate = calculateNextDueDate(new Date(), recurringPayment.frequency)
  await recurringPayment.save()

  // Log activity
  await activityService.logActivity(req.user.id, 'paid_recurring_payment', 'recurringPayment', id, {
    name: recurringPayment.name,
    amount: recurringPayment.amount
  })

  const populated = await RecurringPayment.findById(id)
    .populate('category', 'name color icon')
    .populate('wallet', 'name type')

  res.json({
    success: true,
    message: 'Payment marked as paid and transaction created',
    data: { recurringPayment: populated, transaction }
  })
})

export const skipOccurrence = asyncHandler(async (req, res) => {
  const { id } = req.params

  const recurringPayment = await RecurringPayment.findOne({ _id: id, userId: req.user.id })
  if (!recurringPayment) {
    throw new AppError('Recurring payment not found', 404)
  }

  // Skip to next occurrence
  recurringPayment.nextDueDate = calculateNextDueDate(recurringPayment.nextDueDate, recurringPayment.frequency)
  await recurringPayment.save()

  await activityService.logActivity(req.user.id, 'skipped_recurring_payment', 'recurring', id, {
    name: recurringPayment.name
  })

  const populated = await RecurringPayment.findById(id)
    .populate('category', 'name color icon')
    .populate('wallet', 'name type')

  res.json({
    success: true,
    message: 'Occurrence skipped successfully',
    data: { recurringPayment: populated }
  })
})

export const deleteRecurringPayment = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid payment ID', 400)
  }

  const recurringPayment = await RecurringPayment.findOneAndDelete({
    _id: id,
    userId: req.user.id
  })

  if (!recurringPayment) {
    throw new AppError('Recurring payment not found', 404)
  }

  await activityService.logActivity(req.user.id, 'deleted_recurring_payment', 'recurring', id, {
    name: recurringPayment.name
  })

  res.json({
    success: true,
    message: 'Recurring payment deleted successfully',
    data: null
  })
})

export const getDueSoon = asyncHandler(async (req, res) => {
  const now = new Date()
  const dueSoonPayments = await RecurringPayment.find({
    userId: req.user.id,
    isActive: true,
    nextDueDate: { $gte: now }
  })
    .populate('category', 'name color icon')
    .populate('wallet', 'name type')
    .sort({ nextDueDate: 1 })

  // Filter by isDueSoon virtual
  const filtered = dueSoonPayments.filter(rp => rp.isDueSoon)

  res.json({
    success: true,
    data: { recurringPayments: filtered }
  })
})
