import { createApp } from './app.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Teezo API listening on port ${config.port}`);
});