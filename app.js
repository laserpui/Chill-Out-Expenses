// Core Application State & Constants
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby8zX5Y3Ro4Pnzm9PGhwa_DoCYP8qBGHjOcTHmrAK6etfe53vJhj8G1fdRytORqY-VKSA/exec"; // <-- ใส่ลิงก์ที่เผยแพร่จาก Apps Script ที่นี่ (เช่น https://script.google.com/macros/s/.../exec)
const PAYER_NAMES = []; // <-- เพิ่ม/ลด/แก้ไขรายชื่อตรงนี้ได้เลย!
const ADMIN_PASSWORD = 'Admin1234';
const LOCAL_SPLIT_CONFIG_KEY = 'chillout_split_config_v2';
const LEGACY_DEFAULT_PAYER_NAMES = ['ปุ๋ย + แอม', 'จุ๊บ + บี๋', 'โหน่ง + ดา', 'เฮียฮิง', 'เฮียฮิง', 'ปุ๋ย', 'แอม', 'จุ๊บ', 'บี๋'];

const STATE = {
    config: {
        apiUrl: '',
        payers: [],
        nonDrinkers: [],
        sheetUrl: ''
    },
    lastDashboardData: null,
    selectedPayer: '',
    selectedCategory: '',
    attachedImageBase64: '',
    attachedImageName: '',
    isSubmitting: false
};

// DOM Elements
const elements = {
    form: document.getElementById('expense-form'),
    dateInput: document.getElementById('expense-date'),
    payerContainer: document.getElementById('payer-container'),
        payerQuickNameInput: document.getElementById('payer-quick-name'),
    addPayerQuickBtn: document.getElementById('btn-add-payer-quick'),
selectedPayerInput: document.getElementById('selected-payer'),
    categoryContainer: document.getElementById('category-container'),
    selectedCategoryInput: document.getElementById('selected-category'),
    specifyPanel: document.getElementById('specify-panel'),
    specifyInput: document.getElementById('expense-specify'),
    amountInput: document.getElementById('expense-amount'),
    remarksInput: document.getElementById('expense-remarks'),
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('image-file-input'),
    previewContainer: document.getElementById('preview-container'),
    previewImage: document.getElementById('preview-image'),
    removeImgBtn: document.getElementById('btn-remove-img'),
    submitBtn: document.getElementById('btn-submit-form'),
    submitSpinner: document.getElementById('submit-spinner'),
    submitText: document.getElementById('btn-submit-text'),
    submitIcon: document.getElementById('btn-submit-icon'),
    demoBanner: document.getElementById('demo-banner'),
    
    // Bottom Nav Tabs
    viewExpense: document.getElementById('view-expense'),
    viewDashboard: document.getElementById('view-dashboard'),
    navBtnExpense: document.getElementById('nav-btn-expense'),
    navBtnDashboard: document.getElementById('nav-btn-dashboard'),
    
    // Dashboard elements
    dashboardTotal: document.getElementById('dashboard-total'),
    dashboardSplitTotal: document.getElementById('dashboard-split-total'),
    dashboardSplitSummary: document.getElementById('dashboard-split-summary'),
    dashboardPayersList: document.getElementById('dashboard-payers-list'),
    dashboardCategoriesList: document.getElementById('dashboard-categories-list'),
    dashboardRecentList: document.getElementById('dashboard-recent-list'),
    refreshDashboardBtn: document.getElementById('btn-refresh-dashboard'),
    participantNameInput: document.getElementById('participant-name-input'),
    addParticipantBtn: document.getElementById('btn-add-participant'),
    participantList: document.getElementById('participant-list'),
    participantSaveStatus: document.getElementById('participant-save-status'),
    openSheetBtn: document.getElementById('btn-open-sheet'),
    downloadSummaryImageBtn: document.getElementById('btn-download-summary-image'),
    shareSummaryImageBtn: document.getElementById('btn-share-summary-image'),
    downloadExpenseImageBtn: document.getElementById('btn-download-expense-image'),
    shareExpenseImageBtn: document.getElementById('btn-share-expense-image'),
    adminModal: document.getElementById('admin-password-modal'),
    adminPasswordInput: document.getElementById('admin-password-input'),
    confirmAdminBtn: document.getElementById('btn-confirm-admin-modal'),
    closeAdminBtn: document.getElementById('btn-close-admin-modal'),
    
    // Payer custom specify elements
    payerSpecifyPanel: document.getElementById('payer-specify-panel'),
    payerSpecifyInput: document.getElementById('payer-specify'),
    
    // Toast
    toastContainer: document.getElementById('toast-container'),
    toastItem: document.getElementById('toast-item'),
    toastText: document.getElementById('toast-text'),
    toastIcon: document.getElementById('toast-icon-element')
};

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initDateInput();
    renderPayerChips();
    renderParticipantManager();
    setupEventListeners();
    updateUIState();
    loadParticipantConfig();
});

// Set default date to today in local time format YYYY-MM-DD
function initDateInput() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    elements.dateInput.value = `${year}-${month}-${day}`;
}

// ----------------------------------------------------
// Settings & Payer Management
// ----------------------------------------------------
function loadSettings() {
    // 1. ตรวจสอบลิ้งก์จากค่าคงที่ APPS_SCRIPT_URL ที่ใส่ไว้ในโค้ดก่อน
    if (APPS_SCRIPT_URL) {
        STATE.config.apiUrl = APPS_SCRIPT_URL;
    }
    
    // 2. ตรวจจับ URL โฮสต์อัตโนมัติหากเปิดใช้งานผ่าน Google Apps Script Web App โดยตรง
    const currentUrl = window.location.href.split('?')[0];
    if (currentUrl.includes('script.google.com')) {
        STATE.config.apiUrl = currentUrl;
    } else if (!STATE.config.apiUrl) {
        // ดึงข้อมูลการเชื่อมโยงจาก LocalStorage สำหรับการทดสอบไฟล์เดี่ยวบนเครื่องคอม
        const savedUrl = localStorage.getItem('chillout_api_url');
        if (savedUrl) {
            STATE.config.apiUrl = savedUrl;
        }
    }
    
    // ใช้ชื่อจากโค้ดตรงๆ เป็น Source of Truth
    STATE.config.payers = [...PAYER_NAMES];
}

function updateUIState() {
    if (STATE.config.apiUrl) {
        elements.demoBanner.style.display = 'none';
    } else {
        elements.demoBanner.style.display = 'flex';
    }
}

// ----------------------------------------------------
// UI Rendering Functions
// ----------------------------------------------------
function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function normalizeParticipantNames(names) {
    const seen = new Set();
    const result = [];
    (names || []).forEach(name => {
        const cleanName = String(name || '').trim();
        if (cleanName && !seen.has(cleanName)) {
            seen.add(cleanName);
            result.push(cleanName);
        }
    });
    return result;
}

function isLegacyDefaultNameSet(people) {
    const normalized = normalizeParticipantNames(people);
    return normalized.length > 0 && normalized.every(name => LEGACY_DEFAULT_PAYER_NAMES.includes(name));
}

