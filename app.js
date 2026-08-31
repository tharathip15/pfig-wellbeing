// State Management
let employees = [];
let currentFilterDept = '';
let currentFilterProgress = 'all';
let currentSearchQuery = '';
let currentSortField = 'name';
let currentSortOrder = 'asc'; // 'asc' or 'desc'
let currentPage = 1;
let pageSize = 10; // 'all' means show all
let wellbeingSession = null;
let wellbeingDataMode = 'personal';
let wellbeingPersonalHealthRanking = null;

// Form state variables
let modalMode = 'add'; // 'add' or 'edit'

// Presentation state variables
let soundEnabled = true;
let currentPresentationStage = 0; // 0 = Intro, 1 = 3rd, 2 = 2nd, 3 = 1st, 4 = Podium
let presentationWinners = []; // Will hold top 3 winners
let cardRevealed = false; // Whether the current slide card is revealed

// Personal Lookup and Microsoft authorization state
let currentView = 'personal'; // 'admin' or 'personal'
let currentWinningCriteria = 'health_score'; // Default winning criteria
let currentEvaluationRound = 'm4'; // 'm3' or 'm4'

// DOM Elements
const elements = {
  tableBody: document.getElementById('employee-table-body'),
  emptyState: document.getElementById('table-empty-state'),
  totalEmployees: document.getElementById('stat-total-employees'),
  avgWeightLoss: document.getElementById('stat-avg-weight-loss'),
  weightTrend: document.getElementById('stat-weight-trend'),
  avgBmiLoss: document.getElementById('stat-avg-bmi-loss'),
  bmiTrend: document.getElementById('stat-bmi-trend'),
  maxBodyageLoss: document.getElementById('stat-max-bodyage-loss'),
  maxBodyageWinner: document.getElementById('stat-max-bodyage-winner'),
  
  // Leaderboard & Summary
  leaderboardContainer: document.getElementById('leaderboard-container'),
  leaderboardRoundSubtitle: document.getElementById('leaderboard-round-subtitle'),
  summaryRoundNote: document.getElementById('summary-round-note'),
  summaryBodyagePercent: document.getElementById('summary-bodyage-percent'),
  summaryWeightPercent: document.getElementById('summary-weight-percent'),
  summaryBmiPercent: document.getElementById('summary-bmi-percent'),
  barBodyage: document.getElementById('bar-bodyage'),
  barWeight: document.getElementById('bar-weight'),
  barBmi: document.getElementById('bar-bmi'),

  // Filters & Controls
  searchBox: document.getElementById('search-box'),
  filterDept: document.getElementById('filter-department'),
  selectEvalRound: document.getElementById('select-eval-round'),
  filterProgress: document.getElementById('filter-progress'),
  filterCriteria: document.getElementById('filter-criteria'),
  pageSizeSelect: document.getElementById('select-page-size'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnDownloadTemplate: document.getElementById('btn-download-template'),
  csvFileInput: document.getElementById('csv-file-input'),
  btnAddEmployee: document.getElementById('btn-add-employee'),
  
  // Pagination
  paginationSummary: document.getElementById('pagination-summary'),
  paginationButtons: document.getElementById('pagination-buttons'),

  // Modal
  employeeModal: document.getElementById('employee-modal'),
  employeeForm: document.getElementById('employee-form'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelModal: document.getElementById('btn-cancel-modal'),
  modalHeadline: document.getElementById('modal-headline'),
  
  // Form fields
  formId: document.getElementById('form-emp-id'),
  formName: document.getElementById('form-name'),
  formDept: document.getElementById('form-department'),
  formEntraOid: document.getElementById('form-entra-oid'),
  formAge: document.getElementById('form-age'),
  formHeight: document.getElementById('form-height'),
  
  formM1Weight: document.getElementById('form-m1-weight'),
  formM1Bodyage: document.getElementById('form-m1-bodyage'),
  formM1Bmi: document.getElementById('form-m1-bmi'),
  formM1Muscle: document.getElementById('form-m1-muscle'),
  formM1Fat: document.getElementById('form-m1-fat'),
  formM2Weight: document.getElementById('form-m2-weight'),
  formM2Bodyage: document.getElementById('form-m2-bodyage'),
  formM2Bmi: document.getElementById('form-m2-bmi'),
  formM2Muscle: document.getElementById('form-m2-muscle'),
  formM2Fat: document.getElementById('form-m2-fat'),
  formM3Weight: document.getElementById('form-m3-weight'),
  formM3Bodyage: document.getElementById('form-m3-bodyage'),
  formM3Bmi: document.getElementById('form-m3-bmi'),
  formM3Muscle: document.getElementById('form-m3-muscle'),
  formM3Fat: document.getElementById('form-m3-fat'),
  formM4Weight: document.getElementById('form-m4-weight'),
  formM4Bodyage: document.getElementById('form-m4-bodyage'),
  formM4Bmi: document.getElementById('form-m4-bmi'),
  formM4Muscle: document.getElementById('form-m4-muscle'),
  formM4Fat: document.getElementById('form-m4-fat'),
  // Toast container
  toastWrapper: document.getElementById('toast-wrapper'),

  // Presentation Mode selectors
  btnPresentationMode: document.getElementById('btn-presentation-mode'),
  presentationOverlay: document.getElementById('presentation-overlay'),
  presBtnExit: document.getElementById('pres-btn-exit'),
  presBtnSound: document.getElementById('pres-btn-sound'),
  presBtnStart: document.getElementById('pres-btn-start'),
  presBtnNext: document.getElementById('pres-btn-next'),
  presBtnBack: document.getElementById('pres-btn-back'),
  presBtnRevealAction: document.getElementById('pres-btn-reveal-action'),
  presRevealCard: document.getElementById('pres-reveal-card'),
  presRevealCardBack: document.getElementById('pres-reveal-card-back'),
  presRevealRankTitle: document.getElementById('pres-reveal-rank-title'),
  presRevealPrizeTitle: document.getElementById('pres-reveal-prize-title'),
  presIndicators: document.getElementById('pres-indicators'),

  // Personal View and PIN Modal selectors
  btnToggleView: document.getElementById('btn-toggle-view'),
  adminView: document.getElementById('admin-view'),
  personalView: document.getElementById('personal-view'),
  personalSearchInput: document.getElementById('personal-search-input'),
  personalSuggestions: document.getElementById('personal-suggestions'),
  personalProfileDisplay: document.getElementById('personal-profile-display'),
  headerImportCsv: document.getElementById('header-import-csv'),
  pinModal: document.getElementById('pin-modal'),
  btnClosePinModal: document.getElementById('btn-close-pin-modal'),
  btnSubmitPin: document.getElementById('btn-submit-pin'),
  pinDigits: document.querySelectorAll('.pin-digit'),
  pinErrorMsg: document.getElementById('pin-error-msg'),
  pin1: document.getElementById('pin-1'),

  // Calculator Modal
  btnOpenCalculator: document.getElementById('btn-open-calculator'),
  calculatorModal: document.getElementById('calculator-modal'),
  btnCloseCalcModal: document.getElementById('btn-close-calc-modal'),
  btnResetCalc: document.getElementById('btn-reset-calc'),
  calcGender: document.getElementById('calc-gender'),
  calcHeight: document.getElementById('calc-height'),
  calcM1Weight: document.getElementById('calc-m1-weight'),
  calcM1Muscle: document.getElementById('calc-m1-muscle'),
  calcM1Fat: document.getElementById('calc-m1-fat'),
  calcLatestWeight: document.getElementById('calc-latest-weight'),
  calcLatestMuscle: document.getElementById('calc-latest-muscle'),
  calcLatestFat: document.getElementById('calc-latest-fat'),
  calcTotalScore: document.getElementById('calc-total-score'),
  calcStartBmi: document.getElementById('calc-start-bmi'),
  calcStartCategory: document.getElementById('calc-start-category'),
  calcLatestBmi: document.getElementById('calc-latest-bmi'),
  calcWeightScoreText: document.getElementById('calc-weight-score-text'),
  calcWeightBar: document.getElementById('calc-weight-bar'),
  calcMuscleScoreText: document.getElementById('calc-muscle-score-text'),
  calcMuscleBar: document.getElementById('calc-muscle-bar'),
  calcFatScoreText: document.getElementById('calc-fat-score-text'),
  calcFatBar: document.getElementById('calc-fat-bar'),
  calcExplanationText: document.getElementById('calc-explanation-text')
};



async function wellbeingApiRequest(path, options = {}) {
  const response = await window.PfigWellbeingAuth.apiFetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to connect to PFIG Wellbeing');
  return result;
}

function resolveSignedInEmployee(employeeList, identity) {
  if (!Array.isArray(employeeList) || !identity) return null;
  const signedInOid = String(identity.oid || '').trim().toLowerCase();
  if (signedInOid) {
    const linkedEmployee = employeeList.find(employee => (
      String(employee.entra_oid || '').trim().toLowerCase() === signedInOid
    ));
    if (linkedEmployee) return linkedEmployee;
  }
  return !identity.canEdit && employeeList.length === 1 ? employeeList[0] : null;
}

// DB Sync Loader helper
function showLoader(show) {
  let loader = document.getElementById('db-sync-loader');
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'db-sync-loader';
      loader.style.position = 'fixed';
      loader.style.top = '0';
      loader.style.left = '0';
      loader.style.width = '100vw';
      loader.style.height = '100vh';
      loader.style.background = 'rgba(0, 0, 0, 0.5)';
      loader.style.backdropFilter = 'blur(4px)';
      loader.style.zIndex = '9999';
      loader.style.display = 'flex';
      loader.style.alignItems = 'center';
      loader.style.justifyContent = 'center';
      loader.style.flexDirection = 'column';
      loader.style.color = '#fff';
      loader.style.fontFamily = 'var(--font-main)';
      
      const spinner = document.createElement('div');
      spinner.className = 'loader-spinner';
      spinner.style.border = '4px solid rgba(255, 255, 255, 0.1)';
      spinner.style.borderLeftColor = 'var(--primary)';
      spinner.style.borderRadius = '50%';
      spinner.style.width = '40px';
      spinner.style.height = '40px';
      spinner.style.animation = 'spin-anim 0.8s linear infinite';
      
      const text = document.createElement('div');
      text.id = 'db-sync-loader-text';
      text.style.marginTop = '1rem';
      text.style.fontSize = '0.95rem';
      text.style.fontWeight = '500';
      text.textContent = 'กำลังเชื่อมต่อฐานข้อมูลออนไลน์...';
      
      if (!document.getElementById('loader-spin-style')) {
        const style = document.createElement('style');
        style.id = 'loader-spin-style';
        style.innerHTML = `
          @keyframes spin-anim {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      loader.appendChild(spinner);
      loader.appendChild(text);
      document.body.appendChild(loader);
    } else {
      loader.style.display = 'flex';
      document.getElementById('db-sync-loader-text').textContent = 'กำลังซิงก์ข้อมูล...';
    }
  } else {
    if (loader) {
      loader.style.display = 'none';
    }
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  showLoader(true);
  
  // Initialize Theme
  const savedTheme = localStorage.getItem('pfig-theme') || 'light';
  console.log("Initializing theme from localStorage. Saved value:", savedTheme);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateThemeButtonIcon();

  setupEventListeners();
  try {
    wellbeingSession = await window.PfigWellbeingAuth.initialize();
  } catch (error) {
    console.error('Wellbeing authentication failed:', error);
    showLoader(false);
    window.PfigWellbeingAuth.showGate(error.message || 'Unable to sign in');
    return;
  }
  if (!wellbeingSession?.identity) {
    showLoader(false);
    return;
  }
  await loadData();
  updateUI();
  showLoader(false);
  
  if (currentView === 'personal') {
    switchToPersonalView();
  } else {
    switchToAdminView();
  }
  
  // Setup realtime listener
  setupRealtimeListener();
  
  // Check if DB is empty and show welcome toast
  if (employees.length === 0 && wellbeingSession?.identity?.canEdit) {
    showToast('ยินดีต้อนรับสู่ระบบ PFIG Well Being! เริ่มบันทึกข้อมูลพนักงานใหม่ได้ทันที', 'info', 5000);
  }
});

// Load only the rows authorized for the signed-in Entra identity.
async function loadData() {
  try {
    const result = await wellbeingApiRequest('/api/employees');
    const data = Array.isArray(result.employees) ? result.employees : [];
    wellbeingDataMode = result.mode || 'personal';
    wellbeingPersonalHealthRanking = result.personalHealthRanking || null;
    employees = data.map(item => ({
      id: item.id,
      name: item.name,
      department: item.department,
      age: item.age,
      height: item.height,
      months: item.months,
      entra_oid: item.entra_oid || null
    }));

    // Auto-detect round: if anyone has complete m4, default to m4; otherwise if anyone has complete m3, default to m3
    const hasM4Data = employees.some(emp => PfigHealthScore.hasCompleteMeasurement(emp, 'm4'));
    const hasM3Data = employees.some(emp => PfigHealthScore.hasCompleteMeasurement(emp, 'm3'));
    if (!hasM4Data && hasM3Data) {
      currentEvaluationRound = 'm3';
    } else {
      currentEvaluationRound = 'm4';
    }
    if (elements.selectEvalRound) {
      elements.selectEvalRound.value = currentEvaluationRound;
    }

    if (result.requiresIdentityLink) {
      elements.personalProfileDisplay.innerHTML = '<div class="empty-state"><h3>Account not linked</h3><p>Please ask the Wellbeing administrator to link your Microsoft account to your employee record.</p></div>';
      elements.personalProfileDisplay.style.display = 'block';
    }
  } catch (err) {
    console.error('Wellbeing API error:', err);
    showToast(err.message || 'Unable to load wellbeing data', 'error');
    employees = [];
  }
}

function setupRealtimeListener() {
  console.info('Wellbeing data access is protected by the server API.');
}

// Legacy implementation retained temporarily for migration reference; it is never called.
async function loadDataFromLegacySupabase() {
  try {
    const { data, error } = await supabaseClient
      .from('pfig_employees')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Error loading data from Supabase:", error);
      showToast('ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้: ' + error.message, 'error');
      employees = [];
      return;
    }
    
    employees = data.map(item => ({
      id: item.id,
      name: item.name,
      department: item.department,
      age: item.age,
      height: item.height,
      months: item.months
    }));
  } catch (err) {
    console.error("Network error:", err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล', 'error');
    employees = [];
  }
}

// Setup Realtime Sync
function setupLegacyRealtimeListener() {
  console.log("Setting up Supabase Realtime channel...");
  
  supabaseClient
    .channel('pfig_employees_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pfig_employees'
      },
      async (payload) => {
        console.log('Realtime change event received:', payload.eventType, payload);
        
        let syncMsg = 'ข้อมูลในระบบอัปเดตเรียบร้อยแล้ว';
        if (payload.eventType === 'INSERT') {
          syncMsg = `เพิ่มพนักงานใหม่: ${payload.new.name}`;
        } else if (payload.eventType === 'UPDATE') {
          syncMsg = `อัปเดตข้อมูลพนักงาน: ${payload.new.name}`;
        } else if (payload.eventType === 'DELETE') {
          syncMsg = `ลบข้อมูลพนักงานเรียบร้อย`;
        }
        
        showToast(syncMsg, 'info', 2000);
        
        await loadData();
        updateUI();
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        showToast('เชื่อมต่อฐานข้อมูลเรียลไทม์ออนไลน์สำเร็จ 🟢', 'success', 2500);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Realtime subscription channel error');
        showToast('เกิดข้อผิดพลาดในการซิงก์ข้อมูลเรียลไทม์', 'error', 3000);
      }
    });
}

// Placeholder saveData helper
function saveData() {
  // Saved directly in asynchronous operations now
}

// Helper: Calculate BMI
function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100;
  if (isNaN(w) || isNaN(h) || h === 0) return null;
  return parseFloat((w / (h * h)).toFixed(2));
}

// Helper: Compare baseline m1 to target round (m3 or m4)
function getComparison(emp, round = currentEvaluationRound) {
  const months = emp.months || {};
  const m1 = months.m1;
  const target = months[round];
  const targetName = round === 'm3' ? 'ติดตามผล (ครั้งที่ 3)' : 'ผลลัพธ์สุดท้าย (ครั้งที่ 4)';
  if (!m1 || !target || Number(m1.weight) <= 0 || Number(m1.bodyage) <= 0 || Number(target.weight) <= 0 || Number(target.bodyage) <= 0) {
    return { weightDiff: 0, bmiDiff: 0, bodyageDiff: 0, muscleDiff: 0, fatDiff: 0, hasProgress: false, latestLabel: '-', latestWeight: null, latestBmi: null, latestBodyage: null, m1Weight: null, m1Bmi: null, m1Bodyage: null };
  }
  const muscleDiff = (target.muscle != null && m1.muscle != null) ? parseFloat((target.muscle - m1.muscle).toFixed(1)) : 0;
  const fatDiff = (target.fat != null && m1.fat != null) ? parseFloat((target.fat - m1.fat).toFixed(1)) : 0;
  return {
    weightDiff: parseFloat((target.weight - m1.weight).toFixed(1)), bmiDiff: parseFloat(((target.bmi || 0) - (m1.bmi || 0)).toFixed(2)),
    bodyageDiff: parseInt(target.bodyage - m1.bodyage), muscleDiff, fatDiff, hasProgress: true, latestLabel: targetName,
    latestWeight: target.weight, latestBmi: target.bmi || null, latestBodyage: target.bodyage, m1Weight: m1.weight, m1Bmi: m1.bmi || null, m1Bodyage: m1.bodyage
  };
}
  

// Helper: Calculate 3D Health Score (Combined Weight, Muscle, Fat Progress)
function calculateHealthScore(emp, round = currentEvaluationRound) {
  return PfigHealthScore.calculateHealthScore(emp, round);
}

// Setup Event Listeners
function setupEventListeners() {
  // Add Employee Button
  elements.btnAddEmployee.addEventListener('click', () => {
    openModal('add');
  });

  // Close modal click triggers
  elements.btnCloseModal.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);
  elements.employeeModal.addEventListener('click', (e) => {
    if (e.target === elements.employeeModal) closeModal();
  });

  // Form submit
  elements.employeeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveForm();
  });

  // Dynamic BMI Calculation in Modal inputs
  const hookBmiCalculation = (weightInputId, bodyageInputId, bmiInputId) => {
    const weightInput = document.getElementById(weightInputId);
    const bodyageInput = document.getElementById(bodyageInputId);
    const bmiInput = document.getElementById(bmiInputId);
    
    const update = () => {
      const height = parseFloat(elements.formHeight.value);
      const weight = parseFloat(weightInput.value);
      if (height && weight) {
        const bmi = calcBMI(weight, height);
        bmiInput.value = bmi ? bmi : '';
      } else {
        bmiInput.value = '';
      }
    };
    
    weightInput.addEventListener('input', update);
    elements.formHeight.addEventListener('input', update);
  };
  
  hookBmiCalculation('form-m1-weight', 'form-m1-bodyage', 'form-m1-bmi');
  hookBmiCalculation('form-m2-weight', 'form-m2-bodyage', 'form-m2-bmi');
  hookBmiCalculation('form-m3-weight', 'form-m3-bodyage', 'form-m3-bmi');
  hookBmiCalculation('form-m4-weight', 'form-m4-bodyage', 'form-m4-bmi');

  // Search box listener (with debounce)
  let searchTimeout;
  elements.searchBox.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      currentPage = 1;
      updateUI();
    }, 200);
  });

  // Department Filter
  elements.filterDept.addEventListener('change', (e) => {
    currentFilterDept = e.target.value;
    currentPage = 1;
    updateUI();
  });

  // Evaluation Round Filter
  if (elements.selectEvalRound) {
    elements.selectEvalRound.addEventListener('change', (e) => {
      currentEvaluationRound = e.target.value;
      currentPage = 1;
      updateUI();
    });
  }

  // Progress Status Filter
  elements.filterProgress.addEventListener('change', (e) => {
    currentFilterProgress = e.target.value;
    currentPage = 1;
    updateUI();
  });

  // Page Size selector
  elements.pageSizeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    pageSize = val === 'all' ? 'all' : parseInt(val);
    currentPage = 1;
    updateUI();
  });





  // Export CSV
  elements.btnExportCsv.addEventListener('click', exportCSV);
  
  // Download CSV template
  elements.btnDownloadTemplate.addEventListener('click', downloadTemplateCSV);

  // Import CSV File change
  elements.csvFileInput.addEventListener('change', handleCSVImport);

  // Sorting columns
  document.getElementById('sort-name').addEventListener('click', () => handleSort('name'));
  document.getElementById('sort-w-diff').addEventListener('click', () => handleSort('weightDiff'));
  document.getElementById('sort-age-diff').addEventListener('click', () => handleSort('bodyageDiff'));

  // Winning Criteria selector
  if (elements.filterCriteria) {
    elements.filterCriteria.addEventListener('change', (e) => {
      currentWinningCriteria = e.target.value;
      updateUI();
    });
  }

  // Presentation Mode event listeners
  elements.btnPresentationMode.addEventListener('click', startPresentation);
  elements.presBtnExit.addEventListener('click', exitPresentation);
  elements.presBtnSound.addEventListener('click', togglePresentationSound);
  elements.presBtnStart.addEventListener('click', () => goPresentationStage(1));
  elements.presBtnNext.addEventListener('click', handlePresentationNext);
  elements.presBtnBack.addEventListener('click', handlePresentationBack);
  elements.presBtnRevealAction.addEventListener('click', revealAwardCard);

  // Photo input event listeners
  const setupPhotoInput = (inputId, previewId, hiddenInputId) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const hidden = document.getElementById(hiddenInputId);
    
    if (input) {
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        showLoader(true);
        try {
          const compressedBase64 = await compressImage(file, 400, 400, 0.7);
          hidden.value = compressedBase64;
          preview.querySelector('img').src = compressedBase64;
          preview.style.display = 'block';
          showToast('โหลดรูปภาพสำเร็จ', 'success', 2000);
        } catch (err) {
          console.error(err);
          showToast('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 'error');
        }
        showLoader(false);
      });
    }
  };
  
  setupPhotoInput('form-m1-photo-input', 'form-m1-photo-preview', 'form-m1-photo-data');
  setupPhotoInput('form-m2-photo-input', 'form-m2-photo-preview', 'form-m2-photo-data');
  setupPhotoInput('form-m3-photo-input', 'form-m3-photo-preview', 'form-m3-photo-data');
  setupPhotoInput('form-m4-photo-input', 'form-m4-photo-preview', 'form-m4-photo-data');
  const closeGalleryBtn = document.getElementById('btn-close-gallery-modal');
  if (closeGalleryBtn) {
    closeGalleryBtn.addEventListener('click', window.closePhotoGallery);
  }
  const galleryModal = document.getElementById('photo-gallery-modal');
  if (galleryModal) {
    galleryModal.addEventListener('click', (e) => {
      if (e.target === galleryModal) window.closePhotoGallery();
    });
  }

  // View Switcher Button
  elements.btnToggleView.addEventListener('click', () => {
    if (currentView === 'admin') {
      switchToPersonalView();
    } else if (wellbeingSession?.identity?.canEdit) {
      switchToAdminView();
    } else {
      openPinModal();
    }
  });

  // Personal Search Autocomplete suggestions
  elements.personalSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    if (!val) {
      elements.personalSuggestions.innerHTML = '';
      elements.personalSuggestions.style.display = 'none';
      return;
    }

    const matches = employees.filter(emp => 
      emp.name.toLowerCase().includes(val)
    );

    if (matches.length > 0) {
      elements.personalSuggestions.innerHTML = '';
      matches.forEach(emp => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
          <span class="suggestion-name">${emp.name}</span>
          <span class="suggestion-dept">${emp.department}</span>
        `;
        div.addEventListener('click', () => {
          elements.personalSearchInput.value = emp.name;
          elements.personalSuggestions.style.display = 'none';
          showPersonalProfile(emp.id);
        });
        elements.personalSuggestions.appendChild(div);
      });
      elements.personalSuggestions.style.display = 'block';
    } else {
      elements.personalSuggestions.innerHTML = `
        <div style="padding: 0.85rem 1.5rem; color: var(--text-muted); font-size: 0.9rem; font-style: italic;">
          ไม่พบรายชื่อพนักงาน
        </div>
      `;
      elements.personalSuggestions.style.display = 'block';
    }
  });

  // Click outside suggestions list to close it
  document.addEventListener('click', (e) => {
    if (!elements.personalSearchInput.contains(e.target) && !elements.personalSuggestions.contains(e.target)) {
      elements.personalSuggestions.style.display = 'none';
    }
  });

  // PIN Input digits auto-focus progression
  elements.pinDigits.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      input.value = input.value.replace(/[^0-9]/g, '');
      if (input.value.length === 1) {
        if (index < 3) {
          elements.pinDigits[index + 1].focus();
        } else {
          handlePinVerification();
        }
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
        elements.pinDigits[index - 1].focus();
      }
    });
  });

  elements.btnClosePinModal.addEventListener('click', closePinModal);
  elements.btnSubmitPin.addEventListener('click', handlePinVerification);

  // Theme Toggle Button
  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      console.log("Theme toggled by user. Active theme:", isDark ? "dark" : "light");
      localStorage.setItem('pfig-theme', isDark ? 'dark' : 'light');
      updateThemeButtonIcon();
    });
  }

  // Open Calculator modal
  if (elements.btnOpenCalculator) {
    elements.btnOpenCalculator.addEventListener('click', () => {
      elements.calculatorModal.classList.add('active');
      runCalculatorCalculation();
    });
  }

  // Close Calculator modal
  if (elements.btnCloseCalcModal) {
    elements.btnCloseCalcModal.addEventListener('click', () => {
      elements.calculatorModal.classList.remove('active');
    });
  }

  if (elements.calculatorModal) {
    elements.calculatorModal.addEventListener('click', (e) => {
      if (e.target === elements.calculatorModal) {
        elements.calculatorModal.classList.remove('active');
      }
    });
  }

  // Reset Calculator values
  if (elements.btnResetCalc) {
    elements.btnResetCalc.addEventListener('click', () => {
      elements.calcHeight.value = 170;
      elements.calcM1Weight.value = 80;
      elements.calcM1Muscle.value = 32;
      elements.calcM1Fat.value = 28;
      elements.calcLatestWeight.value = 72;
      elements.calcLatestMuscle.value = 35;
      elements.calcLatestFat.value = 22;
      runCalculatorCalculation();
    });
  }

  // Real-time calculation on typing/changing
  const calcInputs = [
    elements.calcGender,
    elements.calcHeight,
    elements.calcM1Weight,
    elements.calcM1Muscle,
    elements.calcM1Fat,
    elements.calcLatestWeight,
    elements.calcLatestMuscle,
    elements.calcLatestFat
  ];
  calcInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', runCalculatorCalculation);
    }
  });
}

