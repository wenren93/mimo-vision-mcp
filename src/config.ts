import { config as loadDotEnv } from 'dotenv';
import path from 'node:path';

loadDotEnv({ path: path.resolve(process.cwd(), '.env'), quiet: true });

export interface AssetConfig {
  assetRoot: string;
  maxFileBytes: number;
  maxPixels: number;
}

export interface VisionRuntimeConfig extends AssetConfig {
  mimoApiKey: string;
  mimoBaseUrl: string;
  visionModel: string;
  timeoutMs: number;
}

export interface AgentRuntimeConfig extends VisionRuntimeConfig {
  deepSeekApiKey: string;
  deepSeekBaseUrl: string;
  textModel: string;
}

function positiveNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
}

function requiredSecret(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value === 'replace_me') {
    throw new Error(`${name} is required; copy .env.example to .env and set it`);
  }
  return value;
}

function normalizedBaseUrl(name: string, fallback: string): string {
  return (process.env[name] ?? fallback).trim().replace(/\/+$/, '');
}

export function loadAssetConfig(): AssetConfig {
  return {
    assetRoot: path.resolve(process.env.VISION_ASSET_ROOT ?? './assets'),
    maxFileBytes: Math.floor(positiveNumber('VISION_MAX_FILE_MB', 10) * 1024 * 1024),
    maxPixels: Math.floor(positiveNumber('VISION_MAX_PIXELS', 40_000_000)),
  };
}

export function loadVisionRuntimeConfig(): VisionRuntimeConfig {
  return {
    ...loadAssetConfig(),
    mimoApiKey: requiredSecret('MIMO_API_KEY'),
    mimoBaseUrl: normalizedBaseUrl('MIMO_BASE_URL', 'https://api.xiaomimimo.com/anthropic'),
    visionModel: process.env.VISION_MODEL?.trim() || 'mimo-v2.5',
    timeoutMs: Math.floor(positiveNumber('VISION_TIMEOUT_MS', 45_000)),
  };
}

export function loadAgentRuntimeConfig(): AgentRuntimeConfig {
  return {
    ...loadVisionRuntimeConfig(),
    deepSeekApiKey: requiredSecret('DEEPSEEK_API_KEY'),
    deepSeekBaseUrl: normalizedBaseUrl('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/anthropic'),
    textModel: process.env.TEXT_MODEL?.trim() || 'deepseek-v4-pro',
  };
}

const MCP_SERVER_ENV_KEYS = [
  'MIMO_API_KEY',
  'MIMO_BASE_URL',
  'VISION_MODEL',
  'VISION_ASSET_ROOT',
  'VISION_MAX_FILE_MB',
  'VISION_MAX_PIXELS',
  'VISION_TIMEOUT_MS',
  'PATH',
  'HOME',
  'USER',
] as const;

export function childProcessEnv(): Record<string, string> {
  return Object.fromEntries(
    MCP_SERVER_ENV_KEYS.map((key) => [key, process.env[key]] as const).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}
