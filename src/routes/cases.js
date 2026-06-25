import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';
import CaseManager from '../services/case/case-manager.js';
import { validateCaseData } from '../middleware/validation.js';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error-handler.js';

const router = express.Router();

// Create case
router.post('/', async (req, res, next) => {
  try {
    validateCaseData(req.body);

    const caseId = await CaseManager.createCase(req.body);
    const caseData = await CaseManager.getCase(caseId);

    res.status(201).json({
      success: true,
      caseId,
      case: caseData,
    });
  } catch (error) {
    next(error);
  }
});

// Get case by ID
router.get('/:caseId', async (req, res, next) => {
  try {
    const caseData = await CaseManager.getCase(req.params.caseId);

    if (!caseData) {
      throw new NotFoundError(`Case ${req.params.caseId} not found`);
    }

    res.json({
      success: true,
      case: caseData,
    });
  } catch (error) {
    next(error);
  }
});

// Get case by number
router.get('/number/:caseNumber', async (req, res, next) => {
  try {
    const caseData = await CaseManager.getCaseByNumber(
      req.params.caseNumber
    );

    if (!caseData) {
      throw new NotFoundError(
        `Case ${req.params.caseNumber} not found`
      );
    }

    res.json({
      success: true,
      case: caseData,
    });
  } catch (error) {
    next(error);
  }
});

// List cases
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const cases = await CaseManager.listCases(limit, offset);

    res.json({
      success: true,
      count: cases.length,
      limit,
      offset,
      cases,
    });
  } catch (error) {
    next(error);
  }
});

// Update case
router.put('/:caseId', async (req, res, next) => {
  try {
    const caseData = await CaseManager.getCase(req.params.caseId);

    if (!caseData) {
      throw new NotFoundError(`Case ${req.params.caseId} not found`);
    }

    // Only allow specific fields to be updated
    const allowedFields = ['case_name', 'court_name', 'judge', 'jurisdiction'];
    const updates = {};
    
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    await CaseManager.updateCase(req.params.caseId, updates);
    const updatedCase = await CaseManager.getCase(req.params.caseId);

    res.json({
      success: true,
      case: updatedCase,
    });
  } catch (error) {
    next(error);
  }
});

// Get case sessions
router.get('/:caseId/sessions', async (req, res, next) => {
  try {
    const caseData = await CaseManager.getCase(req.params.caseId);

    if (!caseData) {
      throw new NotFoundError(`Case ${req.params.caseId} not found`);
    }

    const sessions = await CaseManager.getCaseSessions(req.params.caseId);

    res.json({
      success: true,
      sessionCount: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
});

// Delete case
router.delete('/:caseId', async (req, res, next) => {
  try {
    const caseData = await CaseManager.getCase(req.params.caseId);

    if (!caseData) {
      throw new NotFoundError(`Case ${req.params.caseId} not found`);
    }

    await CaseManager.deleteCase(req.params.caseId);

    res.json({
      success: true,
      message: `Case ${req.params.caseId} deleted`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;