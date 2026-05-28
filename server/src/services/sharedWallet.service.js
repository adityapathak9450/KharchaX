import mongoose from 'mongoose'
import Category from '../models/Category.model.js'
import { AppError } from '../middleware/error.middleware.js'

export function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100
}

export function toIdString(id) {
  if (!id) return ''
  return id._id ? id._id.toString() : id.toString()
}

export function computeSplitShares(amount, splitType, splitBetween, customSplits = []) {
  const total = roundMoney(amount)
  const memberIds = splitBetween.map((id) => toIdString(id))

  if (memberIds.length === 0) {
    throw new AppError('Select at least one member to split with', 400)
  }

  let shares = []

  if (splitType === 'percentage') {
    const pctMap = new Map(
      customSplits.map((s) => [toIdString(s.userId), Number(s.percentage)])
    )
    let sumPct = 0

    memberIds.forEach((id) => {
      const pct = pctMap.get(id) ?? 0
      sumPct += pct
      shares.push({ userId: id, amount: roundMoney((total * pct) / 100) })
    })

    if (Math.abs(sumPct - 100) > 0.01) {
      throw new AppError('Split percentages must total 100%', 400)
    }
  } else if (splitType === 'exact') {
    const amtMap = new Map(
      customSplits.map((s) => [toIdString(s.userId), Number(s.amount)])
    )
    let sum = 0

    memberIds.forEach((id) => {
      const shareAmount = roundMoney(amtMap.get(id) ?? 0)
      sum += shareAmount
      shares.push({ userId: id, amount: shareAmount })
    })

    if (Math.abs(sum - total) > 0.01) {
      throw new AppError('Exact split amounts must equal expense total', 400)
    }
  } else {
    const base = roundMoney(total / memberIds.length)
    let allocated = 0

    memberIds.forEach((id, index) => {
      if (index === memberIds.length - 1) {
        shares.push({ userId: id, amount: roundMoney(total - allocated) })
      } else {
        shares.push({ userId: id, amount: base })
        allocated += base
      }
    })
  }

  const allocatedTotal = roundMoney(shares.reduce((sum, s) => sum + s.amount, 0))
  const drift = roundMoney(total - allocatedTotal)
  if (drift !== 0) {
    shares[shares.length - 1].amount = roundMoney(
      shares[shares.length - 1].amount + drift
    )
  }

  return shares.map((s) => ({
    userId: new mongoose.Types.ObjectId(s.userId),
    amount: s.amount,
  }))
}

export function getExpenseShares(expense) {
  if (expense.splits?.length) {
    return expense.splits.map((s) => ({
      userId: toIdString(s.userId),
      amount: roundMoney(s.amount),
    }))
  }

  if (expense.splitBetween?.length) {
    return computeSplitShares(
      expense.amount,
      'equal',
      expense.splitBetween,
      []
    ).map((s) => ({
      userId: toIdString(s.userId),
      amount: s.amount,
    }))
  }

  return []
}

export function calculateMemberBalances(sharedWallet) {
  const balances = {}

  sharedWallet.members.forEach((member) => {
    const id = toIdString(member.userId)
    balances[id] = {
      userId: id,
      name: member.userId?.name || 'Member',
      balance: 0,
    }
  })

  for (const expense of sharedWallet.expenses || []) {
    const amount = roundMoney(expense.amount)
    const paidBy = toIdString(expense.paidBy)
    const shares = getExpenseShares(expense)

    if (balances[paidBy]) {
      balances[paidBy].balance = roundMoney(balances[paidBy].balance + amount)
    }

    shares.forEach(({ userId, amount: shareAmount }) => {
      if (balances[userId]) {
        balances[userId].balance = roundMoney(balances[userId].balance - shareAmount)
      }
    })
  }

  for (const settlement of sharedWallet.settlements || []) {
    const from = toIdString(settlement.fromUser)
    const to = toIdString(settlement.toUser)
    const settledAmount = roundMoney(settlement.amount)

    if (balances[from]) {
      balances[from].balance = roundMoney(balances[from].balance + settledAmount)
    }
    if (balances[to]) {
      balances[to].balance = roundMoney(balances[to].balance - settledAmount)
    }
  }

  return balances
}

export function suggestSettlements(balancesMap) {
  const creditors = []
  const debtors = []

  Object.values(balancesMap).forEach((entry) => {
    if (entry.balance > 0.01) {
      creditors.push({
        userId: entry.userId,
        name: entry.name,
        amount: roundMoney(entry.balance),
      })
    } else if (entry.balance < -0.01) {
      debtors.push({
        userId: entry.userId,
        name: entry.name,
        amount: roundMoney(Math.abs(entry.balance)),
      })
    }
  })

  const suggestions = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const settledAmount = roundMoney(Math.min(debtor.amount, creditor.amount))

    suggestions.push({
      fromUserId: debtor.userId,
      from: debtor.name,
      toUserId: creditor.userId,
      to: creditor.name,
      amount: settledAmount,
    })

    debtor.amount = roundMoney(debtor.amount - settledAmount)
    creditor.amount = roundMoney(creditor.amount - settledAmount)

    if (debtor.amount < 0.01) i += 1
    if (creditor.amount < 0.01) j += 1
  }

  return suggestions
}

export async function resolveSharedExpenseCategory(userId) {
  const category =
    (await Category.findOne({
      isDefault: true,
      type: { $in: ['expense', 'both'] },
      name: /shared/i,
    })) ||
    (await Category.findOne({
      isDefault: true,
      type: { $in: ['expense', 'both'] },
      name: 'Bills',
    })) ||
    (await Category.findOne({
      userId,
      type: { $in: ['expense', 'both'] },
    })) ||
    (await Category.findOne({
      isDefault: true,
      type: { $in: ['expense', 'both'] },
    }))

  if (!category) {
    throw new AppError('No expense category available for shared transaction', 400)
  }

  return category._id
}

export function assertSharedWalletMember(sharedWallet, userId) {
  const isMember =
    toIdString(sharedWallet.createdBy) === userId ||
    sharedWallet.members.some((m) => toIdString(m.userId) === userId)

  if (!isMember) {
    throw new AppError('Shared wallet not found or access denied', 404)
  }
}
