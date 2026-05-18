import Transaction from '../models/Transaction.model.js'
import Wallet from '../models/Wallet.model.js'
import Budget from '../models/Budget.model.js'
import Category from '../models/Category.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../middleware/error.middleware.js'
import mongoose from 'mongoose'

export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  console.log('=== MONTHLY TREND DEBUG ===');
  console.log('REQ USER ID:', req.user.id);
  console.log('OBJECT ID:', new mongoose.Types.ObjectId(req.user.id));
  console.log('START DATE:', startDate);

  // Check transaction types in database
  const types = await Transaction.distinct('type');
  console.log('TRANSACTION TYPES IN DB:', types);

  // Get all transactions first to debug
  const allTransactions = await Transaction.find({ userId: req.user.id, date: { $gte: startDate } });
  console.log('ALL TRANSACTIONS COUNT (STRING ID):', allTransactions.length);
  console.log('TRANSACTIONS SAMPLE:', allTransactions.slice(0, 3).map(t => ({ id: t._id, type: t.type, amount: t.amount, date: t.date })));
  
  // Test with ObjectId
  const allTransactionsObjectId = await Transaction.find({ userId: new mongoose.Types.ObjectId(req.user.id), date: { $gte: startDate } });
  console.log('ALL TRANSACTIONS COUNT (OBJECT ID):', allTransactionsObjectId.length);
  console.log('INCOME TRANSACTIONS:', allTransactionsObjectId.filter(t => t.type === 'income').length);
  console.log('EXPENSE TRANSACTIONS:', allTransactionsObjectId.filter(t => t.type === 'expense').length);

  // Test without date filter
  const allTransactionsNoDate = await Transaction.find({ userId: new mongoose.Types.ObjectId(req.user.id) });
  console.log('ALL TRANSACTIONS (NO DATE FILTER):', allTransactionsNoDate.length);

  const trend = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user.id),
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

  console.log('MONTHLY TREND RESULT:', trend);

  console.log('MONTHLY TREND API RESPONSE:', { success: true, data: { trend } });

  res.json({
    success: true,
    data: { trend }
  })
})

export const getTopCategories = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query
  const now = new Date()
  
  console.log('=== CATEGORY BREAKDOWN DEBUG ===');
  console.log('REQ USER ID:', req.user.id);
  console.log('OBJECT ID:', new mongoose.Types.ObjectId(req.user.id));
  
  let startDate, endDate
  if (month && year) {
    startDate = new Date(year, month - 1, 1)
    endDate = new Date(year, month, 0)
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  }

  console.log('DATE RANGE:', { startDate, endDate });

  // Get all expense transactions first to debug
  const allExpenseTransactions = await Transaction.find({ 
    userId: req.user.id, 
    type: 'expense',
    date: { $gte: startDate, $lt: endDate }
  });
  
  console.log('EXPENSE TRANSACTIONS FOUND (STRING ID):', allExpenseTransactions.length);
  console.log('EXPENSE TRANSACTIONS SAMPLE:', allExpenseTransactions.slice(0, 3).map(t => ({ category: t.category, amount: t.amount, type: t.type })));
  
  // Test with ObjectId
  const allExpenseTransactionsObjectId = await Transaction.find({ 
    userId: new mongoose.Types.ObjectId(req.user.id), 
    type: 'expense',
    date: { $gte: startDate, $lt: endDate }
  });
  
  console.log('EXPENSE TRANSACTIONS FOUND (OBJECT ID):', allExpenseTransactionsObjectId.length);
  console.log('EXPENSE TRANSACTIONS SAMPLE:', allExpenseTransactionsObjectId.slice(0, 3).map(t => ({ category: t.category, amount: t.amount, type: t.type })));

  // Test without date filter
  const allExpenseNoDate = await Transaction.find({ 
    userId: new mongoose.Types.ObjectId(req.user.id), 
    type: 'expense'
  });
  console.log('EXPENSE TRANSACTIONS (NO DATE FILTER):', allExpenseNoDate.length);

  const categories = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user.id),
        type: 'expense',
        date: { $gte: startDate, $lt: endDate }
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

  console.log('CATEGORY BREAKDOWN RESULT:', categories);

  res.json({
    success: true,
    data: { categories }
  })
})

