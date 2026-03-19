import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 3600 + Math.floor(Math.random() * 400);
const baseUrl = `http://127.0.0.1:${PORT}`;
let serverProcess;

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
    env: { ...process.env, PORT: String(PORT), DISABLE_HMR: 'true', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await waitForServer();
});

test.after(async () => {
  if (!serverProcess) return;
  if (serverProcess.exitCode === null) {
    serverProcess.kill('SIGTERM');
  }
  await new Promise(resolve => {
    serverProcess.once('exit', resolve);
    setTimeout(() => {
      if (serverProcess.exitCode === null) serverProcess.kill('SIGKILL');
    }, 2000);
  });
});

async function withServer(env, run) {
  const port = 4100 + Math.floor(Math.random() * 400);
  const localBaseUrl = `http://127.0.0.1:${port}`;
  const processRef = spawn('./node_modules/.bin/tsx', ['server.ts'], {
    env: { ...process.env, PORT: String(port), DISABLE_HMR: 'true', NODE_ENV: 'test', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const localApi = async (path, options = {}) => {
    const response = await fetch(`${localBaseUrl}${path}`, options);
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { response, body };
  };

  const waitForLocalServer = async () => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(`${localBaseUrl}/api/health`);
        if (response.ok) return;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('Local test server did not become ready in time');
  };

  try {
    await waitForLocalServer();
    await run(localApi);
  } finally {
    if (processRef.exitCode === null) {
      processRef.kill('SIGTERM');
    }
    await new Promise(resolve => {
      processRef.once('exit', resolve);
      setTimeout(() => {
        if (processRef.exitCode === null) processRef.kill('SIGKILL');
      }, 2000);
    });
  }
}

test('admin settings cannot directly change plan or employee limit', async () => {
  const stamp = Date.now();
  const register = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Safety Corp',
      userName: 'Admin Safety',
      email: `admin.safety.${stamp}@example.com`,
      password: 'Senha123!',
      plan: 'basic'
    })
  });

  assert.equal(register.response.status, 201);
  const token = register.body.token;

  const update = await api('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Safety Corp Updated',
      email: `admin.safety.${stamp}@example.com`,
      phone: '11999999999',
      address: 'Rua Teste',
      plan: 'enterprise',
      employeesLimit: 999
    })
  });

  assert.equal(update.response.status, 200);
  assert.equal(update.body.name, 'Safety Corp Updated');
  assert.equal(update.body.plan, 'basic');
  assert.equal(update.body.employeesLimit, 10);
});

test('employee forgot password returns a reset link in development', async () => {
  const stamp = Date.now() + 1;
  const register = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Access Corp',
      userName: 'Admin Access',
      email: `admin.access.${stamp}@example.com`,
      password: 'Senha123!',
      plan: 'basic'
    })
  });

  assert.equal(register.response.status, 201);
  const companyId = register.body.user.companyId;

  const employee = await api('/api/auth/register-employee', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId,
      name: 'Funcionario Teste',
      email: `func.access.${stamp}@example.com`,
      password: 'Senha123!'
    })
  });

  assert.equal(employee.response.status, 201);

  const forgot = await api('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `func.access.${stamp}@example.com`
    })
  });

  assert.equal(forgot.response.status, 200);
  assert.match(forgot.body.resetUrl, /\/reset-password\/[a-f0-9]{40}$/);
});

test('payment simulation works in non-production for the authenticated admin', async () => {
  const stamp = Date.now() + 2;
  const register = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: 'Payment Corp',
      userName: 'Admin Payment',
      email: `admin.payment.${stamp}@example.com`,
      password: 'Senha123!',
      plan: 'professional'
    })
  });

  assert.equal(register.response.status, 201);
  const adminToken = register.body.token;

  const simulate = await api('/api/payments/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });

  assert.equal(simulate.response.status, 200);

  const history = await api('/api/payments/history?page=1&limit=10', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  assert.equal(history.response.status, 200);
  assert.equal(history.body.payments.length, 1);
  assert.equal(history.body.payments[0].status, 'approved');
  assert.equal(history.body.payments[0].paymentMethod, 'simulation');
});

test('expired trial blocks admin operations but keeps settings and payments accessible', async () => {
  await withServer({ MONGODB_URI: '', TRIAL_DAYS: '0', APP_URL: '' }, async (localApi) => {
    const stamp = Date.now() + 3;
    const register = await localApi('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Blocked Corp',
        userName: 'Admin Blocked',
        email: `admin.blocked.${stamp}@example.com`,
        password: 'Senha123!',
        plan: 'basic'
      })
    });

    assert.equal(register.response.status, 201);
    const token = register.body.token;

    const settings = await localApi('/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(settings.response.status, 200);
    assert.equal(settings.body.subscriptionStatus, 'blocked');

    const dashboard = await localApi('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(dashboard.response.status, 200);
    assert.equal(dashboard.body.accessBlocked, true);

    const employees = await localApi('/api/admin/employees', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(employees.response.status, 402);
    assert.equal(employees.body.code, 'SUBSCRIPTION_BLOCKED');

    const payments = await localApi('/api/payments/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.equal(payments.response.status, 200);
  });
});
