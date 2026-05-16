/**
 * @fileoverview File upload routes for agent analysis.
 */

import { Router } from 'express';
import { requireAuth as authMiddleware } from '../middleware/auth.js';
import { auditLogModel } from '../models/auditLog.model.js';
import { AUDIT_EVENTS } from '@aios/shared/constants';
import config from '../config/index.js';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const router = Router();

// Ensure upload dir exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * POST /upload — Upload a file for agent analysis.
 * Accepts raw text body with Content-Type headers.
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const contentType = req.headers['content-type'] || '';

    let fileName = req.headers['x-file-name'] || 'upload.txt';
    let fileContent = '';

    // Handle JSON body with file content
    if (contentType.includes('application/json')) {
      const { name, content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'No file content provided' });
      }
      fileName = name || 'upload.txt';
      fileContent = content;
    } else {
      // Handle raw text upload
      fileContent = req.body?.toString() || '';
    }

    if (!fileContent || fileContent.length === 0) {
      return res.status(400).json({ error: 'Empty file' });
    }

    // Check file extension
    const ext = path.extname(fileName).toLowerCase();
    if (!config.upload.allowedTypes.includes(ext)) {
      return res.status(400).json({
        error: `File type ${ext} not allowed. Allowed: ${config.upload.allowedTypes.join(', ')}`,
      });
    }

    // Check size
    if (Buffer.byteLength(fileContent) > config.upload.maxSize) {
      return res.status(400).json({
        error: `File too large. Max size: ${config.upload.maxSize / 1024}KB`,
      });
    }

    // Save file
    const fileId = randomUUID();
    const storedName = `${fileId}${ext}`;
    const filePath = path.join(uploadDir, storedName);
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    // Audit log
    auditLogModel.create({
      eventType: AUDIT_EVENTS.FILE_UPLOADED,
      userId: req.user.id,
      action: `File uploaded: ${fileName}`,
      details: { fileId, fileName, size: Buffer.byteLength(fileContent), ext },
      result: 'success',
    });

    res.status(201).json({
      fileId,
      fileName,
      size: Buffer.byteLength(fileContent),
      ext,
      message: 'File uploaded successfully. Include fileId in your chat message for agent analysis.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /upload/:fileId — Retrieve file content.
 */
router.get('/:fileId', authMiddleware, (req, res, next) => {
  try {
    const { fileId } = req.params;

    // Find file
    const files = fs.readdirSync(uploadDir);
    const match = files.find((f) => f.startsWith(fileId));

    if (!match) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadDir, match);
    const content = fs.readFileSync(filePath, 'utf-8');

    res.json({ fileId, content, size: content.length });
  } catch (error) {
    next(error);
  }
});

export default router;