export const getSpendingHeatmap = asyncHandler(async (req, res) => {
  const { days = 90 } = req.query
  const now = new Date()
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

  const heatmap = await Transaction.aggregate([
    {
      $match: {
        userId: req.user.id,
        type: 'expense',
        date: { $gte: startDate }
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

  console.log('SPENDING HEATMAP RESULT:', heatmap);

  console.log('SPENDING HEATMAP API RESPONSE:', { success: true, data: { heatmap } });

  res.json({
    success: true,
    data: { heatmap }
  })
})

export const getSavingsGrowth = asyncHandler(async (req, res) => {
  const { months = 12 } = req.query
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

  console.log('=== SAVINGS GROWTH DEBUG ===');
  console.log('REQ USER ID:', req.user.id);
  console.log('OBJECT ID:', new mongoose.Types.ObjectId(req.user.id));
  console.log('START DATE:', startDate);

  // Get all savings transactions first to debug
  const allSavingsTransactions = await Transaction.find({ 
    userId: req.user.id, 
    date: { $gte: startDate }
  });
  console.log('SAVINGS TRANSACTIONS COUNT (STRING ID):', allSavingsTransactions.length);
  console.log('SAVINGS TRANSACTIONS SAMPLE:', allSavingsTransactions.slice(0, 3).map(t => ({ type: t.type, amount: t.amount, date: t.date })));

  // Test with ObjectId
  const allSavingsTransactionsObjectId = await Transaction.find({ 
    userId: new mongoose.Types.ObjectId(req.user.id), 
    date: { $gte: startDate }
  });
  console.log('SAVINGS TRANSACTIONS COUNT (OBJECT ID):', allSavingsTransactionsObjectId.length);

  // Test without date filter
  const allSavingsNoDate = await Transaction.find({ 
    userId: new mongoose.Types.ObjectId(req.user.id)
  });
  console.log('SAVINGS TRANSACTIONS (NO DATE FILTER):', allSavingsNoDate.length);

  const savings = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user.id),
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

  console.log('SAVINGS AGGREGATION RESULT:', savings);

  // Calculate cumulative savings
  let cumulativeSavings = 0
  const growth = savings.map(item => {
    cumulativeSavings += item.savings
    return {
      ...item,
      cumulativeSavings
    }
  })

  console.log('SAVINGS GROWTH RESULT:', growth);

  console.log('SAVINGS GROWTH API RESPONSE:', { success: true, data: { growth } });

  res.json({
    success: true,
    data: { growth }
  })
})

export const getWalletUsage = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query
  const now = new Date()
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

  console.log('=== WALLET USAGE DEBUG ===');
  console.log('REQ USER ID:', req.user.id);
  console.log('OBJECT ID:', new mongoose.Types.ObjectId(req.user.id));
  console.log('START DATE:', startDate);

  // Get all wallet transactions first to debug
  const allWalletTransactions = await Transaction.find({ 
    userId: req.user.id, 
    date: { $gte: startDate }
  });
  console.log('WALLET TRANSACTIONS COUNT (STRING ID):', allWalletTransactions.length);
  console.log('WALLET TRANSACTIONS SAMPLE:', allWalletTransactions.slice(0, 3).map(t => ({ wallet: t.wallet, amount: t.amount, type: t.type })));

  // Test with ObjectId
  const allWalletTransactionsObjectId = await Transaction.find({ 
    userId: new mongoose.Types.ObjectId(req.user.id), 
    date: { $gte: startDate }
  });
  console.log('WALLET TRANSACTIONS COUNT (OBJECT ID):', allWalletTransactionsObjectId.length);

  // Test without date filter
  const allWalletNoDate = await Transaction.find({ 
    userId: new mongoose.Types.ObjectId(req.user.id)
  });
  console.log('WALLET TRANSACTIONS (NO DATE FILTER):', allWalletNoDate.length);

  const walletStats = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user.id),
        date: { $gte: startDate }
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

  console.log('WALLET USAGE RESULT:', walletStats);

  console.log('WALLET USAGE API RESPONSE:', { success: true, data: { walletStats } });

  res.json({
    success: true,
    data: { walletStats }
  })

  console.log('CATEGORY BREAKDOWN API RESPONSE:', { success: true, data: { categories } });

  res.json({
    success: true,
    data: { categories }
  })
})

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query
  
  let startDate
  const now = new Date()
  let previousStartDate
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
      previousStartDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000))
      break
    case '90d':
      startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
      previousStartDate = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000))
      break
    case '1y':
      startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1)
      previousStartDate = new Date(now.getFullYear() - 1, now.getMonth() - 12, 1)
      break
    default:
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
      previousStartDate = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))
  }

  // Current period stats
  console.log('=== DASHBOARD DEBUG START ===');
  console.log('Dashboard aggregation - User ID:', req.user.id);
  console.log('Dashboard aggregation - Date range:', startDate);
  
  // Debug: Check transaction types before aggregation
  const sampleTransactions = await Transaction.find({ userId: req.user.id }).limit(10);
  console.log('SAMPLE TRANSACTIONS:', sampleTransactions.map(t => ({ 
    id: t._id, 
    type: t.type, 
    amount: t.amount,
    date: t.date 
  })));
  
  // Debug: Count transactions by type
  const incomeTransactions = await Transaction.find({ userId: req.user.id, type: 'income' });
  const expenseTransactions = await Transaction.find({ userId: req.user.id, type: 'expense' });
  console.log('INCOME TRANSACTIONS COUNT:', incomeTransactions.length);
  console.log('EXPENSE TRANSACTIONS COUNT:', expenseTransactions.length);
  console.log('INCOME TOTAL:', incomeTransactions.reduce((sum, t) => sum + t.amount, 0));
  console.log('EXPENSE TOTAL:', expenseTransactions.reduce((sum, t) => sum + t.amount, 0));
  
  // Debug: Log actual transaction types and values
  console.log('INCOME TRANSACTIONS DETAILS:', incomeTransactions.map(t => ({ id: t._id, type: t.type, amount: t.amount })));
  console.log('EXPENSE TRANSACTIONS DETAILS:', expenseTransactions.map(t => ({ id: t._id, type: t.type, amount: t.amount })));
  
  // Debug: Check if aggregation works with hardcoded types
  const testAggregation = await Transaction.aggregate([
    {
      $match: {
        userId: req.user.id,
        type: { $in: ['income', 'expense'] }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);
  console.log('TEST AGGREGATION BY TYPE:', testAggregation);
  
  const currentStats = await Transaction.aggregate([
    {
      $match: {
        userId: req.user.id,
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
  
  console.log('AGGREGATION RESULT:', currentStats);
  console.log('AGGREGATION INCOME:', currentStats[0]?.totalIncome);
  console.log('AGGREGATION EXPENSES:', currentStats[0]?.totalExpenses);
  
  // Final response logging
 

  // Previous period stats for comparison
  const previousStats = await Transaction.aggregate([
    {
      $match: {
        userId: req.user.id,
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

  // Total balance from wallets
  const wallets = await Wallet.find({ 
    userId: req.user.id, 
    isArchived: false 
  }).select('balance')

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)

  const current = currentStats[0] || { totalIncome: 0, totalExpenses: 0 }
  const previous = previousStats[0] || { totalIncome: 0, totalExpenses: 0 }

  const currentSavings = current.totalIncome - current.totalExpenses
  const previousSavings = previous.totalIncome - previous.totalExpenses

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const stats = {
    totalBalance,
    totalIncome: current.totalIncome,
    totalExpenses: current.totalExpenses,
    totalSavings: currentSavings,
    balanceChange: calculateChange(totalBalance, totalBalance), // No change for balance
    incomeChange: calculateChange(current.totalIncome, previous.totalIncome),
    expenseChange: calculateChange(current.totalExpenses, previous.totalExpenses),
    savingsChange: calculateChange(currentSavings, previousSavings)
  }

  res.json({
    success: true,
    data: {stats}
  })
})