// Update Theme Button Text/Icon
function updateThemeButtonIcon() {
  const btn = document.getElementById('btn-toggle-theme');
  if (!btn) return;
  const isDark = document.body.classList.contains('dark-theme');
  btn.innerHTML = isDark ? '☀️ ธีมสว่าง' : '🌙 ธีมมืด';
}



// Handling Column Sorts
function handleSort(field) {
  if (currentSortField === field) {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = field;
    currentSortOrder = field === 'name' ? 'asc' : 'desc'; // Default desc for numeric changes (higher loss is top)
  }
  
  // Update header indicator classes
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
  });
  
  const activeTh = document.getElementById(`sort-${field === 'weightDiff' ? 'w-diff' : field === 'bodyageDiff' ? 'age-diff' : 'name'}`);
  if (activeTh) {
    activeTh.classList.add(currentSortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
  }
  
  updateUI();
}

// Fetch Filtered and Sorted list of employees
function getFilteredAndSortedEmployees() {
  let list = [...employees];
  if (currentSearchQuery) {
    list = list.filter(emp => emp.name.toLowerCase().includes(currentSearchQuery) || emp.department.toLowerCase().includes(currentSearchQuery));
  }
  if (currentFilterDept) {
    list = list.filter(emp => emp.department === currentFilterDept);
  }
  if (currentFilterProgress === 'has-records') {
    list = list.filter(emp => getComparison(emp, currentEvaluationRound).hasProgress);
  } else if (currentFilterProgress === 'missing-records') {
    list = list.filter(emp => !getComparison(emp, currentEvaluationRound).hasProgress);
  } else if (currentFilterProgress === 'bodyage-reduced') {
    list = list.filter(emp => {
      const comp = getComparison(emp, currentEvaluationRound);
      return comp.hasProgress && comp.bodyageDiff < 0;
    });
  }
  list.sort((a, b) => {
    let valA, valB;
    if (currentSortField === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
      if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
      return 0;
    }
    const compA = getComparison(a, currentEvaluationRound);
    const compB = getComparison(b, currentEvaluationRound);
    if (currentSortField === 'weightDiff') {
      valA = compA.hasProgress ? compA.weightDiff : 999;
      valB = compB.hasProgress ? compB.weightDiff : 999;
    } else if (currentSortField === 'bodyageDiff') {
      valA = compA.hasProgress ? compA.bodyageDiff : 999;
      valB = compB.hasProgress ? compB.bodyageDiff : 999;
    }
    return currentSortOrder === 'asc' ? valA - valB : valB - valA;
  });
  return list;
}
  

// Update UI elements, tables, stats widgets, and charts
function updateUI() {
  const filtered = getFilteredAndSortedEmployees();
  
  // Update Department dropdown filter options
  populateDepartmentFilter();
  
  // Update Dashboard summary widgets
  calculateWidgets();

  // Render Table
  renderTable(filtered);
  
  // Render Leaderboard
  renderLeaderboard();
  
  // Render Summary Progress bars
  renderProgressBars();
}

// Dynamically populate department dropdown based on available departments in DB
function populateDepartmentFilter() {
  const predefined = ['Corporate', 'Finance & Acc', 'Logistics', 'Sales', 'Executive'];
  const dbDepts = employees.map(emp => emp.department).filter(Boolean);
  const depts = [...new Set([...predefined, ...dbDepts])].sort();
  
  // Save current selection value
  const currentVal = elements.filterDept.value;
  
  // Re-populate options
  elements.filterDept.innerHTML = '<option value="">ทุกแผนก</option>';
  depts.forEach(dept => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    elements.filterDept.appendChild(option);
  });
  
  // Restore value if still present in selection
  if (depts.includes(currentVal)) {
    elements.filterDept.value = currentVal;
  } else {
    elements.filterDept.value = '';
    currentFilterDept = '';
  }
}

// Compute statistics widgets values
function calculateWidgets() {
  const total = employees.length;
  elements.totalEmployees.textContent = total;
  
  if (total === 0) {
    elements.avgWeightLoss.textContent = '0.0 kg';
    elements.weightTrend.innerHTML = '<span class="widget-trend-down">↓ 0%</span> ในผู้เข้าร่วม';
    elements.avgBmiLoss.textContent = '0.0';
    elements.bmiTrend.innerHTML = '<span class="widget-trend-down">↓ 0</span> พัฒนาขึ้น';
    elements.maxBodyageLoss.textContent = '0 ปี';
    elements.maxBodyageWinner.textContent = 'ไม่มีข้อมูล';
    return;
  }
  
  let totalWeightLoss = 0;
  let totalBmiLoss = 0;
  let weightLossCount = 0;
  let bmiLossCount = 0;
  
  let maxAgeLoss = 0;
  let maxAgeWinner = null;
  
  employees.forEach(emp => {
    const comp = getComparison(emp, currentEvaluationRound);
    if (comp.hasProgress) {
      totalWeightLoss += comp.weightDiff; // Weight diff (negative value is weight loss)
      totalBmiLoss += comp.bmiDiff;
      weightLossCount++;
      bmiLossCount++;
      
      // Top body age reduction (exclude 'Executive')
      if (emp.department !== 'Executive') {
        const reduction = -comp.bodyageDiff;
        if (reduction > maxAgeLoss) {
          maxAgeLoss = reduction;
          maxAgeWinner = emp;
        }
      }
    }
  });
  
  // Average Weight Loss
  if (weightLossCount > 0) {
    // Calculate average weight loss (average of differences, inversion so positive values represent loss)
    const avgLossVal = -(totalWeightLoss / weightLossCount);
    elements.avgWeightLoss.textContent = `${avgLossVal.toFixed(1)} kg`;
    
    // Average BMI Loss
    const avgBmiLossVal = -(totalBmiLoss / bmiLossCount);
    elements.avgBmiLoss.textContent = avgBmiLossVal.toFixed(2);
    
    // Success rate info
    const weightProgressPercent = (employees.filter(emp => {
      const c = getComparison(emp, currentEvaluationRound);
      return c.hasProgress && c.weightDiff < 0;
    }).length / total * 100).toFixed(0);
    
    elements.weightTrend.innerHTML = `<span class="widget-trend-down">↓ ลดได้เฉลี่ย</span> ในผู้ลดสำเร็จ ${weightProgressPercent}%`;
    elements.bmiTrend.innerHTML = `<span class="widget-trend-down">↓ พัฒนาดีขึ้น</span> เฉลี่ยต่อคน`;
  } else {
    elements.avgWeightLoss.textContent = '0.0 kg';
    elements.avgBmiLoss.textContent = '0.0';
    elements.weightTrend.innerHTML = '<span class="widget-trend-down">0.0%</span> ไม่มีข้อมูลการบันทึก';
    elements.bmiTrend.innerHTML = 'ยังไม่มีข้อมูลการบันทึก';
  }
  
  // Top Winner Card Widget dynamically based on criteria
  let topValue = '0';
  let topWinnerName = 'ไม่มีข้อมูลการบันทึก';
  let widgetTitle = 'ลดอายุร่างกายได้สูงสุด';
  let widgetIcon = '🔥';
  
  if (currentWinningCriteria === 'health_score') {
    widgetTitle = 'คะแนนสุขภาพสูงสุด';
    widgetIcon = '🏆';
    let maxScore = -999;
    let bestScoreWinner = null;
    employees.forEach(emp => {
      const comp = getComparison(emp, currentEvaluationRound);
      if (comp.hasProgress && emp.department !== 'Executive') {
        const scoreData = calculateHealthScore(emp, currentEvaluationRound);
        if (scoreData.totalScore > maxScore) {
          maxScore = scoreData.totalScore;
          bestScoreWinner = emp;
        }
      }
    });
    if (bestScoreWinner) {
      topValue = `${maxScore.toFixed(1)} คะแนน`;
      topWinnerName = `${bestScoreWinner.name} (${bestScoreWinner.department})`;
    } else {
      topValue = '-';
    }
  } else if (currentWinningCriteria === 'bodyage') {
    widgetTitle = 'ลดอายุร่างกายได้สูงสุด';
    widgetIcon = '🔥';
    if (maxAgeLoss > 0 && maxAgeWinner) {
      topValue = `${maxAgeLoss} ปี`;
      topWinnerName = `${maxAgeWinner.name} (${maxAgeWinner.department})`;
    } else {
      topValue = '0 ปี';
    }
  } else if (currentWinningCriteria === 'weight') {
    widgetTitle = 'ลดน้ำหนักตัวได้สูงสุด';
    widgetIcon = '⚖️';
    let maxWeightLoss = 0;
    let maxWeightWinner = null;
    employees.forEach(emp => {
      const comp = getComparison(emp, currentEvaluationRound);
      if (comp.hasProgress && emp.department !== 'Executive') {
        const loss = -comp.weightDiff;
        if (loss > maxWeightLoss) {
          maxWeightLoss = loss;
          maxWeightWinner = emp;
        }
      }
    });
    if (maxWeightLoss > 0 && maxWeightWinner) {
      topValue = `-${maxWeightLoss.toFixed(1)} kg`;
      topWinnerName = `${maxWeightWinner.name} (${maxWeightWinner.department})`;
    } else {
      topValue = '0.0 kg';
    }
  } else if (currentWinningCriteria === 'bmi_closest') {
    widgetTitle = 'BMI มาตรฐานดีที่สุด';
    widgetIcon = '🎯';
    let minBmiDistance = 999;
    let bestBmiWinner = null;
    let bestBmiVal = 0;
    employees.forEach(emp => {
      const comp = getComparison(emp, currentEvaluationRound);
      if (comp.hasProgress && emp.department !== 'Executive' && comp.latestBmi !== null) {
        const distance = Math.abs(comp.latestBmi - 21);
        if (distance < minBmiDistance) {
          minBmiDistance = distance;
          bestBmiWinner = emp;
          bestBmiVal = comp.latestBmi;
        }
      }
    });
    if (bestBmiWinner) {
      topValue = `${bestBmiVal.toFixed(2)}`;
      topWinnerName = `${bestBmiWinner.name} (${bestBmiWinner.department}) • ห่างเป้า ${minBmiDistance.toFixed(2)}`;
    } else {
      topValue = '-';
    }
  }
  
  const titleEl = document.getElementById('stat-max-title');
  const iconEl = document.getElementById('stat-max-icon');
  if (titleEl) titleEl.textContent = widgetTitle;
  if (iconEl) iconEl.textContent = widgetIcon;
  elements.maxBodyageLoss.textContent = topValue;
  elements.maxBodyageWinner.textContent = topWinnerName;
}

