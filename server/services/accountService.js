import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { ApiException } from '../middlewares/errorHandler.js';
import totpService from './totpService.js';

const HIGH_VALUE_THRESHOLD = 50000;

function newReference() {
  return 'TXN-' + crypto.randomUUID().substring(0, 8).toUpperCase();
}

async function generateUniqueAccountNumber() {
  while (true) {
    const num = Math.floor(10000000 + Math.random() * 90000000);
    const exists = await prisma.account.findUnique({
      where: { accountNumber: BigInt(num) },
    });
    if (!exists) {
      return BigInt(num);
    }
  }
}

export function toAccountResponse(account) {
  return {
    id: account.id,
    accountNumber: Number(account.accountNumber),
    holderName: account.holderName,
    balance: Number(account.balance),
    frozen: account.frozen,
    createdAt: account.createdAt ? account.createdAt.toISOString() : null,
  };
}

export function toLedgerEntryResponse(entry) {
  return {
    id: entry.id,
    type: entry.type,
    amount: Number(entry.amount),
    balanceAfter: Number(entry.balanceAfter),
    description: entry.description,
    reference: entry.reference,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
  };
}

export const accountService = {
  async myAccounts(owner) {
    const list = await prisma.account.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: 'desc' },
    });
    return list.map(toAccountResponse);
  },

  async getOwnedAccount(owner, accountNumber) {
    const acct = await prisma.account.findUnique({
      where: { accountNumber: BigInt(accountNumber) },
    });
    if (!acct) {
      throw ApiException.notFound('Account not found');
    }
    if (acct.ownerId !== owner.id) {
      throw ApiException.forbidden("You don't own this account");
    }
    return toAccountResponse(acct);
  },

  async history(owner, accountNumber, page = 0, size = 10) {
    const acct = await prisma.account.findUnique({
      where: { accountNumber: BigInt(accountNumber) },
    });
    if (!acct) {
      throw ApiException.notFound('Account not found');
    }
    if (acct.ownerId !== owner.id) {
      throw ApiException.forbidden("You don't own this account");
    }

    const take = Math.min(Number(size) || 10, 100);
    const skip = (Number(page) || 0) * take;

    const [totalElements, entries] = await Promise.a
module.exports = { createAccount, getAccounts, getAccountByNumber };
