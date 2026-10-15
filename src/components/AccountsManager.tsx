import React, { useState } from 'react';
import { Account, Transaction, Currency, Language, ExchangeRates } from '../types';
import { getT } from '../utils/translations';
import { formatCurrency, convertCurrency } from '../utils/formatters';
import { playSound } from '../utils/audio';
import { Plus, Building2, Wallet, PiggyBank, CreditCard, ArrowRightLeft, Edit2, Trash2, Check, X, RotateCcw, Coins } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface AccountsManagerProps {
  accounts: Account[];
  transactions: Transaction[];
  currency: Currency;
  exchangeRates: ExchangeRates;
  lang: Language;
  onAddAccount: (acc: Account) => void;
  onEditAccount: (acc: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onOpenTransferModal: () => void;
  onResetBalance?: () => void;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({
  accounts,
  transactions,
  currency,
  exchangeRates,
  lang,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenTransferModal,
  onResetBalance,
}) => {
  const t = getT(lang);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | Currency>('ALL');

  // Form states
  const [nameLo, setNameLo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<Account['type']>('bank');
  const [accountCurrency, setAccountCurrency] = useState<Currency>('LAK');
  const [initialBalance, setInitialBalance] = useState('0');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#2563eb');

  // Compute live account balance in its native currency
  const computedAccounts = accounts.map(acc => {
    let balance = acc.initialBalance || 0;
    const accCurr = acc.currency || 'LAK';

    transactions.forEach(tr => {
      if (tr.accountId === acc.id) {
        const change = tr.currency === accCurr
          ? tr.amount
          : convertCurrency(tr.amount, tr.currency, accCurr, exchangeRates);

        if (tr.type === 'income') balance += change;
        else if (tr.type === 'expense' || tr.type === 'transfer') balance -= change;
      }
      if (tr.type === 'transfer' && tr.toAccountId === acc.id) {
        const change = tr.currency === accCurr
          ? tr.amount
          : convertCurrency(tr.amount, tr.currency, accCurr, exchangeRates);

        balance += change;
      }
    });
    return { ...acc, currentBalance: balance, currency: accCurr };
  });

  // Multi-currency summaries
  const lakAccounts = computedAccounts.filter(a => a.currency === 'LAK');
  const thbAccounts = computedAccounts.filter(a => a.currency === 'THB');
  const usdAccounts = computedAccounts.filter(a => a.currency === 'USD');

  const totalLAK = lakAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalTHB = thbAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const totalUSD = usdAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  // Total equivalent converted to the user's active viewing currency
  const totalNetWorthInSelectedCurrency = computedAccounts.reduce((sum, a) => {
    return sum + convertCurrency(a.currentBalance, a.currency, currency, exchangeRates);
  }, 0);

  const displayedAccounts = currencyFilter === 'ALL'
    ? computedAccounts
    : computedAccounts.filter(a => a.currency === currencyFilter);

  const handleOpenAdd = (defaultCurr: Currency = 'LAK') => {
    playSound('click');
    setEditingAccount(null);
    setNameLo('');
    setNameEn('');
    setType('bank');
    setAccountCurrency(defaultCurr);
    setInitialBalance('0');
    setAccountNumber('');
    setColor(defaultCurr === 'USD' ? '#3b82f6' : defaultCurr === 'THB' ? '#10b981' : '#2563eb');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    playSound('click');
    setEditingAccount(acc);
    setNameLo(acc.nameLo);
    setNameEn(acc.nameEn);
    setType(acc.type);
    setAccountCurrency(acc.currency || 'LAK');
    setInitialBalance(acc.initialBalance.toString());
    setAccountNumber(acc.accountNumber || '');
    setColor(acc.color);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameLo.trim()) return;

    if (editingAccount) {
      playSound('success');
      onEditAccount({
        ...editingAccount,
        nameLo: nameLo.trim(),
        nameEn: nameEn.trim() || nameLo.trim(),
        type,
        currency: accountCurrency,
        initialBalance: parseFloat(initialBalance) || 0,
        accountNumber: accountNumber.trim() || undefined,
        color,
      });
    } else {
      playSound('success');
      const newAcc: Account = {
        id: `acc_${Date.now()}`,
        nameLo: nameLo.trim(),
        nameEn: nameEn.trim() || nameLo.trim(),
        type,
        initialBalance: parseFloat(initialBalance) || 0,
        currency: accountCurrency,
        accountNumber: accountNumber.trim() || undefined,
        color,
      };
      onAddAccount(newAcc);
    }

    setIsFormOpen(false);
  };

  const colors = ['#2563eb', '#10b981', '#059669', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

  const getCurrencySymbol = (curr: Currency) => {
    if (curr === 'LAK') return '₭';
    if (curr === 'THB') return '฿';
    return '$';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>{t.accounts}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'lo'
              ? 'ຈັດການບັນຊີເງິນກີບ, ເງິນບາດ, ແລະ ເງິນໂດລາ (ເພີ່ມ, ແກ້ໄຂ, ໂອນເງິນ, ລຶບ)'
              : 'Multi-currency accounts: LAK, THB, USD (Add, Edit, Transfer, Delete)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'lo' ? 'ໂອນເງິນລະຫວ່າງບັນຊີ' : 'Transfer'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('LAK')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addAccount}</span>
          </button>
        </div>
      </div>

      {/* 3 NATIVE CURRENCY TOTAL KPI CARDS (Kip, Baht, Dollar) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Kip Accounts Card */}
        <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-4 shadow-sm hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              {lang === 'lo' ? 'ຍອດເງິນກີບ (LAK)' : 'Total LAK (₭)'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded-full">
              {lakAccounts.length} {lang === 'lo' ? 'ບັນຊີ' : 'accs'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tabular-nums mt-1.5 truncate">
            {formatCurrency(totalLAK, 'LAK')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{lang === 'lo' ? 'ບັນຊີຫຼັກໃນປະເທດລາວ' : 'Lao Kip Accounts'}</span>
            <button
              type="button"
              onClick={() => handleOpenAdd('LAK')}
              className="text-[10px] text-blue-400 hover:underline"
            >
              + {lang === 'lo' ? 'ເພີ່ມບັນຊິກີບ' : 'Add LAK'}
            </button>
          </div>
        </div>

        {/* Baht Accounts Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {lang === 'lo' ? 'ຍອດເງິນບາດ (THB)' : 'Total THB (฿)'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full">
              {thbAccounts.length} {lang === 'lo' ? 'ບັນຊີ' : 'accs'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tabular-nums mt-1.5 truncate">
            {formatCurrency(totalTHB, 'THB')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>≈ {formatCurrency(convertCurrency(totalTHB, 'THB', currency, exchangeRates), currency)}</span>
            <button
              type="button"
              onClick={() => handleOpenAdd('THB')}
              className="text-[10px] text-emerald-400 hover:underline"
            >
              + {lang === 'lo' ? 'ເພີ່ມບັນຊີບາດ' : 'Add THB'}
            </button>
          </div>
        </div>

        {/* Dollar Accounts Card */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 shadow-sm hover:border-amber-500/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {lang === 'lo' ? 'ຍອດເງິນໂດລາ (USD)' : 'Total USD ($)'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full">
              {usdAccounts.length} {lang === 'lo' ? 'ບັນຊີ' : 'accs'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono tabular-nums mt-1.5 truncate">
            {formatCurrency(totalUSD, 'USD')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>≈ {formatCurrency(convertCurrency(totalUSD, 'USD', currency, exchangeRates), currency)}</span>
            <button
              type="button"
              onClick={() => handleOpenAdd('USD')}
              className="text-[10px] text-amber-400 hover:underline"
            >
              + {lang === 'lo' ? 'ເພີ່ມບັນຊີໂດລາ' : 'Add USD'}
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Net Worth Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400">
            {lang === 'lo' ? 'ມູນຄ່າຊັບສິນລວມທຸກສະກຸນເງິນ (ຄິດໄລ່ຕາມອັດຕາແລກປ່ຽນ):' : 'Estimated Net Worth across all currencies:'}
          </span>
          <strong className="text-slate-100 font-mono text-sm tabular-nums">
            {formatCurrency(totalNetWorthInSelectedCurrency, currency)}
          </strong>
        </div>

        {onResetBalance && totalNetWorthInSelectedCurrency > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(lang === 'lo' ? 'ທ່ານຕ້ອງການລ້າງຍອດເງິນຄົງເຫຼືອທັງໝົດໃຫ້ເປັນ 0 ແທ້ບໍ?' : 'Are you sure you want to reset remaining balance to 0?')) {
                onResetBalance();
              }
            }}
            className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 rounded transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{lang === 'lo' ? 'ລ້າງຍອດເປັນ 0' : 'Reset to 0'}</span>
          </button>
        )}
      </div>

      {/* Add / Edit Account Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="p-5 bg-slate-900 border border-emerald-500/50 rounded-xl space-y-4 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{editingAccount ? t.editAccount : t.addAccount}</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* Account Name */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">
                {t.accountName} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder={lang === 'lo' ? 'ຕົວຢ່າງ: BCEL One, ກະເປົາໂດລາ, Kasikorn' : 'e.g. BCEL One, Kasikorn, USD Cash'}
                value={nameLo}
                onChange={(e) => setNameLo(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Currency Selector (LAK, THB, USD) */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">
                {lang === 'lo' ? 'ສະກຸນເງິນຂອງບັນຊີ (Currency)' : 'Account Currency'} <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => { playSound('click'); setAccountCurrency('LAK'); }}
                  className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                    accountCurrency === 'LAK'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ₭ ກີບ (LAK)
                </button>
                <button
                  type="button"
                  onClick={() => { playSound('click'); setAccountCurrency('THB'); }}
                  className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                    accountCurrency === 'THB'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ฿ ບາດ (THB)
                </button>
                <button
                  type="button"
                  onClick={() => { playSound('click'); setAccountCurrency('USD'); }}
                  className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                    accountCurrency === 'USD'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  $ ໂດລາ (USD)
                </button>
              </div>
            </div>

            {/* Account Type */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">{t.accountType}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Account['type'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
              >
                <option value="bank">{t.bank}</option>
                <option value="cash">{t.cash}</option>
                <option value="savings">{t.savings}</option>
                <option value="wallet">{t.wallet}</option>
              </select>
            </div>

            {/* Initial Balance */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">
                {t.initialBalance} ({getCurrencySymbol(accountCurrency)})
              </label>
              <input
                type="number"
                step="any"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">{t.accountNumber}</label>
              <input
                type="text"
                placeholder="010-12-000... (ທາງເລືອກ)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-slate-700"
              />
            </div>

            {/* Color picker */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">{lang === 'lo' ? 'ສີສັນປະຈຳບັນຊີ' : 'Account Color'}</label>
              <div className="flex items-center gap-1.5 pt-1.5">
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border transition-transform ${color === c ? 'border-white scale-110 shadow-md ring-2 ring-emerald-500' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      )}

      {/* Currency Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setCurrencyFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currencyFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'lo' ? 'ທຸກບັນຊີ' : 'All Accounts'} ({computedAccounts.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrencyFilter('LAK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              currencyFilter === 'LAK'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-blue-300'
            }`}
          >
            <span>{lang === 'lo' ? 'ບັນຊິກີບ' : 'LAK'}</span>
            <span className="font-mono text-[10px] opacity-80">({lakAccounts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrencyFilter('THB')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              currencyFilter === 'THB'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span>{lang === 'lo' ? 'ບັນຊີບາດ' : 'THB'}</span>
            <span className="font-mono text-[10px] opacity-80">({thbAccounts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrencyFilter('USD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              currencyFilter === 'USD'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span>{lang === 'lo' ? 'ບັນຊີໂດລາ' : 'USD'}</span>
            <span className="font-mono text-[10px] opacity-80">({usdAccounts.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          {displayedAccounts.length} {lang === 'lo' ? 'ບັນຊີສະແດງ' : 'accounts displayed'}
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedAccounts.map(acc => {
          const txCount = transactions.filter(t => t.accountId === acc.id || t.toAccountId === acc.id).length;
          const isLAK = acc.currency === 'LAK';
          const isTHB = acc.currency === 'THB';
          const isUSD = acc.currency === 'USD';

          return (
            <div
              key={acc.id}
              className={`bg-slate-900/90 border rounded-xl p-4 flex flex-col justify-between group transition-all hover:shadow-lg ${
                isUSD
                  ? 'border-amber-500/30 hover:border-amber-500/60'
                  : isTHB
                  ? 'border-emerald-500/30 hover:border-emerald-500/60'
                  : 'border-slate-800 hover:border-blue-500/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      {acc.type === 'bank' && <Building2 className="w-4 h-4" />}
                      {acc.type === 'cash' && <Wallet className="w-4 h-4" />}
                      {acc.type === 'savings' && <PiggyBank className="w-4 h-4" />}
                      {acc.type === 'wallet' && <CreditCard className="w-4 h-4" />}
                    </div>

                    {/* Currency Badge */}
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isUSD
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600/40'
                          : isTHB
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                          : 'bg-blue-950/80 text-blue-300 border-blue-600/40'
                      }`}
                    >
                      {isUSD ? '$ ໂດລາ (USD)' : isTHB ? '฿ ບາດ (THB)' : '₭ ກີບ (LAK)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                      title={t.editAccount}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => {
                          playSound('click');
                          setDeletingAccountId(acc.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                        title={t.deleteAccount}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-slate-100 truncate">
                  {lang === 'lo' ? acc.nameLo : acc.nameEn}
                </h3>
                {acc.accountNumber ? (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    {acc.accountNumber}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {acc.type === 'cash' ? (lang === 'lo' ? 'ເງິນສົດ' : 'Cash') : (lang === 'lo' ? 'ກະເປົາເງິນ' : 'Wallet')}
                  </p>
                )}
              </div>

              {/* Native Balance Display */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500">
                  {txCount} {lang === 'lo' ? 'ລາຍການ' : 'txns'}
                </span>
                <div className="text-right">
                  <span
                    className={`text-base font-bold font-mono tabular-nums block ${
                      isUSD ? 'text-amber-300' : isTHB ? 'text-emerald-300' : 'text-slate-100'
                    }`}
                  >
                    {formatCurrency(acc.currentBalance, acc.currency)}
                  </span>
                  {acc.currency !== currency && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ≈ {formatCurrency(convertCurrency(acc.currentBalance, acc.currency, currency, exchangeRates), currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedAccounts.length === 0 && (
        <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-3">
          <p className="text-sm">
            {lang === 'lo' ? `ບໍ່ມີບັນຊີໃນໝວດໝູ່ ${currencyFilter}` : `No accounts in ${currencyFilter}`}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAdd(currencyFilter === 'ALL' ? 'LAK' : currencyFilter)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addAccount}</span>
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmDeleteModal
        isOpen={deletingAccountId !== null}
        onClose={() => setDeletingAccountId(null)}
        onConfirm={() => {
          if (deletingAccountId) {
            playSound('delete');
            onDeleteAccount(deletingAccountId);
            setDeletingAccountId(null);
          }
        }}
        title={t.deleteAccount}
        message={t.confirmDeleteAccount}
        lang={lang}
      />
    </div>
  );
};
