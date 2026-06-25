import express from 'express';
import logger from '../config/logger.js';
import SpeakerManager from '../services/speaker/speaker-manager.js';
import { validateSpeakerData } from '../middleware/validation.js';
import { NotFoundError, ValidationError } from '../middleware/error-handler.js';

const router = express.Router();

// Register speaker
router.post('/:sessionId', async (req, res, next) => {
  try {
    validateSpeakerData(req.body);

    const speakerId = await SpeakerManager.registerSpeaker(
      req.params.sessionId,
      req.body
    );
    const speaker = await SpeakerManager.getSpeaker(speakerId);

    res.status(201).json({
      success: true,
      speakerId,
      speaker,
    });
  } catch (error) {
    next(error);
  }
});

// Get speaker
router.get('/:speakerId', async (req, res, next) => {
  try {
    const speaker = await SpeakerManager.getSpeaker(req.params.speakerId);

    if (!speaker) {
      throw new NotFoundError(
        `Speaker ${req.params.speakerId} not found`
      );
    }

    res.json({
      success: true,
      speaker,
    });
  } catch (error) {
    next(error);
  }
});

// Get session speakers
router.get('/session/:sessionId', async (req, res, next) => {
  try {
    const speakers = await SpeakerManager.getSessionSpeakers(
      req.params.sessionId
    );

    res.json({
      success: true,
      count: speakers.length,
      speakers,
    });
  } catch (error) {
    next(error);
  }
});

// Update speaker
router.put('/:speakerId', async (req, res, next) => {
  try {
    const speaker = await SpeakerManager.getSpeaker(req.params.speakerId);

    if (!speaker) {
      throw new NotFoundError(
        `Speaker ${req.params.speakerId} not found`
      );
    }

    const allowedFields = ['name', 'label', 'role', 'voice_profile'];
    const updates = {};
    
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    await SpeakerManager.updateSpeaker(req.params.speakerId, updates);
    const updatedSpeaker = await SpeakerManager.getSpeaker(req.params.speakerId);

    res.json({
      success: true,
      speaker: updatedSpeaker,
    });
  } catch (error) {
    next(error);
  }
});

// Verify speaker
router.post('/:speakerId/verify', async (req, res, next) => {
  try {
    const speaker = await SpeakerManager.getSpeaker(req.params.speakerId);

    if (!speaker) {
      throw new NotFoundError(
        `Speaker ${req.params.speakerId} not found`
      );
    }

    await SpeakerManager.verifySpeaker(req.params.speakerId);

    res.json({
      success: true,
      message: 'Speaker verified',
    });
  } catch (error) {
    next(error);
  }
});

// Delete speaker
router.delete('/:speakerId', async (req, res, next) => {
  try {
    const speaker = await SpeakerManager.getSpeaker(req.params.speakerId);

    if (!speaker) {
      throw new NotFoundError(
        `Speaker ${req.params.speakerId} not found`
      );
    }

    await SpeakerManager.deleteSpeaker(req.params.speakerId);

    res.json({
      success: true,
      message: `Speaker ${req.params.speakerId} deleted`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;