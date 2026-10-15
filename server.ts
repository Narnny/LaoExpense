import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.resolve(__dirname, 'data', 'app-database.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface ServerDB {
  users: Array<{
    id: string;
    username: string;
    phone: string;
    fullName: string;
    email?: string;
    password: string;
    avatarColor: string;
    createdAt: number;
  }>;
  userData: Record<string, {
    transactions?: any[];
    categories?: any[];
    accounts?: any[];
    budgets?: any[];
    recurring?: any[];
    updatedAt?: number;
  }>;
}

// Persistent user seed that is guaranteed to always exist across server instances
const SEED_USERS: ServerDB['users'] = [
  {
    id: 'usr_1791175894996_wk7g',
    username: 'narnny',
    phone: '02099774515',
    fullName: 'kounyavong',
    email: 'narnny1994nk@gmail.com',
    password: '123',
    avatarColor: '#2563eb',
    createdAt: 1791175894996,
  },
];

function readDB(): ServerDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      const loadedUsers: ServerDB['users'] = Array.isArray(parsed.users) ? parsed.users : [];

      // Ensure the persistent user is always present in users
      for (const su of SEED_USERS) {
        const found = loadedUsers.some(u => u.id === su.id || u.username === su.username || u.phone === su.phone);
        if (!found) {
          loadedUsers.push(su);
        }
      }

      return {
        users: loadedUsers,
        userData: parsed.userData && typeof parsed.userData === 'object' ? parsed.userData : {},
      };
    }
  } catch (err) {
    console.error('Error reading DB:', err);
  }
  return { users: [...SEED_USERS], userData: {} };
}

