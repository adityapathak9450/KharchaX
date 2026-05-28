import Transaction from '../models/Transaction.model.js'
import Wallet from '../models/Wallet.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import mongoose from 'mongoose'

function parseRange(range = '30d') {
  const now = new Date()
  let startDate

  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      break
    case '90d':
      startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
      break
    case '1y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    case '30d':
    default:
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
  }

  return { startDate, endDate: now }
}

function getMonthsFromRange(range = '30d') {
  switch (range) {
    case '7d':
      return 1
    case '90d':
      return 3
    case '1y':
      return 12
    case '30d':
    default:
      return 6
  }
}

function getUserObjectId(req) {
  return new mongoose.Types.ObjectId(req.user.id)
}

function getRangeParam(req) {
  return req.query.range || req.query.period || '30d'
}

export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const months = Number(req.query.months) || getMonthsFromRange(range)
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  const userId = getUserObjectId(req)

  console.log(`[analytics] monthly-trend user=${req.user.id} months=${months}`)

  const trend = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        _id: 0,
        month: {
          $dateToString: {
            format: '%b %Y',
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month'
              }
            }
          }
        },
        income: 1,
        expenses: 1
      }
    }
  ])

  res.json({
    success: true,
    data: { trend }
  })
})

export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const { startDate, endDate } = parseRange(range)
  const userId = getUserObjectId(req)

  console.log(`[analytics] category-breakdown user=${req.user.id} range=${range}`)

  const categories = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $group: {
        _id: '$category',
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
        name: { $first: '$categoryInfo.name' },
        color: { $first: '$categoryInfo.color' },
        icon: { $first: '$categoryInfo.icon' }
      }
    },
    {
      $sort: { amount: -1 }
    }
  ])

  res.json({
    success: true,
    data: { categories }
  })
})

export const getTopCategories = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const { startDate, endDate } = parseRange(range)
  const userId = getUserObjectId(req)

  console.log(`[analytics] top-categories user=${req.user.id} range=${range}`)

  const categories = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $group: {
        _id: '$category',
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
        name: { $first: '$categoryInfo.name' },
        color: { $first: '$categoryInfo.color' },
        icon: { $first: '$categoryInfo.icon' }
      }
    },
    {
      $sort: { amount: -1 }
    },
    {
      $limit: 6
    }
  ])

  res.json({
    success: true,
    data: { categories }
  })
})

export const getSpendingHeatmap = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const { startDate, endDate } = parseRange(range === '1y' ? '90d' : range)
  const userId = getUserObjectId(req)

  const heatmap = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$date'
          }
        },
        amount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ])

  res.json({
    success: true,
    data: { heatmap }
  })
})

export const getSavingsGrowth = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const months = Number(req.query.months) || getMonthsFromRange(range === '7d' ? '30d' : range)
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  const userId = getUserObjectId(req)

  const savings = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    },
    {
      $project: {
        _id: 0,
        month: {
          $dateToString: {
            format: '%b %Y',
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month'
              }
            }
          }
        },
        income: 1,
        expenses: 1,
        savings: { $subtract: ['$income', '$expenses'] }
      }
    }
  ])

  let cumulativeSavings = 0
  const growth = savings.map((item) => {
    cumulativeSavings += item.savings
    return {
      ...item,
      cumulativeSavings
    }
  })

  res.json({
    success: true,
    data: { growth }
  })
})

export const getWalletUsage = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const { startDate, endDate } = parseRange(range)
  const userId = getUserObjectId(req)

  const walletStats = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'wallets',
        localField: 'wallet',
        foreignField: '_id',
        as: 'walletInfo'
      }
    },
    {
      $unwind: '$walletInfo'
    },
    {
      $group: {
        _id: '$wallet',
        name: { $first: '$walletInfo.name' },
        type: { $first: '$walletInfo.type' },
        color: { $first: '$walletInfo.color' },
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        },
        transactions: { $sum: 1 }
      }
    },
    {
      $sort: { transactions: -1 }
    }
  ])

  res.json({
    success: true,
    data: { walletStats }
  })
})

