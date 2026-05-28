#!/usr/bin/env node

import { execSync } from 'node:child_process';
import process from 'node:process';

const FRONTEND_PORT = 26528;
const BACKEND_PORT = 26529;

const isWin = process.platform === 'win32';

function killByPort(port) {
  try {
    if (isWin) {
      // Windows: netstat -ano | findstr :PORT
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', windowsHide: true });
      const lines = output.split(/\r?\n/).filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const state = parts[3];
        const pid = parts[4];
        if (state === 'LISTENING' && pid) {
          pids.add(pid);
        }
      }
      return [...pids];
    } else {
      // macOS / Linux: lsof -ti :PORT
      const output = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
      return output.split(/\r?\n/).filter(Boolean);
    }
  } catch {
    return [];
  }
}

function killPids(pids, port) {
  for (const pid of pids) {
    try {
      if (isWin) {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore', windowsHide: true });
      } else {
        process.kill(Number(pid), 'SIGTERM');
      }
      console.log(`已停止端口 ${port} 的进程 (PID: ${pid})`);
    } catch {
      console.log(`无法停止端口 ${port} 的进程 (PID: ${pid})`);
    }
  }
}

console.log('正在停止服务...\n');

const backendPids = killByPort(BACKEND_PORT);
const frontendPids = killByPort(FRONTEND_PORT);

if (backendPids.length === 0 && frontendPids.length === 0) {
  console.log('未找到占用前端或后端端口的进程。');
  process.exit(0);
}

killPids(backendPids, BACKEND_PORT);
killPids(frontendPids, FRONTEND_PORT);

console.log('\n服务已停止。');
