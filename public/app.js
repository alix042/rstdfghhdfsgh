/* =========================================================
   NEXTdosyayükleme - Core Application Script (Enhanced Edition)
   Author: ekonqt
   ========================================================= */

// The 50 Roblox Map Loading Steps specified by the user
const ROBLOX_STEPS = [
	"1/50 - Harita geometrisi yükleniyor...",
	"2/50 - Ağaçlar ve bitki örtüsü yerleştiriliyor...",
	"3/50 - Binalar ve yapılar inşa ediliyor...",
	"4/50 - Arazi yükseklik haritası işleniyor...",
	"5/50 - Su fizikleri ve dalgalar ayarlanıyor...",
	"6/50 - Gökyüzü ve bulut efektleri senkronize ediliyor...",
	"7/50 - Işıklandırma ve gölgeler hesaplanıyor...",
	"8/50 - Atmosfer ve sis efektleri ekleniyor...",
	"9/50 - Dış mekan Kaplamaları (Textures) yükleniyor...",
	"10/50 - İç mekan detayları ve mobilyalar çiziliyor...",
	"11/50 - Mesh (3D Model) verileri indiriliyor...",
	"12/50 - Karakter animasyon dosyaları hazırlanıyor...",
	"13/50 - Oyuncu spawn noktaları doğrulanıyor...",
	"14/50 - NPC yolları ve haritalaması yapılandırılıyor...",
	"15/50 - Raycast ve çarpışma (Collision) kutuları oluşturuluyor...",
	"16/50 - Çevre sesleri ve efektleri önbelleğe alınıyor...",
	"17/50 - Arka plan müzikleri yükleniyor...",
	"18/50 - Adımlama sesleri sisteme tanımlanıyor...",
	"19/50 - UI (Arayüz) ikonları ve grafikler derleniyor...",
	"20/50 - Sunucu ve istemci bağlantısı doğrulanıyor...",
	"21/50 - Anti-Cheat güvenlik protokolleri başlatılıyor...",
	"22/50 - Veritabanı ve oyuncu verileri kontrol ediliyor...",
	"23/50 - Envanter nesneleri ve araçlar yükleniyor...",
	"24/50 - Market ve Gamepass entegrasyonu tamamlanıyor...",
	"25/50 - Özel efektler (Particles) hazırlanıyor...",
	"26/50 - Patlama ve kıvılcım efektleri optimize ediliyor...",
	"27/50 - Araç fizikleri ve tekerlek sürtünmeleri ayarlanıyor...",
	"28/50 - Silah mekanizmaları ve mermi yolları çiziliyor...",
	"29/50 - Ragdoll (Kukla) fizikleri aktifleştirilecektir...",
	"30/50 - Gece / Gündüz döngüsü senkronize ediliyor...",
	"31/50 - Hava durumu sistemleri (Yağmur/Rüzgar) kuruluyor...",
	"32/50 - Gölge kalitesi ve yansıma haritaları işleniyor...",
	"33/50 - Bloom ve Sunrays efektleri kalibre ediliyor...",
	"34/50 - Alan bazlı ses bölgeleri (Reverb) tanımlanıyor...",
	"35/50 - Chat (Sohbet) kanalları ve komutları yükleniyor...",
	"36/50 - Lider tablosu (Leaderstats) verileri çekiliyor...",
	"37/50 - Rozetler ve Başarımlar kontrol ediliyor...",
	"38/50 - Mini harita (Minimap) verileri oluşturuluyor...",
	"39/50 - Navigasyon ağı (Pathfinding) güncelleniyor...",
	"40/50 - Materyal pürüzsüzlükleri hesaplanıyor...",
	"41/50 - Yüksek çözünürlüklü kaplamalar işleniyor...",
	"42/50 - Kamera açıları ve sarsıntı efektleri hazılanıyor...",
	"43/50 - Dükkan ürün dizilimleri taranıyor...",
	"44/50 - Parti ve klan sistemleri bağlanıyor...",
	"45/50 - Görev yöneticisi ve diyaloglar yükleniyor...",
	"46/50 - Ses efekt parametreleri dengeleniyor...",
	"47/50 - RAM ve FPS optimizasyonu yapılıyor...",
	"48/50 - Son harita detayları cilalanıyor...",
	"49/50 - Harita yüklemesi doğrulanıyor...",
	"50/50 - Dünya hazır! Giriş yapılıyor..."
];

// Application State
let state = {
  isReady: false,
  couponCode: "EKONQT-ROBLOX-2026-NXT99",
  images: [],
  loadingDurationSeconds: 300, // 5 mins
  themeColor: 'cyan',
  currentImageIndex: 0,
  completedImages: new Set(),
  adminToken: null,
  soundMuted: false
};

// Timers & Audio
let imageLoaderInterval = null;
let robloxLoaderInterval = null;
let gaugeInterval = null;
let audioCtx = null;

// Sound Synthesizer via Web Audio API
function playSound(type = 'beep', freq = 600, duration = 0.08) {
  if (state.soundMuted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (type === 'fanfare') {
      // Fanfare sequence
      [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
        setTimeout(() => playSound('beep', f, 0.15), idx * 120);
      });
      return;
    }

    osc.type = type === 'click' ? 'square' : 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio optional fallback
  }
}

// DOM Elements
const statusPill = document.getElementById('status-pill');
const notReadyBanner = document.getElementById('not-ready-banner');
const imageTabsContainer = document.getElementById('image-tabs-container');
const currentInspectionImg = document.getElementById('current-inspection-img');
const imageLoaderOverlay = document.getElementById('image-loader-overlay');
const techStepBadge = document.getElementById('tech-step-badge');
const techLoadingText = document.getElementById('tech-loading-text');
const techProgressFill = document.getElementById('tech-progress-fill');
const techPercent = document.getElementById('tech-percent');
const techTimeLeft = document.getElementById('tech-time-left');

const currentPhotoNum = document.getElementById('current-photo-num');
const imgDetailsTitle = document.getElementById('img-details-title');
const imgDetailsDesc = document.getElementById('img-details-desc');
const specPolyVal = document.getElementById('spec-poly-val');
const specHashVal = document.getElementById('spec-hash-val');
const specStatusVal = document.getElementById('spec-status-val');
const nextPhotoBtn = document.getElementById('next-photo-btn');

