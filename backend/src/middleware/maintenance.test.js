import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { canAccessDuringMaintenance, maintenanceGate } from './maintenance.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto';

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('maintenance denies anonymous API requests', () => {
  process.env.MAINTENANCE_MODE = 'true';
  process.env.MAINTENANCE_ALLOWED_ADMINS = 'admin-test';
  const response = makeResponse();
  let continued = false;

  maintenanceGate({ method: 'GET', path: '/api/cuotas', headers: {} }, response, () => {
    continued = true;
  });

  assert.equal(continued, false);
  assert.equal(response.statusCode, 503);
});

test('maintenance permits only an allowlisted administrator', () => {
  process.env.MAINTENANCE_MODE = 'true';
  process.env.MAINTENANCE_ALLOWED_ADMINS = 'admin-test';
  const token = jwt.sign({ id: 1, rol: 'admin', usuario: 'ADMIN-TEST' }, JWT_SECRET);
  const response = makeResponse();
  let continued = false;

  maintenanceGate({
    method: 'GET',
    path: '/api/cuotas',
    headers: { authorization: `Bearer ${token}` }
  }, response, () => {
    continued = true;
  });

  assert.equal(continued, true);
  assert.equal(response.statusCode, 200);
});

test('maintenance blocks writes even for an allowlisted administrator', () => {
  process.env.MAINTENANCE_MODE = 'true';
  process.env.MAINTENANCE_ALLOWED_ADMINS = 'admin-test';
  const token = jwt.sign({ id: 1, rol: 'admin', usuario: 'admin-test' }, JWT_SECRET);
  const response = makeResponse();
  let continued = false;

  maintenanceGate({
    method: 'POST',
    path: '/api/cuotas',
    headers: { authorization: `Bearer ${token}` }
  }, response, () => {
    continued = true;
  });

  assert.equal(continued, false);
  assert.equal(response.statusCode, 503);
});

test('maintenance keeps health and login endpoints reachable for their own checks', () => {
  process.env.MAINTENANCE_MODE = 'true';
  const healthResponse = makeResponse();
  const loginResponse = makeResponse();
  let healthContinued = false;
  let loginContinued = false;

  maintenanceGate({ method: 'GET', path: '/api/health', headers: {} }, healthResponse, () => {
    healthContinued = true;
  });
  maintenanceGate({ method: 'POST', path: '/api/auth/login', headers: {} }, loginResponse, () => {
    loginContinued = true;
  });

  assert.equal(healthContinued, true);
  assert.equal(loginContinued, true);
});

test('maintenance allowlist requires an administrator and matches usernames case-insensitively', () => {
  process.env.MAINTENANCE_ALLOWED_ADMINS = 'admin-test';

  assert.equal(canAccessDuringMaintenance({ rol: 'admin', usuario: 'ADMIN-TEST' }), true);
  assert.equal(canAccessDuringMaintenance({ rol: 'revisor', usuario: 'admin-test' }), false);
  assert.equal(canAccessDuringMaintenance({ rol: 'admin', usuario: 'other-admin' }), false);
});