// Render Table Rows with Pagination
function renderTable(filteredEmployees) {
  elements.tableBody.innerHTML = '';
  if (filteredEmployees.length === 0) {
    elements.emptyState.style.display = 'flex';
    elements.paginationSummary.textContent = 'กำลังแสดงผล 0 - 0 จากทั้งหมด 0 คน';
    elements.paginationButtons.innerHTML = '';
    return;
  }
  elements.emptyState.style.display = 'none';
  const totalItems = filteredEmployees.length;
  let itemsToShow = filteredEmployees;
  if (pageSize !== 'all') {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    itemsToShow = filteredEmployees.slice(startIdx, endIdx);
    elements.paginationSummary.textContent = `กำลังแสดงผล ${startIdx + 1} - ${Math.min(endIdx, totalItems)} จากทั้งหมด ${totalItems} คน`;
    renderPaginationControls(totalPages);
  } else {
    elements.paginationSummary.textContent = `กำลังแสดงผล 1 - ${totalItems} จากทั้งหมด ${totalItems} คน`;
    elements.paginationButtons.innerHTML = '';
  }
  itemsToShow.forEach(emp => {
    const comp = getComparison(emp);
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    const renderMeasurement = (measurement, roundKey) => {
      if (!measurement || !measurement.weight) return '<span style="color:var(--text-muted);font-style:italic;">ยังไม่บันทึก</span>';
      const muscle = measurement.muscle != null ? `${measurement.muscle}%` : '-';
      const fat = measurement.fat != null ? `${measurement.fat}%` : '-';
      let scoreBadgeHtml = '';
      if (roundKey === 'm3' || roundKey === 'm4') {
        const canScore = PfigHealthScore.hasCompleteMeasurement(emp, roundKey);
        if (canScore) {
          const s = PfigHealthScore.calculateHealthScore(emp, roundKey);
          scoreBadgeHtml = `<div class="td-subtitle" style="margin-top:2px;"><span style="color:var(--primary-light);font-weight:600;">🎯 คะแนนสุขภาพ: ${s.totalScore.toFixed(1)}</span></div>`;
        }
      }
      return `<div>⚖️ ${measurement.weight} kg</div><div class="td-subtitle">🧠 อายุร่างกาย: ${measurement.bodyage} ปี (BMI: ${measurement.bmi || '-'})</div><div class="td-subtitle">💪 กล้ามเนื้อ: ${muscle} | 📉 ไขมัน: ${fat}</div>${scoreBadgeHtml}`;
    };
    const roundKeys = ['m1', 'm2', 'm3', 'm4'];
    const measurements = roundKeys.map(round => ({ data: emp.months[round], roundKey: round }));
    const hasPhotos = measurements.some(item => item.data && item.data.photo);
    const galleryBtn = hasPhotos ? `<button class="btn-gallery-trigger" onclick="openPhotoGallery('${emp.id}')" title="ดูรูปถ่ายเปรียบเทียบ">🖼️ รูปถ่าย</button>` : `<button class="btn-gallery-trigger btn-gallery-empty" onclick="openPhotoGallery('${emp.id}')" title="ไม่มีรูปถ่าย">🖼️ ไม่มีรูป</button>`;
    tdName.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;width:100%;"><div><div class="td-name">${emp.name}</div><div class="td-subtitle">ส่วนสูง ${emp.height} ซม.</div></div><div>${galleryBtn}</div></div>`;
    tr.appendChild(tdName);
    const tdAge = document.createElement('td');
    tdAge.innerHTML = `<div>จริง: ${emp.age} ปี</div><div class="td-subtitle">สูง: ${emp.height} ซม.</div>`;
    tr.appendChild(tdAge);
    const tdDept = document.createElement('td');
    tdDept.textContent = emp.department;
    tr.appendChild(tdDept);
    measurements.forEach(item => {
      const td = document.createElement('td');
      td.innerHTML = renderMeasurement(item.data, item.roundKey);
      tr.appendChild(td);
    });
    const roundLabelNumber = currentEvaluationRound === 'm3' ? '3' : '4';
    const tdWDiff = document.createElement('td');
    tdWDiff.innerHTML = comp.hasProgress ? `<span class="metric-badge ${comp.weightDiff < 0 ? 'metric-badge-improved' : comp.weightDiff > 0 ? 'metric-badge-worsened' : 'metric-badge-neutral'}">${comp.weightDiff < 0 ? '↓ ' + Math.abs(comp.weightDiff) : comp.weightDiff > 0 ? '↑ ' + comp.weightDiff : '0.0'} kg</span><div class="td-subtitle">เทียบกับค่าตั้งต้น</div>` : '<span style="color:var(--text-muted);">-</span>';
    tr.appendChild(tdWDiff);
    const tdAgeDiff = document.createElement('td');
    tdAgeDiff.innerHTML = comp.hasProgress ? `<span class="metric-badge ${comp.bodyageDiff < 0 ? 'metric-badge-improved' : comp.bodyageDiff > 0 ? 'metric-badge-worsened' : 'metric-badge-neutral'}">${comp.bodyageDiff < 0 ? 'ลดลง ' + Math.abs(comp.bodyageDiff) : comp.bodyageDiff > 0 ? 'เพิ่ม ' + comp.bodyageDiff : 'คงที่'} ปี</span><div class="td-subtitle">เทียบกับครั้งที่ 1 ไปครั้งที่ ${roundLabelNumber}</div>` : '<span style="color:var(--text-muted);">-</span>';
    tr.appendChild(tdAgeDiff);
    const tdAction = document.createElement('td');
    tdAction.innerHTML = `<div class="action-buttons"><button class="btn-icon btn-icon-edit" onclick="openModal('edit','${emp.id}')" title="แก้ไขข้อมูล">แก้ไข</button><button class="btn-icon btn-icon-delete" onclick="deleteEmployee('${emp.id}')" title="ลบข้อมูล">ลบ</button></div>`;
    tr.appendChild(tdAction);
    elements.tableBody.appendChild(tr);
  });
}

// Render pagination buttons controls
function renderPaginationControls(totalPages) {
  elements.paginationButtons.innerHTML = '';
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.innerHTML = '&laquo;';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    currentPage--;
    updateUI();
  });
  elements.paginationButtons.appendChild(prevBtn);
  
  // Page number buttons
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentPage ? 'pagination-active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      updateUI();
    });
    elements.paginationButtons.appendChild(pageBtn);
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.innerHTML = '&raquo;';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    currentPage++;
    updateUI();
  });
  elements.paginationButtons.appendChild(nextBtn);
}

function getWinningCriteriaMeta(criteria = currentWinningCriteria) {
  const meta = {
    health_score: {
      titleText: '5 อันดับแรก ผู้ที่ได้คะแนนสุขภาพรวมสูงสุด',
      criteriaLabel: 'คะแนนสุขภาพรวม',
      emptyMsg: 'ยังไม่มีข้อมูลบันทึกความคืบหน้าของพนักงานในระบบขณะนี้',
      presentationErrorMsg: 'กรุณาสุ่มข้อมูลพนักงาน หรือบันทึกความคืบหน้าของพนักงานสำเร็จอย่างน้อย 3 คนก่อนประกาศผล'
    },
    bodyage: {
      titleText: '5 อันดับแรก ผู้ที่ลดอายุร่างกายได้มากที่สุด',
      criteriaLabel: 'ลดอายุร่างกาย',
      emptyMsg: 'ยังไม่มีข้อมูลพนักงานที่ลดอายุร่างกายได้ในระบบขณะนี้',
      presentationErrorMsg: 'กรุณาสุ่มข้อมูลพนักงาน หรือบันทึกความคืบหน้าให้มีผู้ลดอายุร่างกายสำเร็จอย่างน้อย 3 คนก่อนประกาศผล'
    },
    weight: {
      titleText: '5 อันดับแรก ผู้ที่ลดน้ำหนักตัวได้มากที่สุด',
      criteriaLabel: 'ลดน้ำหนักตัว',
      emptyMsg: 'ยังไม่มีข้อมูลพนักงานที่ลดน้ำหนักตัวได้ในระบบขณะนี้',
      presentationErrorMsg: 'กรุณาสุ่มข้อมูลพนักงาน หรือบันทึกความคืบหน้าให้มีผู้ลดน้ำหนักสำเร็จอย่างน้อย 3 คนก่อนประกาศผล'
    },
    bmi_closest: {
      titleText: '5 อันดับแรก ผู้ที่ค่า BMI มาตรฐานดีที่สุด (ใกล้เป้า 21)',
      criteriaLabel: 'BMI ใกล้เป้า 21',
      emptyMsg: 'ยังไม่มีข้อมูลบันทึกความคืบหน้าของพนักงานในระบบขณะนี้',
      presentationErrorMsg: 'กรุณาสุ่มข้อมูลพนักงาน หรือบันทึกความคืบหน้าของพนักงานสำเร็จอย่างน้อย 3 คนก่อนประกาศผล'
    }
  };

  return meta[criteria] || meta.health_score;
}

function getRankBadgeClass(rank) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-other';
}

function getRankBadgeIcon(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return String(rank);
}

function formatChangeText(label, diff, unit = '', decimals = 1) {
  const value = Number(diff);
  if (!Number.isFinite(value)) return `${label} -`;
  if (value === 0) return `${label} คงที่`;

  const direction = value > 0 ? 'เพิ่ม' : 'ลด';
  return `${label} ${direction} ${Math.abs(value).toFixed(decimals)}${unit}`;
}

function formatFromToText(startVal, endVal, unit = '', decimals = 1) {
  const start = Number(startVal);
  const end = Number(endVal);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '';

  const unitText = unit ? ` ${unit}` : '';
  return ` (${start.toFixed(decimals)}→${end.toFixed(decimals)}${unitText})`;
}

function getDashboardLeaderboardReason(criteria, emp, scoreData = null, round = currentEvaluationRound) {
  const comp = getComparison(emp, round);

  if (criteria === 'health_score') {
    const score = scoreData || calculateHealthScore(emp, round);
    return [
      `BMI ${score.weightScore.toFixed(1)}/20 (${formatChangeText('BMI', comp.bmiDiff, '', 2)})`,
      `กล้ามเนื้อ ${score.muscleScore.toFixed(1)}/40 (${formatChangeText('กล้ามเนื้อ', comp.muscleDiff, '%', 1)})`,
      `ไขมัน ${score.fatScore.toFixed(1)}/40 (${formatChangeText('ไขมัน', comp.fatDiff, '%', 1)})`
    ].join(' • ');
  }

  if (criteria === 'bodyage') {
    return `${formatChangeText('อายุร่างกาย', comp.bodyageDiff, ' ปี', 0)}${formatFromToText(comp.m1Bodyage, comp.latestBodyage, 'ปี', 0)}`;
  }

  if (criteria === 'weight') {
    return `${formatChangeText('น้ำหนัก', comp.weightDiff, ' kg', 1)}${formatFromToText(comp.m1Weight, comp.latestWeight, 'kg', 1)}`;
  }

  if (criteria === 'bmi_closest') {
    const distance = Number.isFinite(comp.latestBmi) ? Math.abs(comp.latestBmi - 21) : null;
    const distanceText = distance === null ? 'ห่างเป้า -' : `ห่างเป้า ${distance.toFixed(2)}`;
    const roundLabel = round === 'm3' ? 'ติดตามผล (ครั้งที่ 3)' : 'ผลลัพธ์สุดท้าย';
    return `BMI ${roundLabel} ${comp.latestBmi.toFixed(2)} (${distanceText}) • ${formatChangeText('BMI', comp.bmiDiff, '', 2)}${formatFromToText(comp.m1Bmi, comp.latestBmi, '', 2)}`;
  }

  return '';
}

function hasCompleteFinalMeasurement(emp, round = currentEvaluationRound) {
  return PfigHealthScore.hasCompleteMeasurement(emp, round);
}

function getRankedAchievers(criteria = currentWinningCriteria, employeeList = employees, round = currentEvaluationRound) {
  const meta = getWinningCriteriaMeta(criteria);
  const eligibleEmployees = employeeList.filter(emp => PfigHealthScore.hasCompleteMeasurement(emp, round));
  let items = [];

  if (criteria === 'health_score') {
    items = eligibleEmployees
      .filter(emp => {
        const comp = getComparison(emp, round);
        return comp.hasProgress && emp.department !== 'Executive';
      })
      .map(emp => {
        const scoreData = calculateHealthScore(emp, round);
        const comp = getComparison(emp, round);
        return {
          emp: emp,
          valText: `${scoreData.totalScore.toFixed(1)} คะแนน`,
          descText: 'คะแนนสุขภาพรวม',
          reasonText: getDashboardLeaderboardReason(criteria, emp, scoreData, round),
          sortKey: scoreData.totalScore,
          fatDiff: comp.fatDiff,
          muscleDiff: comp.muscleDiff
        };
      })
      .sort((a, b) => {
        if (b.sortKey !== a.sortKey) {
          return b.sortKey - a.sortKey;
        }
        if (a.fatDiff !== b.fatDiff) {
          return a.fatDiff - b.fatDiff; // smaller (more negative, meaning larger decrease) is better
        }
        if (b.muscleDiff !== a.muscleDiff) {
          return b.muscleDiff - a.muscleDiff; // larger (more positive, meaning larger increase) is better
        }
        return a.emp.name.localeCompare(b.emp.name);
      });
  } else if (criteria === 'bodyage') {
    items = eligibleEmployees
      .filter(emp => {
        const comp = getComparison(emp, round);
        return comp.hasProgress && comp.bodyageDiff < 0 && emp.department !== 'Executive';
      })
      .map(emp => {
        const comp = getComparison(emp, round);
        return {
          emp: emp,
          valText: `-${Math.abs(comp.bodyageDiff)} ปี`,
          descText: 'อายุร่างกายลดลง',
          reasonText: getDashboardLeaderboardReason(criteria, emp, null, round),
          sortKey: -comp.bodyageDiff
        };
      })
      .sort((a, b) => {
        if (b.sortKey !== a.sortKey) {
          return b.sortKey - a.sortKey;
        }
        return a.emp.name.localeCompare(b.emp.name);
      });
  } else if (criteria === 'weight') {
    items = eligibleEmployees
      .filter(emp => {
        const comp = getComparison(emp, round);
        return comp.hasProgress && comp.weightDiff < 0 && emp.department !== 'Executive';
      })
      .map(emp => {
        const comp = getComparison(emp, round);
        return {
          emp: emp,
          valText: `-${Math.abs(comp.weightDiff).toFixed(1)} kg`,
          descText: 'น้ำหนักตัวลดลง',
          reasonText: getDashboardLeaderboardReason(criteria, emp, null, round),
          sortKey: -comp.weightDiff
        };
      })
      .sort((a, b) => {
        if (b.sortKey !== a.sortKey) {
          return b.sortKey - a.sortKey;
        }
        return a.emp.name.localeCompare(b.emp.name);
      });
  } else if (criteria === 'bmi_closest') {
    items = eligibleEmployees
      .filter(emp => {
        const comp = getComparison(emp, round);
        return comp.hasProgress && emp.department !== 'Executive' && comp.latestBmi !== null;
      })
      .map(emp => {
        const comp = getComparison(emp, round);
        const distance = Math.abs(comp.latestBmi - 21);
        return {
          emp: emp,
          valText: `${comp.latestBmi.toFixed(2)}`,
          descText: `ห่างเป้า ${distance.toFixed(2)}`,
          reasonText: getDashboardLeaderboardReason(criteria, emp, null, round),
          sortKey: distance
        };
      })
      .sort((a, b) => {
        if (a.sortKey !== b.sortKey) {
          return a.sortKey - b.sortKey;
        }
        return a.emp.name.localeCompare(b.emp.name);
      });
  }

  return {
    items,
    titleText: meta.titleText,
    criteriaLabel: meta.criteriaLabel,
    emptyMsg: meta.emptyMsg,
    presentationErrorMsg: meta.presentationErrorMsg
  };
}

function getPersonalRankBadgeData(empId, criteria = currentWinningCriteria, employeeList = employees, serverHealthRanking = null, round = currentEvaluationRound) {
  if (criteria === 'health_score' && serverHealthRanking) {
    if (serverHealthRanking.hasRank) {
      const rank = serverHealthRanking.rank;
      return {
        hasRank: true,
        rank,
        icon: getRankBadgeIcon(rank),
        rankClass: getRankBadgeClass(rank),
        titleText: `อันดับ ${rank}`,
        metricText: `${Number(serverHealthRanking.totalScore).toFixed(1)} คะแนน`,
        descText: 'คะแนนสุขภาพรวม',
        contextText: `อันดับ ${rank} จาก ${serverHealthRanking.totalParticipants} คน`,
        criteriaLabel: 'คะแนนสุขภาพรวม'
      };
    }
    return {
      hasRank: false,
      rank: null,
      icon: '⏳',
      rankClass: 'rank-other',
      titleText: 'รออันดับ',
      metricText: 'ยังไม่เข้าเงื่อนไข',
      descText: 'คะแนนสุขภาพรวม',
      contextText: 'ต้องมีข้อมูลค่าตั้งต้นและผลลัพธ์รอบประเมินครบก่อนเข้าร่วมการจัดอันดับ'
    };
  }

  const ranking = getRankedAchievers(criteria, employeeList, round);
  const rankIndex = ranking.items.findIndex(item => item.emp.id === empId);

  if (rankIndex === -1) {
    const emp = employeeList.find(item => item.id === empId);
    const isExecutive = emp && emp.department === 'Executive';

    return {
      hasRank: false,
      rank: null,
      icon: isExecutive ? '🔒' : '⏳',
      rankClass: 'rank-other',
      titleText: isExecutive ? 'ไม่รวมจัดอันดับ' : 'รออันดับ',
      metricText: isExecutive ? 'Executive' : 'ยังไม่เข้าเงื่อนไข',
      descText: ranking.criteriaLabel,
      contextText: isExecutive ? 'ตำแหน่ง Executive ไม่รวมในกติกาการแข่งขัน' : ranking.emptyMsg
    };
  }

  const rank = rankIndex + 1;
  const item = ranking.items[rankIndex];

  return {
    hasRank: true,
    rank,
    icon: getRankBadgeIcon(rank),
    rankClass: getRankBadgeClass(rank),
    titleText: `อันดับ ${rank}`,
    metricText: item.valText,
    descText: item.descText,
    contextText: `อันดับ ${rank} จาก ${ranking.items.length} คน`,
    criteriaLabel: ranking.criteriaLabel
  };
}

