import { Router } from 'express';
import {
  getReports,
  generateReportController,
  downloadReport,
  getReportStatus,
  deleteReport
  ,
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/reports - Get all reports for the user
router.get('/', getReports);

// POST /api/reports/generate - Generate a new report
router.post('/generate', generateReportController);

// GET /api/reports/:id/download - Download a report
router.get('/:id/download', downloadReport);

// GET /api/reports/:id/status - Get report status
router.get('/:id/status', getReportStatus);

router.delete('/:id', deleteReport);

export default router;
