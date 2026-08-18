import { jest, describe, test, expect, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import prisma from '../config/prisma.js';

describe('Swiss Bank API Integration Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('unauthenticated access is rejected with 401', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(401);
  });

  test('register, login, and openAccount', async () => {
    const email = `testuser_${Date.now()}@bank.app`;
    
    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Integration Tester',
        email,
        password: 'password123',
        phone: '9876500000',
        dateOfBirth: '1995-05-15',
        panNumber: 'ABCDE1234F',
        address: '1 Swiss Way, Zurich',
      });
    expect(regRes.status).toBe(201);
    expect(regRes.body.email).toBe(email);

    // Login
    const userAgent = request.agent(app);
    const loginRes = await userAgent
      .post('/api/auth/login')
      .send({ email, password: 'password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe(email);

    // Open Account
    const openRes = await userAgent
      .post('/api/accounts')
      .send({
        holderName: 'Integration Tester',
        openingBalance: '1000.00',
        pin: '4321',
      });
    expect(openRes.status).toBe(201);
    expect(openRes.body.accountNumber).toBeDefined();
    expect(openRes.body.balance).toBe(1000.0);

    // List Accounts
    const listRes = await userAgent.get('/api/accounts');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
    const createdAcct = listRes.body.find((a) => a.accountNumber === openRes.body.accountNumber);
    expect(createdAcct).toBeDefined();
    expect(createdAcct.balance).toBe(1000.0);
  }, 30000);

  test('transfer moves money and writes double-entry ledger', async () => {
    const email = `transfer_${Date.now()}@bank.app`;
    const userAgent = request.agent(app);

    await userAgent.post('/api/auth/register').send({
      fullName: 'Transfer Tester',
      email,
      password: 'password123',
      phone: '9876511111',
      dateOfBirth: '1994-01-01',
      panNumber: 'TRANS1234F',
      address: 'Zurich Test',
    });

    await user
});
