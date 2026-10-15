import { Currency, ExchangeRates, Language, Transaction, Category, Account, User } from '../types';

export const formatCurrency = (amount: number, currency: Currency = 'LAK'): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  let formattedNumber = '';
  if (currency === 'LAK') {
    formattedNumber = Math.round(absAmount).toLocaleString('en-US');
    return `${isNegative ? '-' : ''}${formattedNumber} ₭`;
  } else if (currency === 'THB') {
    formattedNumber = absAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return `${isNegative ? '-' : ''}฿ ${formattedNumber}`;
  } else {
    // USD
    formattedNumber = absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${isNegative ? '-' : ''}$ ${formattedNumber}`;
  }
};

export const convertCurrency = (
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): number => {
  if (from === to) return amount;
  // Convert from source to LAK base first
  let amountInLAK = amount;
  if (from === 'THB') {
    amountInLAK = amount * rates.THB;
  } else if (from === 'USD') {
    amountInLAK = amount * rates.USD;
  }

  // Convert from LAK base to target
  if (to === 'LAK') return amountInLAK;
  if (to === 'THB') return amountInLAK / rates.THB;
  if (to === 'USD') return amountInLAK / rates.USD;

  return amountInLAK;
};

const LAO_MONTHS = [
  'ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ',
  'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'
];

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const formatDate = (dateStr: string, lang: Language = 'lo'): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (lang === 'lo') {
    return `${day} ${LAO_MONTHS[monthIdx] || ''} ${year}`;
  } else {
    return `${EN_MONTHS[monthIdx] || ''} ${day}, ${year}`;
  }
};

export const formatRelativeTime = (timestamp: number, lang: Language = 'lo'): string => {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  
  if (diffSec < 60) {
    return lang === 'lo' ? 'ຫາກໍ່ລົງ' : 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === 'lo' ? `${diffMin} ນາທີກ່ອນ` : `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return lang === 'lo' ? `${diffHours} ຊົ່ວໂມງກ່ອນ` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return lang === 'lo' ? `${diffDays} ມື້ກ່ອນ` : `${diffDays}d ago`;
};