function renderPersonalRankInlineBadge(rankData) {
  const mutedClass = rankData.hasRank ? '' : ' personal-rank-inline-muted';
  const labelText = rankData.hasRank ? `#${rankData.rank}` : rankData.titleText;
  const iconHtml = (!rankData.hasRank || rankData.rank <= 3)
    ? `<span class="personal-rank-inline-icon">${rankData.icon}</span>`
    : '';

  return `
    <span class="personal-rank-inline ${rankData.rankClass}${mutedClass}" title="${rankData.contextText}">
      ${iconHtml}
      <span>${labelText}</span>
    </span>
  `;
}

function renderLeaderboard() {
  elements.leaderboardContainer.innerHTML = '';
  const ranking = getRankedAchievers(currentWinningCriteria, employees, currentEvaluationRound);

  // Update Leaderboard Card Title dynamically
  const titleEl = document.getElementById('leaderboard-title');
  if (titleEl) {
    titleEl.innerHTML = `<span>🏆</span> ${ranking.titleText}`;
  }

  // Update Leaderboard Round Subtitle dynamically
  if (elements.leaderboardRoundSubtitle) {
    const roundText = currentEvaluationRound === 'm3' ? 'ติดตามผล (ครั้งที่ 3)' : 'ผลลัพธ์สุดท้าย (ครั้งที่ 4)';
    elements.leaderboardRoundSubtitle.textContent = `ค่าตั้งต้น เทียบ ${roundText}`;
  }
  
  const topAchievers = ranking.items.slice(0, 5);
  
  if (topAchievers.length === 0) {
    elements.leaderboardContainer.innerHTML = `
      <div class="empty-state" style="padding: 2rem;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌿</div>
        <p>${ranking.emptyMsg}</p>
      </div>
    `;
    return;
  }
  
  topAchievers.forEach((item, index) => {
    const rank = index + 1;
    const badgeClass = getRankBadgeClass(rank);
    
    const div = document.createElement('div');
    div.className = 'leaderboard-item';
    div.innerHTML = `
      <div class="leaderboard-rank-badge ${badgeClass}">${getRankBadgeIcon(rank)}</div>
      <div class="leaderboard-info">
        <div class="leaderboard-name">${item.emp.name}</div>
        <div class="leaderboard-reason">${item.emp.department} • ${item.reasonText}</div>
      </div>
      <div class="leaderboard-metric">
        <div class="leaderboard-val">${item.valText}</div>
        <div class="leaderboard-desc">${item.descText}</div>
      </div>
    `;
    elements.leaderboardContainer.appendChild(div);
  });
}

// Render Summary Progress bars
function renderProgressBars() {
  const roundNum = currentEvaluationRound === 'm3' ? '3' : '4';
  const roundName = currentEvaluationRound === 'm3' ? 'ติดตามผล (ครั้งที่ 3)' : 'ผลลัพธ์สุดท้าย (ครั้งที่ 4)';
  if (elements.summaryRoundNote) {
    elements.summaryRoundNote.innerHTML = `การคำนวณเปรียบเทียบผลลัพธ์ยึดตาม <strong>น้ำหนัก และ อายุร่างกาย</strong> จากค่าตั้งต้น (ครั้งที่ 1) ถึง${roundName}`;
  }

  const total = employees.length;
  if (total === 0) {
    elements.summaryBodyagePercent.textContent = '0% (0 คน)';
    elements.summaryWeightPercent.textContent = '0% (0 คน)';
    elements.summaryBmiPercent.textContent = '0% (0 คน)';
    elements.barBodyage.style.width = '0%';
    elements.barWeight.style.width = '0%';
    elements.barBmi.style.width = '0%';
    return;
  }
  
  let bodyageDropCount = 0;
  let weightDropCount = 0;
  let bmiDropCount = 0;
  
  employees.forEach(emp => {
    const comp = getComparison(emp, currentEvaluationRound);
    if (comp.hasProgress) {
      if (comp.bodyageDiff < 0) bodyageDropCount++;
      if (comp.weightDiff < 0) weightDropCount++;
      if (comp.bmiDiff < 0) bmiDropCount++;
    }
  });
  
  const bodyagePercent = Math.round((bodyageDropCount / total) * 100);
  const weightPercent = Math.round((weightDropCount / total) * 100);
  const bmiPercent = Math.round((bmiDropCount / total) * 100);
  
  elements.summaryBodyagePercent.textContent = `${bodyagePercent}% (${bodyageDropCount} จาก ${total} คน)`;
  elements.barBodyage.style.width = `${bodyagePercent}%`;
  
  elements.summaryWeightPercent.textContent = `${weightPercent}% (${weightDropCount} จาก ${total} คน)`;
  elements.barWeight.style.width = `${weightPercent}%`;
  
  elements.summaryBmiPercent.textContent = `${bmiPercent}% (${bmiDropCount} จาก ${total} คน)`;
  elements.barBmi.style.width = `${bmiPercent}%`;
}

// Open Modal for Add/Edit
function openModal(mode, id = null) {
  modalMode = mode;
  elements.employeeForm.reset();
  const stages = [1, 2, 3, 4];
  if (mode === 'add') {
    elements.modalHeadline.textContent = 'เพิ่มข้อมูลพนักงานใหม่';
    elements.formId.value = '';
    stages.forEach(stage => {
      document.getElementById(`form-m${stage}-bmi`).value = '';
      removePhoto(stage);
    });
  } else {
    elements.modalHeadline.textContent = 'แก้ไขข้อมูลพนักงาน';
    const emp = employees.find(e => e.id === id);
    if (!emp) { showToast('ไม่พบข้อมูลพนักงานที่ต้องการแก้ไข', 'error'); return; }
    elements.formId.value = emp.id;
    elements.formName.value = emp.name;
    elements.formDept.value = emp.department;
    elements.formEntraOid.value = emp.entra_oid || '';
    elements.formAge.value = emp.age;
    elements.formHeight.value = emp.height;
    stages.forEach(stage => {
      const measurement = emp.months[`m${stage}`] || {};
      elements[`formM${stage}Weight`].value = measurement.weight || '';
      elements[`formM${stage}Bodyage`].value = measurement.bodyage || '';
      elements[`formM${stage}Bmi`].value = measurement.bmi || calcBMI(measurement.weight, emp.height) || '';
      elements[`formM${stage}Muscle`].value = measurement.muscle || '';
      elements[`formM${stage}Fat`].value = measurement.fat || '';
      const photo = document.getElementById(`form-m${stage}-photo-data`);
      const preview = document.getElementById(`form-m${stage}-photo-preview`);
      if (measurement.photo) {
        photo.value = measurement.photo;
        preview.querySelector('img').src = measurement.photo;
        preview.style.display = 'block';
      } else removePhoto(stage);
    });
  }
  elements.employeeModal.classList.add('active');
}

// Close Modal
function closeModal() {
  elements.employeeModal.classList.remove('active');
}

// Save Form Data (Add or Edit)
async function saveForm() {
  const name = elements.formName.value.trim();
  const department = elements.formDept.value.trim();
  const entra_oid = elements.formEntraOid.value.trim() || null;
  const age = parseInt(elements.formAge.value);
  const height = parseInt(elements.formHeight.value);
  const readMeasurement = stage => {
    const weight = parseFloat(elements[`formM${stage}Weight`].value);
    const bodyage = parseInt(elements[`formM${stage}Bodyage`].value);
    const muscle = parseFloat(elements[`formM${stage}Muscle`].value);
    const fat = parseFloat(elements[`formM${stage}Fat`].value);
    const photo = document.getElementById(`form-m${stage}-photo-data`).value || null;
    if (isNaN(weight) || isNaN(bodyage)) return photo ? { weight: null, bodyage: null, bmi: null, muscle: null, fat: null, photo } : null;
    return { weight, bodyage, bmi: calcBMI(weight, height), muscle: isNaN(muscle) ? null : muscle, fat: isNaN(fat) ? null : fat, photo };
  };
  const editingId = elements.formId.value;
  const existingEmp = modalMode === 'edit' ? employees.find(e => e.id === editingId) : null;
  const months = { m1: readMeasurement(1), m2: readMeasurement(2), m3: readMeasurement(3), m4: readMeasurement(4) };
  const existingGender = existingEmp && existingEmp.months ? existingEmp.months.gender : null;
  if (existingGender) months.gender = existingGender;
  showLoader(true);
  try {
    const payload = { name, department, age, height, months, entra_oid };
    const path = modalMode === 'add' ? '/api/employees' : `/api/employees?id=${encodeURIComponent(editingId)}`;
    await wellbeingApiRequest(path, { method: modalMode === 'add' ? 'POST' : 'PATCH', body: JSON.stringify(payload) });
    showToast(modalMode === 'add' ? 'เพิ่มพนักงานสำเร็จเรียบร้อย' : 'อัปเดตข้อมูลพนักงานสำเร็จ', 'success');
    await loadData(); updateUI(); closeModal();
  } catch (err) {
    console.error(err); showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  } finally { showLoader(false); }
}


