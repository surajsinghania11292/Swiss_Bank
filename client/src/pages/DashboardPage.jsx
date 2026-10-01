import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../components/common/ToastContainer.jsx';
import { api, money, fmtAcct, fmtDate } from '../services/api.js';

export default function DashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Accounts state
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [allRecentEntries, setAllRecentEntries] = useState([]);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerMeta, setLedgerMeta] = useState({ totalPages: 1, totalElements: 0, first: true, last: true });

  // Beneficiaries, Billpay, Cards, Tickets state
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [cards, setCards] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [tickets, setTickets] = useState([]);

  // Modals & Action Forms
  const [modalOpen, setModalOpen] = useState(null); // 'openAccount' | 'deposit' | 'withdraw' | 'transfer' | 'addBeneficiary' | 'transfer2fa'
  const [loading, setLoading] = useState(false);

  // Form states
  const [newAccountForm, setNewAccountForm] = useState({ holderName: '', openingBalance: '1000', pin: '' });
  const [depositForm, setDepositForm] = useState({ accountNumber: '', amount: '', pin: '' });
  const [withdrawForm, setWithdrawForm] = useState({ accountNumber: '', amount: '', pin: '' });
  const [transferForm, setTransferForm] = useState({ fromAccountNumber: '', toAccountNumber: '', amount: '', pin: '', totpCode: '' });
  const [billForm, setBillForm] = useState({ accountNumber: '', category: 'Electricity', consumer: '', amount: '', pin: '' });
  const [benefForm, setBenefForm] = useState({ name: '', accountNumber: '', nickname: '' });
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [twofaSecret, setTwofaSecret] = useState('');
  const [twofaCode, setTwofaCode] = useState('');
  const [showTwofaSetup, setShowTwofaSetup] = useState(false);

  // FD / RD Calculator state
  const [fdType, setFdType] = useState('fd'); // 'fd' | 'rd'
  const [fdAmount, setFdAmount] = useState(100000);
  const [fdTenure, setFdTenure] = useState(24);
  const [fdRate, setFdRate] = useState(6.5);

  // Loan EMI Calculator state
  const [loanType, setLoanType] = useState('Personal');
  const [loanAmount, setLoanAmount] = useState(500000);
  const [loanTenure, setLoanTenure] = useState(36);
  const [loanRate, setLoanRate] = useState(10.5);

  // Load Accounts & Initial Data
  const loadAccounts = async () => {
    try {
      const data = await api('/api/accounts');
      setAccounts(data || []);
      if (data && data.length > 0) {
        if (!activeAccount || !data.some((a) => a.accountNumber === activeAccount.accountNumber)) {
          setActiveAccount(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    }
  };

  const loadLedger = async (acctNumber, page = 0) => {
    if (!acctNumber) return;
    try {
      const data = await api(`/api/accounts/${acctNumber}/history?page=${page}&size=8`);
      setLedgerEntries(data.content || []);
      setLedgerPage(data.page || 0);
      setLedgerMeta({
        totalPages: data.totalPages || 1,
        totalElements: data.totalElements || 0,
        first: data.first,
        last: data.last,
      });
    } catch (err) {
      console.error('Failed to load ledger', err);
    }
  };

  const loadAllRecentActivity = async () => {
    try {
      const accts = await api('/api/accounts');
      if (accts && accts.length > 0) {
        const promises = accts.map((a) =>
          api(`/api/accounts/${a.accountNumber}/history?page=0&size=10`).catch(() => ({ content: [] }))
        );
        const results = await Promise.all(promises);
        const combined = results.flatMap((r) => r.content || []);
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllRecentEntries(combined.slice(0, 8));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBeneficiaries = async () => {
    try {
      const data = await api('/api/beneficiaries');
      setBeneficiaries(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCards = async () => {
    try {
      const data = await api('/api/cards');
      setCards(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBillHistory = async () => {
    try {
      const data = await api('/api/billpay/history?page=0&size=8');
      setBillHistory(data.content || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTickets = async () => {
    try {
      const data = await api('/api/support/tickets');
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadBeneficiaries();
    loadCards();
    loadAllRecentActivity();
  }, []);

  useEffect(() => {
    if (activeAccount) {
      loadLedger(activeAccount.accountNumber, 0);
      setDepositForm((f) => ({ ...f, accountNumber: activeAccount.accountNumber }));
      setWithdrawForm((f) => ({ ...f, accountNumber: activeAccount.accountNumber }));
      setTransferForm((f) => ({ ...f, fromAccountNumber: activeAccount.accountNumber }));
      setBillForm((f) => ({ ...f, accountNumber: activeAccount.accountNumber }));
    }
  }, [activeAccount]);

  useEffect(() => {
    if (activeView === 'dashboard') loadAllRecentActivity();
    if (activeView === 'beneficiaries') loadBeneficiaries();
    if (activeView === 'cards') loadCards();
    if (activeView === 'billpay') loadBillHistory();
    if (activeView === 'support') loadTickets();
  }, [activeView]);

  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const recentMoneyIn = allRecentEntries
    .filter((e) => e.type === 'CREDIT')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const recentMoneyOut = allRecentEntries
    .filter((e) => e.type === 'DEBIT')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Handlers
  const handleOpenAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await api('/api/accounts', {
        method: 'POST',
        body: JSON.stringify(newAccountForm),
      });
      toast(`Account #${created.accountNumber} opened successfully!`);
      setModalOpen(null);
      setNewAccountForm({ holderName: '', openingBalance: '1000', pin: '' });
      await loadAccounts();
      setActiveAccount(created);
    } catch (err) {
      toast(err.message || 'Failed to open account', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api('/api/accounts/credit', {
        method: 'POST',
        body: JSON.stringify(depositForm),
      });
      toast(`Deposited ₹${money(depositForm.amount)} successfully!`);
      setDepositForm({ ...depositForm, amount: '', pin: '' });
      setModalOpen(null);
      await loadAccounts();
      setActiveAccount(updated);
      loadLedger(updated.accountNumber, 0);
      loadAllRecentActivity();
    } catch (err) {
      toast(err.message || 'Deposit failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api('/api/accounts/debit', {
        method: 'POST',
        body: JSON.stringify(withdrawForm),
      });
      toast(`Withdrawn ₹${money(withdrawForm.amount)} successfully!`);
      setWithdrawForm({ ...withdrawForm, amount: '', pin: '' });
      setModalOpen(null);
      await loadAccounts();
      setActiveAccount(updated);
      loadLedger(updated.accountNumber, 0);
      loadAllRecentActivity();
    } catch (err) {
      toast(err.message || 'Withdrawal failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api('/api/accounts/transfer', {
        method: 'POST',
        body: JSON.stringify(transferForm),
      });
      toast(`Transferred ₹${money(transferForm.amount)} successfully!`);
      setTransferForm({ ...transferForm, toAccountNumber: '', amount: '', pin: '', totpCode: '' });
      setModalOpen(null);
      await loadAccounts();
      setActiveAccount(updated);
      loadLedger(updated.accountNumber, 0);
      loadAllRecentActivity();
    } catch (err) {
      if (err.code === 'TOTP_REQUIRED' || err.status === 428) {
        setModalOpen('transfer2fa');
        toast('High-value transfer requires 2FA confirmation', 'info');
      } else {
        toast(err.message || 'Transfer failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async (accountNumber) => {
    try {
      const blob = await api(`/api/accounts/${accountNumber}/statement.csv`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${accountNumber}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast('Statement CSV downloaded');
    } catch (err) {
      toast('Failed to download CSV statement', 'error');
    }
  };

  const handleCardToggle = async (accountNumber, patch) => {
    try {
      const updated = await api(`/api/cards/${accountNumber}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setCards((prev) => prev.map((c) => (c.accountNumber === accountNumber ? updated : c)));
      toast('Card settings updated');
    } catch (err) {
      toast(err.message || 'Failed to update card', 'error');
    }
  };

  const handleCardReplacement = async (accountNumber) => {
    try {
      const updated = await api(`/api/cards/${accountNumber}/request-replacement`, {
        method: 'POST',
      });
      setCards((prev) => prev.map((c) => (c.accountNumber === accountNumber ? updated : c)));
      toast('Replacement card requested. It will arrive in 3-5 business days.');
    } catch (err) {
      toast(err.message || 'Failed to request card replacement', 'error');
    }
  };

  const handleBillPay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/billpay', {
        method: 'POST',
        body: JSON.stringify(billForm),
      });
      toast(`Paid ${billForm.category} bill of ₹${money(billForm.amount)} successfully!`);
      setBillForm({ ...billForm, consumer: '', amount: '', pin: '' });
      await loadAccounts();
      loadBillHistory();
      loadAllRecentActivity();
      if (activeAccount) loadLedger(activeAccount.accountNumber, 0);
    } catch (err) {
      toast(err.message || 'Bill payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(benefForm),
      });
      toast(`Beneficiary ${benefForm.name} saved!`);
      setBenefForm({ name: '', accountNumber: '', nickname: '' });
      setModalOpen(null);
      loadBeneficiaries();
    } catch (err) {
      toast(err.message || 'Failed to save beneficiary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBeneficiary = async (id) => {
    try {
      await api(`/api/beneficiaries/${id}`, { method: 'DELETE' });
      toast('Beneficiary removed');
      loadBeneficiaries();
    } catch (err) {
      toast('Failed to remove beneficiary', 'error');
    }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketForm),
      });
      toast('Support ticket submitted! Our team will respond shortly.');
      setTicketForm({ subject: '', message: '' });
      loadTickets();
    } catch (err) {
      toast(err.message || 'Failed to submit ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Setup
  const handleStart2fa = async () => {
    try {
      const data = await api('/api/2fa/setup', { method: 'POST' });
      setTwofaSecret(data.secret);
      setShowTwofaSetup(true);
    } catch (err) {
      toast(err.message || 'Failed to initialize 2FA', 'error');
    }
  };

  const handleEnable2fa = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: twofaCode }),
      });
      toast('2-Factor Authentication enabled!');
      setShowTwofaSetup(false);
      setTwofaCode('');
      await refreshUser();
    } catch (err) {
      toast(err.message || 'Invalid 2FA code', 'error');
    } finally {
      setLoading(false);
    }
  };

  // FD / RD calculations
  const calculateFd = () => {
    const P = Number(fdAmount) || 0;
    const n = Number(fdTenure) || 1;
    const r = Number(fdRate) / 100 || 0.065;
    if (fdType === 'fd') {
      const invested = P;
      const maturity = Math.round(P * Math.pow(1 + r / 4, (4 * n) / 12));
      const interest = maturity - invested;
      return { invested, interest, maturity };
    } else {
      const invested = P * n;
      const maturity = Math.round(P * ((Math.pow(1 + r / 4, (4 * n) / 12) - 1) / (1 - Math.pow(1 + r / 4, -1 / 3))));
      const interest = Math.max(0, maturity - invested);
      return { invested, interest, maturity };
    }
  };

  // Loan calculations
  const calculateLoan = () => {
    const P = Number(loanAmount) || 0;
    const n = Number(loanTenure) || 1;
    const r = Number(loanRate) / 12 / 100 || 0.01;
    const emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const total = emi * n;
    const interest = total - P;
    return { emi, interest, total };
  };

  const fdRes = calculateFd();
  const loanRes = calculateLoan();

  return (
    <div className="app-shell">
      {/* Sidebar Backdrop for Mobile */}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} id="sidebar">
        <div className="sidebar__brand" style={{ cursor: 'pointer' }} onClick={() => setActiveView('dashboard')}>
          <img src="/assets/logo.svg" alt="Swiss Bank" />
          <div>
            <div className="sidebar__brand-name">Swiss Bank</div>
            <div className="sidebar__brand-sub">NetBanking</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav__group-label">Menu</div>
          <button
            className={`nav__item ${activeView === 'dashboard' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="12" width="8" height="9" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></svg>
            Dashboard
          </button>

          <button
            className={`nav__item ${activeView === 'accounts' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('accounts'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3.2"/></svg>
            Accounts
          </button>

          <button
            className={`nav__item ${activeView === 'transfers' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('transfers'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12"/></svg>
            Transfers
          </button>

          <button
            className={`nav__item ${activeView === 'deposits' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('deposits'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Deposits &amp; Loans
          </button>

          <button
            className={`nav__item ${activeView === 'cards' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('cards'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></svg>
            Cards
          </button>

          <button
            className={`nav__item ${activeView === 'billpay' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('billpay'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l3 3v15H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>
            Bill Pay &amp; Recharge
          </button>

          <button
            className={`nav__item ${activeView === 'beneficiaries' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('beneficiaries'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Beneficiaries
          </button>

          <div className="nav__group-label">Account</div>
          <button
            className={`nav__item ${activeView === 'profile' ? 'is-active' : ''}`}
            onClick={() => { setActiveView('profile'); setSidebarOpen(false); }}
            type="button"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
            Profile &amp; KYC
  
export default DashboardPage;