// Metrics DOM
const visitorCount = document.getElementById('visitor-count');
const pingVal = document.getElementById('ping-val');
const fpsVal = document.getElementById('fps-val');
const ramVal = document.getElementById('ram-val');
const speedVal = document.getElementById('speed-val');
const soundToggleBtn = document.getElementById('sound-toggle-btn');

// Stages
const stageImages = document.getElementById('stage-images');
const stageRobloxLoader = document.getElementById('stage-roblox-loader');
const stageCoupon = document.getElementById('stage-coupon');

// Timer & Terminal
const timerMin = document.getElementById('timer-min');
const timerSec = document.getElementById('timer-sec');
const currentStepTitle = document.getElementById('current-step-title');
const overallPercentage = document.getElementById('overall-percentage');
const mainProgressFill = document.getElementById('main-progress-fill');
const terminalLogs = document.getElementById('terminal-logs');

// Coupon
const displayCouponCode = document.getElementById('display-coupon-code');
const copyCodeBtn = document.getElementById('copy-code-btn');

// Zoom Modal
const zoomImgBtn = document.getElementById('zoom-img-btn');
const imageZoomModal = document.getElementById('image-zoom-modal');
const zoomedImg = document.getElementById('zoomed-img');
const zoomedCaption = document.getElementById('zoomed-caption');
const closeZoomBtn = document.getElementById('close-zoom-btn');

// Admin Elements
const openAdminBtn = document.getElementById('open-admin-btn');
const closeAdminBtn = document.getElementById('close-admin-btn');
const adminModal = document.getElementById('admin-modal');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginView = document.getElementById('admin-login-view');
const adminDashboardView = document.getElementById('admin-dashboard-view');
const adminPassInput = document.getElementById('admin-pass-input');
const toggleReadyBtn = document.getElementById('toggle-ready-btn');
const adminCodeInput = document.getElementById('admin-code-input');
const saveCodeBtn = document.getElementById('save-code-btn');
const dur300Btn = document.getElementById('dur-300-btn');
const dur10Btn = document.getElementById('dur-10-btn');
const adminInstantFinishBtn = document.getElementById('admin-instant-finish-btn');
const adminImagesList = document.getElementById('admin-images-list');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initParticleCanvas();
  initFPSCounter();
  initGauges();
  fetchServerStatus();
  setInterval(fetchServerStatus, 3000); // Poll status every 3s
  setupEventListeners();
});

// Particle Matrix Canvas Background Engine
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#06b6d4';

    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = primaryColor;

    particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      for (let j = idx + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.globalAlpha = 1 - dist / 130;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// FPS & Ping Metrics Counter
function initFPSCounter() {
  let frameCount = 0;
  let lastTime = performance.now();

  function calcFPS(now) {
    frameCount++;
    if (now >= lastTime + 1000) {
      fpsVal.innerText = `${frameCount} FPS`;
      frameCount = 0;
      lastTime = now;
      const fakePing = Math.floor(Math.random() * 6) + 14;
      pingVal.innerText = `${fakePing}ms`;
    }
    requestAnimationFrame(calcFPS);
  }
  requestAnimationFrame(calcFPS);
}

// Dynamic Hardware Gauges Simulation
function initGauges() {
  gaugeInterval = setInterval(() => {
    const ram = (2.4 + Math.random() * 0.9).toFixed(1);
    const speed = (150 + Math.random() * 45).toFixed(1);
    if (ramVal) ramVal.innerText = `${ram} GB / 8.0 GB`;
    if (speedVal) speedVal.innerText = `${speed} MB/s`;
  }, 2000);
}

// Fetch Status from Express Backend API
async function fetchServerStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.success) {
      state.isReady = data.isReady;
      state.couponCode = data.couponCode;
      state.images = data.images || [];
      state.loadingDurationSeconds = data.loadingDurationSeconds || 300;
      if (data.themeColor) setSiteTheme(data.themeColor, false);
      if (data.activeVisitors && visitorCount) visitorCount.innerText = data.activeVisitors;

      updateStatusUI();

      if (state.images.length > 0 && imageTabsContainer.children.length === 0) {
        renderImageTabs();
        loadInspectionImage(0);
      }
    }
  } catch (err) {
    console.error('Error fetching status:', err);
  }
}

// Update Theme Class
function setSiteTheme(color, sendApi = true) {
  state.themeColor = color;
  document.body.className = `theme-${color}`;
  if (sendApi && state.adminToken) {
    fetch('/api/admin/theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ themeColor: color, adminPassword: state.adminToken })
    });
  }
}
window.setSiteTheme = setSiteTheme;

// Update Header Status UI
function updateStatusUI() {
  if (state.isReady) {
    statusPill.className = 'status-pill status-ready';
    statusPill.innerHTML = '<span class="status-dot"></span><span class="status-text">HARİTA TESLİMİNE: <strong>HAZIR</strong></span>';
    notReadyBanner.classList.add('hidden');
    if (toggleReadyBtn) {
      toggleReadyBtn.className = 'btn-status-toggle is-ready';
      toggleReadyBtn.innerText = 'HAZIR (Tıkla: Değiştir)';
    }
  } else {
    statusPill.className = 'status-pill status-not-ready';
    statusPill.innerHTML = '<span class="status-dot"></span><span class="status-text">HARİTA TESLİMİNE: <strong>HAZIR DEĞİL</strong></span>';
    notReadyBanner.classList.remove('hidden');
    if (toggleReadyBtn) {
      toggleReadyBtn.className = 'btn-status-toggle not-ready';
      toggleReadyBtn.innerText = 'HAZIR DEĞİL (Tıkla: Değiştir)';
    }
  }
}

// Render 10 Image Navigation Tabs
function renderImageTabs() {
  imageTabsContainer.innerHTML = '';
  state.images.forEach((img, idx) => {
    const btn = document.createElement('button');
    btn.className = `tab-btn ${idx === state.currentImageIndex ? 'active' : ''} ${state.completedImages.has(idx) ? 'completed' : ''}`;
    btn.innerHTML = `<i class="${state.completedImages.has(idx) ? 'fa-solid fa-circle-check' : 'fa-solid fa-image'}"></i> ${idx + 1}. Revize`;
    btn.onclick = () => {
      playSound('click', 700, 0.05);
      loadInspectionImage(idx);
    };
    imageTabsContainer.appendChild(btn);
  });
}

