import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AppConfig } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configPath = path.resolve(__dirname, '../../config.json');

function loadConfig(): AppConfig {
  if (!fs.existsSync(configPath)) {
    return {
      default_topic: '人工智能会取代人类工作吗？',
      default_rounds: 3,
    };
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

export function getDefaultConfig(): { topic: string; rounds: number } {
  const config = loadConfig();
  return {
    topic: config.default_topic || '人工智能会取代人类工作吗？',
    rounds: config.default_rounds || 3,
  };
}