export const exportTransactionsToCSV = (
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  lang: Language = 'lo'
) => {
  const catMap = new Map(categories.map(c => [c.id, lang === 'lo' ? c.nameLo : c.nameEn]));
  const accMap = new Map(accounts.map(a => [a.id, lang === 'lo' ? a.nameLo : a.nameEn]));

  const headers = lang === 'lo'
    ? ['ວັນທີ', 'ເວລາ', 'ປະເພດ', 'ຫົວຂໍ້', 'ໝວດໝູ່', 'ບັນຊີ', 'ຈຳນວນເງິນ', 'ສະກຸນເງິນ', 'ມູນຄ່າກີບ (LAK)', 'ໝາຍເຫດ']
    : ['Date', 'Time', 'Type', 'Title', 'Category', 'Account', 'Amount', 'Currency', 'Amount in LAK', 'Notes'];

  const rows = transactions.map(t => {
    const typeLabel = t.type === 'income' ? (lang === 'lo' ? 'ລາຍຮັບ' : 'Income') :
                     t.type === 'expense' ? (lang === 'lo' ? 'ລາຍຈ່າຍ' : 'Expense') :
                     (lang === 'lo' ? 'ໂອນເງິນ' : 'Transfer');
    
    return [
      t.date,
      t.time,
      typeLabel,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${catMap.get(t.categoryId) || ''}"`,
      `"${accMap.get(t.accountId) || ''}"`,
      t.amount,
      t.currency,
      t.amountInBase,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ];
  });

  // UTF-8 BOM (\uFEFF) so Excel respects Lao and UTF-8 characters without corruption
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LaoExpense_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportAllUserDataToCSV = (
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  user?: User | null,
  lang: Language = 'lo'
) => {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const accMap = new Map(accounts.map(a => [a.id, a]));

  // Compute live account balances
  const computedAccounts = accounts.map(acc => {
    let balance = acc.initialBalance;
    transactions.forEach(tr => {
      if (tr.accountId === acc.id) {
        if (tr.type === 'income') balance += tr.amountInBase;
        else if (tr.type === 'expense' || tr.type === 'transfer') balance -= tr.amountInBase;
      }
      if (tr.type === 'transfer' && tr.toAccountId === acc.id) {
        balance += tr.amountInBase;
      }
    });
    return { ...acc, currentBalance: balance };
  });

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const lines: string[] = [];

  // 1. OVERVIEW & USER INFO SECTION
  lines.push(escapeCSV(lang === 'lo' ? '=== ລາຍງານຂໍ້ມູນຜູ້ໃຊ້ງານ (USER PROFILE & SYSTEM OVERVIEW) ===' : '=== USER PROFILE & SYSTEM OVERVIEW ==='));
  const userHeaders = lang === 'lo'
    ? ['ຊື່ຜູ້ໃຊ້ງານ', 'ບັນຊີຜູ້ໃຊ້ (Username)', 'ເບີໂທລະສັບ', 'ວັນທີສົ່ງອອກ', 'ຈຳນວນລາຍການ', 'ຈຳນວນບັນຊີ', 'ຈຳນວນໝວດໝູ່']
    : ['Full Name', 'Username', 'Phone Number', 'Export Date', 'Total Transactions', 'Total Accounts', 'Total Categories'];
  lines.push(userHeaders.map(escapeCSV).join(','));

  const nowStr = new Date().toLocaleString(lang === 'lo' ? 'lo-LA' : 'en-US');
  lines.push([
    escapeCSV(user?.fullName || (lang === 'lo' ? 'ຜູ້ໃຊ້ງານ' : 'User')),
    escapeCSV(user?.username || '-'),
    escapeCSV(user?.phone || '-'),
    escapeCSV(nowStr),
    transactions.length,
    accounts.length,
    categories.length
  ].join(','));

  lines.push('');
  lines.push('');

  // 2. ACCOUNTS TABLE
  lines.push(escapeCSV(lang === 'lo' ? '=== ບັນຊີ ແລະ ກະເປົາເງິນ (ACCOUNTS & WALLETS) ===' : '=== ACCOUNTS & WALLETS ==='));
  const accHeaders = lang === 'lo'
    ? ['ລະຫັດບັນຊີ', 'ຊື່ບັນຊີ (ລາວ)', 'ຊື່ບັນຊີ (Eng)', 'ປະເພດບັນຊີ', 'ສະກຸນເງິນ', 'ຍອດເງິນເລີ່ມຕົ້ນ', 'ຍອດເງິນປັດຈຸບັນ (LAK)', 'ເລກບັນຊີ']
    : ['Account ID', 'Account Name (Lao)', 'Account Name (En)', 'Account Type', 'Currency', 'Initial Balance', 'Current Balance (LAK)', 'Account Number'];
  lines.push(accHeaders.map(escapeCSV).join(','));

  computedAccounts.forEach(acc => {
    const typeLabel = acc.type === 'bank' ? (lang === 'lo' ? 'ທະນາຄານ (Bank)' : 'Bank') :
                     acc.type === 'cash' ? (lang === 'lo' ? 'ເງິນສົດ (Cash)' : 'Cash') :
                     acc.type === 'savings' ? (lang === 'lo' ? 'ເງິນຝາກປະຢັດ (Savings)' : 'Savings') :
                     (lang === 'lo' ? 'ກະເປົາເງິນດິຈິຕອນ (Wallet)' : 'Digital Wallet');
    lines.push([
      escapeCSV(acc.id),
      escapeCSV(acc.nameLo),
      escapeCSV(acc.nameEn),
      escapeCSV(typeLabel),
      escapeCSV(acc.currency),
      acc.initialBalance,
      acc.currentBalance,
      escapeCSV(acc.accountNumber || '-'),
    ].join(','));
  });

  lines.push('');
  lines.push('');

  // 3. CATEGORIES TABLE
  lines.push(escapeCSV(lang === 'lo' ? '=== ໝວດໝູ່ລາຍຮັບ-ລາຍຈ່າຍ (CATEGORIES) ===' : '=== CATEGORIES ==='));
  const catHeaders = lang === 'lo'
    ? ['ລະຫັດໝວດໝູ່', 'ຊື່ໝວດໝູ່ (ລາວ)', 'ຊື່ໝວດໝູ່ (Eng)', 'ປະເພດ (Type)']
    : ['Category ID', 'Category Name (Lao)', 'Category Name (En)', 'Type'];
  lines.push(catHeaders.map(escapeCSV).join(','));

  categories.forEach(cat => {
    const typeLabel = cat.type === 'income' ? (lang === 'lo' ? 'ລາຍຮັບ (Income)' : 'Income') :
                     (lang === 'lo' ? 'ລາຍຈ່າຍ (Expense)' : 'Expense');
    lines.push([
      escapeCSV(cat.id),
      escapeCSV(cat.nameLo),
      escapeCSV(cat.nameEn),
      escapeCSV(typeLabel),
    ].join(','));
  });

  lines.push('');
  lines.push('');

  // 4. TRANSACTIONS LEDGER (FOR EXCEL ANALYSIS)
  lines.push(escapeCSV(lang === 'lo' ? '=== ລາຍການເຄື່ອນໄຫວລາຍຮັບ-ລາຍຈ່າຍທັງໝົດ (TRANSACTIONS LEDGER FOR EXCEL ANALYSIS) ===' : '=== TRANSACTIONS LEDGER FOR EXCEL ANALYSIS ==='));
  const txHeaders = lang === 'lo'
    ? ['ວັນທີ', 'ເວລາ', 'ປະເພດ', 'ຫົວຂໍ້/ລາຍການ', 'ໝວດໝູ່', 'ບັນຊີຕົ້ນທາງ', 'ບັນຊີປາຍທາງ', 'ຈຳນວນເງິນ', 'ສະກຸນເງິນ', 'ມູນຄ່າກີບ (LAK)', 'ໝາຍເຫດ', 'ສະລິບ', 'ລະຫັດລາຍການ']
    : ['Date', 'Time', 'Type', 'Title', 'Category', 'Account', 'To Account', 'Amount', 'Currency', 'Amount in LAK', 'Notes', 'Receipt', 'Transaction ID'];
  lines.push(txHeaders.map(escapeCSV).join(','));

  transactions.forEach(t => {
    const typeLabel = t.type === 'income' ? (lang === 'lo' ? 'ລາຍຮັບ' : 'Income') :
                     t.type === 'expense' ? (lang === 'lo' ? 'ລາຍຈ່າຍ' : 'Expense') :
                     (lang === 'lo' ? 'ໂອນເງິນ' : 'Transfer');
    const cat = catMap.get(t.categoryId);
    const catName = cat ? (lang === 'lo' ? cat.nameLo : cat.nameEn) : t.categoryId;
    const acc = accMap.get(t.accountId);
    const accName = acc ? (lang === 'lo' ? acc.nameLo : acc.nameEn) : t.accountId;
    const toAcc = t.toAccountId ? accMap.get(t.toAccountId) : null;
    const toAccName = toAcc ? (lang === 'lo' ? toAcc.nameLo : toAcc.nameEn) : (t.toAccountId ? t.toAccountId : '-');

    lines.push([
      escapeCSV(t.date),
      escapeCSV(t.time),
      escapeCSV(typeLabel),
      escapeCSV(t.title || ''),
      escapeCSV(catName),
      escapeCSV(accName),
      escapeCSV(toAccName),
      t.amount,
      escapeCSV(t.currency),
      t.amountInBase,
      escapeCSV(t.note || ''),
      escapeCSV(t.receiptUrl ? (lang === 'lo' ? 'ມີ' : 'Yes') : (lang === 'lo' ? 'ບໍ່ມີ' : 'No')),
      escapeCSV(t.id),
    ].join(','));
  });

  // UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (user?.username || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `LaoExpense_AllData_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportAccountsToCSV = (
  accounts: Account[],
  transactions: Transaction[],
  lang: Language = 'lo'
) => {
  const computedAccounts = accounts.map(acc => {
    let balance = acc.initialBalance;
    transactions.forEach(tr => {
      if (tr.accountId === acc.id) {
        if (tr.type === 'income') balance += tr.amountInBase;
        else if (tr.type === 'expense' || tr.type === 'transfer') balance -= tr.amountInBase;
      }
      if (tr.type === 'transfer' && tr.toAccountId === acc.id) {
        balance += tr.amountInBase;
      }
    });
    return { ...acc, currentBalance: balance };
  });

  const headers = lang === 'lo'
    ? ['ລະຫັດບັນຊີ', 'ຊື່ບັນຊີ (ລາວ)', 'ຊື່ບັນຊີ (Eng)', 'ປະເພດບັນຊີ', 'ສະກຸນເງິນ', 'ຍອດເງິນເລີ່ມຕົ້ນ', 'ຍອດເງິນປັດຈຸບັນ (LAK)', 'ເລກບັນຊີ']
    : ['Account ID', 'Account Name (Lao)', 'Account Name (En)', 'Account Type', 'Currency', 'Initial Balance', 'Current Balance (LAK)', 'Account Number'];

  const rows = computedAccounts.map(acc => [
    `"${acc.id}"`,
    `"${acc.nameLo.replace(/"/g, '""')}"`,
    `"${acc.nameEn.replace(/"/g, '""')}"`,
    `"${acc.type}"`,
    `"${acc.currency}"`,
    acc.initialBalance,
    acc.currentBalance,
    `"${(acc.accountNumber || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LaoExpense_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportCategoriesToCSV = (
  categories: Category[],
  lang: Language = 'lo'
) => {
  const headers = lang === 'lo'
    ? ['ລະຫັດໝວດໝູ່', 'ຊື່ໝວດໝູ່ (ລາວ)', 'ຊື່ໝວດໝູ່ (Eng)', 'ປະເພດ']
    : ['Category ID', 'Category Name (Lao)', 'Category Name (En)', 'Type'];

  const rows = categories.map(cat => [
    `"${cat.id}"`,
    `"${cat.nameLo.replace(/"/g, '""')}"`,
    `"${cat.nameEn.replace(/"/g, '""')}"`,
    `"${cat.type === 'income' ? (lang === 'lo' ? 'ລາຍຮັບ' : 'Income') : (lang === 'lo' ? 'ລາຍຈ່າຍ' : 'Expense')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LaoExpense_Categories_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
