import { v4 as uuidv4 } from 'uuid';
import logger from '../../config/logger.js';
import { getDatabase } from '../../config/database.js';
import { SESSION_STATUS } from '../../utils/constants.js';

export class CaseManager {
  /**
   * Create a new case
   */
  static async createCase(caseData) {
    const db = getDatabase();
    const caseId = uuidv4();

    try {
      await db.run(
        `
        INSERT INTO cases (id, case_number, case_name, court_name, judge, jurisdiction, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          caseId,
          caseData.case_number,
          caseData.case_name || null,
          caseData.court_name || null,
          caseData.judge || null,
          caseData.jurisdiction || null,
          caseData.date || new Date().toISOString(),
        ]
      );

      logger.info(`Created case: ${caseId} (${caseData.case_number})`);
      return caseId;
    } catch (error) {
      logger.error('Error creating case:', error);
      throw error;
    }
  }

  /**
   * Get case by ID
   */
  static async getCase(caseId) {
    const db = getDatabase();

    try {
      const caseData = await db.get('SELECT * FROM cases WHERE id = ?', [caseId]);
      return caseData || null;
    } catch (error) {
      logger.error('Error getting case:', error);
      throw error;
    }
  }

  /**
   * Get case by case number
   */
  static async getCaseByNumber(caseNumber) {
    const db = getDatabase();

    try {
      const caseData = await db.get(
        'SELECT * FROM cases WHERE case_number = ?',
        [caseNumber]
      );
      return caseData || null;
    } catch (error) {
      logger.error('Error getting case by number:', error);
      throw error;
    }
  }

  /**
   * List all cases
   */
  static async listCases(limit = 50, offset = 0) {
    const db = getDatabase();

    try {
      const cases = await db.all(
        'SELECT * FROM cases ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      return cases;
    } catch (error) {
      logger.error('Error listing cases:', error);
      throw error;
    }
  }

  /**
   * Update case
   */
  static async updateCase(caseId, updates) {
    const db = getDatabase();

    try {
      const setClauses = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updates), caseId];

      await db.run(
        `UPDATE cases SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );

      logger.info(`Updated case: ${caseId}`);
      return true;
    } catch (error) {
      logger.error('Error updating case:', error);
      throw error;
    }
  }

  /**
   * Delete case
   */
  static async deleteCase(caseId) {
    const db = getDatabase();

    try {
      await db.run('DELETE FROM cases WHERE id = ?', [caseId]);
      logger.info(`Deleted case: ${caseId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting case:', error);
      throw error;
    }
  }

  /**
   * Create transcription session for case
   */
  static async createSession(caseId, sessionData) {
    const db = getDatabase();
    const sessionId = uuidv4();

    try {
      // Verify case exists
      const caseExists = await db.get('SELECT id FROM cases WHERE id = ?', [
        caseId,
      ]);
      if (!caseExists) {
        throw new Error(`Case ${caseId} not found`);
      }

      await db.run(
        `
        INSERT INTO transcription_sessions (id, case_id, title, status)
        VALUES (?, ?, ?, ?)
      `,
        [sessionId, caseId, sessionData.title || null, SESSION_STATUS.ACTIVE]
      );

      logger.info(`Created session: ${sessionId} for case: ${caseId}`);
      return sessionId;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get sessions for case
   */
  static async getCaseSessions(caseId) {
    const db = getDatabase();

    try {
      const sessions = await db.all(
        'SELECT * FROM transcription_sessions WHERE case_id = ? ORDER BY started_at DESC',
        [caseId]
      );
      return sessions;
    } catch (error) {
      logger.error('Error getting case sessions:', error);
      throw error;
    }
  }
}

export default CaseManager;