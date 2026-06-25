import { v4 as uuidv4 } from 'uuid';
import logger from '../../config/logger.js';
import { getDatabase } from '../../config/database.js';

export class SpeakerManager {
  /**
   * Register speaker for session
   */
  static async registerSpeaker(sessionId, speakerData) {
    const db = getDatabase();
    const speakerId = speakerData.id || uuidv4();

    try {
      await db.run(
        `
        INSERT INTO speakers (id, session_id, name, label, role, voice_profile, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          speakerId,
          sessionId,
          speakerData.name || null,
          speakerData.label || null,
          speakerData.role || null,
          speakerData.voice_profile || null,
          speakerData.is_verified ? 1 : 0,
        ]
      );

      logger.info(
        `Registered speaker: ${speakerId} (${speakerData.label}) for session: ${sessionId}`
      );
      return speakerId;
    } catch (error) {
      logger.error('Error registering speaker:', error);
      throw error;
    }
  }

  /**
   * Get speaker by ID
   */
  static async getSpeaker(speakerId) {
    const db = getDatabase();

    try {
      const speaker = await db.get(
        'SELECT * FROM speakers WHERE id = ?',
        [speakerId]
      );
      return speaker || null;
    } catch (error) {
      logger.error('Error getting speaker:', error);
      throw error;
    }
  }

  /**
   * Get speakers for session
   */
  static async getSessionSpeakers(sessionId) {
    const db = getDatabase();

    try {
      const speakers = await db.all(
        'SELECT * FROM speakers WHERE session_id = ? ORDER BY created_at ASC',
        [sessionId]
      );
      return speakers;
    } catch (error) {
      logger.error('Error getting session speakers:', error);
      throw error;
    }
  }

  /**
   * Update speaker
   */
  static async updateSpeaker(speakerId, updates) {
    const db = getDatabase();

    try {
      const setClauses = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updates), speakerId];

      await db.run(
        `UPDATE speakers SET ${setClauses} WHERE id = ?`,
        values
      );

      logger.info(`Updated speaker: ${speakerId}`);
      return true;
    } catch (error) {
      logger.error('Error updating speaker:', error);
      throw error;
    }
  }

  /**
   * Get speaker by label
   */
  static async getSpeakerByLabel(sessionId, label) {
    const db = getDatabase();

    try {
      const speaker = await db.get(
        'SELECT * FROM speakers WHERE session_id = ? AND label = ?',
        [sessionId, label]
      );
      return speaker || null;
    } catch (error) {
      logger.error('Error getting speaker by label:', error);
      throw error;
    }
  }

  /**
   * Delete speaker
   */
  static async deleteSpeaker(speakerId) {
    const db = getDatabase();

    try {
      await db.run('DELETE FROM speakers WHERE id = ?', [speakerId]);
      logger.info(`Deleted speaker: ${speakerId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting speaker:', error);
      throw error;
    }
  }

  /**
   * Verify speaker voice profile
   */
  static async verifySpeaker(speakerId) {
    const db = getDatabase();

    try {
      await db.run(
        'UPDATE speakers SET is_verified = 1 WHERE id = ?',
        [speakerId]
      );
      logger.info(`Verified speaker: ${speakerId}`);
      return true;
    } catch (error) {
      logger.error('Error verifying speaker:', error);
      throw error;
    }
  }
}

export default SpeakerManager;