// Load Image and start 25-Second Fake Loader
function loadInspectionImage(index) {
  if (imageLoaderInterval) clearInterval(imageLoaderInterval);

  state.currentImageIndex = index;
  renderImageTabs();

  currentPhotoNum.innerText = index + 1;

  const imgData = state.images[index] || {
    title: `${index + 1}. Revize Fotoğrafı`,
    description: `Harita modülü #${index + 1} için teknik işleme yapılıyor.`,
    url: `https://picsum.photos/seed/roblox_map_${index + 1}/900/500`
  };

  currentInspectionImg.src = imgData.url;
  imgDetailsTitle.innerHTML = `<i class="fa-solid fa-camera"></i> ${index + 1}. Revize Fotoğrafı`;
  imgDetailsDesc.innerText = imgData.description || `Harita modülü #${index + 1} için teknik işleme yapılmaktadır.`;

  // Randomize realistic spec detail values
  const polyCount = (1100000 + index * 45200).toLocaleString();
  specPolyVal.innerText = `${polyCount} Triangles`;
  specHashVal.innerText = `SHA256-NXT-${1000 + index * 83}`;

  // Update Next Button label
  if (index < 9) {
    nextPhotoBtn.innerHTML = `<span class="btn-text">${index + 2}. Revize Fotoğrafına Geçmek İçin Tıklayın</span> <i class="fa-solid fa-arrow-right"></i>`;
  } else {
    nextPhotoBtn.innerHTML = `<span class="btn-text">Son Fotoğraf Tamamlandı! Harita Yüklemesine Geç</span> <i class="fa-solid fa-check-double"></i>`;
  }

  // If already loaded before, show completed immediately
  if (state.completedImages.has(index)) {
    imageLoaderOverlay.classList.remove('active');
    specStatusVal.className = 'spec-val text-success';
    specStatusVal.innerText = 'Tamamlandı (Doğrulandı)';
    nextPhotoBtn.disabled = false;
    return;
  }

  // Start 25-Second Technical Fake Loader
  imageLoaderOverlay.classList.add('active');
  specStatusVal.className = 'spec-val text-warning';
  specStatusVal.innerText = 'Yükleniyor...';
  nextPhotoBtn.disabled = true;

  techStepBadge.innerText = `SERİ NO #${index + 1} TEKNİK TARAMA`;

  const totalTime = 25.0; // 25 seconds required by prompt
  let elapsed = 0;

  const messages = [
    "Fotoğrafın teknik matrisi ve poligon verileri taranıyor...",
    "Görsel doku (Texture) paketleri ayrıştırılıyor...",
    "Roblox Studio 3D render modeli ile eşleştiriliyor...",
    "Son yükleme ve teknik güvenlik kontrolleri yapılıyor..."
  ];

  imageLoaderInterval = setInterval(() => {
    elapsed += 0.2;
    const progressPercent = Math.min(100, (elapsed / totalTime) * 100);
    const timeLeft = Math.max(0, totalTime - elapsed).toFixed(1);

    techProgressFill.style.width = `${progressPercent}%`;
    techPercent.innerText = `${Math.floor(progressPercent)}%`;
    techTimeLeft.innerText = `${timeLeft}s Kaldı`;

    if (Math.floor(elapsed * 5) % 5 === 0) {
      playSound('beep', 400 + progressPercent * 3, 0.03);
    }

    if (elapsed < 6) {
      techLoadingText.innerText = messages[0];
    } else if (elapsed < 12) {
      techLoadingText.innerText = messages[1];
    } else if (elapsed < 19) {
      techLoadingText.innerText = messages[2];
    } else {
      techLoadingText.innerText = messages[3];
    }

    if (elapsed >= totalTime) {
      clearInterval(imageLoaderInterval);
      state.completedImages.add(index);
      renderImageTabs();
      imageLoaderOverlay.classList.remove('active');
      specStatusVal.className = 'spec-val text-success';
      specStatusVal.innerText = 'Doğrulandı';
      nextPhotoBtn.disabled = false;
      playSound('beep', 900, 0.15);
      showToast(`${index + 1}. Revize Fotoğrafı başarıyla doğrulandı!`);
    }
  }, 200);
}

// Legal Contract State
let approvedMaddeler = new Set();

// Next Photo Button Click Event
nextPhotoBtn.onclick = () => {
  playSound('click', 600, 0.05);
  if (state.currentImageIndex < 9) {
    loadInspectionImage(state.currentImageIndex + 1);
  } else {
    if (!state.isReady) {
      showToast("Harita teslimi henüz admin tarafından HAZIR yapılmadı!", "error");
      alert("Harita teslimatı şu an 'HAZIR DEĞİL' durumundadır. Yöneticinin (ekonqt) onay vermesini bekleyiniz.");
    } else {
      // Check if legal contract approved, if not open legal wizard modal
      if (approvedMaddeler.size < 4) {
        openLegalContractModal();
      } else {
        startRobloxMapDeliveryLoader();
      }
    }
  }
};

// Legal Contract Modal Wizard Logic
const legalModal = document.getElementById('legal-modal');
const legalApprovedCount = document.getElementById('legal-approved-count');
const legalProgressFill = document.getElementById('legal-progress-fill');
const finalLegalSubmitBtn = document.getElementById('final-legal-submit-btn');

function openLegalContractModal() {
  legalModal.classList.remove('hidden');
  updateLegalWizardUI();
}

function approveMadde(num) {
  playSound('beep', 800 + num * 100, 0.1);
  approvedMaddeler.add(num);
  showToast(`Madde ${num} okundu ve onaylandı!`, "success");
  updateLegalWizardUI();
}

