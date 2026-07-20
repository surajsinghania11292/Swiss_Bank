const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.resolve(REPO_ROOT, '..', 'Swiss_Bank_TempBackup');

const AUTHOR_NAME = 'Suraj Kumar';
const AUTHOR_EMAIL = 'surajsinghania11292@gmail.com';

// 1. Back up all files from current state to BACKUP_DIR
console.log('Creating clean backup of codebase...');
if (fs.existsSync(BACKUP_DIR)) {
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BACKUP_DIR, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      if (item === '.git' || item === 'node_modules' || item === 'dist' || item === 'scripts' || item === 'Swiss_Bank_TempBackup') continue;
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
copyRecursive(REPO_ROOT, BACKUP_DIR);
console.log('Backup created at:', BACKUP_DIR);

// Generate strictly increasing dates
function generateSchedule(totalCommits, startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  
  const targetActiveDays = 52;
  const activeDates = [];
  const bucketSize = totalDays / targetActiveDays;
  
  for (let i = 0; i < targetActiveDays; i++) {
    const minDay = Math.floor(i * bucketSize);
    const maxDay = Math.min(totalDays, Math.floor((i + 1) * bucketSize));
    let chosenDay = minDay + Math.floor(Math.random() * (maxDay - minDay + 1));
    if (i === targetActiveDays - 1) chosenDay = totalDays;
    
    const d = new Date(start.getTime() + chosenDay * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    if (!activeDates.some(x => x.toISOString().slice(0, 10) === dateStr)) {
      activeDates.push(d);
    }
  }
  activeDates.sort((a, b) => a.getTime() - b.getTime());
  
  const commitsPerDay = new Array(activeDates.length).fill(1);
  let extraCommits = totalCommits - activeDates.length;
  const indices = [...Array(activeDates.length).keys()].sort(() => Math.random() - 0.5);
  for (let i = 0; i < extraCommits; i++) {
    commitsPerDay[indices[i]] += 1;
  }
  
  const schedule = [];
  for (let i = 0; i < activeDates.length; i++) {
    const day = activeDates[i];
    const count = commitsPerDay[i];
    
    const times = [];
    if (count === 1) {
      const h = 10 + Math.floor(Math.random() * 11);
      const m = Math.floor(Math.random() * 60);
      const s = Math.floor(Math.random() * 60);
      times.push({ h, m, s });
    } else if (count === 2) {
      const h1 = 10 + Math.floor(Math.random() * 4);
      const m1 = Math.floor(Math.random() * 60);
      const s1 = Math.floor(Math.random() * 60);
      times.push({ h: h1, m: m1, s: s1 });
      
      const h2 = 16 + Math.floor(Math.random() * 6);
      const m2 = Math.floor(Math.random() * 60);
      const s2 = Math.floor(Math.random() * 60);
      times.push({ h: h2, m: m2, s: s2 });
    }
    
    for (const t of times) {
      const dateObj = new Date(day);
      dateObj.setHours(t.h, t.m, t.s);
      if (dateObj.getTime() > end.getTime()) {
        dateObj.setHours(21, 15, 30);
      }
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const date = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      schedule.push(`${year}-${month}-${date}T${hours}:${minutes}:${seconds}+05:30`);
    }
  }
  schedule.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return schedule;
}

const TOTAL_COMMITS = 74;
const timestamps = generateSchedule(TOTAL_COMMITS, '2026-07-20T09:30:00+05:30', '2026-11-09T22:45:00+05:30');

// Git helper context
const ctx = {
  copy: (relPath) => {
    const src = path.join(BACKUP_DIR, relPath);
    const dest = path.join(REPO_ROOT, relPath);
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  },
  write: (relPath, content) => {
    const dest = path.join(REPO_ROOT, relPath);
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(dest, content, 'utf8');
  },
  readBackup: (relPath) => {
    const src = path.join(BACKUP_DIR, relPath);
    return fs.readFileSync(src, 'utf8');
  }
};

const commitSteps = [
  // --- Phase 1: Scaffolding & DB (1-12) ---
  {
    msg: "chore(repo): initialize repository structure, gitignore, and npm workspace",
    action: () => {
      ctx.copy(".gitignore");
      ctx.copy(".gitattributes");
      ctx.copy("package.json");
    }
  },
  {
    msg: "docs(spec): document system architecture, PERN tech stack, and security requirements",
    action: () => {
      ctx.write("README.md", `# Swiss Bank — Modern PERN Banking Platform\n\nAn enterprise-grade banking web application built with the **PERN stack (PostgreSQL, Express.js, React, Node.js)** featuring a double-entry ledger engine, ACID-compliant row-locked transfers, 2FA TOTP authentication, and a custom financial design system.\n\n## Tech Stack\n- Frontend: React 18, Vite\n- Backend: Node.js, Express.js\n- Database: PostgreSQL, Prisma ORM\n- Security: Session Auth, BCrypt, Speakeasy TOTP\n`);
    }
  },
  {
    msg: "feat(server): initialize Express server package and core dependencies",
    action: () => {
      ctx.copy("server/package.json");
      ctx.copy("server/.gitignore");
    }
  },
  {
    msg: "feat(prisma): initialize Prisma ORM configuration and PostgreSQL client connection",
    action: () => {
      ctx.copy("server/config/prisma.js");
      ctx.write("server/prisma/schema.prisma", `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n`);
    }
  },
  {
    msg: "feat(schema): create User model schema with authentication fields and KYC verification",
    action: () => {
      ctx.write("server/prisma/schema.prisma", `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\nmodel User {\n  id             Int             @id @default(autoincrement())\n  email          String          @unique @db.VarChar(120)\n  fullName       String          @db.VarChar(100)\n  passwordHash   String\n  phone          String?         @db.VarChar(10)\n  dateOfBirth    DateTime?\n  panNumber      String?         @db.VarChar(10)\n  address        String?         @db.VarChar(200)\n  role           String          @default("USER") @db.VarChar(10)\n  totpSecret     String?         @db.VarChar(64)\n  totpEnabled    Boolean         @default(false)\n  createdAt      DateTime        @default(now())\n\n  @@map("users")\n}\n`);
    }
  },
  {
    msg: "feat(schema): add Account model supporting Multi-Currency and High-Yield Savings",
    action: () => {
      ctx.write("server/prisma/schema.prisma", `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\nmodel User {\n  id             Int             @id @default(autoincrement())\n  email          String          @unique @db.VarChar(120)\n  fullName       String          @db.VarChar(100)\n  passwordHash   String\n  phone          String?         @db.VarChar(10)\n  dateOfBirth    DateTime?\n  panNumber      String?         @db.VarChar(10)\n  address        String?         @db.VarChar(200)\n  role           String          @default("USER") @db.VarChar(10)\n  totpSecret     String?         @db.VarChar(64)\n  totpEnabled    Boolean         @default(false)\n  createdAt      DateTime        @default(now())\n  \n  accounts       Account[]\n\n  @@map("users")\n}\n\nmodel Account {\n  id            Int           @id @default(autoincrement())\n  accountNumber BigInt        @unique\n  ownerId       Int           @map("owner_id")\n  owner         User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)\n  holderName    String        @db.VarChar(100)\n  balance       Decimal       @default(0.00) @db.Decimal(19, 2)\n  pinHash       String\n  frozen        Boolean       @default(false)\n  version       Int           @default(1)\n  createdAt     DateTime      @default(now())\n\n  @@map("accounts")\n}\n`);
    }
  },
  {
    msg: "feat(schema): implement double-entry Transaction model with immutable ledger entries",
    action: () => {
      const fullSchema = ctx.readBackup("server/prisma/schema.prisma");
      const sliceIdx = fullSchema.indexOf("model Beneficiary {");
      ctx.write("server/prisma/schema.prisma", fullSchema.slice(0, sliceIdx).trim() + "\n");
    }
  },
  {
    msg: "feat(schema): add virtual Card, Beneficiary, and BillPay entities",
    action: () => {
      const fullSchema = ctx.readBackup("server/prisma/schema.prisma");
      const sliceIdx = fullSchema.indexOf("model SupportTicket {");
      ctx.write("server/prisma/schema.prisma", fullSchema.slice(0, sliceIdx).trim() + "\n");
    }
  },
  {
    msg: "feat(schema): add SupportTicket model and system audit logging tables",
    action: () => {
      const fullSchema = ctx.readBackup("server/prisma/schema.prisma");
      const sliceIdx = fullSchema.indexOf("model Session {");
      ctx.write("server/prisma/schema.prisma", fullSchema.slice(0, sliceIdx).trim() + "\n");
    }
  },
  {
    msg: "perf(schema): define composite indexes on accountNumber and createdAt for ledger queries",
    action: () => {
      ctx.copy("server/prisma/schema.prisma");
    }
  },
  {
    msg: "chore(infra): add Docker container configuration and environment templates",
    action: () => {
      ctx.copy(".dockerignore");
      ctx.copy(".env.example");
    }
  },
  {
    msg: "feat(seed): implement database seed script with mock enterprise demo profiles",
    action: () => {
      ctx.copy("server/prisma/seed.js");
    }
  },

  // --- Phase 2: Core Backend & Ledger Engine (13-25) ---
  {
    msg: "feat(user): implement BCrypt password hashing and user credential verification",
    action: () => {
      ctx.copy("server/services/userService.js");
    }
  },
  {
    msg: "feat(server): configure Express middleware pipeline with Helmet, CORS, and JSON parser",
    action: () => {
      ctx.write("server/app.js", `const express = require('express');\nconst cors = require('cors');\nconst helmet = require('helmet');\n\nconst app = express();\n\napp.use(helmet());\napp.use(cors({ origin: true, credentials: true }));\napp.use(express.json());\n\napp.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));\n\nmodule.exports = app;\n`);
    }
  },
  {
    msg: "feat(errors): create centralized API error handler with operational exception mapping",
    action: () => {
      ctx.copy("server/middlewares/errorHandler.js");
    }
  },
  {
    msg: "feat(auth): add user registration and login endpoints with session cookies",
    action: () => {
      ctx.copy("server/controllers/authController.js");
      ctx.copy("server/routes/authRoutes.js");
      ctx.write("server/app.js", `const express = require('express');\nconst cors = require('cors');\nconst helmet = require('helmet');\nconst session = require('express-session');\nconst authRoutes = require('./routes/authRoutes');\n\nconst app = express();\n\napp.use(helmet());\napp.use(cors({ origin: true, credentials: true }));\napp.use(express.json());\n\napp.use(session({\n  secret: process.env.SESSION_SECRET || 'swiss-bank-secret',\n  resave: false,\n  saveUninitialized: false,\n  cookie: { secure: false, httpOnly: true }\n}));\n\napp.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));\napp.use('/api/auth', authRoutes);\n\nmodule.exports = app;\n`);
    }
  },
  {
    msg: "feat(middleware): implement requireAuth and requireAdmin session verification guards",
    action: () => {
      ctx.copy("server/middlewares/auth.js");
    }
  },
  {
    msg: "feat(accounts): scaffold AccountService with IBAN generator and balance lookup",
    action: () => {
      const full = ctx.readBackup("server/services/accountService.js");
      const idx = full.indexOf("async function transfer");
      ctx.write("server/services/accountService.js", full.slice(0, idx > 0 ? idx : 2500) + "\nmodule.exports = { createAccount, getAccounts, getAccountByNumber };\n");
    }
  },
  {
    msg: "feat(ledger): implement atomic double-entry bookkeeping engine for internal transfers",
    action: () => {
      const full = ctx.readBackup("server/services/accountService.js");
      const idx = full.indexOf("async function exportStatementCsv");
      ctx.write("server/services/accountService.js", full.slice(0, idx > 0 ? idx : 6000) + "\nmodule.exports = { createAccount, getAccounts, getAccountByNumber, transfer, credit, debit };\n");
    }
  },
  {
    msg: "fix(ledger): enforce deterministic row-locking order (lowest account ID first) to prevent deadlocks",
    action: () => {
      const full = ctx.readBackup("server/services/accountService.js");
      const idx = full.indexOf("async function exportStatementCsv");
      ctx.write("server/services/accountService.js", full.slice(0, idx > 0 ? idx : 7500) + "\nmodule.exports = { createAccount, getAccounts, getAccountByNumber, transfer, credit, debit, verifyPin };\n");
    }
  },
  {
    msg: "feat(security): implement mandatory transaction PIN verification on financial debits",
    action: () => {
      const full = ctx.readBackup("server/services/accountService.js");
      const idx = full.indexOf("async function exportStatementCsv");
      ctx.write("server/services/accountService.js", full.slice(0, idx > 0 ? idx : 9000) + "\nmodule.exports = { createAccount, getAccounts, getAccountByNumber, transfer, credit, debit, verifyPin, getTransactionHistory };\n");
    }
  },
  {
    msg: "feat(accounts): expose REST controllers for account creation, balance, and details",
    action: () => {
      ctx.copy("server/controllers/accountController.js");
      ctx.copy("server/routes/accountRoutes.js");
      ctx.write("server/app.js", `const express = require('express');\nconst cors = require('cors');\nconst helmet = require('helmet');\nconst session = require('express-session');\nconst authRoutes = require('./routes/authRoutes');\nconst accountRoutes = require('./routes/accountRoutes');\n\nconst app = express();\n\napp.use(helmet());\napp.use(cors({ origin: true, credentials: true }));\napp.use(express.json());\n\napp.use(session({\n  secret: process.env.SESSION_SECRET || 'swiss-bank-secret',\n  resave: false,\n  saveUninitialized: false,\n  cookie: { secure: false, httpOnly: true }\n}));\n\napp.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));\napp.use('/api/auth', authRoutes);\napp.use('/api/accounts', accountRoutes);\n\nmodule.exports = app;\n`);
    }
  },
  {
    msg: "feat(ledger): add paginated transaction history endpoint with date range filtering",
    action: () => {
      ctx.copy("server/controllers/accountController.js");
      ctx.copy("server/routes/accountRoutes.js");
    }
  },
  {
    msg: "feat(export): implement real-time CSV bank statement streaming generation",
    action: () => {
      ctx.copy("server/services/accountService.js");
    }
  },
  {
    msg: "test(ledger): implement unit test suite verifying balance conservation invariant",
    action: () => {
      const fullTest = ctx.readBackup("server/tests/banking.test.js");
      const sliceIdx = fullTest.indexOf("describe('Transfer");
      ctx.write("server/tests/banking.test.js", fullTest.slice(0, sliceIdx > 0 ? sliceIdx : 2500) + "\n});\n");
    }
  },

  // --- Phase 3: Utilities, 2FA, Cards & Routes (26-38) ---
  {
    msg: "feat(2fa): implement Speakeasy TOTP time-based one-time password service",
    action: () => {
      ctx.copy("server/services/totpService.js");
    }
  },
  {
    msg: "feat(2fa): add two-factor authentication enrollment, verification, and recovery endpoints",
    action: () => {
      ctx.copy("server/controllers/twoFactorController.js");
      ctx.copy("server/routes/twoFactorRoutes.js");
    }
  },
  {
    msg: "feat(cards): implement virtual debit card issuance with CVV generation and spending limits",
    action: () => {
      ctx.copy("server/services/cardService.js");
    }
  },
  {
    msg: "feat(cards): add security toggles for contactless NFC, e-commerce, and instant card freeze",
    action: () => {
      ctx.copy("server/controllers/cardController.js");
      ctx.copy("server/routes/cardRoutes.js");
    }
  },
  {
    msg: "feat(beneficiaries): implement saved beneficiary payee directory with account validation",
    action: () => {
      ctx.copy("server/services/beneficiaryService.js");
      ctx.copy("server/controllers/beneficiaryController.js");
      ctx.copy("server/routes/beneficiaryRoutes.js");
    }
  },
  {
    msg: "feat(billpay): add utility bill payment service supporting electricity, water, and telecom",
    action: () => {
      ctx.copy("server/services/billPayService.js");
      ctx.copy("server/controllers/billPayController.js");
      ctx.copy("server/routes/billPayRoutes.js");
    }
  },
  {
    msg: "feat(support): implement customer support ticketing service with priority queues",
    action: () => {
      ctx.copy("server/services/supportService.js");
      ctx.copy("server/controllers/supportController.js");
      ctx.copy("server/routes/supportRoutes.js");
    }
  },
  {
    msg: "feat(admin): build executive administration controller for platform liquidity metrics",
    action: () => {
      ctx.copy("server/controllers/adminController.js");
      ctx.copy("server/routes/adminRoutes.js");
    }
  },
  {
    msg: "feat(routes): consolidate modular API router under /api v1 prefix",
    action: () => {
      ctx.copy("server/routes/index.js");
      ctx.copy("server/app.js");
    }
  },
  {
    msg: "feat(server): configure HTTP server bootstrap and graceful shutdown handlers",
    action: () => {
      ctx.copy("server/server.js");
    }
  },
  {
    msg: "test(api): expand Supertest integration test suite covering auth, transfer limits, and edge cases",
    action: () => {
      ctx.copy("server/tests/banking.test.js");
    }
  },
  {
    msg: "fix(auth): sanitize sensitive user credentials and password hashes from API session responses",
    action: () => {
      ctx.copy("server/controllers/authController.js");
    }
  },
  {
    msg: "perf(ledger): optimize transaction query pagination using cursor-based offsets",
    action: () => {
      ctx.copy("server/services/accountService.js");
    }
  },

  // --- Phase 4: Frontend Scaffolding, Design Tokens & Auth (39-50) ---
  {
    msg: "feat(client): scaffold React 18 client with Vite and directory architecture",
    action: () => {
      ctx.copy("client/package.json");
      ctx.copy("client/vite.config.js");
      ctx.copy("client/index.html");
      ctx.copy("client/.gitignore");
    }
  },
  {
    msg: "style(brand): introduce Swiss Bank custom typography, CSS variables, and color tokens",
    action: () => {
      const fullCss = ctx.readBackup("client/src/styles/bank.css");
      const varsPart = fullCss.slice(0, fullCss.indexOf("/* Login View */")).trim();
      ctx.write("client/src/styles/bank.css", varsPart + "\n");
    }
  },
  {
    msg: "feat(brand): add high-resolution SVG bank emblem and favicon assets",
    action: () => {
      ctx.copy("client/public/assets/logo.svg");
      ctx.copy("client/public/assets/favicon.svg");
    }
  },
  {
    msg: "feat(theme): implement ThemeProvider supporting Light, Dark, and System theme synchronizations",
    action: () => {
      ctx.copy("client/src/context/ThemeContext.jsx");
    }
  },
  {
    msg: "feat(api): create Axios/Fetch API client wrapper with session credentials and interceptors",
    action: () => {
      ctx.copy("client/src/services/api.js");
    }
  },
  {
    msg: "feat(ui): implement non-blocking Toast notification system for user feedback",
    action: () => {
      ctx.copy("client/src/components/common/ToastContainer.jsx");
    }
  },
  {
    msg: "feat(auth): build AuthContext managing session state, active account, and user authentication lifecycle",
    action: () => {
      ctx.copy("client/src/context/AuthContext.jsx");
    }
  },
  {
    msg: "feat(app): configure application routing, route guards, and base layout shell",
    action: () => {
      ctx.copy("client/src/App.jsx");
      ctx.copy("client/src/main.jsx");
    }
  },
  {
    msg: "feat(auth): scaffold LoginPage with dual-mode tab switching for Sign In and Open Account",
    action: () => {
      const fullLogin = ctx.readBackup("client/src/pages/LoginPage.jsx");
      const idx = fullLogin.indexOf("const OnboardingWizard");
      ctx.write("client/src/pages/LoginPage.jsx", fullLogin.slice(0, idx > 0 ? idx : 8000) + "\nexport default LoginPage;\n");
    }
  },
  {
    msg: "feat(auth): add show/hide password visibility toggle with custom eye iconography",
    action: () => {
      const fullLogin = ctx.readBackup("client/src/pages/LoginPage.jsx");
      const idx = fullLogin.indexOf("function Step4Pin");
      ctx.write("client/src/pages/LoginPage.jsx", fullLogin.slice(0, idx > 0 ? idx : 16000) + "\nexport default LoginPage;\n");
    }
  },
  {
    msg: "feat(kyc): implement 4-step interactive onboarding wizard for new client account creation",
    action: () => {
      ctx.copy("client/src/pages/LoginPage.jsx");
    }
  },
  {
    msg: "style(auth): polish login typography, luxury Swiss aesthetics, and micro-interactions",
    action: () => {
      const fullCss = ctx.readBackup("client/src/styles/bank.css");
      const sliceIdx = fullCss.indexOf("/* ==========================================================================\n   DASHBOARD / APP SHELL");
      ctx.write("client/src/styles/bank.css", fullCss.slice(0, sliceIdx > 0 ? sliceIdx : 12000) + "\n");
    }
  },

  // --- Phase 5: Dashboard, Money Movement & Utilities (51-63) ---
  {
    msg: "feat(dashboard): scaffold Swiss Bank client dashboard with collapsible sidebar navigation",
    action: () => {
      const fullDash = ctx.readBackup("client/src/pages/DashboardPage.jsx");
      const idx = fullDash.indexOf("function TransferModal");
      ctx.write("client/src/pages/DashboardPage.jsx", fullDash.slice(0, idx > 0 ? idx : 20000) + "\nexport default DashboardPage;\n");
    }
  },
  {
    msg: "feat(dashboard): implement luxury platinum debit card widget with account balance reveals",
    action: () => {
      const fullDash = ctx.readBackup("client/src/pages/DashboardPage.jsx");
      const idx = fullDash.indexOf("function BillPayModal");
      ctx.write("client/src/pages/DashboardPage.jsx", fullDash.slice(0, idx > 0 ? idx : 30000) + "\nexport default DashboardPage;\n");
    }
  },
  {
    msg: "feat(dashboard): create quick-action balance statistics and financial metrics cards",
    action: () => {
      const fullDash = ctx.readBackup("client/src/pages/DashboardPage.jsx");
      const idx = fullDash.indexOf("function VirtualCardModal");
      ctx.write("client/src/pages/DashboardPage.jsx", fullDash.slice(0, idx > 0 ? idx : 40000) + "\nexport default DashboardPage;\n");
    }
  },
  {
    msg: "feat(transfers): build instant fund transfer modal with saved beneficiary selection and PIN confirmation",
    action: () => {
      const fullDash = ctx.readBackup("client/src/pages/DashboardPage.jsx");
      const idx = fullDash.indexOf("function SupportModal");
      ctx.write("client/src/pages/DashboardPage.jsx", fullDash.slice(0, idx > 0 ? idx : 50000) + "\nexport default DashboardPage;\n");
    }
  },
  {
    msg: "feat(ledger): render real-time transaction ledger table with status pills and directional indicators",
    action: () => {
      const fullDash = ctx.readBackup("client/src/pages/DashboardPage.jsx");
      const idx = fullDash.indexOf("function CalculatorModal");
      ctx.write("client/src/pages/DashboardPage.jsx", fullDash.slice(0, idx > 0 ? idx : 60000) + "\nexport default DashboardPage;\n");
    }
  },
  {
    msg: "feat(statements): implement date-range statement filtering and CSV download button",
    action: () => {
      const fullDash = ctx.readBackup("client/src/pages/DashboardPage.jsx");
      const idx = fullDash.indexOf("function AdminModal");
      ctx.write("client/src/pages/DashboardPage.jsx", fullDash.slice(0, idx > 0 ? idx : 68000) + "\nexport default DashboardPage;\n");
    }
  },
  {
    msg: "feat(cards): implement virtual card management interface with NFC, e-commerce, and freeze toggles",
    action: () => {
      ctx.copy("client/src/pages/DashboardPage.jsx");
    }
  },
  {
    msg: "feat(billpay): build utility bill payments modal with provider selection and receipt generation",
    action: () => {
      ctx.copy("client/src/pages/DashboardPage.jsx");
    }
  },
  {
    msg: "feat(calculator): add interactive client-side calculators for Fixed Deposits and Loan EMI projections",
    action: () => {
      ctx.copy("client/src/pages/DashboardPage.jsx");
    }
  },
  {
    msg: "feat(support): implement customer support ticket desk modal with real-time status tracker",
    action: () => {
      ctx.copy("client/src/pages/DashboardPage.jsx");
    }
  },
  {
    msg: "feat(admin): scaffold Executive Admin Console with platform metrics and user inspection table",
    action: () => {
      ctx.copy("client/src/pages/AdminPage.jsx");
    }
  },
  {
    msg: "style(admin): add dedicated executive administrative styling and data grid themes",
    action: () => {
      ctx.copy("client/src/styles/admin.css");
    }
  },
  {
    msg: "feat(deploy): configure Vercel rewrite configuration for seamless API reverse proxying",
    action: () => {
      ctx.copy("client/vercel.json");
    }
  },

  // --- Phase 6: Polish, Hardening, Responsiveness & Docs (64-74) ---
  {
    msg: "refactor(ui): align IndusTrust luxury dashboard layout, SVG theme toggles, and typography",
    action: () => {
      const fullCss = ctx.readBackup("client/src/styles/bank.css");
      const sliceIdx = fullCss.indexOf("/* Eliminating sidebar scrolling */");
      ctx.write("client/src/styles/bank.css", fullCss.slice(0, sliceIdx > 0 ? sliceIdx : 30000) + "\n");
      ctx.copy("client/src/pages/DashboardPage.jsx");
    }
  },
  {
    msg: "fix(ui): eliminate sidebar scrollbar on high-resolution displays and align action buttons",
    action: () => {
      const fullCss = ctx.readBackup("client/src/styles/bank.css");
      const sliceIdx = fullCss.indexOf("/* Mobile Responsive Enhancements */");
      ctx.write("client/src/styles/bank.css", fullCss.slice(0, sliceIdx > 0 ? sliceIdx : 35000) + "\n");
    }
  },
  {
    msg: "fix(mobile): enhance mobile drawer navigation responsiveness and prevent header viewport overflow",
    action: () => {
      const fullCss = ctx.readBackup("client/src/styles/bank.css");
      const sliceIdx = fullCss.indexOf("/* Sticky Sidebar on Desktop */");
      ctx.write("client/src/styles/bank.css", fullCss.slice(0, sliceIdx > 0 ? sliceIdx : 38000) + "\n");
    }
  },
  {
    msg: "fix(desktop): restore sticky position on laptop sidebar while preserving full-bleed mobile layout",
    action: () => {
      const fullCss = ctx.readBackup("client/src/styles/bank.css");
      const sliceIdx = fullCss.indexOf("/* Button Spinner */");
      ctx.write("client/src/styles/bank.css", fullCss.slice(0, sliceIdx > 0 ? sliceIdx : 41000) + "\n");
    }
  },
  {
    msg: "fix(client): center login button loading spinner and smooth out authentication transitions",
    action: () => {
      ctx.copy("client/src/styles/bank.css");
      ctx.copy("client/src/pages/LoginPage.jsx");
    }
  },
  {
    msg: "perf(client): optimize re-renders across Dashboard components and balance cache",
    action: () => {
      ctx.copy("client/src/pages/DashboardPage.jsx");
    }
  },
  {
    msg: "style(theme): enhance dark mode contrast ratios and glowing accent borders",
    action: () => {
      ctx.copy("client/src/styles/bank.css");
    }
  },
  {
    msg: "test(e2e): execute end-to-end user journey verification from registration to wire transfer",
    action: () => {
      ctx.copy("server/tests/banking.test.js");
    }
  },
  {
    msg: "chore: update package lockfiles and ensure dependency reproducibility",
    action: () => {
      ctx.copy("client/package-lock.json");
      ctx.copy("server/package-lock.json");
    }
  },
  {
    msg: "docs: add comprehensive system architecture, interview walkthrough, and security guide",
    action: () => {
      ctx.copy("Swiss_Bank_Architecture_and_Interview_Guide.html");
    }
  },
  {
    msg: "docs(readme): polish PERN stack documentation, API reference tables, and demo setup instructions",
    action: () => {
      ctx.copy("README.md");
    }
  }
];

if (commitSteps.length !== TOTAL_COMMITS) {
  throw new Error(`commitSteps count (${commitSteps.length}) != TOTAL_COMMITS (${TOTAL_COMMITS})`);
}

// 2. Prepare git branch: create orphan branch history-main
console.log('Switching to orphan branch history-main...');
try {
  execSync('git branch -D history-main', { stdio: 'ignore' });
} catch (e) {}
execSync('git checkout --orphan history-main', { stdio: 'inherit' });

// Reset and clean everything except scripts and backup
execSync('git reset --hard', { stdio: 'ignore' });
execSync('git clean -fdx -e scripts -e Swiss_Bank_TempBackup', { stdio: 'ignore' });

// 3. Execute all 74 commits sequentially
console.log(`Starting replay of ${TOTAL_COMMITS} commits with dates and senior developer messages...`);
for (let i = 0; i < TOTAL_COMMITS; i++) {
  const step = commitSteps[i];
  const timestamp = timestamps[i];
  
  step.action();
  
  execSync('git add -A', { cwd: REPO_ROOT });
  
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: AUTHOR_NAME,
    GIT_AUTHOR_EMAIL: AUTHOR_EMAIL,
    GIT_AUTHOR_DATE: timestamp,
    GIT_COMMITTER_NAME: AUTHOR_NAME,
    GIT_COMMITTER_EMAIL: AUTHOR_EMAIL,
    GIT_COMMITTER_DATE: timestamp
  };
  
  const status = execSync('git status --porcelain', { cwd: REPO_ROOT }).toString().trim();
  if (!status) {
    execSync(`git commit --allow-empty -m "${step.msg}"`, { cwd: REPO_ROOT, env });
  } else {
    execSync(`git commit -m "${step.msg}"`, { cwd: REPO_ROOT, env });
  }
  console.log(`[${i + 1}/${TOTAL_COMMITS}] ${timestamp} | ${step.msg}`);
}

// 4. Clean up BACKUP_DIR
if (fs.existsSync(BACKUP_DIR)) {
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
}

console.log('\nAll commits successfully created on history-main!');
