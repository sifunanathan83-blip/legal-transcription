import { v4 as uuidv4 } from 'uuid';
import logger from '../../config/logger.js';
import { getDatabase } from '../../config/database.js';
import { validateTranscriptSegment } from '../../middleware/validation.js';

export class TranscriptSegmentManager {
  /**
   * Create transcript segment
   */
  static async createSegment(sessionId, segmentData) {
    const db = getDatabase();
    const segmentId = uuidv4();

    try {
      // Validate segment data
      validateTranscriptSegment(segmentData);

      await db.run(
        `
        INSERT INTO transcript_segments 
        (id, session_id, speaker_id, text, start_time_ms, end_time_ms, confidence, is_objection, is_procedural, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          segmentId,
          sessionId,
          segmentData.speaker_id,
          segmentData.text,
          segmentData.start_time_ms,
          segmentData.end_time_ms,
          segmentData.confidence || null,
          segmentData.is_objection ? 1 : 0,
          segmentData.is_procedural ? 1 : 0,
          segmentData.tags || null,
        ]
      );

      logger.info(`Created segment: ${segmentId}`);
      return segmentId;
    } catch (error) {
      logger.error('Error creating segment:', error);
      throw error;
    }
  }

  /**
   * Get segment by ID
   */
  static async getSegment(segmentId) {
    const db = getDatabase();

    try {
      const segment = await db.get(
        'SELECT * FROM transcript_segments WHERE id = ?',
        [segmentId]
      );
      return segment || null;
    } catch (error) {
      logger.error('Error getting segment:', error);
      throw error;
    }
  }

  /**
   * Get segments for session
   */
  static async getSessionSegments(sessionId, limit = 1000, offset = 0) {
    const db = getDatabase();

    try {
      const segments = await db.all(
        `
        SELECT * FROM transcript_segments 
        WHERE session_id = ? 
        ORDER BY start_time_ms ASC 
        LIMIT ? OFFSET ?
      `,
        [sessionId, limit, offset]
      );
      return segments;
    } catch (error) {
      logger.error('Error getting session segments:', error);
      throw error;
    }
  }

  /**
   * Get segments by speaker
   */
  static async getSpeakerSegments(sessionId, speakerId) {
    const db = getDatabase();

    try {
      const segments = await db.all(
        `
        SELECT * FROM transcript_segments 
        WHERE session_id = ? AND speaker_id = ? 
        ORDER BY start_time_ms ASC
      `,
        [sessionId, speakerId]
      );
      return segments;
    } catch (error) {
      logger.error('Error getting speaker segments:', error);
      throw error;
    }
  }

  /**
   * Get objection segments
   */
  static async getObjections(sessionId) {
    const db = getDatabase();

    try {
      const objections = await db.all(
        `
        SELECT * FROM transcript_segments 
        WHERE session_id = ? AND is_objection = 1 
        ORDER BY start_time_ms ASC
      `,
        [sessionId]
      );
      return objections;
    } catch (error) {
      logger.error('Error getting objections:', error);
      throw error;
    }
  }

  /**
   * Update segment
   */
  static async updateSegment(segmentId, updates) {
    const db = getDatabase();

    try {
      const setClauses = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updates), segmentId];

      await db.run(
        `UPDATE transcript_segments SET ${setClauses} WHERE id = ?`,
        values
      );

      logger.info(`Updated segment: ${segmentId}`);
      return true;
    } catch (error) {
      logger.error('Error updating segment:', error);
      throw error;
    }
  }

  /**
   * Delete segment
   */
  static async deleteSegment(segmentId) {
    const db = getDatabase();

    try {
      await db.run('DELETE FROM transcript_segments WHERE id = ?', [
        segmentId,
      ]);
      logger.info(`Deleted segment: ${segmentId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting segment:', error);
      throw error;
    }
  }

  /**
   * Get transcript word count for session
   */
  static async getWordCount(sessionId) {
    const db = getDatabase();

    try {
      const result = await db.get(
        `
        SELECT SUM(LENGTH(text) - LENGTH(REPLACE(text, ' ', '')) + 1) as word_count
        FROM transcript_segments
        WHERE session_id = ?
      `,
        [sessionId]
      );

      return result?.word_count || 0;
    } catch (error) {
      logger.error('Error calculating word count:', error);
      throw error;
    }
  }

  /**
   * Create correction/revision
   */
  static async createRevision(segmentId, originalText, correctedText, reason) {
    const db = getDatabase();
    const revisionId = uuidv4();

    try {
      await db.run(
        `
        INSERT INTO revisions (id, segment_id, original_text, corrected_text, reason)
        VALUES (?, ?, ?, ?, ?)
      `,
        [revisionId, segmentId, originalText, correctedText, reason || null]
      );

      // Update the segment with corrected text
      await this.updateSegment(segmentId, { text: correctedText });

      logger.info(`Created revision: ${revisionId}`);
      return revisionId;
    } catch (error) {
      logger.error('Error creating revision:', error);
      throw error;
    }
  }
}

export default TranscriptSegmentManager;