import { db } from '../db/client.js';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = '/data/backups';
const MAX_BACKUPS = 7;

export function runBackup(): void {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const filename = `backup-${new Date().toISOString().split('T')[0]}.db`;
    const dest = path.join(BACKUP_DIR, filename);

    db.run(`VACUUM INTO '${dest}'`);
    logger.info(`💾 DB backup created: ${filename}`);

    // Rotate: keep only last 7
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('backup-'))
      .sort();

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(0, files.length - MAX_BACKUPS);
      for (const f of toDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        logger.info(`🗑️ Old backup deleted: ${f}`);
      }
    }
  } catch (error) {
    logger.error({ err: error }, '❌ DB backup failed');
  }
}
