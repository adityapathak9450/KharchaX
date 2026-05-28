import Transaction from '../models/Transaction.model.js';
import Wallet from '../models/Wallet.model.js';
import Category from '../models/Category.model.js';
import { createTransactionSchema, updateTransactionSchema } from '../validators/transaction.validator.js';
import mongoose from 'mongoose';
import activityService from '../services/activity.service.js';
import { notificationService } from '../services/notification.service.js';
import Budget from '../models/Budget.model.js';

export const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      wallet,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      tags,
    } = req.query;

    const userId = req.user.id;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build match object
    const $match = { userId: new mongoose.Types.ObjectId(userId) };

    if (type) {
      $match.type = type;
    }

    if (category) {
      $match.category = new mongoose.Types.ObjectId(category);
    }

    if (wallet) {
      $match.wallet = new mongoose.Types.ObjectId(wallet);
    }

    if (startDate || endDate) {
      $match.date = {};
      if (startDate) $match.date.$gte = new Date(startDate);
      if (endDate) {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  $match.date.$lte = end;
}
    }

    if (search) {
      $match.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      $match.tags = { $in: tagArray };
    }

    // Build sort object
    let $sort = {};
    switch (sortBy) {
      case 'date':
        $sort = { date: -1 };
        break;
      case '-date':
        $sort = { date: 1 };
        break;
      case 'amount':
        $sort = { amount: -1 };
        break;
      case '-amount':
        $sort = { amount: 1 };
        break;
      default:
        $sort = { date: -1 };
    }

    const aggregationPipeline = [
      { $match },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallet',
          foreignField: '_id',
          as: 'wallet'
        }
      },
      { $unwind: '$category' },
      { $unwind: '$wallet' },
      {
        $facet: {
          data: [
            { $sort },
            { $skip: skip },
            { $limit: limitNum }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const [result] = await Transaction.aggregate(aggregationPipeline);
    const transactions = result.data || [];
    const total = result.total[0]?.count || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        transactions,
        total,
        page: pageNum,
        totalPages
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ _id: id, userId })
      .populate('category', 'name color icon')
      .populate('wallet', 'name type');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const validatedData = createTransactionSchema.parse(req.body);
    const userId = req.user.id;

    // Create transaction
    const transaction = new Transaction({
      ...validatedData,
      userId,
      date: new Date(validatedData.date)
    });

    // Update wallet balance
    const wallet = await Wallet.findById(validatedData.wallet);

if (!wallet) {
  return res.status(404).json({
    success: false,
    message: 'Wallet not found'
  });
}

const isOwner = wallet.userId.toString() === req.user.id;

const isMember = wallet.members?.some(
  member => member.userId.toString() === req.user.id
);

if (!isOwner && !isMember) {
  return res.status(403).json({
    success: false,
    message: 'Access denied'
  });
}
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    if (validatedData.type === 'income') {
      wallet.balance += validatedData.amount;
    } else {
      wallet.balance -= validatedData.amount;
    }

    // Save both transaction and wallet
    const [savedTransaction] = await Promise.all([
      transaction.save(),
      wallet.save()
    ]);

    // Log activity for real-time updates
    await activityService.logTransactionActivity(userId, savedTransaction, 'created');

    await notificationService.createAndEmitNotification({
      userId: userId,
      type: 'system',
      title: 'Transaction Added',
      message: `${savedTransaction.type} of ${savedTransaction.amount} added to ${wallet.name || 'wallet'}`,
      data: { transactionId: savedTransaction._id }
    });

    // Check budgets if expense
    if (savedTransaction.type === 'expense' && savedTransaction.category) {
      const transactionDate = new Date(savedTransaction.date);
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();
      
      // Import budgetService dynamically to avoid circular dependencies
      const { default: budgetService } = await import('../services/budget.service.js');
      const budgetResult = await budgetService.checkBudgets(
        savedTransaction.userId,
        savedTransaction.category,
        month,
        year
      );
      
      // Emit budget alerts if needed
      if (budgetResult.alerts && budgetResult.alerts.length > 0) {
        for (const alert of budgetResult.alerts) {
          await activityService.logBudgetAlert(userId, alert.budget, alert.type, {
            transactionAmount: validatedData.amount,
            transactionId: savedTransaction._id
          });
        }
      }
    }

    // Populate response
    const populatedTransaction = await Transaction.findById(savedTransaction._id)
      .populate('category', 'name color icon')
      .populate('wallet', 'name type');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: populatedTransaction
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const validatedData = updateTransactionSchema.parse(req.body);

    // Find existing transaction
   const existingTransaction = await Transaction.findOne({
  _id: id,
  userId
});
    if (!existingTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Calculate balance difference
    const oldEffect = existingTransaction.type === 'income' 
      ? existingTransaction.amount 
      : -existingTransaction.amount;
    const newEffect = validatedData.type === 'income' 
      ? validatedData.amount 
      : -validatedData.amount;
    const diff = newEffect - oldEffect;

    // Update wallet balance
   const wallet = await Wallet.findById(existingTransaction.wallet);



const isOwner = wallet.userId.toString() === req.user.id;

const isMember = wallet.members?.some(
  member => member.userId.toString() === req.user.id
);

if (!isOwner && !isMember) {
  return res.status(403).json({
    success: false,
    message: 'Access denied'
  });
}

    wallet.balance += diff;

    // Update transaction
    const oldCategory = existingTransaction.category.toString();
const oldAmount = existingTransaction.amount;
const oldType = existingTransaction.type;
    Object.assign(existingTransaction, validatedData);
    if (validatedData.date) {
      existingTransaction.date = new Date(validatedData.date);
    }

    // Save both
    const [updatedTransaction] = await Promise.all([
      existingTransaction.save(),
      wallet.save()
    ]);

    // Check budgets if expense and category or amount changed
   const finalType = validatedData.type || oldType;
const finalCategory = validatedData.category || oldCategory;
const finalAmount = validatedData.amount || oldAmount;

if (
  finalType === 'expense' &&
  (
    finalCategory !== oldCategory ||
    finalAmount !== oldAmount
  )
) {
      const transactionDate = new Date(validatedData.date || existingTransaction.date);
      const month = transactionDate.getMonth() + 1;
      const year = transactionDate.getFullYear();
      
      const { default: budgetService } = await import('../services/budget.service.js');
      budgetService.checkBudgets(userId, validatedData.category, month, year);
    }

    // Populate response
    const populatedTransaction = await Transaction.findById(updatedTransaction._id)
      .populate('category', 'name color icon')
      .populate('wallet', 'name type');

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: populatedTransaction
    });

  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find transaction
   const transaction = await Transaction.findOne({
  _id: id,
  userId
});
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update wallet balance (reverse the transaction effect)
    const wallet = await Wallet.findById(transaction.wallet);