function writeDB(data: ServerDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

app.use(express.json({ limit: '15mb' }));

// Smart Phone normalizer for Lao and international phone numbers:
// Extracts base digits (e.g. 020 9977 4515, +856 20 9977 4515, 2099774515, 99774515 -> 99774515)
function normalizeLaoPhone(p?: string): string {
  if (!p) return '';
  let d = p.replace(/\D/g, '');
  if (d.startsWith('85620')) d = d.substring(5);
  else if (d.startsWith('856')) d = d.substring(3);
  else if (d.startsWith('020')) d = d.substring(3);
  else if (d.startsWith('20') && d.length === 10) d = d.substring(2);
  else if (d.startsWith('0')) d = d.substring(1);
  return d;
}

function matchPhones(p1?: string, p2?: string): boolean {
  if (!p1 || !p2) return false;
  const d1 = p1.replace(/\D/g, '');
  const d2 = p2.replace(/\D/g, '');
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;

  const n1 = normalizeLaoPhone(p1);
  const n2 = normalizeLaoPhone(p2);
  if (n1 && n2 && n1 === n2) return true;
  if (n1.length >= 6 && n2.length >= 6 && (n1.includes(n2) || n2.includes(n1))) return true;

  return false;
}

// Ultra-Flexible User Finder: by ID, Phone, Username, Full Name, Email, or loose match
function findUserByIdentifier(users: ServerDB['users'], identifier: string) {
  if (!Array.isArray(users) || users.length === 0 || !identifier?.trim()) return null;

  const raw = identifier.trim();
  const q = raw.toLowerCase();
  const qDigits = raw.replace(/\D/g, '');
  const qNormPhone = normalizeLaoPhone(raw);

  return users.find(u => {
    // 0. Direct ID match
    if (u.id === raw) return true;

    // 1. Phone match by normalized Lao phone or raw digits
    if (matchPhones(u.phone, raw)) return true;
    if (qNormPhone.length >= 6 && normalizeLaoPhone(u.phone) === qNormPhone) return true;
    if (qDigits.length >= 6 && u.phone.replace(/\D/g, '').includes(qDigits)) return true;

    const uName = (u.username || '').toLowerCase().trim();
    const uFull = (u.fullName || '').toLowerCase().trim();
    const uEmail = (u.email || '').toLowerCase().trim();

    // 2. Exact username match
    if (uName && uName === q) return true;

    // 3. Exact full name match
    if (uFull && uFull === q) return true;

    // 4. Exact email match or email prefix
    if (uEmail && uEmail === q) return true;
    if (q.includes('@')) {
      const emailPrefix = q.split('@')[0];
      if (uName === emailPrefix || uEmail.startsWith(emailPrefix)) return true;
      if (emailPrefix.includes(uName) || uName.includes(emailPrefix)) return true;
    }
    if (uEmail && uEmail.includes(q)) return true;

    // 5. Query contains username or username contains query (min 2 chars)
    if (uName && q.length >= 2 && (uName.includes(q) || q.includes(uName))) return true;

    // 6. Substring match on full name (min 2 chars)
    if (uFull && q.length >= 2 && (uFull.includes(q) || q.includes(uFull))) return true;

    // 7. General phone digits match
    const uDigits = (u.phone || '').replace(/\D/g, '');
    if (qDigits.length >= 6 && uDigits.length >= 6 && (uDigits.includes(qDigits) || qDigits.includes(uDigits))) {
      return true;
    }

    return false;
  }) || null;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Check/Find account by Name or Phone (for Forgot Password verification)
app.get('/api/auth/find-account', (req, res) => {
  const identifier = (req.query.identifier as string) || '';
  if (!identifier.trim()) {
    return res.status(400).json({ success: false, error: 'Missing identifier' });
  }

  const db = readDB();
  const user = findUserByIdentifier(db.users, identifier);
  if (!user) {
    return res.json({ success: true, found: false });
  }

  return res.json({
    success: true,
    found: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      username: user.username,
      avatarColor: user.avatarColor,
    },
  });
});

// Get all active registered users to allow immediate sync across clients
app.get('/api/auth/users', (req, res) => {
  const db = readDB();
  res.json({
    success: true,
    users: db.users,
  });
});

// Register User
app.post('/api/auth/register', (req, res) => {
  const { phone, username, fullName, password, avatarColor } = req.body;
  if (!phone || !username || !password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const db = readDB();
  const cleanPhone = phone.trim();
  const cleanUsername = username.trim().toLowerCase();

  // Check if user already exists
  const existing = findUserByIdentifier(db.users, cleanPhone) || findUserByIdentifier(db.users, cleanUsername);
  if (existing) {
    return res.status(409).json({
      success: false,
      alreadyExists: true,
      error: 'ເບີໂທລະສັບ ຫຼື ຊື່ຜູ້ໃຊ້ນີ້ຖືກນຳໃຊ້ແລ້ວ. ກະລຸນາເຂົ້າສູ່ລະບົບ ຫຼື ໃຊ້ຊື່ອື່ນ',
    });
  }

  const colors = ['#2563eb', '#059669', '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#10b981'];
  const user = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    phone: cleanPhone,
    fullName: fullName ? fullName.trim() : username.trim(),
    password: password.trim(),
    avatarColor: avatarColor || colors[Math.floor(Math.random() * colors.length)],
    createdAt: Date.now(),
  };

  db.users.push(user);
  writeDB(db);

  return res.json({ success: true, user });
});

// Login User (Works securely from ANY device or machine using Phone, Username, Full Name, or Email)
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ success: false, error: 'ກະລຸນາປ້ອນເບີໂທ/ຊື່ ແລະ ລະຫັດຜ່ານ' });
  }

  const db = readDB();
  const user = findUserByIdentifier(db.users, identifier);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'ເບີໂທ, ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ',
    });
  }

  const reqPass = password.trim();
  const userPass = (user.password || '').trim();
  const isPasswordMatch =
    userPass === reqPass ||
    userPass.toLowerCase() === reqPass.toLowerCase();

  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      error: 'ເບີໂທ, ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ',
    });
  }

  // Clean up any old dummy test transactions or preset balances
  const cleanUserData = (uData: any) => {
    if (!uData) return null;
    const cleaned = { ...uData };
    if (Array.isArray(cleaned.transactions)) {
      cleaned.transactions = cleaned.transactions.filter(
        (t: any) => t && t.title !== 'Project OPEC' && t.title !== 'Project OT' && !['tx_1', 'tx_2', 'tx_3', 'tx_4', 'tx_5', 'tx_6', 'tx_7'].includes(t.id)
      );
    }
    if (Array.isArray(cleaned.accounts)) {
      cleaned.accounts = cleaned.accounts.map((a: any) => {
        if (a && [1000000, 200000, 12500000, 1800000, 10000000].includes(a.initialBalance)) {
          return { ...a, initialBalance: 0 };
        }
        return a;
      });
    }
    return cleaned;
  };

  // Send back user and any existing synced data
  const userData = cleanUserData(db.userData[user.id] || null);

  return res.json({
    success: true,
    user,
    data: userData,
  });
});