function updateLegalWizardUI() {
  const count = approvedMaddeler.size;
  legalApprovedCount.innerText = count;
  legalProgressFill.style.width = `${(count / 4) * 100}%`;

  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById(`madde-card-${i}`);
    const statusIcon = document.getElementById(`madde-status-${i}`);
    const btn = document.getElementById(`btn-approve-madde-${i}`);

    if (approvedMaddeler.has(i)) {
      card.className = 'madde-card approved';
      statusIcon.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
      btn.className = 'btn-primary btn-madde-approve approved';
      btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Madde ${i} Onaylandı`;
      btn.disabled = true;
    } else if (i === 1 || approvedMaddeler.has(i - 1)) {
      card.className = 'madde-card active';
      statusIcon.innerHTML = '<i class="fa-regular fa-circle text-primary"></i>';
      btn.className = 'btn-primary btn-madde-approve';
      btn.disabled = false;
    } else {
      card.className = 'madde-card locked';
      statusIcon.innerHTML = '<i class="fa-solid fa-lock"></i>';
      btn.disabled = true;
    }
  }

  if (count === 4) {
    finalLegalSubmitBtn.disabled = false;
  } else {
    finalLegalSubmitBtn.disabled = true;
  }
}

document.getElementById('btn-approve-madde-1').onclick = () => approveMadde(1);
document.getElementById('btn-approve-madde-2').onclick = () => approveMadde(2);
document.getElementById('btn-approve-madde-3').onclick = () => approveMadde(3);
document.getElementById('btn-approve-madde-4').onclick = () => approveMadde(4);

finalLegalSubmitBtn.onclick = () => {
  playSound('fanfare');
  legalModal.classList.add('hidden');
  showToast("Yasal mutabakat metni tamamen onaylandı!", "success");
  startRobloxMapDeliveryLoader();
};


// Zoom Image Modal
zoomImgBtn.onclick = () => {
  zoomedImg.src = currentInspectionImg.src;
  zoomedCaption.innerText = imgDetailsTitle.innerText;
  imageZoomModal.classList.remove('hidden');
};

closeZoomBtn.onclick = () => {
  imageZoomModal.classList.add('hidden');
};

// Sound Toggle
soundToggleBtn.onclick = () => {
  state.soundMuted = !state.soundMuted;
  if (state.soundMuted) {
    soundToggleBtn.className = 'btn-icon muted';
    soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    showToast("Sistem sesleri kapatıldı", "info");
  } else {
    soundToggleBtn.className = 'btn-icon';
    soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    playSound('beep', 750, 0.1);
    showToast("Sistem sesleri açıldı", "info");
  }
};

// Start Stage 2: 5-Minute 50-Step Roblox Loading Sequence
function startRobloxMapDeliveryLoader() {
  stageImages.classList.add('hidden');
  stageRobloxLoader.classList.remove('hidden');
  stageCoupon.classList.add('hidden');

  terminalLogs.innerHTML = '';
  
  const duration = state.loadingDurationSeconds || 300; // 300 seconds default (5 mins)
  let currentStepIndex = 0;
  let remainingSeconds = duration;

  updateTimerDisplay(remainingSeconds);

  addTerminalLog("NEXTdosyayükleme v2.4 Sunucu Bağlantısı Kuruldu", "system");
  addTerminalLog("ekonqt Yetkisi Doğrulandı. 50 Modüllük Harita Yüklemesi Başlatılıyor...", "system");

  robloxLoaderInterval = setInterval(() => {
    remainingSeconds -= 0.5;
    if (remainingSeconds < 0) remainingSeconds = 0;

    updateTimerDisplay(remainingSeconds);

    const calculatedStep = Math.min(
      ROBLOX_STEPS.length - 1,
      Math.floor(((duration - remainingSeconds) / duration) * ROBLOX_STEPS.length)
    );

    if (calculatedStep > currentStepIndex) {
      currentStepIndex = calculatedStep;
      const stepText = ROBLOX_STEPS[currentStepIndex];

      currentStepTitle.innerHTML = `<i class="fa-solid fa-gear fa-spin text-primary"></i> ${stepText}`;
      addTerminalLog(stepText, "log");
      playSound('beep', 500 + currentStepIndex * 12, 0.05);

      const percent = Math.floor(((currentStepIndex + 1) / ROBLOX_STEPS.length) * 100);
      overallPercentage.innerText = `${percent}%`;
      mainProgressFill.style.width = `${percent}%`;
    }

    if (remainingSeconds <= 0) {
      clearInterval(robloxLoaderInterval);
      completeRobloxLoader();
    }
  }, 500);
}

function updateTimerDisplay(totalSecs) {
  const m = Math.floor(totalSecs / 60);
  const s = Math.floor(totalSecs % 60);
  timerMin.innerText = m < 10 ? `0${m}` : m;
  timerSec.innerText = s < 10 ? `0${s}` : s;
}

function addTerminalLog(msg, type = "log") {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-msg ${type === 'complete' ? 'completed' : ''}">${msg}</span>`;
  terminalLogs.appendChild(div);
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// Complete Stage 2 -> Transition to 15s Diagnostic Fix or PIN Gate
function completeRobloxLoader() {
  overallPercentage.innerText = '100%';
  mainProgressFill.style.width = '100%';
  currentStepTitle.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${ROBLOX_STEPS[ROBLOX_STEPS.length - 1]}`;
  addTerminalLog(">>> TEBRİKLER! 50 Adımlı Harita Derlemesi Tamamlandı. Kontrol ediliyor... <<<", "complete");

  playSound('beep', 1000, 0.2);

  setTimeout(() => {
    stageRobloxLoader.classList.add('hidden');
    
    if (state.hasErrors) {
      start15SecondErrorFixLoader();
    } else {
      showPinGateStage();
    }
  }, 1500);
}

// 15-SECOND MISSING MAP ERROR DIAGNOSTIC LOADER
let errorFixInterval = null;
const stageErrorFix = document.getElementById('stage-error-fix');
const errorTimerSec = document.getElementById('error-timer-sec');
const errorStepTitle = document.getElementById('error-step-title');
const errorPercentage = document.getElementById('error-percentage');
const errorProgressFill = document.getElementById('error-progress-fill');

function start15SecondErrorFixLoader() {
  stageErrorFix.classList.remove('hidden');
  
  let remaining = 15.0;
  const total = 15.0;

  playSound('beep', 400, 0.3);
  showToast("HARİTADA EKSİK VAR! 15 saniyelik otomatik onarım başlatıldı.", "error");

  errorFixInterval = setInterval(() => {
    remaining -= 0.2;
    if (remaining < 0) remaining = 0;

    errorTimerSec.innerText = remaining.toFixed(1);
    const percent = Math.floor(((total - remaining) / total) * 100);
    errorPercentage.innerText = `${percent}%`;
    errorProgressFill.style.width = `${percent}%`;

    if (Math.floor(remaining * 5) % 5 === 0) {
      playSound('beep', 350 + percent * 4, 0.04);
    }

    if (remaining <= 0) {
      clearInterval(errorFixInterval);
      state.hasErrors = false; // Mark errors resolved
      stageErrorFix.classList.add('hidden');
      showToast("Eksik ve hatalar başarıyla giderildi!", "success");
      showPinGateStage();
    }
  }, 200);
}

// USERNAME & 4-DIGIT PIN SECURITY GATE STAGE
const stagePinLogin = document.getElementById('stage-pin-login');
const userPinForm = document.getElementById('user-pin-form');
const userNameInput = document.getElementById('user-name-input');
const userPinInput = document.getElementById('user-pin-input');
const claimedUsername = document.getElementById('claimed-username');

function showPinGateStage() {
  stageErrorFix.classList.add('hidden');
  stagePinLogin.classList.remove('hidden');
  playSound('beep', 750, 0.1);
}

if (userPinForm) {
  userPinForm.onsubmit = async (e) => {
    e.preventDefault();
    const username = userNameInput.value.trim();
    const pin = userPinInput.value.trim();

    if (!username) return showToast("Lütfen kullanıcı adınızı giriniz!", "error");
    if (!pin || pin.length !== 4) return showToast("Şifre 4 haneli olmalıdır!", "error");

    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin })
      });
      const data = await res.json();
      if (data.success) {
        playSound('fanfare');
        stagePinLogin.classList.add('hidden');
        stageCoupon.classList.remove('hidden');
        displayCouponCode.innerText = state.couponCode || "EKONQT-ROBLOX-2026-NXT99";
        if (claimedUsername) claimedUsername.innerText = username;
        showToast("Kimlik başarıyla doğrulandı! Harita teslim edildi.", "success");
      } else {
        playSound('beep', 250, 0.2);
        showToast(data.message || "Hatalı şifre!", "error");
      }
    } catch (err) {
      showToast("Doğrulama sunucusuna ulaşılamadı!", "error");
    }
  };
}


// Copy Code Button
copyCodeBtn.onclick = () => {
  const code = displayCouponCode.innerText;
  navigator.clipboard.writeText(code).then(() => {
    playSound('beep', 1000, 0.1);
    showToast("Teslimat Kupon Kodu Başarıyla Kopyalandı!", "success");
    copyCodeBtn.innerHTML = '<i class="fa-solid fa-check"></i> Kopyalandı!';
    setTimeout(() => {
      copyCodeBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Kodu Kopyala';
    }, 2500);
  });
};

// Toast Notifications
function showToast(msg, type = "info") {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation text-warning' : 'fa-circle-check text-success'}"></i> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ADMIN PANEL LOGIC
openAdminBtn.onclick = () => {
  playSound('click', 600, 0.05);
  adminModal.classList.remove('hidden');
  if (state.adminToken) {
    showAdminDashboard();
  } else {
    adminLoginView.classList.remove('hidden');
    adminDashboardView.classList.add('hidden');
  }
};

closeAdminBtn.onclick = () => {
  adminModal.classList.add('hidden');
};

adminLoginForm.onsubmit = async (e) => {
  e.preventDefault();
  const pass = adminPassInput.value.trim();
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    });
    const data = await res.json();
    if (data.success) {
      state.adminToken = pass;
      showAdminDashboard();
      showToast("Admin girişi başarılı!", "success");
    } else {
      showToast(data.message || "Hatalı şifre!", "error");
    }
  } catch (err) {
    showToast("Sunucuya bağlanılamadı!", "error");
  }
};

function showAdminDashboard() {
  adminLoginView.classList.add('hidden');
  adminDashboardView.classList.remove('hidden');

  adminCodeInput.value = state.couponCode;

  updateAdminDurationChips();
  renderAdminImagesList();
}

// Toggle Map Errors from Admin
const toggleErrorsBtn = document.getElementById('toggle-errors-btn');
const adminUserPinInput = document.getElementById('admin-user-pin-input');
const saveUserPinBtn = document.getElementById('save-user-pin-btn');

if (toggleErrorsBtn) {
  toggleErrorsBtn.onclick = async () => {
    const nextErrors = !state.hasErrors;
    try {
      const res = await fetch('/api/admin/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.adminToken}`
        },
        body: JSON.stringify({ hasErrors: nextErrors, adminPassword: state.adminToken })
      });
      const data = await res.json();
      if (data.success) {
        state.hasErrors = data.hasErrors;
        updateAdminErrorsUI();
        showToast(`Harita Hata Durumu: ${state.hasErrors ? 'EKSİK VAR' : 'EKSİK YOK (DÜZELTİLDİ)'}`, "success");
      }
    } catch (err) {
      showToast("Hata durumu güncellenemedi!", "error");
    }
  };
}