export const getDashboardStats = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const { startDate } = parseRange(range)
  const now = new Date()
  const userId = getUserObjectId(req)
  const durationMs = now.getTime() - startDate.getTime()
  const previousStartDate = new Date(startDate.getTime() - durationMs)

  console.log(`[analytics] dashboard-stats user=${req.user.id} range=${range}`)

  const currentStats = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        }
      }
    }
  ])

  const previousStats = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: previousStartDate, $lt: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        totalExpenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        }
      }
    }
  ])

  const wallets = await Wallet.find({
    userId,
    isArchived: false
  }).select('balance')

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const current = currentStats[0] || { totalIncome: 0, totalExpenses: 0 }
  const previous = previousStats[0] || { totalIncome: 0, totalExpenses: 0 }
  const currentSavings = current.totalIncome - current.totalExpenses
  const previousSavings = previous.totalIncome - previous.totalExpenses

  const calculateChange = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0
    return ((currentValue - previousValue) / previousValue) * 100
  }

  const stats = {
    totalBalance,
    totalIncome: current.totalIncome,
    totalExpenses: current.totalExpenses,
    totalSavings: currentSavings,
    balanceChange: 0,
    incomeChange: calculateChange(current.totalIncome, previous.totalIncome),
    expenseChange: calculateChange(current.totalExpenses, previous.totalExpenses),
    savingsChange: calculateChange(currentSavings, previousSavings)
  }

  res.json({
    success: true,
    data: { stats }
  })
})

export const exportAnalytics = asyncHandler(async (req, res) => {
  const range = getRangeParam(req)
  const { startDate, endDate } = parseRange(range)
  const userId = getUserObjectId(req)
  console.log(`[analytics] export user=${req.user.id} range=${range} start=${startDate.toISOString()} end=${endDate.toISOString()}`)

  const [summaryAgg, categoryAgg, topAgg, transactions] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          category: { $first: '$categoryInfo.name' },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } }
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          category: { $first: '$categoryInfo.name' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 6 }
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: {
          path: '$categoryInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      { $sort: { date: -1 } },
      {
        $project: {
          _id: 0,
          date: 1,
          category: '$categoryInfo.name',
          type: 1,
          amount: 1,
          description: '$notes'
        }
      }
    ])
  ])

  const summary = summaryAgg[0] || {
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: 0
  }
  const totalSavings = summary.totalIncome - summary.totalExpenses

  const escapeCsv = (value) => {
    const text = String(value ?? '').replace(/"/g, '""')
    return `"${text}"`
  }

  const lines = []
  lines.push('Section,Metric,Value')
  lines.push(`Summary,Range,${range}`)
  lines.push(`Summary,Start Date,${startDate.toISOString()}`)
  lines.push(`Summary,End Date,${endDate.toISOString()}`)
  lines.push(`Summary,Total Income,${summary.totalIncome}`)
  lines.push(`Summary,Total Expenses,${summary.totalExpenses}`)
  lines.push(`Summary,Savings,${totalSavings}`)
  lines.push(`Summary,Transactions,${summary.transactionCount}`)
  lines.push('')
  lines.push('Category Breakdown,Category,Amount')
  categoryAgg.forEach((item) => {
    lines.push(`Category Breakdown,${escapeCsv(item.category)},${item.amount}`)
  })
  lines.push('')
  lines.push('Top Categories,Category,Total')
  topAgg.forEach((item) => {
    lines.push(`Top Categories,${escapeCsv(item.category)},${item.total}`)
  })
  lines.push('')
  lines.push('Date,Category,Type,Amount,Description')
  transactions.forEach((tx) => {
    lines.push([
      tx.date ? new Date(tx.date).toISOString() : '',
      escapeCsv(tx.category || 'Unknown'),
      tx.type || '',
      tx.amount ?? 0,
      escapeCsv(tx.description || '')
    ].join(','))
  })

  const csv = lines.join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="analytics-${range}.csv"`)
  res.status(200).send(csv)
})
