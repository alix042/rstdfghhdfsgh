const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage setup for Multer (image uploads)
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `img_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Data file persistence
const DATA_FILE = path.join(__dirname, 'data.json');

const defaultImages = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `${i + 1}. Revize Harita Detayı`,
  description: `Harita modülü #${i + 1} için teknik işleme ve detay doğrulaması yapılmaktadır.`,
  url: `https://picsum.photos/seed/roblox_map_${i + 1}/900/500`
}));

const defaultData = {
  isReady: false, // HARİTA TESLİMİ: hazır / hazır değil
  couponCode: "EKONQT-ROBLOX-2026-NXT99",
  adminPassword: "admin123",
  images: defaultImages,
  loadingDurationSeconds: 600, // 10 minutes extended default
  themeColor: "cyan", // cyan, emerald, purple, crimson
  activeVisitors: 4,
  hasErrors: true, // Haritada eksik var uyarısı
  userPin: "1234"  // 4 Haneli Kullanıcı Şifresi
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return { ...defaultData, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error("Error reading data.json, fallback to defaults:", err);
  }
  return defaultData;
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving data.json:", err);
  }
}

let dbState = loadData();

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Public API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    isReady: dbState.isReady,
    couponCode: dbState.couponCode,
    images: dbState.images,
    loadingDurationSeconds: dbState.loadingDurationSeconds || 600,
    themeColor: dbState.themeColor || "cyan",
    activeVisitors: Math.floor(Math.random() * 3) + 3,
    hasErrors: dbState.hasErrors !== undefined ? dbState.hasErrors : true,
    userPin: dbState.userPin || "1234"
  });
});

// User PIN Verification
app.post('/api/verify-pin', (req, res) => {
  const { username, pin } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, message: 'Lütfen kullanıcı adınızı giriniz!' });
  }
  if (!pin || pin.trim() !== (dbState.userPin || '1234')) {
    return res.status(401).json({ success: false, message: 'Hatalı 4 haneli şifre!' });
  }
  return res.json({ success: true, message: 'Kimlik doğrulandı!', username: username.trim() });
});

// Admin API endpoints
app.post('/api/admin/theme', authenticateAdmin, (req, res) => {
  const { themeColor } = req.body;
  if (['cyan', 'emerald', 'purple', 'crimson'].includes(themeColor)) {
    dbState.themeColor = themeColor;
    saveData(dbState);
    return res.json({ success: true, themeColor: dbState.themeColor });
  }
  return res.status(400).json({ success: false, message: 'Geçersiz tema!' });
});

app.post('/api/admin/errors', authenticateAdmin, (req, res) => {
  const { hasErrors } = req.body;
  dbState.hasErrors = Boolean(hasErrors);
  saveData(dbState);
  res.json({ success: true, hasErrors: dbState.hasErrors });
});

app.post('/api/admin/pin', authenticateAdmin, (req, res) => {
  const { userPin } = req.body;
  if (!userPin || userPin.length !== 4 || !/^\d{4}$/.test(userPin)) {
    return res.status(400).json({ success: false, message: 'Şifre tam olarak 4 rakamdan oluşmalıdır!' });
  }
  dbState.userPin = userPin;
  saveData(dbState);
  res.json({ success: true, userPin: dbState.userPin });
});

// Admin Authentication Middleware / Check
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const pass = req.body.adminPassword || (authHeader ? authHeader.replace('Bearer ', '') : '');
  if (pass === dbState.adminPassword) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Geçersiz admin şifresi!' });
}

// Admin API endpoints
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === dbState.adminPassword) {
    return res.json({ success: true, message: 'Giriş başarılı' });
  }
  return res.status(401).json({ success: false, message: 'Hatalı şifre!' });
});

app.post('/api/admin/status', authenticateAdmin, (req, res) => {
  const { isReady } = req.body;
  dbState.isReady = Boolean(isReady);
  saveData(dbState);
  res.json({ success: true, isReady: dbState.isReady });
});

app.post('/api/admin/code', authenticateAdmin, (req, res) => {
  const { couponCode } = req.body;
  if (!couponCode || !couponCode.trim()) {
    return res.status(400).json({ success: false, message: 'Kupon kodu boş olamaz!' });
  }
  dbState.couponCode = couponCode.trim();
  saveData(dbState);
  res.json({ success: true, couponCode: dbState.couponCode });
});

app.post('/api/admin/duration', authenticateAdmin, (req, res) => {
  const { seconds } = req.body;
  const numSec = parseInt(seconds, 10);
  if (isNaN(numSec) || numSec <= 0) {
    return res.status(400).json({ success: false, message: 'Geçersiz süre!' });
  }
  dbState.loadingDurationSeconds = numSec;
  saveData(dbState);
  res.json({ success: true, loadingDurationSeconds: dbState.loadingDurationSeconds });
});

app.post('/api/admin/upload-image/:index', authenticateAdmin, upload.single('image'), (req, res) => {
  const index = parseInt(req.params.index, 10);
  if (isNaN(index) || index < 0 || index >= 10) {
    return res.status(400).json({ success: false, message: 'Geçersiz fotoğraf indeksi (0-9 olmalı)!' });
  }

  if (req.file) {
    dbState.images[index].url = `/uploads/${req.file.filename}`;
  } else if (req.body.imageUrl) {
    dbState.images[index].url = req.body.imageUrl.trim();
  } else {
    return res.status(400).json({ success: false, message: 'Dosya veya Görsel URL\'si gereklidir!' });
  }

  if (req.body.title) dbState.images[index].title = req.body.title;
  if (req.body.description) dbState.images[index].description = req.body.description;

  saveData(dbState);
  res.json({ success: true, image: dbState.images[index] });
});

app.post('/api/admin/change-password', authenticateAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 3) {
    return res.status(400).json({ success: false, message: 'Şifre en az 3 karakter olmalıdır.' });
  }
  dbState.adminPassword = newPassword;
  saveData(dbState);
  res.json({ success: true, message: 'Admin şifresi güncellendi.' });
});

// Fallback route to serve main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` NEXTdosyayükleme sunucusu başlatıldı!`);
  console.log(` Port: ${PORT}`);
  console.log(` ekonqt tarafından yapılmıştır`);
  console.log(` Admin Şifresi: ${dbState.adminPassword}`);
  console.log(`====================================================`);
});
