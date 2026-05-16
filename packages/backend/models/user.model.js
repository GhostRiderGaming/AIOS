/**
 * @fileoverview User data access model.
 * All user-related SQL queries are encapsulated here.
 */

import { queryAll, queryOne, execute } from '../config/database.js';

export const userModel = {
  /**
   * Find user by email.
   * @param {string} email
   * @returns {Object|undefined}
   */
  findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', email);
  },

  /**
   * Find user by ID (without password hash).
   * @param {number} id
   * @returns {Object|undefined}
   */
  findById(id) {
    return queryOne(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      id,
    );
  },

  /**
   * Create a new user.
   * @param {{ email: string, passwordHash: string, name: string, role: string }} data
   * @returns {Object}
   */
  create({ email, passwordHash, name, role }) {
    const { lastId } = execute(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      email,
      passwordHash,
      name,
      role,
    );
    return this.findById(lastId);
  },

  /**
   * Get all users (admin only).
   * @returns {Array}
   */
  findAll() {
    return queryAll('SELECT id, email, name, role, created_at FROM users');
  },
};