function updateAdminErrorsUI() {
  if (toggleErrorsBtn) {
    if (state.hasErrors) {
      toggleErrorsBtn.className = 'btn-status-toggle not-ready';
      toggleErrorsBtn.innerText = 'HARİTADA EKSİK VAR (Açık)';
    } else {
      toggleErrorsBtn.className = 'btn-status-toggle is-ready';
      toggleErrorsBtn.innerText = 'EKSİK YOK (Düzeltildi)';
    }
  }
}

if (saveUserPinBtn) {
  saveUserPinBtn.onclick = async () => {
    const newPin = adminUserPinInput.value.trim();
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return showToast("Şifre tam olarak 4 rakam olmalıdır!", "error");
    }

    try {
      const res = await fetch('/api/admin/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.adminToken}`
        },
        body: JSON.stringify({ userPin: newPin, adminPassword: state.adminToken })
      });
      const data = await res.json();
      if (data.success) {
        state.userPin = data.userPin;
        showToast(`Kullanıcı 4 haneli PIN şifresi '${state.userPin}' olarak kaydedildi!`, "success");
      }
    } catch (err) {
      showToast("PIN şifresi güncellenemedi!", "error");
    }
  };
}

// Toggle Ready Status from Admin
toggleReadyBtn.onclick = async () => {
  const nextReady = !state.isReady;
  try {
    const res = await fetch('/api/admin/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ isReady: nextReady, adminPassword: state.adminToken })
    });
    const data = await res.json();
    if (data.success) {
      state.isReady = data.isReady;
      updateStatusUI();
      showToast(`Harita teslimat durumu: ${state.isReady ? 'HAZIR' : 'HAZIR DEĞİL'} yapıldı!`, "success");
    }
  } catch (err) {
    showToast("Durum güncellenemedi!", "error");
  }
};

// Save Coupon Code from Admin
saveCodeBtn.onclick = async () => {
  const newCode = adminCodeInput.value.trim();
  if (!newCode) return showToast("Kod boş bırakılamaz!", "error");

  try {
    const res = await fetch('/api/admin/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ couponCode: newCode, adminPassword: state.adminToken })
    });
    const data = await res.json();
    if (data.success) {
      state.couponCode = data.couponCode;
      showToast("Kupon kodu başarıyla kaydedildi!", "success");
    }
  } catch (err) {
    showToast("Kod güncellenemedi!", "error");
  }
};

