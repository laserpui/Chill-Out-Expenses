// Core Application State & Constants
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-Gi-5VmPu_fZoBJg_XyI77WitITUGnGYbOazEODyyKf3agddeRfnmOvjipg2Ibn8N1w/exec"; // <-- ใส่ลิงก์ที่เผยแพร่จาก Apps Script ที่นี่ (เช่น https://script.google.com/macros/s/.../exec)
const PAYER_NAMES = ['ปุ๋ย + แอม', 'จุ๊บ + บี๋', 'โหน่ง + ดา', 'เฮียฮิง']; // <-- เพิ่ม/ลด/แก้ไขรายชื่อตรงนี้ได้เลย!

const STATE = {
    config: {
        apiUrl: '',
        payers: []
    },
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
    dashboardAverage: document.getElementById('dashboard-average'),
    dashboardPayersList: document.getElementById('dashboard-payers-list'),
    dashboardCategoriesList: document.getElementById('dashboard-categories-list'),
    dashboardRecentList: document.getElementById('dashboard-recent-list'),
    refreshDashboardBtn: document.getElementById('btn-refresh-dashboard'),
    
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
    setupEventListeners();
    updateUIState();
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
function renderPayerChips() {
    elements.payerContainer.innerHTML = '';
    
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
    
    // เพิ่มปุ่ม "คนอื่น ๆ (ระบุชื่อเอง)" เป็นตัวเลือกพิเศษ
    const otherChip = document.createElement('div');
    otherChip.className = 'payer-chip special-other';
    otherChip.id = 'chip-other-payer';
    otherChip.innerHTML = '✍️ คนอื่น ๆ (ระบุชื่อเอง)';
    if (STATE.selectedPayer === '__OTHER__') {
        otherChip.classList.add('active');
    }
    otherChip.addEventListener('click', () => {
        selectPayer('__OTHER__', otherChip);
    });
    
    elements.payerContainer.appendChild(otherChip);
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
    if (!payer) {
        showToast('⚠️ กรุณาเลือกคนจ่ายเงิน', 'error');
        return;
    }
    
    // กรณีระบุชื่อคนจ่ายเองเพิ่มเติม
    if (payer === '__OTHER__') {
        payer = elements.payerSpecifyInput.value.trim();
        if (!payer) {
            showToast('⚠️ กรุณาระบุชื่อผู้จ่ายเงิน', 'error');
            elements.payerSpecifyInput.focus();
            return;
        }
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
    // Reset inputs, but keep Date and Payer selected for convenient batch inputs
    elements.amountInput.value = '';
    elements.remarksInput.value = '';
    elements.specifyInput.value = '';
    elements.payerSpecifyInput.value = '';
    
    // Reset category selection
    STATE.selectedCategory = '';
    if (elements.selectedCategoryInput) elements.selectedCategoryInput.value = '';
    if (elements.specifyPanel) elements.specifyPanel.classList.remove('show');
    if (elements.specifyInput) elements.specifyInput.removeAttribute('required');
    if (elements.categoryContainer) {
        elements.categoryContainer.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
    }
    
    // Remove attached image
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

// ----------------------------------------------------
// Navigation Tab Switcher & Dashboard Rendering
// ----------------------------------------------------
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
            ]
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
    elements.dashboardAverage.innerHTML = '<span class="skeleton-box skeleton-text" style="display:inline-block; width:80px; height:24px;"></span>';
    
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
    elements.dashboardAverage.textContent = '฿0.00';
    elements.dashboardPayersList.innerHTML = '<div style="text-align:center; padding:12px; font-size:0.8rem; color:var(--text-muted);">โหลดข้อมูลรายคนไม่สำเร็จ</div>';
    elements.dashboardCategoriesList.innerHTML = '<div style="text-align:center; padding:12px; font-size:0.8rem; color:var(--text-muted);">โหลดข้อมูลประเภทไม่สำเร็จ</div>';
    elements.dashboardRecentList.innerHTML = '<div style="text-align:center; padding:20px; font-size:0.8rem; color:var(--text-muted);">ไม่สามารถดึงข้อมูลรายการล่าสุดได้</div>';
}

function renderDashboard(data) {
    const total = data.total || 0;
    
    // 1. Render Stats
    elements.dashboardTotal.textContent = `฿${total.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const payersCount = STATE.config.payers.length || 1;
    const average = total / payersCount;
    elements.dashboardAverage.textContent = `฿${average.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // 2. Render Payer Progress Bars
    elements.dashboardPayersList.innerHTML = '';
    
    // Find highest payer value to set as 100% baseline scale
    let highestPayerPaid = 0;
    
    // ดึงรายชื่อคนจ่ายเงินที่ไม่ซ้ำทั้งหมด (จากค่าคงที่ในโค้ด + ดึงอัตโนมัติจากข้อมูลในตารางชีต)
    const allPayers = Array.from(new Set([...STATE.config.payers, ...Object.keys(data.byPayer)]));
    
    allPayers.forEach(name => {
        if (!name || name === '-') return;
        const paid = data.byPayer[name] || 0;
        if (paid > highestPayerPaid) highestPayerPaid = paid;
    });
    
    allPayers.forEach(name => {
        if (!name || name === '-') return;
        const paid = data.byPayer[name] || 0;
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
        const spent = data.byCategory[cat] || 0;
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