if (!wallet) {
  return res.status(404).json({
    success: false,
    message: 'Wallet not found'
  });
}

const isOwner = wallet.userId.toString() === req.user.id;

const isMember = wallet.members?.some(
  member => member.userId.toString() === req.user.id
);

if (!isOwner && !isMember) {
  return res.status(403).json({
    success: false,
    message: 'Access denied'
  });
}

    if (transaction.type === 'income') {
      wallet.balance -= transaction.amount;
    } else {
      wallet.balance += transaction.amount;
    }

    // Delete transaction and update wallet
    await Promise.all([
      Transaction.deleteOne({ _id: id }),
      wallet.save()
    ]);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

export const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction IDs'
      });
    }

    // Find all transactions to delete (security check)
    const transactions = await Transaction.find({
      _id: { $in: ids },
      userId
    });

    if (transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No transactions found'
      });
    }

    // Group balance updates by wallet
    const walletUpdates = {};
    transactions.forEach(transaction => {
      const walletId = transaction.wallet.toString();
      if (!walletUpdates[walletId]) {
        walletUpdates[walletId] = 0;
      }
      
      if (transaction.type === 'income') {
        walletUpdates[walletId] -= transaction.amount;
      } else {
        walletUpdates[walletId] += transaction.amount;
      }
    });

    // Update all wallets
    const walletPromises = Object.entries(walletUpdates).map(([walletId, amount]) =>
      Wallet.updateOne(
        { _id: walletId, userId },
        { $inc: { balance: amount } }
      )
    );

    // Delete transactions
    const deleteResult = await Transaction.deleteMany({
      _id: { $in: ids },
      userId
    });

    // Execute wallet updates
    await Promise.all(walletPromises);

    res.json({
      success: true,
      message: `${deleteResult.deletedCount} transactions deleted successfully`
    });

  } catch (error) {
    next(error);
  }
};