// Duration Selection Chips
// DURATION BUTTON HANDLERS
const dur900Btn = document.getElementById('dur-900-btn');
const dur600Btn = document.getElementById('dur-600-btn');

if (dur900Btn) dur900Btn.onclick = () => setDuration(900);
if (dur600Btn) dur600Btn.onclick = () => setDuration(600);
dur300Btn.onclick = () => setDuration(300);
dur10Btn.onclick = () => setDuration(10);

function updateAdminDurationChips() {
  const d = state.loadingDurationSeconds;
  if (dur900Btn) dur900Btn.className = d === 900 ? 'btn-chip active' : 'btn-chip';
  if (dur600Btn) dur600Btn.className = d === 600 ? 'btn-chip active' : 'btn-chip';
  dur300Btn.className = d === 300 ? 'btn-chip active' : 'btn-chip';
  dur10Btn.className = d === 10 ? 'btn-chip active' : 'btn-chip';
}

// 1. CYBER SYNTH RADIO PLAYER ENGINE
let isRadioPlaying = false;
let radioLoopInterval = null;
const radioPlayBtn = document.getElementById('radio-play-btn');
const radioSelect = document.getElementById('radio-channel-select');
const visCanvas = document.getElementById('radio-visualizer-canvas');

if (radioPlayBtn) {
  radioPlayBtn.onclick = () => {
    isRadioPlaying = !isRadioPlaying;
    if (isRadioPlaying) {
      radioPlayBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Müziği Durdur';
      radioPlayBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      startRadioSynth();
      showToast("Radio Müzik Çalıyor!", "info");
    } else {
      radioPlayBtn.innerHTML = '<i class="fa-solid fa-play"></i> Müzik Çal';
      radioPlayBtn.style.background = '';
      stopRadioSynth();
    }
  };
}

function startRadioSynth() {
  if (radioLoopInterval) clearInterval(radioLoopInterval);
  let step = 0;
  
  radioLoopInterval = setInterval(() => {
    if (!isRadioPlaying) return;
    const channel = radioSelect ? radioSelect.value : 'synthwave';
    
    let freqs = [220, 277, 329, 440];
    if (channel === 'lofi') freqs = [174, 220, 261, 329];
    if (channel === 'chiptune') freqs = [330, 440, 554, 659, 880];

    const freq = freqs[step % freqs.length];
    playSound('beep', freq, 0.12);
    drawRadioVisualizer();
    step++;
  }, 320);
}

function stopRadioSynth() {
  if (radioLoopInterval) clearInterval(radioLoopInterval);
}

function drawRadioVisualizer() {
  if (!visCanvas) return;
  const ctx = visCanvas.getContext('2d');
  ctx.clearRect(0, 0, visCanvas.width, visCanvas.height);
  const bars = 16;
  const barWidth = visCanvas.width / bars;

  for (let i = 0; i < bars; i++) {
    const h = Math.random() * visCanvas.height * (isRadioPlaying ? 0.9 : 0.1);
    ctx.fillStyle = i % 2 === 0 ? '#06b6d4' : '#10b981';
    ctx.fillRect(i * barWidth, visCanvas.height - h, barWidth - 3, h);
  }
}

// 2. INTERACTIVE 3D MESH INSPECTOR CANVAS
function init3DMeshInspector() {
  const canvas = document.getElementById('canvas-3d-inspector');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let rx = 0.4, ry = 0.6;
  let isDragging = false;
  let prevMouseX = 0, prevMouseY = 0;

  // 3D Cube vertices
  const vertices = [
    [-40, -40, -40], [40, -40, -40], [40, 40, -40], [-40, 40, -40],
    [-40, -40, 40],  [40, -40, 40],  [40, 40, 40],  [-40, 40, 40]
  ];

  const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7]
  ];

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => isDragging = false);

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    ry += dx * 0.01;
    rx += dy * 0.01;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  function render3D() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isDragging) ry += 0.01; // Auto spin

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const projected = vertices.map(([x, y, z]) => {
      // Rotate Y
      let x1 = x * Math.cos(ry) + z * Math.sin(ry);
      let z1 = -x * Math.sin(ry) + z * Math.cos(ry);
      // Rotate X
      let y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
      let z2 = y * Math.sin(rx) + z1 * Math.cos(rx);

      const fov = 200;
      const scale = fov / (fov + z2 + 100);
      return [cx + x1 * scale, cy + y2 * scale];
    });

    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#06b6d4';
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;

    edges.forEach(([u, v]) => {
      const [p1x, p1y] = projected[u];
      const [p2x, p2y] = projected[v];
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
    });

    requestAnimationFrame(render3D);
  }
  render3D();
}

// 3. ROBLOX TRIVIA QUIZ ENGINE
const QUIZ_DATA = [
  {
    q: "Roblox oyunu ilk kez hangi yılda piyasaya sürülmüştür?",
    opts: ["A) 2006", "B) 2010", "C) 2012", "D) 2015"],
    ans: 0
  },
  {
    q: "Roblox Studio'da nesnelerin düşmesini engelleyen özellik hangisidir?",
    opts: ["A) Transparency", "B) Anchored", "C) CanCollide", "D) CastShadow"],
    ans: 1
  },
  {
    q: "Roblox Studio'da kullanılan ana programlama dili hangisidir?",
    opts: ["A) Python", "B) C++", "C) Luau / Lua", "D) JavaScript"],
    ans: 2
  },
  {
    q: "Gelişmiş dinamik ışıklandırma Roblox'ta ne olarak adlandırılır?",
    opts: ["A) Future Lighting", "B) ShadowMap", "C) Voxel", "D) Compatibility"],
    ans: 0
  },
  {
    q: "Roblox oyun içi para biriminin adı nedir?",
    opts: ["A) V-Bucks", "B) Robux", "C) Minecoin", "D) Gold"],
    ans: 1
  }
];

let quizCurrentIdx = 0;
let quizScore = 0;

