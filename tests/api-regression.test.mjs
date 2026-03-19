import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 3100 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${PORT}`;
const adminEmail = `admin.automation.${Date.now()}@example.com`;

let serverProcess;
let serverOutput = '';

async function waitForServer() {
  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('Server did not become ready in time');
}

async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { response, body };
}

test.before(async () => {
  serverProcess = spawn('./node_modules/.bin/tsx', ['server.ts'], {
    env: { ...process.env, PORT: String(PORT), DISABLE_HMR: 'true', NODE_ENV: 'test', APP_URL: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', chunk => {
    serverOutput += chunk.toString();
  });

  serverProcess.stderr.on('data', chunk => {
    serverOutput += chunk.toString();
  });

  await waitForServer();
});

test.after(() => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
});

test.after(async () => {
  if (!serverProcess) return;

  await new Promise(resolve => {
    if (serverProcess.killed || serverProcess.exitCode !== null) {
      serverProcess.stdout?.destroy();
      serverProcess.stderr?.destroy();
      resolve();
      return;
    }

    serverProcess.once('exit', () => {
      serverProcess.stdout?.destroy();
      serverProcess.stderr?.destroy();
      resolve();
    });
    setTimeout(() => {
      if (serverProcess.exitCode === null) {
        serverProcess.kill('SIGKILL');
      }
    }, 2000);
  });
});

test('admin registration returns companyId and invite company lookup works', async () => {
  const register = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'QA Automation Ltda',
      userName: 'Admin Automation',
      email: adminEmail,
      password: 'Senha123!',
      plan: 'basic',
    }),
  });

  assert.equal(register.response.status, 201);
  assert.ok(register.body.token);
  assert.ok(register.body.user.companyId);

  const company = await api(`/api/auth/company/${register.body.user.companyId}`);
  assert.equal(company.response.status, 200);
  assert.equal(company.body.name, 'QA Automation Ltda');
});

test('forgot-password uses local host fallback when APP_URL is missing', async () => {
  const forgot = await api('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail }),
  });

  assert.equal(forgot.response.status, 200);

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !serverOutput.includes('/reset-password/')) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  assert.match(serverOutput, new RegExp(`${baseUrl}/reset-password/[a-f0-9]{40}`));
});

test('register rejects weak passwords', async () => {
  const weak = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Weak Password Ltda',
      userName: 'Admin Fraco',
      email: `weak.${Date.now()}@example.com`,
      password: 'senha123',
      plan: 'basic'
    })
  });

  assert.equal(weak.response.status, 400);
  assert.match(weak.body.message, /letra maiúscula/i);
});