// Delete Employee record
async function deleteEmployee(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  
  if (confirm(`คุณต้องการลบข้อมูลของ ${emp.name} ใช่หรือไม่?`)) {
    showLoader(true);
    try {
      await wellbeingApiRequest(`/api/employees?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const error = null;
        
      if (error) {
        showToast('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message, 'error');
        console.error(error);
      } else {
        showToast('ลบข้อมูลพนักงานเรียบร้อย', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์', 'error');
    }
    await loadData();
    updateUI();
    showLoader(false);
  }
}

// Toast Notifications helper
function showToast(message, type = 'info', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <div>${message}</div>
  `;
  
  elements.toastWrapper.appendChild(toast);
  
  // Trigger animation next frame
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Export Database to CSV
function csvColumns() {
  const headers = ['ชื่อ-นามสกุล', 'แผนก', 'อายุจริง', 'ส่วนสูง'];
  for (let stage = 1; stage <= 4; stage++) headers.push(`น้ำหนัก ครั้งที่ ${stage}`, `อายุร่างกาย ครั้งที่ ${stage}`, `กล้ามเนื้อ% ครั้งที่ ${stage}`, `ไขมัน% ครั้งที่ ${stage}`);
  return headers;
}

function csvLine(values) {
  return values.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',');
}

function csvRowForEmployee(emp) {
  const row = [emp.name, emp.department, emp.age, emp.height];
  for (let stage = 1; stage <= 4; stage++) {
    const measurement = emp.months[`m${stage}`] || {};
    row.push(measurement.weight || '', measurement.bodyage || '', measurement.muscle || '', measurement.fat || '');
  }
  return row;
}

function exportCSV() {
  if (employees.length === 0) { showToast('ไม่มีข้อมูลพนักงานสำหรับส่งออก', 'error'); return; }
  let csvContent = '\ufeff' + csvLine(csvColumns()) + '\n';
  employees.forEach(emp => { csvContent += csvLine(csvRowForEmployee(emp)) + '\n'; });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.setAttribute('href', url); link.setAttribute('download', `PFIG_WellBeing_Data_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast('ส่งออกไฟล์ CSV สำเร็จ!', 'success');
}

function downloadTemplateCSV() {
  const examples = [
    ['John Doe', 'Sales', 30, 175, 85.5, 42, 32.5, 28.4, 83, 40, 33, 27, 81, 39, 33.5, 26.5, 79.5, 38, 34, 25.8],
    ['Jane Smith', 'Finance', 28, 160, 65, 32, 25, 35.5, 64, 31, 25.5, 34, 63, 30, 26, 33.2, 62.1, 30, 26, 32.8]
  ];
  const csvContent = '\ufeff' + csvLine(csvColumns()) + '\n' + examples.map(csvLine).join('\n') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.setAttribute('href', url); link.setAttribute('download', 'PFIG_WellBeing_Template.csv'); document.body.appendChild(link); link.click(); document.body.removeChild(link); showToast('ดาวน์โหลดตัวอย่างไฟล์สำเร็จ นำไปกรอกและอัปโหลดได้ทันที', 'success');
}

// Import CSV File and Parse
function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file, 'UTF-8');
  elements.csvFileInput.value = '';
}

async function parseCSV(text) {
  const lines = text.replace(/^\ufeff/, '').split(/\r\n|\n/);
  if (lines.length < 2) { showToast('ไฟล์ CSV ไม่มีข้อมูลเพียงพอ', 'error'); return; }
  let successCount = 0; let errorCount = 0; const importedList = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim(); if (!line) continue;
    const columns = []; let insideQuotes = false; let currentColumn = '';
    for (const char of line) { if (char === '"') insideQuotes = !insideQuotes; else if (char === ',' && !insideQuotes) { columns.push(currentColumn.trim()); currentColumn = ''; } else currentColumn += char; }
    columns.push(currentColumn.trim());
    if (columns.length < 8) { errorCount++; continue; }
    const name = columns[0].replace(/^"|"$/g, '').trim(); const department = columns[1].replace(/^"|"$/g, '').trim(); const age = parseInt(columns[2]); const height = parseInt(columns[3]);
    const baseWeight = parseFloat(columns[4]); const baseBodyage = parseInt(columns[5]);
    if (!name || !department || isNaN(age) || isNaN(height) || isNaN(baseWeight) || isNaN(baseBodyage)) { errorCount++; continue; }
    const months = {};
    for (let stage = 1; stage <= 4; stage++) { const offset = 4 + (stage - 1) * 4; const weight = parseFloat(columns[offset]); const bodyage = parseInt(columns[offset + 1]); const muscle = parseFloat(columns[offset + 2]); const fat = parseFloat(columns[offset + 3]); if (!isNaN(weight) && !isNaN(bodyage)) months[`m${stage}`] = { weight, bodyage, bmi: calcBMI(weight, height), muscle: isNaN(muscle) ? null : muscle, fat: isNaN(fat) ? null : fat }; }
    importedList.push({ name, department, age, height, months }); successCount++;
  }
  if (successCount > 0) { showLoader(true); try { for (const employee of importedList) await wellbeingApiRequest('/api/employees', { method: 'POST', body: JSON.stringify(employee) }); showToast(`นำเข้าพนักงานสำเร็จ ${successCount} คน ${errorCount > 0 ? `(ผิดพลาด ${errorCount} แถว)` : ''}`, 'success'); await loadData(); updateUI(); } catch (err) { console.error(err); showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error'); } finally { showLoader(false); } } else showToast('ไม่มีข้อมูลพนักงานที่ถูกต้องได้รับการนำเข้า กรุณาตรวจสอบรูปแบบไฟล์', 'error');
}
  

// --- Audio Synthesizer (Using Web Audio API) ---
const AudioSynth = {
  ctx: null,
  drumrollSource: null,
  tomSource: null,
  drumrollGain: null,
  lfo: null,
  
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  
  startDrumroll() {
    if (!soundEnabled) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Stop any existing drumroll
    this.stopDrumroll();
    
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds snare loop
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;
    
    // Snare drum resonant frequency bandpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q = 1.8;
    filter.frequency.setValueAtTime(190, this.ctx.currentTime);
    
    // Modulate snare gain to simulate sticking roll
    this.drumrollGain = this.ctx.createGain();
    this.drumrollGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(24, this.ctx.currentTime); // 24Hz sticks roll
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.drumrollGain.gain);
    
    // Highpass crackle for snare rattle
    const highPass = this.ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.setValueAtTime(900, this.ctx.currentTime);
    highPass.Q = 0.4;
    
    noiseNode.connect(filter);
    filter.connect(this.drumrollGain);
    
    noiseNode.connect(highPass);
    const highPassGain = this.ctx.createGain();
    highPassGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    highPass.connect(highPassGain);
    highPassGain.connect(this.drumrollGain);
    
    // Floor tom drum rumble
    const tomOsc = this.ctx.createOscillator();
    tomOsc.type = 'triangle';
    tomOsc.frequency.setValueAtTime(68, this.ctx.currentTime);
    
    const tomGain = this.ctx.createGain();
    tomGain.gain.setValueAtTime(0.07, this.ctx.currentTime);
    lfoGain.connect(tomGain.gain);
    tomOsc.connect(tomGain);
    tomGain.connect(this.drumrollGain);
    
    this.drumrollGain.connect(this.ctx.destination);
    
    noiseNode.start(0);
    this.lfo.start(0);
    tomOsc.start(0);
    
    this.drumrollSource = noiseNode;
    this.tomSource = tomOsc;
  },
  
  stopDrumroll() {
    if (this.drumrollSource) {
      try { this.drumrollSource.stop(); } catch(e){}
      this.drumrollSource = null;
    }
    if (this.tomSource) {
      try { this.tomSource.stop(); } catch(e){}
      this.tomSource = null;
    }
    if (this.lfo) {
      try { this.lfo.stop(); } catch(e){}
      this.lfo = null;
    }
  },
  
  playFanfare() {
    if (!soundEnabled) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    const now = this.ctx.currentTime;
    
    // Triumphant Eb major chord (Eb4, G4, Bb4, Eb5)
    const notes = [293.66, 392.00, 466.16, 587.33];
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      const vibrato = this.ctx.createOscillator();
      vibrato.frequency.value = 6.5; // 6.5Hz modulation
      const vibratoGain = this.ctx.createGain();
      vibratoGain.gain.value = 3.5;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(700, now + 1.3);
      
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      const delay = idx * 0.06;
      gainNode.gain.linearRampToValueAtTime(0.05, now + delay + 0.08);
      gainNode.gain.setValueAtTime(0.05, now + 1.2);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(now + delay);
      vibrato.start(now + delay);
      osc.stop(now + 1.9);
      vibrato.stop(now + 1.9);
    });
  }
};

// --- Confetti Particle System ---
const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  active: false,
  continuousLoop: false,
  
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },
  
  resize() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  },
  
  spawn(amount = 120) {
    const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#8b5cf6'];
    
    // Spawn from bottom corners
    for (let i = 0; i < amount; i++) {
      const isLeft = Math.random() < 0.5;
      this.particles.push({
        x: isLeft ? 40 : this.canvas.width - 40,
        y: this.canvas.height - 10,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (isLeft ? 1 : -1) * (Math.random() * 11 + 6),
        speedY: -(Math.random() * 16 + 10),
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 8 - 4,
        gravity: 0.35,
        drag: 0.985
      });
    }
    
    if (!this.active) {
      this.active = true;
      this.loop();
    }
  },
  
  loop() {
    if (!this.active) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Continuously spawn small amounts of confetti if continuous loop is active (for podium slide)
    if (this.continuousLoop && Math.random() < 0.1) {
      const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -10,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
        gravity: 0.1,
        drag: 0.99
      });
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.speedX *= p.drag;
      p.speedY += p.gravity;
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;
      
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation * Math.PI / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.4);
      this.ctx.restore();
      
      if (p.y > this.canvas.height + 50 || p.x < -50 || p.x > this.canvas.width + 50) {
        this.particles.splice(i, 1);
      }
    }
    
    if (this.particles.length > 0 || this.continuousLoop) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      this.active = false;
    }
  },
  
  clear() {
    this.particles = [];
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.active = false;
    this.continuousLoop = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
};

// --- Presentation Mode Controller ---
function startPresentation() {
  const ranking = getRankedAchievers(currentWinningCriteria, employees);
  const achievers = ranking.items;
  
  if (achievers.length < 3) {
    showToast(ranking.presentationErrorMsg, 'error', 5000);
    return;
  }
  
  // Rank 1: index 0 (Winner, Gold)
  // Rank 2: index 1 (Silver)
  // Rank 3: index 2 (Bronze)
  presentationWinners = achievers.slice(0, 3).map(item => {
    const comp = getComparison(item.emp);
    const scoreData = calculateHealthScore(item.emp);
    return {
      emp: item.emp,
      bodyageDiff: comp.bodyageDiff,
      weightLoss: -comp.weightDiff,
      bmiLoss: -comp.bmiDiff,
      muscleDiff: comp.muscleDiff,
      fatDiff: comp.fatDiff,
      latestBmi: comp.latestBmi,
      latestWeight: comp.latestWeight,
      latestBodyage: comp.latestBodyage,
      m1Bmi: comp.m1Bmi,
      m1Weight: comp.m1Weight,
      m1Bodyage: comp.m1Bodyage,
      distance: comp.latestBmi ? Math.abs(comp.latestBmi - 21) : 999,
      healthScore: scoreData.totalScore,
      weightScore: scoreData.weightScore,
      muscleScore: scoreData.muscleScore,
      fatScore: scoreData.fatScore
    };
  });
  
  // Set up elements
  Confetti.init(elements.presentationOverlay.querySelector('#presentation-confetti-canvas'));
  
  // Enter Fullscreen Presentation
  currentPresentationStage = 0;
  elements.presentationOverlay.classList.add('active');
  goPresentationStage(0);
}

function exitPresentation() {
  // Stop all timers, drumrolls, confetti
  AudioSynth.stopDrumroll();
  Confetti.clear();
  elements.presentationOverlay.classList.remove('active');
}

function togglePresentationSound() {
  soundEnabled = !soundEnabled;
  elements.presBtnSound.textContent = soundEnabled ? '🔊' : '🔇';
  elements.presBtnSound.classList.toggle('btn-secondary', soundEnabled);
  elements.presBtnSound.classList.toggle('btn-danger', !soundEnabled);
  
  if (!soundEnabled) {
    AudioSynth.stopDrumroll();
  }
}

function goPresentationStage(stageIndex) {
  currentPresentationStage = stageIndex;
  
  // Reset audio & card reveal statuses
  AudioSynth.stopDrumroll();
  Confetti.continuousLoop = false;
  
  // Close any flipped cards
  elements.presRevealCard.classList.remove('flipped');
  cardRevealed = false;
  
  // Select active slides
  const slides = elements.presentationOverlay.querySelectorAll('.pres-slide');
  slides.forEach(slide => slide.classList.remove('active'));
  
  // Select active dots
  const dots = elements.presIndicators.querySelectorAll('.pres-dot');
  dots.forEach(dot => dot.classList.remove('active'));
  if (dots[stageIndex]) dots[stageIndex].classList.add('active');
  
  // Update footer button displays
  elements.presBtnBack.disabled = stageIndex === 0;
  if (stageIndex === 4) {
    elements.presBtnNext.textContent = 'สิ้นสุดการประกาศ';
  } else {
    elements.presBtnNext.textContent = 'ถัดไป ›';
  }
  
  if (stageIndex === 0) {
    // Intro Slide
    document.getElementById('pres-slide-0').classList.add('active');
  } else if (stageIndex >= 1 && stageIndex <= 3) {
    // Reveal slides (3rd place, 2nd place, 1st place)
    document.getElementById('pres-slide-reveal').classList.add('active');
    
    // Determine winner based on stage index
    // Stage 1 -> 3rd place (presentationWinners[2])
    // Stage 2 -> 2nd place (presentationWinners[1])
    // Stage 3 -> 1st place (presentationWinners[0])
    const winnerIdx = 3 - stageIndex; // 2, 1, 0
    const winnerData = presentationWinners[winnerIdx];
    const rankLabels = [
      { title: '🥇 ชนะเลิศอันดับ 1 🥇', prize: 'เงินรางวัล 10,000 บาท', trophy: '🥇', class: 'pres-card-back-gold', mystery: '🥇' },
      { title: '🥈 รองชนะเลิศอันดับ 1 🥈', prize: 'เงินรางวัล 6,000 บาท', trophy: '🥈', class: 'pres-card-back-silver', mystery: '🥈' },
      { title: '🥉 รองชนะเลิศอันดับ 2 🥉', prize: 'เงินรางวัล 4,000 บาท', trophy: '🥉', class: 'pres-card-back-bronze', mystery: '🥉' }
    ];
    const rankInfo = rankLabels[winnerIdx];
    
    elements.presRevealRankTitle.textContent = rankInfo.title;
    elements.presRevealPrizeTitle.textContent = rankInfo.prize;
    
    // Reset Back face color border
    elements.presRevealCardBack.className = 'pres-card-face pres-card-back ' + rankInfo.class;
    document.getElementById('pres-card-mystery-icon').textContent = rankInfo.mystery;
    document.getElementById('pres-rev-trophy').textContent = rankInfo.trophy;
    
    // Set text detail fields
    document.getElementById('pres-rev-name').textContent = winnerData.emp.name;
    document.getElementById('pres-rev-dept').textContent = `${winnerData.emp.department} • อายุจริง ${winnerData.emp.age} ปี`;
    
    // Dynamically render metrics box container based on active criteria
    const metricsContainer = document.getElementById('pres-revealed-metrics');
    if (currentWinningCriteria === 'health_score') {
      const wDiff = -winnerData.weightLoss; // weightDiff
      const wText = wDiff > 0 ? `เพิ่มขึ้น +${wDiff.toFixed(1)} kg` : wDiff < 0 ? `ลดลง ${Math.abs(wDiff).toFixed(1)} kg` : 'คงที่';
      const mText = winnerData.muscleDiff > 0 ? `+${winnerData.muscleDiff}%` : `${winnerData.muscleDiff}%`;
      const fText = winnerData.fatDiff > 0 ? `+${winnerData.fatDiff}%` : `${winnerData.fatDiff}%`;
      
      metricsContainer.innerHTML = `
        <div class="revealed-metric-box">
          <div class="revealed-box-label">การพัฒนาน้ำหนัก</div>
          <div class="revealed-box-val" style="font-size: 0.95rem;">${wText}</div>
        </div>
        <div class="revealed-metric-box">
          <div class="revealed-box-label">มวลกาย (กล้ามเนื้อ/ไขมัน)</div>
          <div class="revealed-box-val" style="font-size: 0.85rem; line-height: 1.2; padding-top: 0.2rem;">
            กล้ามเนื้อ: ${mText}<br>ไขมัน: ${fText}
          </div>
        </div>
        <div class="revealed-metric-box" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3);">
          <div class="revealed-box-label" style="color: var(--primary-light);">คะแนนสุขภาพรวม</div>
          <div class="revealed-box-val" style="color: var(--success); font-weight: 700;">${winnerData.healthScore.toFixed(1)} คะแนน</div>
        </div>
      `;
    } else if (currentWinningCriteria === 'bodyage') {
      metricsContainer.innerHTML = `
        <div class="revealed-metric-box">
          <div class="revealed-box-label">อายุร่างกายเดิม</div>
          <div class="revealed-box-val">${winnerData.m1Bodyage} ปี</div>
        </div>
        <div class="revealed-metric-box">
          <div class="revealed-box-label">อายุร่างกายใหม่</div>
          <div class="revealed-box-val">${winnerData.latestBodyage} ปี</div>
        </div>
        <div class="revealed-metric-box" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3);">
          <div class="revealed-box-label" style="color: var(--primary-light);">ลดลงได้</div>
          <div class="revealed-box-val" style="color: var(--success); font-weight: 700;">-${Math.abs(winnerData.bodyageDiff)} ปี</div>
        </div>
      `;
    } else if (currentWinningCriteria === 'weight') {
      metricsContainer.innerHTML = `
        <div class="revealed-metric-box">
          <div class="revealed-box-label">น้ำหนักเดิม</div>
          <div class="revealed-box-val">${winnerData.m1Weight.toFixed(1)} kg</div>
        </div>
        <div class="revealed-metric-box">
          <div class="revealed-box-label">น้ำหนักใหม่</div>
          <div class="revealed-box-val">${winnerData.latestWeight.toFixed(1)} kg</div>
        </div>
        <div class="revealed-metric-box" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3);">
          <div class="revealed-box-label" style="color: var(--primary-light);">ลดลงได้</div>
          <div class="revealed-box-val" style="color: var(--success); font-weight: 700;">-${Math.abs(winnerData.weightLoss).toFixed(1)} kg</div>
        </div>
      `;
    } else if (currentWinningCriteria === 'bmi_closest') {
      metricsContainer.innerHTML = `
        <div class="revealed-metric-box">
          <div class="revealed-box-label">BMI แรกเริ่ม</div>
          <div class="revealed-box-val">${winnerData.m1Bmi.toFixed(2)}</div>
        </div>
        <div class="revealed-metric-box">
          <div class="revealed-box-label">BMI ผลลัพธ์สุดท้าย</div>
          <div class="revealed-box-val">${winnerData.latestBmi.toFixed(2)}</div>
        </div>
        <div class="revealed-metric-box" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3);">
          <div class="revealed-box-label" style="color: var(--primary-light);">ห่างจากเป้า (21)</div>
          <div class="revealed-box-val" style="color: var(--success); font-weight: 700;">${winnerData.distance.toFixed(2)}</div>
        </div>
      `;
    }
    
    // Extra details (Weight, BMI, Muscle, Fat changes)
    const muscleSign = winnerData.muscleDiff > 0 ? '+' : '';
    const fatSign = winnerData.fatDiff > 0 ? '+' : '';
    const muscleText = winnerData.muscleDiff !== 0 ? `💪 กล้ามเนื้อ: <strong>${muscleSign}${winnerData.muscleDiff}%</strong>` : '';
    const fatText = winnerData.fatDiff !== 0 ? `📉 ไขมัน: <strong>${fatSign}${winnerData.fatDiff}%</strong>` : '';
    
    let subStatsHtml = '';
    if (currentWinningCriteria === 'health_score') {
      const ageDiffVal = winnerData.bodyageDiff;
      const ageText = ageDiffVal < 0 ? `ลดลง ${Math.abs(ageDiffVal)} ปี` : ageDiffVal > 0 ? `เพิ่มขึ้น +${ageDiffVal} ปี` : 'คงที่';
      subStatsHtml = `🌿 อายุร่างกาย: <strong>${ageText}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; 📊 BMI ผลลัพธ์สุดท้าย: <strong>${winnerData.latestBmi ? winnerData.latestBmi.toFixed(2) : '-'}</strong>`;
    } else if (currentWinningCriteria === 'bodyage') {
      subStatsHtml = `⚖️ น้ำหนักลดลง: <strong>${winnerData.weightLoss.toFixed(1)} kg</strong> &nbsp;&nbsp;|&nbsp;&nbsp; 📊 BMI ลดลง: <strong>${winnerData.bmiLoss.toFixed(2)}</strong>`;
    } else if (currentWinningCriteria === 'weight') {
      const ageDiffVal = winnerData.bodyageDiff;
      const ageText = ageDiffVal < 0 ? `ลดลง ${Math.abs(ageDiffVal)} ปี` : ageDiffVal > 0 ? `เพิ่มขึ้น +${ageDiffVal} ปี` : 'คงที่';
      subStatsHtml = `🌿 อายุร่างกาย: <strong>${ageText}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; 📊 BMI ลดลง: <strong>${winnerData.bmiLoss.toFixed(2)}</strong>`;
    } else if (currentWinningCriteria === 'bmi_closest') {
      const ageDiffVal = winnerData.bodyageDiff;
      const ageText = ageDiffVal < 0 ? `ลดลง ${Math.abs(ageDiffVal)} ปี` : ageDiffVal > 0 ? `เพิ่มขึ้น +${ageDiffVal} ปี` : 'คงที่';
      subStatsHtml = `🌿 อายุร่างกาย: <strong>${ageText}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; ⚖️ น้ำหนักลดลง: <strong>${winnerData.weightLoss.toFixed(1)} kg</strong>`;
    }
    
    if (muscleText || fatText) {
      subStatsHtml += `<br>${muscleText} ${muscleText && fatText ? '&nbsp;&nbsp;|&nbsp;&nbsp;' : ''} ${fatText}`;
    }
    
    document.getElementById('pres-rev-weight-stats').innerHTML = subStatsHtml;
    
    // Autostart snare drum roll sound to build suspense
    AudioSynth.startDrumroll();
  } else if (stageIndex === 4) {
    // Podium view
    document.getElementById('pres-slide-podium').classList.add('active');
    
    // Set podium winner cards details
    const p1 = presentationWinners[0]; // 1st
    const p2 = presentationWinners[1]; // 2nd
    const p3 = presentationWinners[2]; // 3rd
    
    // Winner 1st
    document.getElementById('podium-1-name').textContent = p1.emp.name;
    document.getElementById('podium-1-dept').textContent = p1.emp.department;
    
    // Winner 2nd
    document.getElementById('podium-2-name').textContent = p2.emp.name;
    document.getElementById('podium-2-dept').textContent = p2.emp.department;
    
    // Winner 3rd
    document.getElementById('podium-3-name').textContent = p3.emp.name;
    document.getElementById('podium-3-dept').textContent = p3.emp.department;
    
    // Set podium stats dynamically
    const setPodiumStat = (id, p) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (currentWinningCriteria === 'health_score') {
        el.textContent = `คะแนนสุขภาพ: ${p.healthScore.toFixed(1)} คะแนน`;
      } else if (currentWinningCriteria === 'bodyage') {
        el.textContent = `ลดอายุร่างกายได้ -${Math.abs(p.bodyageDiff)} ปี`;
      } else if (currentWinningCriteria === 'weight') {
        el.textContent = `ลดน้ำหนักได้ -${Math.abs(p.weightLoss).toFixed(1)} kg`;
      } else if (currentWinningCriteria === 'bmi_closest') {
        el.textContent = `BMI: ${p.latestBmi.toFixed(2)} (ห่างเป้า ${p.distance.toFixed(2)})`;
      }
    };
    
    setPodiumStat('podium-1-stat', p1);
    setPodiumStat('podium-2-stat', p2);
    setPodiumStat('podium-3-stat', p3);
    
    // Trigger continuous confetti falling loop
    Confetti.continuousLoop = true;
    Confetti.spawn(100);
  }
}

function revealAwardCard() {
  if (cardRevealed) return;
  cardRevealed = true;
  
  // Stop drumroll and play triumphant fanfare sound
  AudioSynth.stopDrumroll();
  AudioSynth.playFanfare();
  
  // Flip Card 3D animation
  elements.presRevealCard.classList.add('flipped');
  
  // Burst confetti
  Confetti.spawn(120);
}

function handlePresentationNext() {
  if (currentPresentationStage === 4) {
    // Staging Podium slide, next finishes
    exitPresentation();
    return;
  }
  
  // If card reveal slide is active, and card hasn't been flipped yet, Next button reveals it
  if ((currentPresentationStage >= 1 && currentPresentationStage <= 3) && !cardRevealed) {
    revealAwardCard();
  } else {
    // Go to next stage
    goPresentationStage(currentPresentationStage + 1);
  }
}

function handlePresentationBack() {
  if (currentPresentationStage > 0) {
    goPresentationStage(currentPresentationStage - 1);
  }
}

// Compress image client side using Canvas
function compressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Remove photo helper
window.removePhoto = function(monthNum) {
  const fileInput = document.getElementById(`form-m${monthNum}-photo-input`);
  const dataInput = document.getElementById(`form-m${monthNum}-photo-data`);
  const previewDiv = document.getElementById(`form-m${monthNum}-photo-preview`);
  
  if (fileInput) fileInput.value = '';
  if (dataInput) dataInput.value = '';
  if (previewDiv) {
    previewDiv.style.display = 'none';
    previewDiv.querySelector('img').src = '';
  }
};

// Photo Gallery Modal triggers
window.openPhotoGallery = function(empId) {
  const emp = employees.find(e => e.id === empId);
  if (!emp) return;
  document.getElementById('photo-gallery-title').textContent = `รูปภาพเปรียบเทียบความคืบหน้า - ${emp.name}`;
  const renderCard = (monthKey, label, imgContainerId, metaId) => {
    const m = emp.months[monthKey];
    const container = document.getElementById(imgContainerId);
    const meta = document.getElementById(metaId);
    if (m && m.photo) {
      container.innerHTML = `<img src="${m.photo}" alt="${label}">`;
      meta.textContent = `${m.weight ? `${m.weight} kg` : '- kg'} | ${m.bmi ? `BMI: ${m.bmi}` : 'BMI: -'}`;
    } else {
      container.innerHTML = '<div class="image-placeholder">ไม่มีรูปถ่าย</div>';
      meta.textContent = '- kg | BMI: -';
    }
  };
  [
    ['m1', 'ครั้งที่ 1 (ค่าตั้งต้น)', 'gallery-m1-img-container', 'gallery-m1-meta'],
    ['m2', 'ครั้งที่ 2 (ติดตามผล)', 'gallery-m2-img-container', 'gallery-m2-meta'],
    ['m3', 'ครั้งที่ 3 (ติดตามผล)', 'gallery-m3-img-container', 'gallery-m3-meta'],
    ['m4', 'ครั้งที่ 4 (ผลลัพธ์สุดท้าย)', 'gallery-m4-img-container', 'gallery-m4-meta']
  ].forEach(args => renderCard(...args));
  document.getElementById('photo-gallery-modal').classList.add('active');
};

window.closePhotoGallery = function() {
  document.getElementById('photo-gallery-modal').classList.remove('active');
};

// --- View Switcher & PIN Verification Helpers ---
function switchToPersonalView() {
  currentView = 'personal';
  elements.adminView.style.display = 'none';
  elements.personalView.style.display = 'block';
  
  // Hide Admin actions in header
  elements.btnToggleView.textContent = '📊 แผงควบคุมระบบ (Admin)';
  elements.btnToggleView.className = 'btn btn-secondary';
  
  elements.btnExportCsv.style.display = 'none';
  elements.btnDownloadTemplate.style.display = 'none';
  elements.headerImportCsv.style.display = 'none';
  elements.btnAddEmployee.style.display = 'none';
  elements.btnPresentationMode.style.display = 'none';
  
  // Clear any inputs/states
  elements.personalSearchInput.value = '';
  elements.personalSuggestions.innerHTML = '';
  elements.personalSuggestions.style.display = 'none';
  elements.personalProfileDisplay.innerHTML = '';
  elements.personalProfileDisplay.style.display = 'none';

  const signedInEmployee = resolveSignedInEmployee(employees, wellbeingSession?.identity);
  if (signedInEmployee) {
    elements.personalSearchInput.value = signedInEmployee.name;
    showPersonalProfile(signedInEmployee.id);
  } else if (wellbeingSession?.identity && !wellbeingSession.identity.canEdit) {
    elements.personalProfileDisplay.innerHTML = '<div class="empty-state"><h3>Account not linked</h3><p>Please ask the Wellbeing administrator to link your Microsoft account to your employee record.</p></div>';
    elements.personalProfileDisplay.style.display = 'block';
  }
}

function openPinModal() {
  if (wellbeingSession?.identity?.canEdit) {
    switchToAdminView();
    return;
  }
  elements.pinDigits.forEach(input => input.value = '');
  elements.pinErrorMsg.style.display = 'none';
  elements.pinModal.classList.add('active');
  
  setTimeout(() => {
    if (elements.pin1) elements.pin1.focus();
  }, 100);
}

function closePinModal() {
  elements.pinModal.classList.remove('active');
}

function handlePinVerification() {
  elements.pinErrorMsg.style.display = 'none';
  window.PfigWellbeingAuth.beginSignIn({ prompt: 'select_account' }).catch(error => {
    elements.pinErrorMsg.textContent = error.message || 'Microsoft sign-in failed';
    elements.pinErrorMsg.style.display = 'block';
  });
}

// Legacy PIN implementation retained temporarily for migration reference; it is never called.
function handleLegacyPinVerification() {
  let pin = '';
  elements.pinDigits.forEach(input => pin += input.value);
  
  if (pin === ADMIN_PIN) {
    closePinModal();
    switchToAdminView();
    showToast('เข้าสู่ระบบผู้ดูแลสำเร็จ 🔓', 'success');
  } else {
    elements.pinErrorMsg.style.display = 'block';
    elements.pinDigits.forEach(input => input.value = '');
    if (elements.pin1) elements.pin1.focus();
    showToast('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่', 'error');
  }
}

function switchToAdminView() {
  if (!wellbeingSession?.identity?.canEdit) {
    openPinModal();
    return;
  }
  currentView = 'admin';
  elements.personalView.style.display = 'none';
  elements.adminView.style.display = 'block';
  
  // Restore Admin actions in header
  elements.btnToggleView.textContent = '👤 ข้อมูลส่วนตัวพนักงาน';
  elements.btnToggleView.className = 'btn btn-accent';
  
  elements.btnExportCsv.style.display = 'inline-flex';
  elements.btnDownloadTemplate.style.display = 'inline-flex';
  elements.headerImportCsv.style.display = 'inline-flex';
  elements.btnAddEmployee.style.display = 'inline-flex';
  elements.btnPresentationMode.style.display = 'inline-flex';
  
  updateUI();
}

// --- Dynamic Personal Profile Renderer ---
let currentProfileEmpId = null;

window.setProfileGender = async function(gender) {
  if (!currentProfileEmpId) return;
  if (!wellbeingSession?.identity?.canEdit) {
    showToast('Only a Wellbeing administrator can update employee data.', 'error');
    return;
  }
  
  const emp = employees.find(e => e.id === currentProfileEmpId);
  if (!emp) return;
  
  const currentSavedGender = emp.months ? emp.months.gender : null;
  if (currentSavedGender !== gender) {
    if (!emp.months) emp.months = {};
    emp.months.gender = gender;
    
    // Immediately show changes on screen
    showPersonalProfile(currentProfileEmpId, gender);
    
    // Save selection to Supabase database
    try {
      showLoader(true);
      await wellbeingApiRequest(`/api/employees?id=${encodeURIComponent(emp.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ months: emp.months })
      });
      const error = null;
      if (error) {
        console.error('Failed to save gender:', error);
        showToast('ไม่สามารถบันทึกเพศในฐานข้อมูลได้: ' + error.message, 'error');
      } else {
        showToast('บันทึกข้อมูลเพศลงฐานข้อมูลเรียบร้อยแล้ว', 'success');
      }
    } catch (err) {
      console.error('Error saving gender to DB:', err);
    } finally {
      showLoader(false);
    }
  } else {
    showPersonalProfile(currentProfileEmpId, gender);
  }
};