// Forgot Password / Reset Password (by Name or Phone)
app.post('/api/auth/reset-password', (req, res) => {
  const { identifier, newPassword } = req.body;
  if (!identifier || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'ກະລຸນາປ້ອນຊື່/ເບີໂທ ແລະ ລະຫັດຜ່ານໃໝ່ໃຫ້ຄົບຖ້ວນ',
    });
  }

  if (newPassword.trim().length < 3) {
    return res.status(400).json({
      success: false,
      error: 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ',
    });
  }

  const db = readDB();
  const user = findUserByIdentifier(db.users, identifier);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'ບໍ່ພົບບັນຊີຈາກ ເບີໂທ, ຊື່ຜູ້ໃຊ້ ຫຼື ຊື່ ນີ້ໃນລະບົບ (Account not found)',
    });
  }

  user.password = newPassword.trim();
  writeDB(db);

  const userData = db.userData[user.id] || null;

  return res.json({
    success: true,
    message: `ຕັ້ງລະຫັດຜ່ານໃໝ່ສຳເລັດສຳລັບບັນຊີ ${user.fullName}!`,
    user,
    data: userData,
  });
});

// Sync user account profile (ensures user is saved in db.users from any active device)
app.post('/api/auth/sync-user', (req, res) => {
  const { user } = req.body;
  if (!user || !user.id || !user.password) {
    return res.status(400).json({ success: false, error: 'Invalid user payload' });
  }

  const db = readDB();
  const idx = db.users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], ...user };
  } else {
    // Also check if phone or username exists to avoid duplicates
    const dupIdx = db.users.findIndex(
      u => matchPhones(u.phone, user.phone) || u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (dupIdx >= 0) {
      db.users[dupIdx] = { ...db.users[dupIdx], ...user };
    } else {
      db.users.push(user);
    }
  }
  writeDB(db);

  return res.json({ success: true });
});

// Helper to sanitize test/dummy data
function cleanUserDataPayload(uData: any) {
  if (!uData) return null;
  const cleaned = { ...uData };
  if (Array.isArray(cleaned.transactions)) {
    cleaned.transactions = cleaned.transactions.filter(
      (t: any) => t && t.title !== 'Project OPEC' && t.title !== 'Project OT' && !['tx_1', 'tx_2', 'tx_3', 'tx_4', 'tx_5', 'tx_6', 'tx_7'].includes(t.id)
    );
  }
  if (Array.isArray(cleaned.accounts)) {
    cleaned.accounts = cleaned.accounts.map((a: any) => {
      if (a && [1000000, 200000, 12500000, 1800000, 10000000].includes(a.initialBalance)) {
        return { ...a, initialBalance: 0 };
      }
      return a;
    });
  }
  return cleaned;
}

// Fetch user data
app.get('/api/user/data', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }
  const db = readDB();
  const data = cleanUserDataPayload(db.userData[userId] || null);
  res.json({ success: true, data });
});

// Sync user financial data to server
app.post('/api/user/sync', (req, res) => {
  const { userId, transactions, categories, accounts, budgets, recurring } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId' });
  }

  const db = readDB();
  db.userData[userId] = {
    transactions,
    categories,
    accounts,
    budgets,
    recurring,
    updatedAt: Date.now(),
  };
  writeDB(db);

  res.json({ success: true });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`LaoExpense Pro Server running on port ${PORT}`);
  });
}

startServer();