function applyParticipantConfig(config = {}) {
    let people = normalizeParticipantNames(config.people || config.participants || STATE.config.payers || []);
    if (isLegacyDefaultNameSet(people)) {
        people = [];
    }
    const nonDrinkers = normalizeParticipantNames(config.nonDrinkers || config.nonAlcoholParticipants || [])
        .filter(name => people.includes(name));

    STATE.config.payers = people;
    STATE.config.nonDrinkers = nonDrinkers;
    renderPayerChips();
    renderParticipantManager();
}

function requestJsonp(action, params = {}, onSuccess, onError) {
    if (!STATE.config.apiUrl) {
        if (onError) onError(new Error('ยังไม่ได้ตั้งค่า Apps Script URL'));
        return;
    }

    const callbackName = 'chillout_api_cb_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const scriptId = 'jsonp_script_' + callbackName;
    const script = document.createElement('script');
    const connector = STATE.config.apiUrl.indexOf('?') > -1 ? '&' : '?';
    const query = new URLSearchParams({ action, callback: callbackName, ...params });

    window[callbackName] = function(data) {
        const scriptEl = document.getElementById(scriptId);
        if (scriptEl) scriptEl.remove();
        delete window[callbackName];
        if (onSuccess) onSuccess(data);
    };

    script.id = scriptId;
    script.onerror = function() {
        const scriptEl = document.getElementById(scriptId);
        if (scriptEl) scriptEl.remove();
        delete window[callbackName];
        if (onError) onError(new Error('เชื่อมต่อหลังบ้านไม่สำเร็จ'));
    };
    script.src = `${STATE.config.apiUrl}${connector}${query.toString()}`;
    document.body.appendChild(script);
}

function setParticipantStatus(text) {
    if (elements.participantSaveStatus) {
        elements.participantSaveStatus.textContent = text;
    }
}

function loadLocalParticipantConfig() {
    try {
        const raw = localStorage.getItem(LOCAL_SPLIT_CONFIG_KEY);
        if (raw) applyParticipantConfig(JSON.parse(raw));
    } catch (error) {
        console.warn('Cannot load local split config:', error);
    }
}

function saveLocalParticipantConfig() {
    try {
        localStorage.setItem(LOCAL_SPLIT_CONFIG_KEY, JSON.stringify({
            people: STATE.config.payers,
            nonDrinkers: STATE.config.nonDrinkers
        }));
    } catch (error) {
        console.warn('Cannot save local split config:', error);
    }
}

function loadParticipantConfig() {
    loadLocalParticipantConfig();
    renderParticipantManager();
    if (!STATE.config.apiUrl) return;

    setParticipantStatus('กำลังโหลดรายชื่อ...');
    requestJsonp('getSplitConfig', {}, (data) => {
        if (data && data.status === 'success' && data.config) {
            applyParticipantConfig(data.config);
            setParticipantStatus('เชื่อมต่อรายชื่อแล้ว');
        } else {
            setParticipantStatus('ใช้รายชื่อเริ่มต้น');
        }
    }, () => {
        setParticipantStatus('โหลดรายชื่อไม่สำเร็จ');
    });
}

function saveParticipantConfig({ refreshDashboard = true } = {}) {
    const config = {
        people: STATE.config.payers,
        nonDrinkers: STATE.config.nonDrinkers
    };

    saveLocalParticipantConfig();
    renderPayerChips();
    renderParticipantManager();

    if (!STATE.config.apiUrl) {
        setParticipantStatus('บันทึกเฉพาะเครื่องนี้');
        return;
    }

    setParticipantStatus('กำลังบันทึก...');
    requestJsonp('saveSplitConfig', { payload: JSON.stringify(config) }, (data) => {
        if (data && data.status === 'success' && data.config) {
            applyParticipantConfig(data.config);
            setParticipantStatus('บันทึกรายชื่อแล้ว');
            if (refreshDashboard && elements.viewDashboard.style.display !== 'none') {
                fetchDashboardData();
            }
        } else {
            setParticipantStatus('บันทึกไม่สำเร็จ');
            showToast((data && data.message) || 'บันทึกรายชื่อไม่สำเร็จ', 'error');
        }
    }, () => {
        setParticipantStatus('บันทึกไม่สำเร็จ');
        showToast('เชื่อมต่อหลังบ้านเพื่อบันทึกรายชื่อไม่สำเร็จ', 'error');
    });
}