function showPersonalProfile(empId, selectedGender = null) {
  currentProfileEmpId = empId;
  const emp = employees.find(e => e.id === empId);
  if (!emp) return;

  // Use saved gender from DB by default, fallback to selectedGender parameter
  const gender = selectedGender || (emp.months ? emp.months.gender : null);

  // Show gender selection popup modal if not yet set in database
  if (!gender && !selectedGender && wellbeingSession?.identity?.canEdit) {
    let existingModal = document.getElementById('gender-selection-modal');
    if (!existingModal) {
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal-overlay active';
      modalOverlay.id = 'gender-selection-modal';
      modalOverlay.style.zIndex = '2000';
      modalOverlay.style.display = 'flex';
      modalOverlay.style.alignItems = 'center';
      modalOverlay.style.justifyContent = 'center';
      
      modalOverlay.innerHTML = `
        <div class="modal-content animate-scale" style="max-width: 380px; text-align: center; background: var(--bg-modal); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); padding: 2rem; border-radius: 16px;">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">⚧️</div>
          <h3 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main); font-family: 'Outfit', sans-serif;">ระบุเพศของคุณ</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5; font-family: 'Outfit', sans-serif;">เพื่อใช้เปรียบเทียบและประเมินผลลัพธ์มวลกล้ามเนื้อและปริมาณไขมันในร่างกายตามเกณฑ์มาตรฐานสุขภาพ</p>
          
          <div style="display: flex; gap: 0.85rem; justify-content: center;">
            <button onclick="saveSelectedGender('male')" class="btn" style="flex: 1; padding: 0.75rem; font-size: 0.9rem; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; background: var(--primary-glow); border: 1px solid var(--primary); color: var(--primary-light); border-radius: 10px; cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif;">
              <span style="font-size: 1.5rem;">👨</span>
              <span style="font-weight: 600;">ชาย (Men)</span>
            </button>
            <button onclick="saveSelectedGender('female')" class="btn" style="flex: 1; padding: 0.75rem; font-size: 0.9rem; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; background: var(--bg-pink-female-glow); border: 1px solid var(--pink-female); color: var(--pink-female); border-radius: 10px; cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif;">
              <span style="font-size: 1.5rem;">👩</span>
              <span style="font-weight: 600;">หญิง (Women)</span>
            </button>
          </div>
          
          <button onclick="cancelGenderSelection()" style="background: none; border: none; color: var(--text-muted); font-size: 0.75rem; margin-top: 1.25rem; cursor: pointer; text-decoration: underline; font-family: 'Outfit', sans-serif;">ข้ามไปก่อน (Skip)</button>
        </div>
      `;
      
      document.body.appendChild(modalOverlay);
      
      window.saveSelectedGender = async function(chosenGender) {
        modalOverlay.remove();
        await setProfileGender(chosenGender);
      };
      
      window.cancelGenderSelection = function() {
        modalOverlay.remove();
      };
    }
  }

  // Status evaluators
  const getBmiStatus = (bmiVal) => {
    const bmi = parseFloat(bmiVal);
    if (isNaN(bmi)) return { text: '', color: '' };
    if (bmi < 18.5) return { text: 'บางเกินไป', color: 'var(--warning)' };
    if (bmi <= 22.9) return { text: 'สมส่วน', color: 'var(--success)' };
    if (bmi <= 24.9) return { text: 'น้ำหนักเกิน', color: 'var(--warning)' };
    if (bmi <= 29.9) return { text: 'อ้วนระดับ 1', color: 'var(--danger)' };
    return { text: 'อ้วนระดับ 2', color: 'var(--danger)' };
  };

  const getFatStatus = (fatVal, gender) => {
    const fat = parseFloat(fatVal);
    if (isNaN(fat)) return { text: '', color: '' };
    if (gender === 'female') {
      if (fat < 14) return { text: 'ต่ำเกินไป', color: 'var(--warning)' };
      if (fat <= 20) return { text: 'ระดับนักกีฬา', color: 'var(--success)' };
      if (fat <= 24) return { text: 'หุ่นฟิต สมส่วน', color: 'var(--success)' };
      if (fat <= 31) return { text: 'สุขภาพดีมาตรฐาน', color: 'var(--success)' };
      return { text: 'สูงเกินเกณฑ์', color: 'var(--danger)' };
    } else {
      if (fat < 6) return { text: 'ต่ำเกินไป', color: 'var(--warning)' };
      if (fat <= 13) return { text: 'ระดับนักกีฬา', color: 'var(--success)' };
      if (fat <= 17) return { text: 'หุ่นฟิต สมส่วน', color: 'var(--success)' };
      if (fat <= 24) return { text: 'สุขภาพดีมาตรฐาน', color: 'var(--success)' };
      return { text: 'สูงเกินเกณฑ์', color: 'var(--danger)' };
    }
  };

  const getMuscleStatus = (muscleVal, gender) => {
    const muscle = parseFloat(muscleVal);
    if (isNaN(muscle)) return { text: '', color: '' };
    if (gender === 'female') {
      if (muscle < 27) return { text: 'กล้ามเนื้อต่ำ', color: 'var(--danger)' };
      if (muscle <= 35) return { text: 'มาตรฐานปกติ', color: 'var(--success)' };
      return { text: 'กล้ามเนื้อสูง/ฟิต', color: 'var(--secondary-light)' };
    } else {
      if (muscle < 33) return { text: 'กล้ามเนื้อต่ำ', color: 'var(--danger)' };
      if (muscle <= 40) return { text: 'มาตรฐานปกติ', color: 'var(--success)' };
      return { text: 'กล้ามเนื้อสูง/ฟิต', color: 'var(--secondary-light)' };
    }
  };

  // Determine personal evaluation round: if m4 complete use m4; else if m3 complete use m3; else currentEvaluationRound
  const personalRound = PfigHealthScore.hasCompleteMeasurement(emp, 'm4')
    ? 'm4'
    : (PfigHealthScore.hasCompleteMeasurement(emp, 'm3') ? 'm3' : currentEvaluationRound);

  const comp = getComparison(emp, personalRound);
  const m1 = emp.months.m1 || {};
  
  // Format statistics change panels
  const formatDiff = (diffVal, unit, isPositiveImprovement = false) => {
    if (!comp.hasProgress) return `<span style="color: var(--text-muted); font-size: 0.95rem; font-style: italic;">รอข้อมูลสรุป</span>`;
    
    // For Weight, BMI, Fat, Body Age: negative difference is improvement
    // For Muscle: positive difference is improvement
    const isImproved = isPositiveImprovement ? (diffVal > 0) : (diffVal < 0);
    const isWorsened = isPositiveImprovement ? (diffVal < 0) : (diffVal > 0);
    const sign = diffVal > 0 ? '+' : '';
    
    if (isImproved) {
      return `<span style="color: var(--success); font-weight: 700;">${sign}${diffVal} ${unit}</span>`;
    } else if (isWorsened) {
      return `<span style="color: var(--danger); font-weight: 700;">${sign}${diffVal} ${unit}</span>`;
    } else {
      return `<span style="color: var(--text-main); font-weight: 600;">คงที่</span>`;
    }
  };

  const weightChangeHtml = formatDiff(comp.weightDiff, 'kg', false);
  const bmiChangeHtml = formatDiff(comp.bmiDiff, '', false);
  const bodyageChangeHtml = formatDiff(comp.bodyageDiff, 'ปี', false);
  
  const muscleChangeHtml = (m1.muscle !== undefined && m1.muscle !== null && comp.hasProgress) ? formatDiff(comp.muscleDiff, '%', true) : `<span style="color: var(--text-muted); font-size: 0.95rem; font-style: italic;">รอข้อมูลสรุป</span>`;
  const fatChangeHtml = (m1.fat !== undefined && m1.fat !== null && comp.hasProgress) ? formatDiff(comp.fatDiff, '%', false) : `<span style="color: var(--text-muted); font-size: 0.95rem; font-style: italic;">รอข้อมูลสรุป</span>`;

  // Build Monthly Columns
  const renderMonthColumn = (m, label, badgeClass) => {
    if (!m || (m.weight === undefined && m.bodyage === undefined && !m.photo)) {
      return `
        <div class="personal-month-card">
          <div class="personal-month-card-header ${badgeClass}">
            <span>📅</span> ${label}
          </div>
          <div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; min-height: 150px; flex-direction: column;">
            <span style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.3;">📭</span>
            <span style="color: var(--text-muted); font-style: italic; font-size: 0.9rem;">ยังไม่มีการบันทึกข้อมูล</span>
          </div>
        </div>
      `;
    }
    
    const bmiVal = m.bmi ? m.bmi : (calcBMI(m.weight, emp.height) || null);
    let bmiHtml = '-';
    if (bmiVal) {
      const status = getBmiStatus(bmiVal);
      bmiHtml = `<span style="color: ${status.color}; font-weight: 700;">${bmiVal} <span style="font-size: 0.72rem; font-weight: 500; padding: 1px 5px; border-radius: 4px; background: var(--border-color); margin-left: 2px;">${status.text}</span></span>`;
    }
    
    let muscleHtml = '-';
    if (m.muscle !== undefined && m.muscle !== null) {
      if (gender) {
        const status = getMuscleStatus(m.muscle, gender);
        muscleHtml = `<span style="color: ${status.color}; font-weight: 700;">${m.muscle}% <span style="font-size: 0.72rem; font-weight: 500; padding: 1px 5px; border-radius: 4px; background: var(--border-color); margin-left: 2px;">${status.text}</span></span>`;
      } else {
        muscleHtml = `<span style="color: var(--text-muted); font-weight: 600;">${m.muscle}% <span style="font-size: 0.7rem; font-weight: normal; opacity: 0.6; margin-left: 2px;">(โปรดระบุเพศ)</span></span>`;
      }
    }
    
    let fatHtml = '-';
    if (m.fat !== undefined && m.fat !== null) {
      if (gender) {
        const status = getFatStatus(m.fat, gender);
        fatHtml = `<span style="color: ${status.color}; font-weight: 700;">${m.fat}% <span style="font-size: 0.72rem; font-weight: 500; padding: 1px 5px; border-radius: 4px; background: var(--border-color); margin-left: 2px;">${status.text}</span></span>`;
      } else {
        fatHtml = `<span style="color: var(--text-muted); font-weight: 600;">${m.fat}% <span style="font-size: 0.7rem; font-weight: normal; opacity: 0.6; margin-left: 2px;">(โปรดระบุเพศ)</span></span>`;
      }
    }
    
    const weightText = m.weight ? `${m.weight} kg` : '- kg';
    const bodyageText = m.bodyage ? `${m.bodyage} ปี` : '- ปี';
    
    const photoFrame = m.photo 
      ? `<div class="personal-photo-frame"><img src="${m.photo}" alt="${label}"></div>`
      : `<div class="personal-photo-frame"><div class="image-placeholder">ไม่มีรูปถ่ายความคืบหน้า</div></div>`;
      
    return `
      <div class="personal-month-card">
        <div class="personal-month-card-header ${badgeClass}">
          <span>📅</span> ${label}
        </div>
        <div class="personal-metrics-list">
          <div class="personal-metric-item">
            <span class="personal-metric-name">⚖️ น้ำหนัก</span>
            <span class="personal-metric-val" style="color: var(--text-main); font-weight: 700;">${weightText}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">🧠 อายุร่างกาย</span>
            <span class="personal-metric-val" style="color: var(--text-main); font-weight: 700;">${bodyageText}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">📊 ค่า BMI</span>
            <span class="personal-metric-val">${bmiHtml}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">💪 กล้ามเนื้อ</span>
            <span class="personal-metric-val">${muscleHtml}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">📉 ไขมัน</span>
            <span class="personal-metric-val">${fatHtml}</span>
          </div>
        </div>
        ${photoFrame}
      </div>
    `;
  };

  const monthColumns = [
    renderMonthColumn(emp.months.m1, 'ครั้งที่ 1 (ค่าตั้งต้น)', 'personal-month-badge-1'),
    renderMonthColumn(emp.months.m2, 'ครั้งที่ 2 (ติดตามผล)', 'personal-month-badge-2'),
    renderMonthColumn(emp.months.m3, 'ครั้งที่ 3 (ติดตามผล)', 'personal-month-badge-3'),
    renderMonthColumn(emp.months.m4, 'ครั้งที่ 4 (ผลลัพธ์สุดท้าย)', 'personal-month-badge-4')
  ];

  // 1. Calculate Ideal Weight Range and Target based on height
  const heightM = parseFloat(emp.height) / 100;
  const minWeight = parseFloat((18.5 * heightM * heightM).toFixed(1));
  const maxWeight = parseFloat((22.9 * heightM * heightM).toFixed(1));
  const targetWeight = parseFloat((21.0 * heightM * heightM).toFixed(1));

  // Determine current weight
  const latestWeight = comp.latestWeight || (m1 ? m1.weight : 0) || 0;

  // Visualizer scale boundaries: from minWeight - 5 to maxWeight + 5
  const leftLimit = parseFloat((minWeight - 5).toFixed(1));
  const rightLimit = parseFloat((maxWeight + 5).toFixed(1));
  const rangeWidth = rightLimit - leftLimit;

  // Calculate percentages for CSS placement
  const healthyStartPct = ((minWeight - leftLimit) / rangeWidth) * 100;
  const healthyEndPct = ((maxWeight - leftLimit) / rangeWidth) * 100;
  const healthyWidthPct = healthyEndPct - healthyStartPct;
  const targetPct = ((targetWeight - leftLimit) / rangeWidth) * 100;
  const currentPct = Math.min(100, Math.max(0, ((latestWeight - leftLimit) / rangeWidth) * 100));
  const currentPinEdgeClass = currentPct <= 15 ? 'is-edge-left' : currentPct >= 85 ? 'is-edge-right' : '';

  // 2. Calculate Personal 3D Health Score Breakdown
  const scoreData = calculateHealthScore(emp, personalRound);
  const totalScoreVal = scoreData.totalScore;
  const wContribution = scoreData.weightScore; // BMI score out of 20
  const mContribution = scoreData.muscleScore; // Muscle score out of 40
  const fContribution = scoreData.fatScore; // Fat score out of 40

  // Calculate progress bar percentages (capped at 100% and min 0%)
  const wBarPct = Math.min(100, Math.max(0, (wContribution / 20.0) * 100));
  const mBarPct = Math.min(100, Math.max(0, (mContribution / 40.0) * 100));
  const fBarPct = Math.min(100, Math.max(0, (fContribution / 40.0) * 100));

  // Determine starting BMI category and construct advice message
  let startBmiText = '-';
  let weightAdvice = '';
  if (m1 && m1.bmi) {
    if (m1.bmi < 18.5) {
      startBmiText = 'ต่ำกว่าเกณฑ์ (ผอม)';
      const neededGain = parseFloat((targetWeight - latestWeight).toFixed(1));
      if (neededGain > 0) {
        weightAdvice = `คุณเริ่มต้นท้าชิงด้วยสภาวะน้ำหนักต่ำกว่าเกณฑ์ เป้าหมายหลักคือการเพิ่มน้ำหนักตัวเพื่อสุขภาพ (Weight Gain) โดยควรเพิ่มน้ำหนักขึ้นอีกประมาณ <strong style="color: var(--primary-light);">${neededGain} kg</strong> เพื่อเข้าสู่จุดสมส่วนอุดมคติที่ <strong>${targetWeight} kg</strong>`;
      } else {
        weightAdvice = `ยินดีด้วย! ปัจจุบันคุณสามารถเพิ่มน้ำหนักขึ้นมาอยู่ในช่วงน้ำหนักสุขภาพดีที่สมส่วนเรียบร้อยแล้ว`;
      }
    } else if (m1.bmi >= 22.9) {
      startBmiText = 'เกินเกณฑ์ (น้ำหนักเกิน/อ้วน)';
      const neededLoss = parseFloat((latestWeight - targetWeight).toFixed(1));
      if (neededLoss > 0) {
        weightAdvice = `คุณเริ่มต้นท้าชิงด้วยสภาวะน้ำหนักเกิน/อ้วน เป้าหมายหลักคือการลดน้ำหนักตัวเพื่อสุขภาพ (Weight Loss) โดยควรลดน้ำหนักลงอีกประมาณ <strong style="color: #f87171;">${neededLoss} kg</strong> เพื่อเข้าสู่จุดสมส่วนอุดมคติที่ <strong>${targetWeight} kg</strong>`;
      } else {
        weightAdvice = `ยินดีด้วย! ปัจจุบันคุณสามารถลดน้ำหนักลงมาอยู่ในช่วงน้ำหนักสุขภาพดีที่สมส่วนเรียบร้อยแล้ว`;
      }
    } else {
      startBmiText = 'สมส่วน (น้ำหนักปกติ)';
      const diffFromTarget = parseFloat(Math.abs(latestWeight - targetWeight).toFixed(1));
      if (diffFromTarget <= 1.0) {
        weightAdvice = `น้ำหนักตัวของคุณอยู่ในเกณฑ์ดีเยี่ยมและใกล้เคียงจุดสมดุลอุดมคติแล้ว รักษาระดับน้ำหนักตัวนี้ไว้และมุ่งเน้นที่การเพิ่มมวลกล้ามเนื้อและลดไขมัน (Body Recomposition) เพื่อความฟิตระดับสูงสุด`;
      } else {
        weightAdvice = `น้ำหนักตัวของคุณอยู่ในเกณฑ์สมส่วนสุขภาพดี (ห่างจากเป้าหมายเบี่ยงเบนเล็กน้อย ±${diffFromTarget} kg) แนะนำให้มุ่งเน้นรักษาระดับน้ำหนักตัวนี้ ควบคู่กับการสร้างมวลกล้ามเนื้อและควบคุมปริมาณไขมัน`;
      }
    }
  }

  const signedInOid = String(wellbeingSession?.identity?.oid || '').toLowerCase();
  const employeeOid = String(emp.entra_oid || '').toLowerCase();
  const serverRank = signedInOid && signedInOid === employeeOid && emp.department !== 'Executive'
    ? wellbeingPersonalHealthRanking
    : null;
  const personalRankData = getPersonalRankBadgeData(emp.id, currentWinningCriteria, employees, serverRank, personalRound);
  const personalRankHtml = renderPersonalRankInlineBadge(personalRankData);

  // Generate Profile HTML
  elements.personalProfileDisplay.innerHTML = `
    <div class="personal-profile-card">
      <!-- Profile Info Header -->
      <div class="personal-profile-header">
        <div class="personal-profile-title-group">
          <div class="personal-avatar">👤</div>
          <div class="personal-name">
            <h3>${emp.name}</h3>
            <div class="personal-meta-info" style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.4rem;">
              <span class="personal-meta-badge personal-meta-badge-dept">🏢 แผนก: ${emp.department}</span>
              <span class="personal-meta-badge">🎂 อายุจริง: ${emp.age} ปี</span>
              <span class="personal-meta-badge">📏 ส่วนสูง: ${emp.height} ซม.</span>
              
              <!-- Inline Gender Selector -->
              <span class="personal-meta-badge" style="background: var(--bg-item); border: 1px solid var(--border-item); display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.2rem 0.6rem; border-radius: 20px;">
                ⚧️ ระบุเพศ:
                <button onclick="setProfileGender('male')" style="background: ${gender === 'male' ? 'var(--primary)' : 'var(--bg-btn-secondary)'}; border: 1px solid ${gender === 'male' ? 'var(--primary-light)' : 'var(--border-color)'}; color: ${gender === 'male' ? '#fff' : 'var(--text-muted)'}; padding: 1px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; font-weight: ${gender === 'male' ? '600' : 'normal'}; transition: all 0.2s; outline: none;">ชาย</button>
                <button onclick="setProfileGender('female')" style="background: ${gender === 'female' ? 'var(--pink-female)' : 'var(--bg-btn-secondary)'}; border: 1px solid ${gender === 'female' ? 'var(--pink-female)' : 'var(--border-color)'}; color: ${gender === 'female' ? '#fff' : 'var(--text-muted)'}; padding: 1px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; font-weight: ${gender === 'female' ? '600' : 'normal'}; transition: all 0.2s; outline: none;">หญิง</button>
              </span>
            </div>
          </div>
        </div>
        <div class="personal-profile-id">
          ID: ${emp.id.substring(0, 8)}...
        </div>
      </div>

      <!-- NEW: Premium Health Insights Dashboard Section -->
      <div class="personal-insights-container">
        <!-- Card 1: 3D Health Score Breakdown -->
        <div class="personal-insight-card">
          <div class="personal-insight-title">
            <div class="personal-insight-title-main">
              <span>🎯</span> คะแนนสุขภาพรวมของคุณ
            </div>
            ${personalRankHtml}
          </div>
          <div class="personal-score-layout">
            <div class="personal-score-radial-group">
              <div class="personal-score-circle">
                <span class="personal-score-circle-value">${totalScoreVal.toFixed(1)}</span>
                <span class="personal-score-circle-label">คะแนนรวม</span>
              </div>
            </div>
            <div class="personal-score-bars-list">
              <!-- Weight component -->
              <div class="personal-score-bar-row">
                <div class="personal-score-bar-header">
                  <span style="color: var(--text-main); font-weight: 500;">⚖️ คะแนนดัชนีมวลกาย BMI (20%)</span>
                  <span style="font-weight: 600; color: var(--accent-light);">${wContribution.toFixed(1)} / 20.00</span>
                </div>
                <div class="personal-score-bar-bg">
                  <div class="personal-score-bar-fill" style="width: ${wBarPct}%; background: var(--accent);"></div>
                </div>
              </div>
              <!-- Muscle component -->
              <div class="personal-score-bar-row">
                <div class="personal-score-bar-header">
                  <span style="color: var(--text-main); font-weight: 500;">💪 คะแนนมิติมวลกล้ามเนื้อ (40%)</span>
                  <span style="font-weight: 600; color: var(--primary-light);">${mContribution.toFixed(1)} / 40.00</span>
                </div>
                <div class="personal-score-bar-bg">
                  <div class="personal-score-bar-fill" style="width: ${mBarPct}%; background: var(--primary);"></div>
                </div>
              </div>
              <!-- Fat component -->
              <div class="personal-score-bar-row">
                <div class="personal-score-bar-header">
                  <span style="color: var(--text-main); font-weight: 500;">📉 คะแนนมิติอัตราไขมันสะสม (40%)</span>
                  <span style="font-weight: 600; color: #f87171;">${fContribution.toFixed(1)} / 40.00</span>
                </div>
                <div class="personal-score-bar-bg">
                  <div class="personal-score-bar-fill" style="width: ${fBarPct}%; background: #f87171;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Healthy Weight Target visualizer -->
        <div class="personal-insight-card">
          <div class="personal-insight-title">
            <span>⚖️</span> ขอบเขตน้ำหนักที่เหมาะสมสำหรับคุณ
          </div>
          <div class="weight-range-visualizer">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
              <span>น้ำหนักเหมาะสม (BMI 18.5 - 22.9): <strong>${minWeight} - ${maxWeight} kg</strong></span>
            </div>
            
            <!-- Range visualization slider bar -->
            <div class="weight-range-bar-wrapper">
              <div class="weight-range-bar"></div>
              <div class="weight-range-fill" style="left: ${healthyStartPct}%; width: ${healthyWidthPct}%;"></div>
              <div class="weight-range-target-marker" style="left: ${targetPct}%;"></div>
              <div class="weight-range-pin ${currentPinEdgeClass}" style="left: ${currentPct}%;"></div>
              
              <!-- Scale Labels -->
              <div class="weight-range-scale-label" style="left: 0%;">${leftLimit}</div>
              <div class="weight-range-scale-label" style="left: ${healthyStartPct}%; color: var(--success); font-weight: 600;">${minWeight}</div>
              <div class="weight-range-scale-label" style="left: ${healthyEndPct}%; color: var(--success); font-weight: 600;">${maxWeight}</div>
              <div class="weight-range-scale-label" style="left: 100%; text-align: right; transform: translateX(-100%);">${rightLimit}</div>
            </div>

            <!-- Personalized Health Advice -->
            <div style="background: var(--bg-item); border: 1px solid var(--border-item); border-radius: 8px; padding: 0.75rem; font-size: 0.78rem; line-height: 1.45; color: var(--text-muted);">
              <strong>💡 คำแนะนำ:</strong> ${weightAdvice}
            </div>
          </div>
        </div>
      </div>

      <!-- Comparative stats grid: final round 4 vs baseline round 1 -->
      <h4 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
        <span>🏆</span> สรุปความเปลี่ยนแปลงทั้งหมด (ค่าตั้งต้น ➔ ผลลัพธ์สุดท้าย)
      </h4>
      <div class="personal-stats-grid">
        <!-- Stat 1: Weight change -->
        <div class="personal-stat-card">
          <div class="personal-stat-icon" style="background: var(--primary-glow); color: var(--primary-light);">⚖️</div>
          <div class="personal-stat-details">
            <span class="personal-stat-label">น้ำหนักเปลี่ยนแปลง</span>
            <span class="personal-stat-value">${weightChangeHtml}</span>
          </div>
        </div>
        
        <!-- Stat 2: Body Age change -->
        <div class="personal-stat-card">
          <div class="personal-stat-icon" style="background: var(--secondary-glow); color: var(--secondary-light);">🧠</div>
          <div class="personal-stat-details">
            <span class="personal-stat-label">อายุร่างกายเปลี่ยนแปลง</span>
            <span class="personal-stat-value">${bodyageChangeHtml}</span>
          </div>
        </div>
        
        <!-- Stat 3: BMI change -->
        <div class="personal-stat-card">
          <div class="personal-stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">📊</div>
          <div class="personal-stat-details">
            <span class="personal-stat-label">ดัชนีมวลกาย (BMI)</span>
            <span class="personal-stat-value">${bmiChangeHtml}</span>
          </div>
        </div>
        
        <!-- Stat 4: Muscle change -->
        <div class="personal-stat-card">
          <div class="personal-stat-icon" style="background: var(--primary-glow); color: var(--primary);">💪</div>
          <div class="personal-stat-details">
            <span class="personal-stat-label">มวลกล้ามเนื้อ</span>
            <span class="personal-stat-value">${muscleChangeHtml}</span>
          </div>
        </div>

        <!-- Stat 5: Fat change -->
        <div class="personal-stat-card">
          <div class="personal-stat-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--danger);">📉</div>
          <div class="personal-stat-details">
            <span class="personal-stat-label">อัตราไขมัน</span>
            <span class="personal-stat-value">${fatChangeHtml}</span>
          </div>
        </div>
      </div>

      <!-- Four measurement rounds details -->
      <h4 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
        <span>📈</span> รายละเอียดการวัดทั้ง 4 รอบ
      </h4>
      <div class="personal-months-grid">
        ${monthColumns.join('')}
      </div>
      <!-- Health Reference Standards Guide -->
      <div class="personal-reference-guide animate-fade" style="margin-top: 2.5rem; border-top: 1px solid var(--border-color); padding-top: 2rem;">
        <h4 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
          <span>📋</span> ตารางเกณฑ์ค่ามาตรฐานสุขภาพสำหรับเปรียบเทียบแนวทาง
        </h4>
        <div class="reference-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 1.5rem;">
          <!-- BMI Card -->
          <div class="reference-card" style="background: var(--bg-item); border: 1px solid var(--border-item); border-radius: 12px; padding: 1.25rem;">
            <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--secondary-light); display: flex; align-items: center; gap: 0.4rem;">
              <span>📊</span> ดัชนีมวลกาย (BMI) - เกณฑ์เอเชีย
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.4rem; color: var(--text-muted); font-weight: 600; gap: 0.5rem;">
                <span style="flex: 1.2; min-width: 80px;">ช่วงค่า BMI</span>
                <span style="flex: 2;">ความหมาย</span>
                <span style="flex: 1.5; text-align: right;">สถานะ</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px dashed var(--border-color); gap: 0.5rem; align-items: center;">
                <span style="flex: 1.2; min-width: 80px;">น้อยกว่า 18.5</span>
                <span style="flex: 2; color: var(--text-muted);">น้ำหนักน้อยกว่าเกณฑ์ / ผอม</span>
                <span style="flex: 1.5; text-align: right; color: var(--warning);">บางเกินไป</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 0.3rem 0.4rem; border-bottom: 1px dashed var(--border-color); gap: 0.5rem; align-items: center; background: rgba(16, 185, 129, 0.05); margin: 0 -0.4rem; border-radius: 6px;">
                <span style="flex: 1.2; min-width: 80px; font-weight: 600; color: var(--primary-light);">18.5 - 22.9</span>
                <span style="flex: 2; font-weight: 600; color: var(--primary-light);">สมส่วน / น้ำหนักปกติ</span>
                <span style="flex: 1.5; text-align: right; color: var(--success); font-weight: 600;">สุขภาพดี 🌱</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px dashed var(--border-color); gap: 0.5rem; align-items: center;">
                <span style="flex: 1.2; min-width: 80px;">23.0 - 24.9</span>
                <span style="flex: 2; color: var(--text-muted);">น้ำหนักเกินเกณฑ์มาตรฐาน</span>
                <span style="flex: 1.5; text-align: right; color: var(--warning);">น้ำหนักเกิน / เริ่มท้วม</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px dashed var(--border-color); gap: 0.5rem; align-items: center;">
                <span style="flex: 1.2; min-width: 80px;">25.0 - 29.9</span>
                <span style="flex: 2; color: var(--text-muted);">โรคอ้วน ระดับ 1</span>
                <span style="flex: 1.5; text-align: right; color: var(--danger);">อ้วนระดับ 1</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 0.3rem 0; gap: 0.5rem; align-items: center;">
                <span style="flex: 1.2; min-width: 80px;">30.0 ขึ้นไป</span>
                <span style="flex: 2; color: var(--text-muted);">โรคอ้วน ระดับ 2</span>
                <span style="flex: 1.5; text-align: right; color: var(--danger); font-weight: 600;">อ้วนระดับ 2 ⚠️</span>
              </div>
            </div>
          </div>
 
          <!-- Body Fat Card -->
          <div class="reference-card" style="background: var(--bg-item); border: 1px solid var(--border-item); border-radius: 12px; padding: 1.25rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem;">
                  <li><span style="color: var(--text-main);">6 - 13%:</span> ระดับนักกีฬา</li>
                  <li><span style="color: var(--text-main);">14 - 17%:</span> หุ่นฟิต สมส่วน</li>
                  <li style="color: var(--primary-light); font-weight: 600;"><span style="color: var(--primary-light);">18 - 24%:</span> สุขภาพดีมาตรฐาน</li>
                  <li><span style="color: var(--danger); font-weight: 600;">&ge; 25%:</span> สูงเกินเกณฑ์ (อ้วน)</li>
                </ul>
              </div>
              <div>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--pink-female); border-bottom: 1px solid var(--border-color); padding-bottom: 0.2rem; margin-bottom: 0.4rem;">ผู้หญิง (Women)</div>
                <ul style="list-style: none; font-size: 0.75rem; line-height: 1.6; color: var(--text-muted); padding: 0; margin: 0;">
                  <li><span style="color: var(--text-main);">14 - 20%:</span> ระดับนักกีฬา</li>
                  <li><span style="color: var(--text-main);">21 - 24%:</span> หุ่นฟิต สมส่วน</li>
                  <li style="color: var(--primary-light); font-weight: 600;"><span style="color: var(--primary-light);">25 - 31%:</span> สุขภาพดีมาตรฐาน</li>
            </div>
          </div>
 
          <!-- Muscle Card -->
          <div class="reference-card" style="background: var(--bg-item); border: 1px solid var(--border-item); border-radius: 12px; padding: 1.25rem;">
            <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.75rem; color: var(--primary-light); display: flex; align-items: center; gap: 0.4rem;">
              <span>💪</span> มวลกล้ามเนื้อในร่างกาย (Muscle %)
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--secondary-light); border-bottom: 1px solid var(--border-color); padding-bottom: 0.2rem; margin-bottom: 0.4rem;">ผู้ชาย (Men)</div>
                <ul style="list-style: none; font-size: 0.75rem; line-height: 1.6; color: var(--text-muted); padding: 0; margin: 0;">
                  <li><span style="color: var(--danger); font-weight: 600;">&lt; 33%:</span> มวลกล้ามเนื้อต่ำ</li>
                  <li style="color: var(--primary-light); font-weight: 600;"><span style="color: var(--primary-light);">33 - 40%:</span> มาตรฐานปกติ</li>
                  <li><span style="color: var(--secondary-light); font-weight: 600;">&gt; 40%:</span> มวลกล้ามเนื้อสูง/ฟิต</li>
                </ul>
              </div>
              <div>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--pink-female); border-bottom: 1px solid var(--border-color); padding-bottom: 0.2rem; margin-bottom: 0.4rem;">ผู้หญิง (Women)</div>
                <ul style="list-style: none; font-size: 0.75rem; line-height: 1.6; color: var(--text-muted); padding: 0; margin: 0;">
                  <li><span style="color: var(--danger); font-weight: 600;">&lt; 27%:</span> มวลกล้ามเนื้อต่ำ</li>
                  <li style="color: var(--primary-light); font-weight: 600;"><span style="color: var(--primary-light);">27 - 35%:</span> มาตรฐานปกติ</li>
                  <li><span style="color: var(--secondary-light); font-weight: 600;">&gt; 35%:</span> มวลกล้ามเนื้อสูง/ฟิต</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  elements.personalProfileDisplay.style.display = 'block';
}

// 3D Health Score Calculator calculation engine
function runCalculatorCalculation() {
  if (!elements.calcHeight || !elements.calcM1Weight || !elements.calcLatestWeight) return;

  const gender = elements.calcGender ? elements.calcGender.value : 'male';
  const height = parseFloat(elements.calcHeight.value) || 0;
  const m1Weight = parseFloat(elements.calcM1Weight.value) || 0;
  const m1Muscle = parseFloat(elements.calcM1Muscle.value) || 0;
  const m1Fat = parseFloat(elements.calcM1Fat.value) || 0;
  const latestWeight = parseFloat(elements.calcLatestWeight.value) || 0;
  const latestMuscle = parseFloat(elements.calcLatestMuscle.value) || 0;
  const latestFat = parseFloat(elements.calcLatestFat.value) || 0;

  if (height <= 0 || m1Weight <= 0 || latestWeight <= 0) {
    if (elements.calcTotalScore) elements.calcTotalScore.textContent = '0.00';
    if (elements.calcStartBmi) elements.calcStartBmi.textContent = '0.00';
    if (elements.calcStartCategory) elements.calcStartCategory.textContent = '-';
    if (elements.calcLatestBmi) elements.calcLatestBmi.textContent = '0.00';
    
    if (elements.calcWeightScoreText) elements.calcWeightScoreText.textContent = '0.00 / 20.00 คะแนน';
    if (elements.calcWeightBar) elements.calcWeightBar.style.width = '0%';
    if (elements.calcMuscleScoreText) elements.calcMuscleScoreText.textContent = '0.00 / 40.00 คะแนน';
    if (elements.calcMuscleBar) elements.calcMuscleBar.style.width = '0%';
    if (elements.calcFatScoreText) elements.calcFatScoreText.textContent = '0.00 / 40.00 คะแนน';
    if (elements.calcFatBar) elements.calcFatBar.style.width = '0%';
    
    if (elements.calcExplanationText) {
      elements.calcExplanationText.innerHTML = 'กรุณากรอกข้อมูลส่วนสูงและน้ำหนักให้ครบถ้วนเพื่อคำนวณ...';
    }
    return;
  }

  // 1. BMI Calculations
  const heightM = height / 100;
  const m1Bmi = parseFloat((m1Weight / (heightM * heightM)).toFixed(2));
  const latestBmi = parseFloat((latestWeight / (heightM * heightM)).toFixed(2));

  if (elements.calcStartBmi) elements.calcStartBmi.textContent = m1Bmi.toFixed(2);
  if (elements.calcLatestBmi) elements.calcLatestBmi.textContent = latestBmi.toFixed(2);

  // Determine Category
  let category = '';
  if (m1Bmi < 18.5) {
    category = 'ต่ำกว่าเกณฑ์ (ผอม)';
  } else if (m1Bmi >= 22.9) {
    category = 'เกินเกณฑ์ (น้ำหนักเกิน/อ้วน)';
  } else {
    category = 'สมส่วน (น้ำหนักปกติ)';
  }
  if (elements.calcStartCategory) elements.calcStartCategory.textContent = category;

  // 2. BMI Score (20 points)
  let bmiScore = 0;
  let bmiExplanation = '';
  const isStartBmiStandard = (m1Bmi >= 18.5 && m1Bmi <= 22.9);
  
  if (isStartBmiStandard) {
    if (latestBmi >= 18.5 && latestBmi <= 22.9) {
      bmiScore = 20;
    } else {
      bmiScore = 0;
    }
    bmiExplanation = `
      <div class="calc-math-step">
        <strong>1) คะแนนมิติ BMI (เต็ม 20 คะแนน):</strong><br>
        สภาวะเริ่มต้นคือ <strong>"สมส่วน (น้ำหนักปกติ)"</strong> (BMI 18.5 - 22.9)<br>
        กติกา: รักษาระดับให้อยู่ในเกณฑ์มาตรฐานได้ในผลลัพธ์สุดท้าย รับ 20 คะแนนเต็ม<br>
        BMI ผลลัพธ์สุดท้ายของคุณคือ: <span class="calc-formula-inline">${latestBmi.toFixed(2)}</span> (ตกเกณฑ์มาตรฐานหรือไม่: ${latestBmi >= 18.5 && latestBmi <= 22.9 ? 'อยู่ในเกณฑ์ปกติ' : 'หลุดเกณฑ์ปกติ'})<br>
        คะแนน BMI ที่ได้: <strong>${bmiScore.toFixed(2)} / 20.00 คะแนน</strong>
      </div>
    `;
  } else {
    const startDistance = Math.abs(m1Bmi - 21.0);
    const latestDistance = Math.abs(latestBmi - 21.0);
    let explanationText = '';
    
    if (latestBmi >= 18.5 && latestBmi <= 22.9) {
      bmiScore = 20;
      explanationText = `ขยับเข้าสู่เกณฑ์มาตรฐานสำเร็จ (BMI 18.5 - 22.9) ได้รับ 20 คะแนนเต็ม`;
    } else if (latestDistance < startDistance) {
      const progressRatio = (startDistance - latestDistance) / startDistance;
      bmiScore = parseFloat((10 + (10 * progressRatio)).toFixed(2));
      explanationText = `ขยับเข้าใกล้ค่ามาตรฐาน 21.0 มากขึ้น (ระยะห่างเริ่มต้น ${startDistance.toFixed(2)} -> ล่าสุด ${latestDistance.toFixed(2)}) คิดเป็นพัฒนาการ ${(progressRatio * 100).toFixed(1)}% ได้คะแนนตามสัดส่วน 10 + (10 × ${progressRatio.toFixed(3)})`;
    } else {
      bmiScore = 0;
      explanationText = `ไม่ขยับเข้าใกล้ค่ามาตรฐาน 21.0 (หรือออกห่างไปมากกว่าเดิม)`;
    }
    
    bmiExplanation = `
      <div class="calc-math-step">
        <strong>1) คะแนนมิติ BMI (เต็ม 20 คะแนน):</strong><br>
        สภาวะเริ่มต้นคือ <strong>"${category}"</strong> (BMI ${m1Bmi.toFixed(2)})<br>
        กติกา: เป้าหมายคือการปรับค่าเข้าใกล้ค่าอุดมคติ 21.0<br>
        ผลลัพธ์: ${explanationText}<br>
        คะแนน BMI ที่ได้: <strong>${bmiScore.toFixed(2)} / 20.00 คะแนน</strong>
      </div>
    `;
  }

  // 3. Muscle Score (40 points)
  let muscleScore = 0;
  const muscleIncreasePct = parseFloat((latestMuscle - m1Muscle).toFixed(1));
  
  const isStartMuscleExcellent = (gender === 'female')
    ? (m1Muscle >= 27)
    : (m1Muscle >= 33);
  
  let muscleExplanation = '';
  if (isStartMuscleExcellent) {
    if (muscleIncreasePct >= 0) {
      muscleScore = 40;
    } else {
      muscleScore = 0;
    }
    muscleExplanation = `
      <div class="calc-math-step">
        <strong>2) คะแนนมิติมวลกล้ามเนื้อ (เต็ม 40 คะแนน):</strong><br>
        เพศ: <strong>${gender === 'female' ? 'หญิง' : 'ชาย'}</strong>, มวลกล้ามเนื้อเริ่มต้น: <strong>${m1Muscle}%</strong> (อยู่ในเกณฑ์ดี/ปกติ >= ${gender === 'female' ? '27%' : '33%'})<br>
        มวลกล้ามเนื้อล่าสุด: <strong>${latestMuscle}%</strong><br>
        สภาวะกล้ามเนื้อเปลี่ยนไป: <strong>${muscleIncreasePct >= 0 ? '+' : ''}${muscleIncreasePct.toFixed(1)}%</strong> (กติกา: รักษาไม่ให้กล้ามเนื้อลดลง รับ 40 คะแนนเต็ม)<br>
        คะแนนกล้ามเนื้อที่ได้: <strong>${muscleScore.toFixed(2)} / 40.00 คะแนน</strong>
      </div>
    `;
  } else {
    if (muscleIncreasePct > 0) {
      muscleScore = Math.min(40, Math.floor(muscleIncreasePct / 0.2) * 5);
    } else {
      muscleScore = 0;
    }
    muscleExplanation = `
      <div class="calc-math-step">
        <strong>2) คะแนนมิติมวลกล้ามเนื้อ (เต็ม 40 คะแนน):</strong><br>
        เพศ: <strong>${gender === 'female' ? 'หญิง' : 'ชาย'}</strong>, มวลกล้ามเนื้อเริ่มต้น: <strong>${m1Muscle}%</strong> (กล้ามเนื้อต่ำกว่าเกณฑ์ปกติ)<br>
        มวลกล้ามเนื้อล่าสุด: <strong>${latestMuscle}%</strong><br>
        สภาวะกล้ามเนื้อเพิ่มขึ้น: <strong>${muscleIncreasePct.toFixed(1)}%</strong> (กติกา: เพิ่มขึ้นทุกๆ 0.2% ได้ 5 คะแนน)<br>
        คะแนนกล้ามเนื้อที่ได้: <strong>${muscleScore.toFixed(2)} / 40.00 คะแนน</strong>
      </div>
    `;
  }

  // 4. Fat Score (40 points)
  let fatScore = 0;
  const fatDecrease = parseFloat((m1Fat - latestFat).toFixed(1));
  const isStartFatStandard = (gender === 'female')
    ? (m1Fat >= 14 && m1Fat <= 31)
    : (m1Fat >= 6 && m1Fat <= 24);
    
  let fatExplanation = '';
  if (isStartFatStandard) {
    if (fatDecrease >= -0.5) {
      fatScore = 40;
    } else {
      fatScore = 0;
    }
    fatExplanation = `
      <div class="calc-math-step">
        <strong>3) คะแนนมิติอัตราไขมันสะสม (เต็ม 40 คะแนน):</strong><br>
        เพศ: <strong>${gender === 'female' ? 'หญิง' : 'ชาย'}</strong>, ไขมันเริ่มต้น: <strong>${m1Fat}%</strong> (อยู่ในเกณฑ์มาตรฐาน: หญิง 14-31% / ชาย 6-24%)<br>
        ไขมันเปลี่ยนไปล่าสุด: <strong>${latestFat}%</strong> (ลดลง ${fatDecrease.toFixed(1)}%)<br>
        กติกา: รักษาให้คงที่ (บวก/ลบไม่เกิน 0.5% หรือไขมันลดลง/ไม่เพิ่มขึ้นเกิน 0.5%) รับ 40 คะแนนเต็ม<br>
        คะแนนไขมันที่ได้: <strong>${fatScore.toFixed(2)} / 40.00 คะแนน</strong>
      </div>
    `;
  } else {
    if (fatDecrease > 0) {
      fatScore = Math.min(40, Math.floor(fatDecrease / 0.5) * 5);
    } else {
      fatScore = 0;
    }
    fatExplanation = `
      <div class="calc-math-step">
        <strong>3) คะแนนมิติอัตราไขมันสะสม (เต็ม 40 คะแนน):</strong><br>
        เพศ: <strong>${gender === 'female' ? 'หญิง' : 'ชาย'}</strong>, ไขมันเริ่มต้น: <strong>${m1Fat}%</strong> (ไขมันสูงกว่าเกณฑ์ปกติ)<br>
        ไขมันสะสมลดลงได้: <strong>${fatDecrease.toFixed(1)}%</strong> (กติกา: ลดลงทุกๆ 0.5% ได้ 5 คะแนน)<br>
        คะแนนไขมันที่ได้: <strong>${fatScore.toFixed(2)} / 40.00 คะแนน</strong>
      </div>
    `;
  }

  // 5. Total Score
  const totalScore = bmiScore + muscleScore + fatScore;

  // Render elements
  if (elements.calcTotalScore) {
    elements.calcTotalScore.textContent = totalScore.toFixed(2);
    
    // Change score circle colors based on score range
    if (totalScore >= 70) {
      elements.calcTotalScore.parentElement.style.borderColor = 'var(--success)';
      elements.calcTotalScore.parentElement.style.background = 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%)';
    } else if (totalScore >= 40) {
      elements.calcTotalScore.parentElement.style.borderColor = 'var(--warning)';
      elements.calcTotalScore.parentElement.style.background = 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)';
    } else {
      elements.calcTotalScore.parentElement.style.borderColor = 'var(--danger)';
      elements.calcTotalScore.parentElement.style.background = 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 100%)';
    }
  }
  
  if (elements.calcWeightScoreText) {
    elements.calcWeightScoreText.textContent = `${bmiScore.toFixed(2)} / 20.00 คะแนน`;
  }
  if (elements.calcWeightBar) {
    const weightBarPct = Math.min(100, Math.max(0, (bmiScore / 20.0) * 100));
    elements.calcWeightBar.style.width = `${weightBarPct}%`;
  }
  
  if (elements.calcMuscleScoreText) {
    elements.calcMuscleScoreText.textContent = `${muscleScore.toFixed(2)} / 40.00 คะแนน`;
  }
  if (elements.calcMuscleBar) {
    const muscleBarPct = Math.min(100, Math.max(0, (muscleScore / 40.0) * 100));
    elements.calcMuscleBar.style.width = `${muscleBarPct}%`;
  }
  
  if (elements.calcFatScoreText) {
    elements.calcFatScoreText.textContent = `${fatScore.toFixed(2)} / 40.00 คะแนน`;
  }
  if (elements.calcFatBar) {
    const fatBarPct = Math.min(100, Math.max(0, (fatScore / 40.0) * 100));
    elements.calcFatBar.style.width = `${fatBarPct}%`;
  }

  // Summary Math Explanation
  if (elements.calcExplanationText) {
    elements.calcExplanationText.innerHTML = `
      <div class="calc-explanation-title">📝 แสดงวิธีการคำนวณทีละขั้นตอน (100 คะแนนเต็ม)</div>
      <div class="calc-math-step">
        <strong>การวิเคราะห์ดัชนีมวลกายเริ่มต้น (BMI Step):</strong><br>
        สูตรคำนวณ: <span class="calc-formula-inline">น้ำหนักตัว (kg) / (ส่วนสูง (m))&sup2;</span><br>
        แทนค่า BMI เริ่มต้น: <span class="calc-formula-inline">${m1Weight} kg / (${heightM.toFixed(2)} m)&sup2; = ${m1Bmi.toFixed(2)}</span><br>
        ผลลัพธ์: ตกอยู่ในเกณฑ์ <strong>&ldquo;${category}&rdquo;</strong> (นำมาใช้เลือกสูตรคำนวณคะแนนในส่วนถัดไป)
      </div>
      ${bmiExplanation}
      ${muscleExplanation}
      ${fatExplanation}
      <div class="calc-math-step" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
        <strong>4) คะแนนสุขภาพรวม (Total Body Score):</strong><br>
        คำนวณจากผลรวมของทั้ง 3 มิติ (BMI 20 + กล้ามเนื้อ 40 + ไขมัน 40)<br>
        สูตรการคำนวณ: <span class="calc-formula-inline">คะแนน BMI + คะแนนกล้ามเนื้อ + คะแนนไขมัน</span><br>
        แทนค่า: <span class="calc-formula-inline">${bmiScore.toFixed(2)} + ${muscleScore.toFixed(2)} + ${fatScore.toFixed(2)} = ${totalScore.toFixed(2)} คะแนน</span><br>
        คะแนนสรุปทั้งหมดของคุณคือ: <strong style="font-size: 1.1rem; color: var(--primary-light);">${totalScore.toFixed(2)} / 100.00 คะแนน</strong>
      </div>
    `;
  }
}