export const exportCSV = async (req, res, next) => {
  try {
    const {
      type,
      category,
      wallet,
      startDate,
      endDate,
      search,
      tags,
    } = req.query;

    const userId = req.user.id;

    // Build match object (same as getTransactions but without pagination)
    const $match = { userId: new mongoose.Types.ObjectId(userId) };

    if (type) $match.type = type;
    if (category) $match.category = new mongoose.Types.ObjectId(category);
    if (wallet) $match.wallet = new mongoose.Types.ObjectId(wallet);
    
    if (startDate || endDate) {
      $match.date = {};
      if (startDate) $match.date.$gte = new Date(startDate);
   if (endDate) {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  $match.date.$lte = end;
}
    }

    if (search) {
      $match.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      $match.tags = { $in: tagArray };
    }

    const transactions = await Transaction.aggregate([
      { $match },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'wallets',
          localField: 'wallet',
          foreignField: '_id',
          as: 'wallet'
        }
      },
      { $unwind: '$category' },
      { $unwind: '$wallet' },
      { $sort: { date: -1 } }
    ]);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');

    // Write CSV
    const csvHeaders = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Tags', 'Notes'];
    res.write(csvHeaders.join(',') + '\n');

    transactions.forEach(transaction => {
      const row = [
        transaction.date.toISOString().split('T')[0], // YYYY-MM-DD
        transaction.type,
        `"${transaction.category.name}"`, // Quote to handle commas
        `"${transaction.wallet.name}"`,
        transaction.amount,
        `"${transaction.tags.join(', ')}"`,
        `"${transaction.notes || ''}"`
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();

  } catch (error) {
    next(error);
  }
};

export const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const results = [];
    const failed = [];

    // Parse CSV (assuming csv-parser middleware was used)
    // For now, implement basic CSV parsing
    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // Find required column indices
    const amountIndex = headers.findIndex(h => h.toLowerCase().includes('amount'));
    const typeIndex = headers.findIndex(h => h.toLowerCase().includes('type'));
    const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('category'));
    const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));

    if (amountIndex === -1 || typeIndex === -1 || categoryIndex === -1 || dateIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'CSV must contain columns: amount, type, category, date'
      });
    }

    // Get user's categories and wallets for mapping
    const categories = await Category.find({ userId });
    const wallets = await Wallet.find({ userId });

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat._id;
    });

    const walletMap = {};
    wallets.forEach(wallet => {
      walletMap[wallet.name.toLowerCase()] = wallet._id;
    });

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remove quotes
      
      try {
        const amount = parseFloat(values[amountIndex]);
        const type = values[typeIndex]?.toLowerCase();
        const categoryName = values[categoryIndex].toLowerCase();
        const date = values[dateIndex];

        if (isNaN(amount) || !['income', 'expense'].includes(type) || !categoryName || !date) {
          failed.push({ row: i + 1, error: 'Invalid data format' });
          continue;
        }

        const categoryId = categoryMap[categoryName];
        if (!categoryId) {
          failed.push({ row: i + 1, error: `Category "${values[categoryIndex]}" not found` });
          continue;
        }

        // Use first wallet as default
        const walletId = Object.values(walletMap)[0];
        if (!walletId) {
          failed.push({ row: i + 1, error: 'No wallets available' });
          continue;
        }

        const transaction = new Transaction({
          userId,
          amount,
          type,
          category: categoryId,
          wallet: walletId,
          date: new Date(date),
          notes: values[headers.findIndex(h => h.toLowerCase().includes('note'))] || ''
        });

        results.push(transaction);
      } catch (error) {
        failed.push({ row: i + 1, error: 'Processing error' });
      }
    }

    // Bulk insert
    let created = 0;
    if (results.length > 0) {
      const inserted = await Transaction.insertMany(results);
      created = inserted.length;

      // Update wallet balances
      const walletUpdates = {};
      results.forEach(transaction => {
        const walletId = transaction.wallet.toString();
        if (!walletUpdates[walletId]) {
          walletUpdates[walletId] = 0;
        }
        
        if (transaction.type === 'income') {
          walletUpdates[walletId] += transaction.amount;
        } else {
          walletUpdates[walletId] -= transaction.amount;
        }
      });

      await Promise.all(
        Object.entries(walletUpdates).map(([walletId, amount]) =>
          Wallet.updateOne(
            { _id: walletId, userId },
            { $inc: { balance: amount } }
          )
        )
      );
    }

    res.json({
      success: true,
      message: `Imported ${created} transactions successfully`,
      data: {
        created,
        failed: failed.length,
        failedRows: failed
      }
    });

  } catch (error) {
    next(error);
  }
};
