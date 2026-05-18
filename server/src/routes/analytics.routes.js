import { Router } from 'express';
import {
  getMonthlyTrend,
  getTopCategories,
  getSpendingHeatmap,
  getSavingsGrowth,
  getWalletUsage,
  getDashboardStats,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/analytics/monthly-trend - Get monthly income vs expense trend
router.get('/monthly-trend', getMonthlyTrend);

// GET /api/analytics/top-categories - Get top spending categories
router.get('/top-categories', getTopCategories);

// GET /api/analytics/spending-heatmap - Get 90-day spending heatmap
router.get('/spending-heatmap', getSpendingHeatmap);

// GET /api/analytics/savings-growth - Get savings growth over time
router.get('/savings-growth', getSavingsGrowth);

// GET /api/analytics/wallet-usage - Get wallet usage statistics
router.get('/wallet-usage', getWalletUsage);

// GET /api/analytics/dashboard-stats - Get dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

export default router;
