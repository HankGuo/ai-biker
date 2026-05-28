#!/usr/bin/env node

import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';

const devMode = process.argv.includes('--dev');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const root = process.cwd();

const FRONTEND_DEFAULT_PORT = 26528;
const BACKEND_DEFAULT_PORT = 26529;

const requestedBackendPort = readPort(process.env.BACKEND_PORT || process.env.PORT, BACKEND_DEFAULT_PORT);
const requestedFrontendPort = readPort(process.env.FRONTEND_PORT, FRONTEND_DEFAULT_PORT);

const backendFree = await isFree(requestedBackendPort);
const frontendFree = await isFree(requestedFrontendPort);

let hasError = false;

if (!backendFree) {
  console.error(`\n错误: 后端端口 ${requestedBackendPort} 已被占用。`);
  console.error('请关闭占用该端口的进程，或设置环境变量 BACKEND_PORT 指定其他端口。');
  console.error(`示例: BACKEND_PORT=26539 npm run start\n`);
  hasError = true;
}

if (!frontendFree) {
  console.error(`\n错误: 前端端口 ${requestedFrontendPort} 已被占用。`);
  console.error('请关闭占用该端口的进程，或设置环境变量 FRONTEND_PORT 指定其他端口。');
  console.error(`示例: FRONTEND_PORT=26538 npm run start\n`);
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

const backendPort = requestedBackendPort;
const frontendPort = requestedFrontendPort;

console.log(`后端: http://localhost:${backendPort}`);
console.log(`前端: http://localhost:${frontendPort}`);
console.log('');

const env = {
  ...process.env,
  BACKEND_PORT: String(backendPort),
  PORT: String(backendPort),
  FRONTEND_PORT: String(frontendPort),
  VITE_API_TARGET: `http://localhost:${backendPort}`,
};

const backend = spawn(npmCommand, ['run', devMode ? 'dev' : 'start'], {
  cwd: `${root}/backend`,
  env,
  stdio: 'inherit',
});

const frontend = spawn(npmCommand, ['run', devMode ? 'dev' : 'start'], {
  cwd: `${root}/frontend`,
  env,
  stdio: 'inherit',
});

const children = [backend, frontend];
let stopping = false;

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (stopping) return;

    const failed = code !== 0 && code !== null;
    if (failed) {
      console.error(`子进程退出: code=${code}${signal ? ` signal=${signal}` : ''}`);
    }
    stopAll(failed ? code : 0);
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

function readPort(value, fallback) {
  if (!value) return fallback;
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback;
}

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

function stopAll(code) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }

  const timer = setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill('SIGKILL');
    }
  }, 3000);
  timer.unref();

  process.exitCode = code;
}
