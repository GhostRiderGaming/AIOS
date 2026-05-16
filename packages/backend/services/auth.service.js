/**
 * @fileoverview Authentication service — business logic for auth flows.
 */

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { userModel } from '../models/user.model.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '@aios/shared/errors';
import { BCRYPT_ROUNDS } from '@aios/shared/constants';

export const authService = {
  /**
   * Register a new user.
   * @param {{ email: string, password: string, name: string, role?: string }} data
   * @returns {{ user: Object, token: string }}
   */
  register({ email, password, name, role }) {
    const existing = userModel.findByEmail(email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = bcryptjs.hashSync(password, BCRYPT_ROUNDS);
    const user = userModel.create({ email, passwordHash, name, role: role || 'viewer' });
    const token = generateToken(user);

    return { user, token };
  },

  /**
   * Authenticate a user.
   * @param {{ email: string, password: string }} credentials
   * @returns {{ user: Object, token: string }}
   */
  login({ email, password }) {
    const user = userModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = bcryptjs.compareSync(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Strip password hash before returning
    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    return { user: safeUser, token };
  },

  /**
   * Get user profile by ID.
   * @param {number} userId
   * @returns {Object}
   */
  getProfile(userId) {
    const user = userModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }
    return user;
  },
};

/**
 * Generate a JWT for the given user.
 * @param {Object} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiry },
  );
}
