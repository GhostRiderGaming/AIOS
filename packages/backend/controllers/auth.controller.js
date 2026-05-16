/**
 * @fileoverview Auth controller — thin request handlers for auth routes.
 */

import { authService } from '../services/auth.service.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { user, token } = authService.register(req.body);
      res
        .cookie('token', token, { httpOnly: true, maxAge: 86400000 })
        .status(201)
        .json({ data: { user, token } });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { user, token } = authService.login(req.body);
      res
        .cookie('token', token, { httpOnly: true, maxAge: 86400000 })
        .json({ data: { user, token } });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = authService.getProfile(req.user.id);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  },
};