function initTriviaQuiz() {
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const qNum = document.getElementById('quiz-question-num');
  const qText = document.getElementById('quiz-question-text');
  const optsBox = document.getElementById('quiz-options-container');

  if (!qNum || !qText || !optsBox) return;

  if (quizCurrentIdx >= QUIZ_DATA.length) {
    qNum.innerText = "YARIŞMA TAMAMLANDI!";
    qText.innerHTML = `Tebrikler! Toplam Skorunuz: <strong>${quizScore} / 50 Puan</strong> 🎉`;
    optsBox.innerHTML = `
      <button class="btn-primary btn-full" onclick="resetTriviaQuiz()" style="grid-column: span 2;">
        <i class="fa-solid fa-rotate-right"></i> Tekrar Oyna
      </button>
    `;
    return;
  }

  const currentData = QUIZ_DATA[quizCurrentIdx];
  qNum.innerText = `Soru ${quizCurrentIdx + 1} / ${QUIZ_DATA.length}`;
  qText.innerText = currentData.q;

  optsBox.innerHTML = '';
  currentData.opts.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.innerText = opt;
    btn.onclick = () => handleQuizAnswer(idx, btn);
    optsBox.appendChild(btn);
  });
}

function handleQuizAnswer(idx, clickedBtn) {
  const currentData = QUIZ_DATA[quizCurrentIdx];
  const allBtns = document.querySelectorAll('.quiz-opt-btn');
  allBtns.forEach(b => b.disabled = true);

  if (idx === currentData.ans) {
    clickedBtn.className = 'quiz-opt-btn correct';
    quizScore += 10;
    playSound('beep', 1000, 0.12);
    showToast("Doğru Cevap! (+10 Puan)", "success");
  } else {
    clickedBtn.className = 'quiz-opt-btn incorrect';
    playSound('beep', 300, 0.2);
    allBtns[currentData.ans].className = 'quiz-opt-btn correct';
  }

  setTimeout(() => {
    quizCurrentIdx++;
    renderQuizQuestion();
  }, 1400);
}

function resetTriviaQuiz() {
  quizCurrentIdx = 0;
  quizScore = 0;
  renderQuizQuestion();
}
window.resetTriviaQuiz = resetTriviaQuiz;

// 4. INTERACTIVE TERMINAL COMMAND LINE
const terminalCmdInput = document.getElementById('terminal-cmd-input');
const terminalCmdSend = document.getElementById('terminal-cmd-send');

if (terminalCmdInput) {
  terminalCmdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleTerminalCommand();
  });
}
if (terminalCmdSend) {
  terminalCmdSend.onclick = handleTerminalCommand;
}

function handleTerminalCommand() {
  if (!terminalCmdInput) return;
  const cmd = terminalCmdInput.value.trim().toLowerCase();
  if (!cmd) return;

  addTerminalLog(`$ ${cmd}`, "system");
  terminalCmdInput.value = '';

  if (cmd === 'help') {
    addTerminalLog("Kullanılabilir Komutlar: help, status, boost, matrix, ekonqt, clear", "log");
  } else if (cmd === 'status') {
    addTerminalLog(`Durum: ${state.isReady ? 'HAZIR' : 'HAZIR DEĞİL'} | Süre: ${state.loadingDurationSeconds}sn | İzleyici: ${visitorCount ? visitorCount.innerText : 3}`, "log");
  } else if (cmd === 'boost') {
    playSound('fanfare');
    addTerminalLog("⚡ TURBO BOOST AKTİF! Harita yükleme hızı 2 katına çıkarıldı.", "complete");
    showToast("Turbo Boost Aktif Edildi!", "success");
  } else if (cmd === 'matrix') {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => addTerminalLog("01010100 01000101 01000011 01001000 - NEXT MATRIX STREAM", "log"), i * 150);
    }
  } else if (cmd === 'ekonqt') {
    addTerminalLog("👑 ekonqt: NEXTdosyayükleme Mimarı & Roblox Baş Geliştiricisi.", "complete");
  } else if (cmd === 'clear') {
    terminalLogs.innerHTML = '';
  } else {
    addTerminalLog(`Bilinmeyen komut: '${cmd}'. Yardım için 'help' yazın.`, "log");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init3DMeshInspector();
  initTriviaQuiz();
});


async function setDuration(sec) {
  try {
    const res = await fetch('/api/admin/duration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ seconds: sec, adminPassword: state.adminToken })
    });
    const data = await res.json();
    if (data.success) {
      state.loadingDurationSeconds = sec;
      updateAdminDurationChips();
      showToast(`Yükleme süresi ${sec} saniye olarak ayarlandı!`, "success");
    }
  } catch (err) {
    showToast("Süre güncellenemedi!", "error");
  }
}

// Instant Finish Admin Shortcut
adminInstantFinishBtn.onclick = () => {
  adminModal.classList.add('hidden');
  state.isReady = true;
  updateStatusUI();
  stageImages.classList.add('hidden');
  stageRobloxLoader.classList.add('hidden');
  stageCoupon.classList.remove('hidden');
  displayCouponCode.innerText = state.couponCode;
  playSound('fanfare');
  showToast("Admin kısayolu: Harita teslimatı tamamlandı!", "success");
};

function updateAdminDurationChips() {
  if (state.loadingDurationSeconds === 10) {
    dur10Btn.className = 'btn-chip active';
    dur300Btn.className = 'btn-chip';
  } else {
    dur300Btn.className = 'btn-chip active';
    dur10Btn.className = 'btn-chip';
  }
}

// Admin Image List Management
function renderAdminImagesList() {
  adminImagesList.innerHTML = '';
  state.images.forEach((img, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-img-card';
    card.innerHTML = `
      <img src="${img.url}" alt="Fotoğraf ${idx + 1}">
      <div class="admin-img-info">
        <span>Görsel #${idx + 1}</span>
        <input type="text" value="${img.url}" id="img-url-input-${idx}" placeholder="Görsel URL veya Yükle">
      </div>
      <button class="btn-secondary" onclick="updateImageURL(${idx})">Kaydet</button>
    `;
    adminImagesList.appendChild(card);
  });
}

async function updateImageURL(idx) {
  const urlInput = document.getElementById(`img-url-input-${idx}`);
  const newUrl = urlInput.value.trim();

  try {
    const res = await fetch(`/api/admin/upload-image/${idx}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.adminToken}`
      },
      body: JSON.stringify({ imageUrl: newUrl, adminPassword: state.adminToken })
    });
    const data = await res.json();
    if (data.success) {
      state.images[idx] = data.image;
      renderImageTabs();
      showToast(`Görsel #${idx + 1} güncellendi!`, "success");
    }
  } catch (err) {
    showToast("Görsel güncellenemedi!", "error");
  }
}
window.updateImageURL = updateImageURL;