function renderParticipantManager() {
    if (!elements.participantList) return;

    const people = STATE.config.payers || [];
    elements.participantList.innerHTML = '';

    if (!people.length) {
        elements.participantList.innerHTML = '<div class="participant-empty">ยังไม่มีรายชื่อคนหาร</div>';
        return;
    }

    people.forEach((name, index) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <input class="form-input participant-name-edit" value="${escapeHtml(name)}" aria-label="แก้ไขชื่อ ${escapeHtml(name)}">
            <label class="participant-nondrinker">
                <input type="checkbox" ${STATE.config.nonDrinkers.includes(name) ? 'checked' : ''}>
                ไม่ดื่ม
            </label>
            <button type="button" class="btn-participant-remove" title="ลบรายชื่อ">
                <i data-lucide="trash-2"></i>
            </button>
        `;

        const nameInput = item.querySelector('.participant-name-edit');
        nameInput.addEventListener('change', () => renameParticipant(index, nameInput.value));
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') nameInput.blur();
        });

        item.querySelector('.participant-nondrinker input').addEventListener('change', (e) => {
            toggleNonDrinker(index, e.target.checked);
        });
        item.querySelector('.btn-participant-remove').addEventListener('click', () => removeParticipant(index));
        elements.participantList.appendChild(item);
    });

    lucide.createIcons();
}

function addParticipantName(name, { selectAfterAdd = false, refreshDashboard = true } = {}) {
    const cleanName = String(name || '').trim();
    if (!cleanName) {
        showToast('กรุณากรอกชื่อก่อน', 'error');
        return false;
    }
    if (STATE.config.payers.includes(cleanName)) {
        showToast('มีชื่อนี้อยู่แล้ว', 'error');
        if (selectAfterAdd) {
            setTimeout(() => {
                const chip = [...elements.payerContainer.querySelectorAll('.payer-chip')].find(item => item.textContent === cleanName);
                if (chip) selectPayer(cleanName, chip);
            }, 0);
        }
        return false;
    }

    STATE.config.payers.push(cleanName);
    saveParticipantConfig({ refreshDashboard });
    if (selectAfterAdd) {
        setTimeout(() => {
            const chip = [...elements.payerContainer.querySelectorAll('.payer-chip')].find(item => item.textContent === cleanName);
            if (chip) selectPayer(cleanName, chip);
        }, 0);
    }
    return true;
}

function addPayerFromExpenseForm() {
    const input = elements.payerQuickNameInput;
    const name = input ? input.value.trim() : '';
    if (!name) {
        showToast('กรุณากรอกชื่อผู้จ่ายก่อน', 'error');
        if (input) input.focus();
        return;
    }
    const added = addParticipantName(name, { selectAfterAdd: true, refreshDashboard: false });
    if (added && input) {
        input.value = '';
        showToast('เพิ่มชื่อผู้จ่ายแล้ว', 'success');
    }
}
function addParticipant() {
    const name = elements.participantNameInput.value.trim();
    if (!name) {
        showToast('กรุณากรอกชื่อก่อน', 'error');
        elements.participantNameInput.focus();
        return;
    }
    if (STATE.config.payers.includes(name)) {
        showToast('มีชื่อนี้อยู่แล้ว', 'error');
        elements.participantNameInput.focus();
        return;
    }

    if (addParticipantName(name)) {
        elements.participantNameInput.value = '';
    }
}

function renameParticipant(index, nextName) {
    const oldName = STATE.config.payers[index];
    const cleanName = String(nextName || '').trim();
    if (!oldName) return;
    if (!cleanName) {
        showToast('ชื่อห้ามว่าง', 'error');
        renderParticipantManager();
        return;
    }
    if (STATE.config.payers.some((name, personIndex) => personIndex !== index && name === cleanName)) {
        showToast('มีชื่อนี้อยู่แล้ว', 'error');
        renderParticipantManager();
        return;
    }

    STATE.config.payers[index] = cleanName;
    STATE.config.nonDrinkers = STATE.config.nonDrinkers.map(name => name === oldName ? cleanName : name);
    if (STATE.selectedPayer === oldName) {
        STATE.selectedPayer = cleanName;
        elements.selectedPayerInput.value = cleanName;
    }
    saveParticipantConfig();
}

function removeParticipant(index) {
    const name = STATE.config.payers[index];
    if (!name) return;

    STATE.config.payers.splice(index, 1);
    STATE.config.nonDrinkers = STATE.config.nonDrinkers.filter(item => item !== name);
    if (STATE.selectedPayer === name) {
        STATE.selectedPayer = '';
        elements.selectedPayerInput.value = '';
    }
    saveParticipantConfig();
}

function toggleNonDrinker(index, checked) {
    const name = STATE.config.payers[index];
    if (!name) return;

    if (checked && !STATE.config.nonDrinkers.includes(name)) {
        STATE.config.nonDrinkers.push(name);
    } else if (!checked) {
        STATE.config.nonDrinkers = STATE.config.nonDrinkers.filter(item => item !== name);
    }
    saveParticipantConfig();
}
function renderPayerChips() {
    elements.payerContainer.innerHTML = '';

    if (!STATE.config.payers.length) {
        const empty = document.createElement('div');
        empty.className = 'payer-empty-note';
        empty.textContent = 'ยังไม่มีรายชื่อผู้จ่าย กรุณาเพิ่มรายชื่อในหน้าสรุปรายงานก่อน';
        elements.payerContainer.appendChild(empty);
        lucide.createIcons();
        return;
    }

    STATE.config.payers.forEach(name => {
        const chip = document.createElement('div');
        chip.className = 'payer-chip';
        chip.textContent = name;
        if (STATE.selectedPayer === name) {
            chip.classList.add('active');
        }

        chip.addEventListener('click', () => {
            selectPayer(name, chip);
        });

        elements.payerContainer.appendChild(chip);
    });
    lucide.createIcons();
}

function selectPayer(name, chipElement) {
    elements.payerContainer.querySelectorAll('.payer-chip').forEach(c => c.classList.remove('active'));
    
    if (STATE.selectedPayer === name) {
        STATE.selectedPayer = '';
        elements.selectedPayerInput.value = '';
        elements.payerSpecifyPanel.classList.remove('show');
        elements.payerSpecifyInput.removeAttribute('required');
    } else {
        STATE.selectedPayer = name;
        elements.selectedPayerInput.value = name;
        chipElement.classList.add('active');
        
        if (name === '__OTHER__') {
            elements.payerSpecifyPanel.classList.add('show');
            elements.payerSpecifyInput.setAttribute('required', 'required');
            elements.payerSpecifyInput.focus();
        } else {
            elements.payerSpecifyPanel.classList.remove('show');
            elements.payerSpecifyInput.removeAttribute('required');
            elements.payerSpecifyInput.value = '';
        }
    }
}

// ----------------------------------------------------
// Event Handlers Setup
// ----------------------------------------------------
function setupEventListeners() {
    // Tab Navigation switching
    elements.navBtnExpense.addEventListener('click', () => switchTab('expense'));
    elements.navBtnDashboard.addEventListener('click', () => switchTab('dashboard'));
    
    // Dashboard Refresh
    elements.refreshDashboardBtn.addEventListener('click', fetchDashboardData);
    elements.addParticipantBtn.addEventListener('click', addParticipant);
    elements.participantNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addParticipant();
    });
    if (elements.addPayerQuickBtn) {
        elements.addPayerQuickBtn.addEventListener('click', addPayerFromExpenseForm);
    }
    if (elements.payerQuickNameInput) {
        elements.payerQuickNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addPayerFromExpenseForm();
            }
        });
    }
    elements.downloadSummaryImageBtn.addEventListener('click', downloadSummaryImage);
    elements.shareSummaryImageBtn.addEventListener('click', shareSummaryImage);
    elements.downloadExpenseImageBtn.addEventListener('click', downloadExpenseListImage);
    elements.shareExpenseImageBtn.addEventListener('click', shareExpenseListImage);
    elements.openSheetBtn.addEventListener('click', openAdminModal);
    elements.closeAdminBtn.addEventListener('click', closeAdminModal);
    elements.confirmAdminBtn.addEventListener('click', handleOpenSheetRequest);
    elements.adminPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleOpenSheetRequest();
        if (e.key === 'Escape') closeAdminModal();
    });
    elements.adminModal.addEventListener('click', (e) => {
        if (e.target === elements.adminModal) closeAdminModal();
    });

    // Categories Grid Selection
    elements.categoryContainer.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            selectCategory(category, card);
        });
    });
    

    
    // Image Upload Handlers
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelection);
    
    // Drag & Drop
    elements.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.add('dragover');
    });
    elements.uploadZone.addEventListener('dragleave', () => {
        elements.uploadZone.classList.remove('dragover');
    });
    elements.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    });
    
    // Remove attached image
    elements.removeImgBtn.addEventListener('click', removeAttachedImage);
    
    // Form Submit
    elements.form.addEventListener('submit', handleFormSubmission);
}

function selectCategory(category, cardElement) {
    elements.categoryContainer.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    
    if (STATE.selectedCategory === category) {
        STATE.selectedCategory = '';
        elements.selectedCategoryInput.value = '';
        elements.specifyPanel.classList.remove('show');
        elements.specifyInput.removeAttribute('required');
    } else {
        STATE.selectedCategory = category;
        elements.selectedCategoryInput.value = category;
        cardElement.classList.add('active');
        
        // Show details panel with organic transition
        elements.specifyPanel.classList.add('show');
        elements.specifyInput.setAttribute('required', 'required');
        
        // Dynamic placeholder depending on selected category
        let placeholder = 'ระบุรายละเอียดเพิ่มเติม...';
        if (category === 'อาหาร') placeholder = 'ตัวอย่างเช่น: ข้าวผัด 5 กล่อง, หมูกระทะชุดใหญ่';
        else if (category.includes('ไม่มีแอลกอฮอล์')) placeholder = 'ตัวอย่างเช่น: โค้ก 2 ลิตร, น้ำแข็ง 3 กระสอบ, น้ำเปล่า';
        else if (category.includes('แอลกอฮอล์')) placeholder = 'ตัวอย่างเช่น: เบียร์สิงห์ 1 ลัง, เหล้าแสงโสม, โซดา';
        else if (category.includes('ลานกางเต็นท์') || category.includes('พัก')) placeholder = 'ตัวอย่างเช่น: ค่ากางเต็นท์ 4 คน, รีสอร์ท 2 ห้อง';
        else if (category === 'อื่นๆ') placeholder = 'ตัวอย่างเช่น: ค่าน้ำมันรถยนต์, ค่าทางด่วน, ค่าเข้าอุทยาน';
        
        elements.specifyInput.placeholder = placeholder;
        elements.specifyInput.focus();
    }
}

// ----------------------------------------------------
// Image Processing & Compression (HTML5 Canvas)
// ----------------------------------------------------
function handleFileSelection(e) {
    if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
}

function processFile(file) {
    if (!file.type.match('image.*')) {
        showToast('⚠️ กรุณาเลือกไฟล์ประเภทรูปภาพเท่านั้น', 'error');
        return;
    }
    
    STATE.attachedImageName = file.name || `receipt_${Date.now()}.jpg`;
    
    // Show visual loading in the upload zone
    elements.uploadZone.querySelector('.upload-text').textContent = 'กำลังลดขนาดรูปภาพ...';
    elements.uploadZone.querySelector('.upload-icon').innerHTML = '<span class="spinner" style="display:inline-block; border-top-color:var(--color-primary);"></span>';
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Target compression sizes
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;
            
            // Maintain aspect ratio
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            // Draw on canvas for compression
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with quality 0.7
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            // Update State
            STATE.attachedImageBase64 = compressedBase64;
            
            // Display Preview
            elements.previewImage.src = compressedBase64;
            elements.uploadZone.style.display = 'none';
            elements.previewContainer.style.display = 'block';
            
            // Reset upload zone content
            resetUploadZoneText();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function removeAttachedImage() {
    STATE.attachedImageBase64 = '';
    STATE.attachedImageName = '';
    elements.fileInput.value = '';
    elements.previewImage.src = '';
    elements.previewContainer.style.display = 'none';
    elements.uploadZone.style.display = 'flex';
    resetUploadZoneText();
}

function resetUploadZoneText() {
    elements.uploadZone.querySelector('.upload-text').textContent = 'กดเพื่อถ่ายรูป หรืออัปโหลดไฟล์ใบเสร็จ';
    elements.uploadZone.querySelector('.upload-icon').innerHTML = '<i data-lucide="camera"></i>';
    lucide.createIcons();
}

// ----------------------------------------------------
// Form Submission & API Connection
// ----------------------------------------------------
async function handleFormSubmission(e) {
    e.preventDefault();
    
    if (STATE.isSubmitting) return;
    
    // 1. Validation
    const date = elements.dateInput.value;
    let payer = STATE.selectedPayer;
    const category = STATE.selectedCategory;
    const details = elements.specifyInput.value.trim();
    const amount = parseFloat(elements.amountInput.value);
    const remarks = elements.remarksInput.value.trim();
    
    if (!date) {
        showToast('⚠️ กรุณาระบุวันที่ใช้จ่าย', 'error');
        elements.dateInput.focus();
        return;
    }
    if (!STATE.config.payers.length) {
        showToast('⚠️ กรุณาเพิ่มรายชื่อผู้จ่ายในหน้าสรุปรายงานก่อน', 'error');
        return;
    }
    if (!payer) {
        showToast('⚠️ กรุณาเลือกคนจ่ายเงิน', 'error');
        return;
    }
    
    if (!category) {
        showToast('⚠️ กรุณาเลือกประเภทค่าใช้จ่าย', 'error');
        return;
    }
    if (!details) {
        showToast('⚠️ กรุณาระบุรายละเอียดเพิ่มเติม', 'error');
        elements.specifyInput.focus();
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast('⚠️ กรุณาระบุยอดค่าใช้จ่ายที่มากกว่า 0 บาท', 'error');
        elements.amountInput.focus();
        return;
    }
    
    // Format attached image filename as: ณ. วันที่ใช้จ่าย_รายชื่อผู้จ่าย_ประเภทค่าใช้จ่าย.jpg
    const formattedImageName = STATE.attachedImageBase64 ? `${date}_${payer}_${category}.jpg` : '';
    
    // Build Submission Payload
    const payload = {
        date: date,
        payer: payer,
        category: category,
        details: details,
        amount: amount,
        remarks: remarks,
        image: STATE.attachedImageBase64, // holds base64 or empty
        imageName: formattedImageName
    };
    
    setSubmittingState(true);
    
    // 2. Demo Mode simulation
    if (!STATE.config.apiUrl) {
        console.log('Sending Form Data [Simulated]:', payload);
        
        // Wait 1.5s to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSubmittingState(false);
        showToast('✅ บันทึกในโหมดจำลองสำเร็จ!', 'success');
        clearForm();
        return;
    }
    
    // 3. Real network submission to Apps Script
    try {
        await fetch(STATE.config.apiUrl, {
            method: 'POST',
            mode: 'no-cors', // Standard bypass for Google Apps Script 302 CORS redirection blocking
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        // no-cors requests return an opaque response. If fetch resolves, the request reached the Apps Script!
        setSubmittingState(false);
        showToast('✅ บันทึกข้อมูลและใบเสร็จเรียบร้อยแล้ว!', 'success');
        clearForm();
        
    } catch (error) {
        console.error('Network Connection/CORS Error:', error);
        setSubmittingState(false);
        showToast('❌ ไม่สามารถส่งข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือความถูกต้องของ URL สคริปต์', 'error');
    }
}

function setSubmittingState(isSubmitting) {
    STATE.isSubmitting = isSubmitting;
    
    if (isSubmitting) {
        elements.submitBtn.setAttribute('disabled', 'disabled');
        elements.submitSpinner.style.display = 'inline-block';
        elements.submitIcon.style.display = 'none';
        elements.submitText.textContent = 'กำลังส่งข้อมูล...';
    } else {
        elements.submitBtn.removeAttribute('disabled');
        elements.submitSpinner.style.display = 'none';
        elements.submitIcon.style.display = 'inline-block';
        elements.submitText.textContent = 'บันทึกค่าใช้จ่าย';
    }
}

function clearForm() {
    // 1. Reset text & numerical inputs
    elements.amountInput.value = '';
    elements.remarksInput.value = '';
    
    // 2. Reset date to today
    initDateInput();
    
    // 3. Reset payer selection completely (deselect chips, hide custom input)
    STATE.selectedPayer = '';
    if (elements.selectedPayerInput) elements.selectedPayerInput.value = '';
    if (elements.payerSpecifyPanel) elements.payerSpecifyPanel.classList.remove('show');
    if (elements.payerSpecifyInput) {
        elements.payerSpecifyInput.value = '';
        elements.payerSpecifyInput.removeAttribute('required');
    }
    if (elements.payerContainer) {
        elements.payerContainer.querySelectorAll('.payer-chip').forEach(chip => {
            chip.classList.remove('active');
        });
    }
    
    // 4. Reset category selection completely (deselect chips, hide details specify)
    STATE.selectedCategory = '';
    if (elements.selectedCategoryInput) elements.selectedCategoryInput.value = '';
    if (elements.specifyPanel) elements.specifyPanel.classList.remove('show');
    if (elements.specifyInput) {
        elements.specifyInput.value = '';
        elements.specifyInput.removeAttribute('required');
    }
    if (elements.categoryContainer) {
        elements.categoryContainer.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
    }
    
    // 5. Remove attached image
    removeAttachedImage();
}

// ----------------------------------------------------
// UI Modal & Dialog Helpers
// ----------------------------------------------------
function openModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
}

// Custom Toast Utility
let toastTimer = null;
function showToast(message, type = 'success') {
    if (toastTimer) clearTimeout(toastTimer);
    
    elements.toastText.textContent = message;
    
    // Configure colors and icons dynamically
    elements.toastItem.className = `toast ${type}`;
    
    if (type === 'success') {
        elements.toastIcon.setAttribute('data-lucide', 'check-circle');
    } else if (type === 'error') {
        elements.toastIcon.setAttribute('data-lucide', 'alert-circle');
    } else {
        elements.toastIcon.setAttribute('data-lucide', 'info');
    }
    
    lucide.createIcons();
    elements.toastContainer.classList.add('show');
    
    toastTimer = setTimeout(() => {
        elements.toastContainer.classList.remove('show');
    }, 4000);
}

function openAdminModal() {
    elements.adminPasswordInput.value = '';
    openModal(elements.adminModal);
    setTimeout(() => elements.adminPasswordInput.focus(), 80);
}

function closeAdminModal() {
    closeModal(elements.adminModal);
}

function handleOpenSheetRequest() {
    const password = elements.adminPasswordInput.value.trim();
    if (password !== ADMIN_PASSWORD) {
        showToast('รหัส Admin ไม่ถูกต้อง', 'error');
        elements.adminPasswordInput.focus();
        return;
    }

    if (STATE.config.sheetUrl) {
        closeAdminModal();
        window.open(STATE.config.sheetUrl, '_blank', 'noopener');
        return;
    }

    openGoogleSheet(password);
}

function openGoogleSheet(password) {
    if (!STATE.config.apiUrl) {
        showToast('ยังไม่ได้ตั้งค่า Apps Script URL สำหรับเปิด Google Sheet', 'error');
        return;
    }

    const callbackName = 'chillout_sheet_cb_' + Date.now();
    const scriptId = 'sheet_link_script_' + Date.now();
    window[callbackName] = function(data) {
        const scriptEl = document.getElementById(scriptId);
        if (scriptEl) scriptEl.remove();
        delete window[callbackName];

        if (data.status === 'success' && data.url) {
            closeAdminModal();
            window.open(data.url, '_blank', 'noopener');
        } else {
            showToast(data.message || 'เปิด Google Sheet ไม่สำเร็จ', 'error');
        }
    };

    const script = document.createElement('script');
    script.id = scriptId;
    script.onerror = function() {
        const scriptEl = document.getElementById(scriptId);
        if (scriptEl) scriptEl.remove();
        delete window[callbackName];
        showToast('เชื่อมต่อหลังบ้านเพื่อเปิด Google Sheet ไม่สำเร็จ', 'error');
    };
    const connector = STATE.config.apiUrl.indexOf('?') > -1 ? '&' : '?';
    script.src = `${STATE.config.apiUrl}${connector}action=sheetLink&password=${encodeURIComponent(password)}&callback=${callbackName}`;
    document.body.appendChild(script);
}

// ----------------------------------------------------
// Navigation Tab Switcher & Dashboard Rendering
// ----------------------------------------------------
function round2(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function wrapCanvasText(ctx, text, maxWidth) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
}

function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Cannot create image'));
        }, 'image/png', 0.95);
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawRoundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
}

async function createSummaryImageBlob() {
    const data = STATE.lastDashboardData;
    const summary = data && data.splitSummary;
    if (!summary || !summary.people || !summary.people.length) {
        throw new Error('No summary data');
    }

    const people = summary.people || [];
    const settlements = summary.settlements || [];
    const total = round2(data.total || 0);
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = 980;
    const padding = 48;
    const rowHeight = 58;
    const settlementLines = settlements.length
        ? settlements.map(item => `${item.from} → ${item.to}: ${formatCurrency(item.amount)}`)
        : ['ยอดลงตัวแล้ว ไม่ต้องโอนเพิ่ม'];
    const height = Math.max(680, padding * 2 + 150 + people.length * rowHeight + settlementLines.length * 42 + 120);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#F7FAF8');
    gradient.addColorStop(0.55, '#FFFDF7');
    gradient.addColorStop(1, '#EAF4EE');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#2C3E35';
    ctx.font = "900 38px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillText('Chill Out Expense Summary', padding, 78);
    ctx.font = "700 22px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillStyle = '#609975';
    ctx.fillText(`ยอดรวม ${formatCurrency(total)} • ${people.length} คน`, padding, 115);

    let y = 160;
    ctx.font = "800 22px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillStyle = '#2C3E35';
    ctx.fillText('สรุปรายคน', padding, y);
    y += 24;

    people.forEach(person => {
        const balance = round2(person.balance || 0);
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.strokeStyle = 'rgba(96,153,117,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundRect(ctx, padding, y, width - padding * 2, rowHeight - 8, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#2C3E35';
        ctx.font = "800 20px 'Noto Sans Thai', 'Segoe UI', sans-serif";
        ctx.fillText(person.name, padding + 18, y + 32);
        ctx.font = "700 16px 'Noto Sans Thai', 'Segoe UI', sans-serif";
        ctx.fillStyle = '#6A7B70';
        ctx.fillText(`จ่ายแล้ว ${formatCurrency(person.paid, 0)} • ต้องรับผิดชอบ ${formatCurrency(person.share, 0)}`, padding + 250, y + 32);
        ctx.textAlign = 'right';
        ctx.fillStyle = balance >= 0 ? '#609975' : '#C8644F';
        ctx.font = "900 20px 'Noto Sans Thai', 'Segoe UI', sans-serif";
        ctx.fillText(`${balance >= 0 ? 'รับคืน' : 'จ่ายเพิ่ม'} ${formatCurrency(Math.abs(balance))}`, width - padding - 18, y + 32);
        ctx.textAlign = 'left';
        y += rowHeight;
    });

    y += 24;
    ctx.fillStyle = '#2C3E35';
    ctx.font = "800 22px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillText('แนะนำการเคลียร์เงิน', padding, y);
    y += 34;
    ctx.font = "700 18px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillStyle = '#2C3E35';
    settlementLines.forEach(line => {
        wrapCanvasText(ctx, line, width - padding * 2).forEach(wrapped => {
            ctx.fillText(wrapped, padding + 18, y);
            y += 34;
        });
    });

    ctx.fillStyle = '#7A8B80';
    ctx.font = "700 16px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillText('สร้างจาก Chill Out Expense Tracker', padding, height - 42);

    return canvasBlob(canvas);
}

async function createExpenseListImageBlob() {
    const data = STATE.lastDashboardData;
    const rows = data && Array.isArray(data.allExpenses) && data.allExpenses.length ? data.allExpenses : (data && Array.isArray(data.recent) ? data.recent : []);
    if (!rows.length) {
        throw new Error('No expense data');
    }

    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const width = 980;
    const padding = 48;
    const rowHeight = 76;
    const height = Math.max(620, padding * 2 + 140 + rows.length * rowHeight + 78);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#F7FAF8');
    gradient.addColorStop(0.6, '#FFFDF7');
    gradient.addColorStop(1, '#EAF4EE');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const total = round2(rows.reduce((sum, item) => sum + Number(item.amount || 0), 0));
    ctx.fillStyle = '#2C3E35';
    ctx.font = "900 38px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillText('Chill Out Expense List', padding, 78);
    ctx.font = "700 22px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillStyle = '#609975';
    ctx.fillText(`รายการล่าสุด ${rows.length} รายการ • รวม ${formatCurrency(total)}`, padding, 115);

    let y = 160;
    rows.forEach((item, index) => {
        ctx.fillStyle = 'rgba(255,255,255,0.84)';
        ctx.strokeStyle = 'rgba(96,153,117,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundRect(ctx, padding, y, width - padding * 2, rowHeight - 10, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#609975';
        ctx.font = "900 18px 'Noto Sans Thai', 'Segoe UI', sans-serif";
        ctx.fillText(String(index + 1).padStart(2, '0'), padding + 18, y + 40);

        ctx.fillStyle = '#2C3E35';
        ctx.font = "800 21px 'Noto Sans Thai', 'Segoe UI', sans-serif";
        ctx.fillText(String(item.details || '-').slice(0, 34), padding + 72, y + 30);
        ctx.fillStyle = '#6A7B70';
        ctx.font = "700 16px 'Noto Sans Thai', 'Segoe UI', sans-serif";
        ctx.fillText(`${item.date || '-'} • ${item.payer || '-'} • ${item.category || '-'}`.slice(0, 70), padding + 72, y + 54);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#2C3E35';
        ctx.font = "900 22px 'Noto Sans Thai', 'Segoe UI', sans-serif";
        ctx.fillText(formatCurrency(item.amount), width - padding - 18, y + 42);
        ctx.textAlign = 'left';
        y += rowHeight;
    });

    ctx.fillStyle = '#7A8B80';
    ctx.font = "700 16px 'Noto Sans Thai', 'Segoe UI', sans-serif";
    ctx.fillText('สร้างจาก Chill Out Expense Tracker', padding, height - 42);

    return canvasBlob(canvas);
}

async function downloadExpenseListImage() {
    try {
        const blob = await createExpenseListImageBlob();
        downloadBlob(blob, 'chill-out-expenses.png');
        showToast('บันทึกรูปรายการแล้ว', 'success');
    } catch (error) {
        console.error(error);
        showToast('ยังไม่มีรายการสำหรับบันทึกภาพ', 'error');
    }
}

async function shareExpenseListImage() {
    try {
        const blob = await createExpenseListImageBlob();
        if (navigator.share && navigator.canShare && typeof File !== 'undefined') {
            const file = new File([blob], 'chill-out-expenses.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Chill Out Expenses', text: 'รายการค่าใช้จ่าย Chill Out' });
                showToast('เปิดเมนูแชร์แล้ว', 'success');
                return;
            }
        }
        downloadBlob(blob, 'chill-out-expenses.png');
        showToast('ดาวน์โหลดรูปรายการแล้ว', 'success');
    } catch (error) {
        console.error(error);
        showToast('แชร์รูปรายการไม่สำเร็จ', 'error');
    }
}
async function downloadSummaryImage() {
    try {
        const blob = await createSummaryImageBlob();
        downloadBlob(blob, 'chill-out-summary.png');
        showToast('บันทึกภาพสรุปแล้ว', 'success');
    } catch (error) {
        console.error(error);
        showToast('ยังไม่มีข้อมูลสรุปสำหรับบันทึกภาพ', 'error');
    }
}

async function shareSummaryImage() {
    try {
        const blob = await createSummaryImageBlob();
        if (navigator.share && navigator.canShare && typeof File !== 'undefined') {
            const file = new File([blob], 'chill-out-summary.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Chill Out Summary', text: 'สรุปค่าใช้จ่าย Chill Out' });
                showToast('เปิดเมนูแชร์แล้ว', 'success');
                return;
            }
        }
        downloadBlob(blob, 'chill-out-summary.png');
        showToast('ดาวน์โหลดรูปสรุปแล้ว', 'success');
    } catch (error) {
        console.error(error);
        showToast('แชร์รูปสรุปไม่สำเร็จ', 'error');
    }
}
function switchTab(tabId) {
    if (tabId === 'expense') {
        elements.navBtnExpense.classList.add('active');
        elements.navBtnDashboard.classList.remove('active');
        elements.viewExpense.style.display = 'block';
        elements.viewDashboard.style.display = 'none';
    } else if (tabId === 'dashboard') {
        elements.navBtnDashboard.classList.add('active');
        elements.navBtnExpense.classList.remove('active');
        elements.viewDashboard.style.display = 'block';
        elements.viewExpense.style.display = 'none';
        
        // Fetch fresh stats from Sheet
        fetchDashboardData();
    }
}

async function fetchDashboardData() {
    // 1. Show skeleton loader
    renderDashboardSkeleton();
    
    // Add visual rotation animation to refresh icon
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) refreshIcon.style.animation = 'spin 1s linear infinite';
    
    // 2. Demo Mode simulation
    if (!STATE.config.apiUrl) {
        // Wait 1.0s to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Render mock dashboard stats
        const mockData = {
            status: 'success',
            total: 3950,
            byCategory: {
                'อาหาร': 1250,
                'เครื่องดื่ม (ไม่มีแอลกอฮอล์)': 480,
                'เครื่องดื่ม (แอลกอฮอล์)': 920,
                'ลานกางเต็นท์ ห้องพัก และบ้านพัก': 1100,
                'อื่นๆ': 200
            },
            byPayer: {
                'ปุย': 1850,
                'แอน': 1200,
                'เก่ง': 900
            },
            recent: [
                { date: '2026-06-02', payer: 'ปุย', category: 'อาหาร', details: 'หมูกระทะชุดใหญ่ และส้มตำน้ำตก', amount: 1250, remarks: 'กินมื้อค่ำ 5 คน', imageUrl: '' },
                { date: '2026-06-01', payer: 'แอน', category: 'เครื่องดื่ม (แอลกอฮอล์)', details: 'เบียร์ลีโอ 2 ลัง และน้ำแข็ง', amount: 920, remarks: 'แช่ถังน้ำแข็งส่วนรวม', imageUrl: '' },
                { date: '2026-06-01', payer: 'เก่ง', category: 'ลานกางเต็นท์ ห้องพัก และบ้านพัก', details: 'ค่ากางเต็นท์อุทยาน', amount: 500, remarks: 'คืนที่ 1', imageUrl: '' },
                { date: '2026-05-31', payer: 'ปุย', category: 'ลานกางเต็นท์ ห้องพัก และบ้านพัก', details: 'บ้านพักหลังริมน้ำ', amount: 600, remarks: 'มัดจำล่วงหน้า', imageUrl: '' },
                { date: '2026-05-31', payer: 'แอน', category: 'เครื่องดื่ม (ไม่มีแอลกอฮอล์)', details: 'น้ำเปล่า โค้ก น้ำแข็ง ฯลฯ', amount: 280, remarks: '', imageUrl: '' }
            ],
            splitSummary: {
                days: [
                    { date: '2026-05-31', participants: ['ปุย', 'แอน'], total: 880, regularTotal: 880, alcoholTotal: 0 },
                    { date: '2026-06-01', participants: ['ปุย', 'แอน', 'เก่ง'], total: 1420, regularTotal: 500, alcoholTotal: 920 },
                    { date: '2026-06-02', participants: ['ปุย', 'แอน', 'เก่ง'], total: 1250, regularTotal: 1250, alcoholTotal: 0 }
                ],
                people: [
                    { name: 'ปุย', paid: 1850, share: 1316.67, balance: 533.33 },
                    { name: 'แอน', paid: 1200, share: 1776.67, balance: -576.67 },
                    { name: 'เก่ง', paid: 500, share: 456.67, balance: 43.33 }
                ],
                settlements: [
                    { from: 'แอน', to: 'ปุย', amount: 533.33 },
                    { from: 'แอน', to: 'เก่ง', amount: 43.33 }
                ]
            }
        };
        
        renderDashboard(mockData);
        if (refreshIcon) refreshIcon.style.animation = '';
        return;
    }
    
    // 3. Real network GET call to Apps Script (JSONP version to completely bypass local file:/// null-origin CORS restrictions)
    const callbackName = 'chillout_cb_' + Date.now();
    const scriptId = 'jsonp_script_' + Date.now();
    
    window[callbackName] = function(data) {
        // Cleanup script tag and global hook
        const scriptEl = document.getElementById(scriptId);
        if (scriptEl) scriptEl.remove();
        delete window[callbackName];
        
        if (refreshIcon) refreshIcon.style.animation = '';
        
        if (data.status === 'success') {
            renderDashboard(data);
        } else {
            console.error('API Error Response:', data);
            showToast('❌ ข้อมูลจาก Google Sheet ไม่สมบูรณ์: ' + data.message, 'error');
            renderDashboardError();
        }
    };
    
    const script = document.createElement('script');
    script.id = scriptId;
    script.onerror = function() {
        const scriptEl = document.getElementById(scriptId);
        if (scriptEl) scriptEl.remove();
        delete window[callbackName];
        
        if (refreshIcon) refreshIcon.style.animation = '';
        showToast('❌ ไม่สามารถดึงข้อมูลสรุปได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือ URL สคริปต์', 'error');
        renderDashboardError();
    };
    
    const connector = STATE.config.apiUrl.indexOf('?') > -1 ? '&' : '?';
    script.src = `${STATE.config.apiUrl}${connector}callback=${callbackName}`;
    document.body.appendChild(script);
}

function renderDashboardSkeleton() {
    // Render skeleton placeholders for values
    elements.dashboardTotal.innerHTML = '<span class="skeleton-box skeleton-text" style="display:inline-block; width:100px; height:24px;"></span>';
    elements.dashboardSplitTotal.innerHTML = '<span class="skeleton-box skeleton-text" style="display:inline-block; width:100px; height:24px;"></span>';
    
    // Skeleton list rows
    const listSkeletonHTML = `
        <div class="progress-row">
            <div class="skeleton-box skeleton-text" style="width: 50%;"></div>
            <div class="skeleton-box skeleton-progress"></div>
        </div>
        <div class="progress-row">
            <div class="skeleton-box skeleton-text" style="width: 70%;"></div>
            <div class="skeleton-box skeleton-progress"></div>
        </div>
    `;
    elements.dashboardSplitSummary.innerHTML = listSkeletonHTML;
    elements.dashboardPayersList.innerHTML = listSkeletonHTML;
    elements.dashboardCategoriesList.innerHTML = listSkeletonHTML;
    
    // Skeleton transaction timeline rows
    elements.dashboardRecentList.innerHTML = `
        <div class="skeleton-box skeleton-row"></div>
        <div class="skeleton-box skeleton-row"></div>
        <div class="skeleton-box skeleton-row"></div>
    `;
}

function renderDashboardError() {
    elements.dashboardTotal.textContent = '฿0.00';
    elements.dashboardSplitTotal.textContent = '฿0.00';
    elements.dashboardSplitSummary.innerHTML = '<div style="text-align:center; padding:12px; font-size:0.8rem; color:var(--text-muted);">โหลดข้อมูลการหารค่าใช้จ่ายไม่สำเร็จ</div>';
    elements.dashboardPayersList.innerHTML = '<div style="text-align:center; padding:12px; font-size:0.8rem; color:var(--text-muted);">โหลดข้อมูลรายคนไม่สำเร็จ</div>';
    elements.dashboardCategoriesList.innerHTML = '<div style="text-align:center; padding:12px; font-size:0.8rem; color:var(--text-muted);">โหลดข้อมูลประเภทไม่สำเร็จ</div>';
    elements.dashboardRecentList.innerHTML = '<div style="text-align:center; padding:20px; font-size:0.8rem; color:var(--text-muted);">ไม่สามารถดึงข้อมูลรายการล่าสุดได้</div>';
}

function formatCurrency(value, digits = 2) {
    return `฿${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function renderSplitSummary(splitSummary, fallbackTotal) {
    const summary = splitSummary || { days: [], people: [], settlements: [] };
    elements.dashboardSplitTotal.textContent = formatCurrency(fallbackTotal || 0);
    elements.dashboardSplitSummary.innerHTML = '';

    if (!summary.days.length && !summary.people.length) {
        elements.dashboardSplitSummary.innerHTML = '<div style="text-align:center; padding:16px; font-size:0.8rem; color:var(--text-muted);">ยังไม่มีข้อมูลสำหรับคำนวณหารค่าใช้จ่าย หรือหลังบ้านยังไม่ได้อัปเดตฟังก์ชัน splitSummary</div>';
        return;
    }

    const dayList = document.createElement('div');
    dayList.className = 'split-day-list';
    summary.days.forEach(day => {
        const participantText = (day.participants || []).join(', ') || '-';
        const row = document.createElement('div');
        row.className = 'split-day-row split-day-row-stack';
        row.innerHTML = `
            <div class="split-row-main">
                <div>
                    <div class="split-day-date">${day.date}</div>
                    <div class="split-day-meta">${(day.participants || []).length} คน: ${participantText}</div>
                    <div class="split-day-meta">ค่าใช้จ่ายทั่วไป ${formatCurrency(day.regularTotal, 0)} • แอลกอฮอล์ ${formatCurrency(day.alcoholTotal, 0)}</div>
                </div>
                <strong>${formatCurrency(day.total)}</strong>
            </div>
        `;
        dayList.appendChild(row);
    });
    elements.dashboardSplitSummary.appendChild(dayList);

    const peopleList = document.createElement('div');
    peopleList.className = 'split-people-list';
    summary.people.forEach(person => {
        const balanceClass = person.balance >= 0 ? 'positive' : 'negative';
        const balanceText = person.balance >= 0 ? 'ควรรับคืน' : 'ต้องจ่ายเพิ่ม';
        const row = document.createElement('div');
        row.className = 'split-person-row';
        row.innerHTML = `
            <div>
                <div class="split-person-name">${person.name}</div>
                <div class="split-day-meta">จ่ายแล้ว ${formatCurrency(person.paid, 0)} • ต้องรับผิดชอบ ${formatCurrency(person.share, 0)}</div>
            </div>
            <div class="split-balance ${balanceClass}">
                <span>${balanceText}</span>
                <strong>${formatCurrency(Math.abs(person.balance))}</strong>
            </div>
        `;
        peopleList.appendChild(row);
    });
    elements.dashboardSplitSummary.appendChild(peopleList);

    const settlements = summary.settlements || [];
    const settleList = document.createElement('div');
    settleList.className = 'split-settlement-list';
    const title = document.createElement('div');
    title.className = 'split-section-title';
    title.textContent = 'แนะนำการเคลียร์เงิน';
    settleList.appendChild(title);

    if (!settlements.length) {
        const empty = document.createElement('div');
        empty.className = 'split-empty-note';
        empty.textContent = 'ยอดจ่ายสมดุลแล้ว หรือยังไม่มีรายการที่ต้องเคลียร์';
        settleList.appendChild(empty);
    } else {
        settlements.forEach(item => {
            const row = document.createElement('div');
            row.className = 'split-settlement-row';
            row.innerHTML = `<span>${item.from} → ${item.to}</span><strong>${formatCurrency(item.amount)}</strong>`;
            settleList.appendChild(row);
        });
    }
    elements.dashboardSplitSummary.appendChild(settleList);
}

function renderDashboard(data) {
    data = data || {};
    const total = data.total || 0;
    const byPayer = data.byPayer || {};
    const byCategory = data.byCategory || {};
    if (data.splitConfig) {
        applyParticipantConfig(data.splitConfig);
    }
    
    // 1. Render Stats
    elements.dashboardTotal.textContent = `฿${total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    renderSplitSummary(data.splitSummary, total);
    
    // 2. Render Payer Progress Bars
    elements.dashboardPayersList.innerHTML = '';
    
    // Find highest payer value to set as 100% baseline scale
    let highestPayerPaid = 0;
    
    // ดึงรายชื่อคนจ่ายเงินที่ไม่ซ้ำทั้งหมด (จากค่าคงที่ในโค้ด + ดึงอัตโนมัติจากข้อมูลในตารางชีต)
    const allPayers = Array.from(new Set([...STATE.config.payers, ...Object.keys(byPayer)]));
    
    allPayers.forEach(name => {
        if (!name || name === '-') return;
        const paid = byPayer[name] || 0;
        if (paid > highestPayerPaid) highestPayerPaid = paid;
    });
    
    allPayers.forEach(name => {
        if (!name || name === '-') return;
        const paid = byPayer[name] || 0;
        const percent = highestPayerPaid > 0 ? (paid / highestPayerPaid) * 100 : 0;
        
        const row = document.createElement('div');
        row.className = 'progress-row';
        row.innerHTML = `
            <div class="progress-info">
                <span class="progress-name">${name}</span>
                <span class="progress-val">฿${paid.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 0%"></div>
            </div>
        `;
        
        elements.dashboardPayersList.appendChild(row);
        
        // Trigger CSS transition beautifully on next paint
        setTimeout(() => {
            const fill = row.querySelector('.progress-bar-fill');
            if (fill) fill.style.width = `${percent}%`;
        }, 50);
    });
    
    // 3. Render Categories Progress Bars
    elements.dashboardCategoriesList.innerHTML = '';
    
    const categories = [
        'อาหาร',
        'เครื่องดื่ม (ไม่มีแอลกอฮอล์)',
        'เครื่องดื่ม (แอลกอฮอล์)',
        'ลานกางเต็นท์ ห้องพัก และบ้านพัก',
        'อื่นๆ'
    ];
    
    categories.forEach(cat => {
        const spent = byCategory[cat] || 0;
        const percent = total > 0 ? (spent / total) * 100 : 0;
        
        const row = document.createElement('div');
        row.className = 'progress-row';
        
        // Pick custom icons & accents for dashboard categories
        let emoji = '🧩';
        let isAccent = false;
        if (cat === 'อาหาร') emoji = '🍲';
        else if (cat.includes('ไม่มีแอลกอฮอล์')) emoji = '🥤';
        else if (cat.includes('แอลกอฮอล์')) { emoji = '🍺'; isAccent = true; }
        else if (cat.includes('พัก') || cat.includes('เต็นท์')) emoji = '⛺';
        
        row.innerHTML = `
            <div class="progress-info">
                <span class="progress-name">${emoji} ${cat}</span>
                <span class="progress-val">${percent.toFixed(1)}% (฿${spent.toLocaleString('th-TH', { maximumFractionDigits: 0 })})</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill ${isAccent ? 'accent' : ''}" style="width: 0%"></div>
            </div>
        `;
        
        elements.dashboardCategoriesList.appendChild(row);
        
        setTimeout(() => {
            const fill = row.querySelector('.progress-bar-fill');
            if (fill) fill.style.width = `${percent}%`;
        }, 50);
    });
    
    // 4. Render Recent timeline logs
    elements.dashboardRecentList.innerHTML = '';
    
    const recentLogs = data.recent || [];
    
    if (recentLogs.length === 0) {
        elements.dashboardRecentList.innerHTML = '<div style="text-align:center; padding:24px; font-size:0.8rem; color:var(--text-muted);">ไม่มีข้อมูลบันทึกค่าใช้จ่ายในขณะนี้</div>';
        return;
    }
    
    recentLogs.forEach(r => {
        // Map category emoji
        let emoji = '🧩';
        if (r.category === 'อาหาร') emoji = '🍲';
        else if (r.category.includes('ไม่มีแอลกอฮอล์')) emoji = '🥤';
        else if (r.category.includes('แอลกอฮอล์')) emoji = '🍺';
        else if (r.category.includes('พัก') || r.category.includes('เต็นท์')) emoji = '⛺';
        
        const item = document.createElement('div');
        item.className = 'log-item';
        
        // Show receipt button only if valid link exists
        let receiptButtonHTML = '';
        if (r.imageUrl && r.imageUrl.startsWith('http')) {
            receiptButtonHTML = `
                <a href="${r.imageUrl}" target="_blank" class="btn-receipt-link">
                    <i data-lucide="external-link" style="width: 10px; height: 10px;"></i> บิล
                </a>
            `;
        }
        
        // Show remarks if present
        let remarksHTML = '';
        if (r.remarks && r.remarks !== '-') {
            remarksHTML = `<span class="log-remarks">(${r.remarks})</span>`;
        }
        
        item.innerHTML = `
            <div class="log-left">
                <div class="log-icon-box">${emoji}</div>
                <div class="log-details">
                    <span class="log-title">${r.details}</span>
                    <span class="log-meta">
                        <span>${r.date}</span> • 
                        <span style="font-weight:700; color:var(--text-primary);">${r.payer}</span>
                        ${remarksHTML}
                    </span>
                </div>
            </div>
            <div class="log-right">
                <span class="log-amount">฿${Number(r.amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                ${receiptButtonHTML}
            </div>
        `;
        
        elements.dashboardRecentList.appendChild(item);
    });
    
    lucide.createIcons();
}