adminLogoutBtn.onclick = () => {
  state.adminToken = null;
  adminLoginView.classList.remove('hidden');
  adminDashboardView.classList.add('hidden');
  adminPassInput.value = '';
  showToast("Çıkış yapıldı.", "info");
};

// MINI GAME ENGINE: "Roblox Cube Catcher"
class RobloxCubeCatcherGame {
  constructor(canvasId, overlayId, scoreId, highscoreId, livesId, startBtnId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.overlay = document.getElementById(overlayId);
    this.scoreEl = document.getElementById(scoreId);
    this.highscoreEl = document.getElementById(highscoreId);
    this.livesEl = document.getElementById(livesId);
    this.startBtn = document.getElementById(startBtnId);

    this.score = 0;
    this.highscore = parseInt(localStorage.getItem('next_roblox_game_highscore') || '0', 10);
    this.lives = 3;
    this.isRunning = false;
    this.animFrame = null;

    this.player = {
      x: this.canvas.width / 2 - 40,
      y: this.canvas.height - 24,
      width: 80,
      height: 14,
      speed: 8,
      dx: 0
    };

    this.items = [];
    this.spawnTimer = 0;

    if (this.highscoreEl) this.highscoreEl.innerText = this.highscore;

    this.initEvents();
  }

  initEvents() {
    if (this.startBtn) {
      this.startBtn.onclick = () => this.start();
    }

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.player.dx = -this.player.speed;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.player.dx = this.player.speed;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.isRunning) return;
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        this.player.dx = 0;
      }
    });

    // Mouse / Touch movement
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isRunning) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      this.player.x = mouseX - this.player.width / 2;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isRunning || !e.touches[0]) return;
      const rect = this.canvas.getBoundingClientRect();
      const touchX = (e.touches[0].clientX - rect.left) * (this.canvas.width / rect.width);
      this.player.x = touchX - this.player.width / 2;
    });
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.items = [];
    this.player.x = this.canvas.width / 2 - 40;
    this.isRunning = true;

    if (this.overlay) this.overlay.classList.add('hidden');
    this.updateUI();

    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.loop();
  }

  spawnItem() {
    const isBomb = Math.random() < 0.25;
    const isRare = !isBomb && Math.random() < 0.2;

    this.items.push({
      x: Math.random() * (this.canvas.width - 24),
      y: -24,
      size: 20,
      speed: 2.5 + Math.random() * 2.5,
      type: isBomb ? 'bomb' : (isRare ? 'rare' : 'cube'),
      rot: Math.random() * Math.PI
    });
  }

  loop() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Grid backdrop in canvas
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Move player
    this.player.x += this.player.dx;
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.width > this.canvas.width) {
      this.player.x = this.canvas.width - this.player.width;
    }

    // Draw Player Paddle
    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#06b6d4';
    this.ctx.fillStyle = primaryColor;
    this.ctx.shadowColor = primaryColor;
    this.ctx.shadowBlur = 12;
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    this.ctx.shadowBlur = 0;

    // Spawn items
    this.spawnTimer++;
    if (this.spawnTimer > 35) {
      this.spawnItem();
      this.spawnTimer = 0;
    }

    // Update & Draw Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.speed;
      item.rot += 0.05;

      this.ctx.save();
      this.ctx.translate(item.x + item.size / 2, item.y + item.size / 2);
      this.ctx.rotate(item.rot);

      if (item.type === 'bomb') {
        // Red Bomb
        this.ctx.fillStyle = '#ef4444';
        this.ctx.shadowColor = '#ef4444';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
      } else if (item.type === 'rare') {
        // Rare Cyan Diamond
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
      } else {
        // Normal Roblox Emerald Cube
        this.ctx.fillStyle = '#10b981';
        this.ctx.shadowColor = '#10b981';
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(-item.size / 2, -item.size / 2, item.size, item.size);
      }
      this.ctx.restore();

      // Check Collision with player paddle
      if (
        item.y + item.size >= this.player.y &&
        item.x + item.size >= this.player.x &&
        item.x <= this.player.x + this.player.width
      ) {
        if (item.type === 'bomb') {
          this.lives--;
          playSound('beep', 200, 0.2);
          if (this.lives <= 0) {
            this.gameOver();
            return;
          }
        } else if (item.type === 'rare') {
          this.score += 30;
          playSound('beep', 1100, 0.08);
        } else {
          this.score += 10;
          playSound('beep', 850, 0.05);
        }

        if (this.score > this.highscore) {
          this.highscore = this.score;
          localStorage.setItem('next_roblox_game_highscore', this.highscore.toString());
        }

        this.updateUI();
        this.items.splice(i, 1);
        continue;
      }

      // Remove offscreen items
      if (item.y > this.canvas.height + 30) {
        this.items.splice(i, 1);
      }
    }

    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  updateUI() {
    if (this.scoreEl) this.scoreEl.innerText = this.score;
    if (this.highscoreEl) this.highscoreEl.innerText = this.highscore;
    if (this.livesEl) {
      this.livesEl.innerText = '❤'.repeat(Math.max(0, this.lives));
    }
  }

  gameOver() {
    this.isRunning = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);

    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      this.overlay.querySelector('.game-overlay-content').innerHTML = `
        <i class="fa-solid fa-skull text-danger" style="font-size:38px;"></i>
        <h4>Oyun Bitti! Skorunuz: ${this.score}</h4>
        <p>En Yüksek Rekorunuz: <strong>${this.highscore}</strong></p>
        <button class="btn-primary" onclick="window.miniGameInstance.start()"><i class="fa-solid fa-rotate-right"></i> Yeniden Oyna</button>
      `;
    }
  }
}

// Instantiate Mini Games
let game1, game2;
document.addEventListener('DOMContentLoaded', () => {
  game1 = new RobloxCubeCatcherGame(
    'mini-game-canvas',
    'game-start-overlay',
    'game-score',
    'game-highscore',
    'game-lives',
    'start-game-btn'
  );
  window.miniGameInstance = game1;

  game2 = new RobloxCubeCatcherGame(
    'mini-game-canvas-s2',
    'game-start-overlay-s2',
    'game-score-s2',
    'game-highscore-s2',
    'game-lives-s2',
    'start-game-btn-s2'
  );
});

