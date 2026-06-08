// State Management
let employees = [];
let currentFilterDept = '';
let currentFilterProgress = 'all';
let currentSearchQuery = '';
let currentSortField = 'name';
let currentSortOrder = 'asc'; // 'asc' or 'desc'
let currentPage = 1;
let pageSize = 10; // 'all' means show all

// Form state variables
let modalMode = 'add'; // 'add' or 'edit'

// Presentation state variables
let soundEnabled = true;
let currentPresentationStage = 0; // 0 = Intro, 1 = 3rd, 2 = 2nd, 3 = 1st, 4 = Podium
let presentationWinners = []; // Will hold top 3 winners
let cardRevealed = false; // Whether the current slide card is revealed

// Personal Lookup and PIN Verification State
let currentView = 'personal'; // 'admin' or 'personal'
const ADMIN_PIN = '1504';

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
  summaryBodyagePercent: document.getElementById('summary-bodyage-percent'),
  summaryWeightPercent: document.getElementById('summary-weight-percent'),
  summaryBmiPercent: document.getElementById('summary-bmi-percent'),
  barBodyage: document.getElementById('bar-bodyage'),
  barWeight: document.getElementById('bar-weight'),
  barBmi: document.getElementById('bar-bmi'),

  // Filters & Controls
  searchBox: document.getElementById('search-box'),
  filterDept: document.getElementById('filter-department'),
  filterProgress: document.getElementById('filter-progress'),
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
  pin1: document.getElementById('pin-1')
};



// Supabase Configuration
const SUPABASE_URL = 'https://qbexpencecrkpsqxiwbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZXhwZW5jZWNya3BzcXhpd2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjczMDMsImV4cCI6MjA5NjQ0MzMwM30.AZidMwQN-szC2BgrciaSwOhEp-sz9M18kiAbxBDmAbo';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  setupEventListeners();
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
  if (employees.length === 0) {
    showToast('ยินดีต้อนรับสู่ระบบ PFIG Well Being! เริ่มบันทึกข้อมูลพนักงานใหม่ได้ทันที', 'info', 5000);
  }
});

// Load data from Supabase
async function loadData() {
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
function setupRealtimeListener() {
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

// Helper: Get comparison stats for an employee
function getComparison(emp) {
  const m1 = emp.months.m1;
  const m2 = emp.months.m2;
  const m3 = emp.months.m3;
  
  // Determine latest available month
  let latest = null;
  let label = '-';
  
  if (m3 && m3.weight && m3.bodyage) {
    latest = m3;
    label = 'เดือน 3';
  } else if (m2 && m2.weight && m2.bodyage) {
    latest = m2;
    label = 'เดือน 2';
  }
  
  if (!latest || !m1) {
    return {
      weightDiff: 0,
      bmiDiff: 0,
      bodyageDiff: 0,
      muscleDiff: 0,
      fatDiff: 0,
      hasProgress: false,
      latestLabel: '-'
    };
  }
  
  const muscleDiff = (latest.muscle !== undefined && latest.muscle !== null && m1.muscle !== undefined && m1.muscle !== null)
    ? parseFloat((latest.muscle - m1.muscle).toFixed(1))
    : 0;
    
  const fatDiff = (latest.fat !== undefined && latest.fat !== null && m1.fat !== undefined && m1.fat !== null)
    ? parseFloat((latest.fat - m1.fat).toFixed(1))
    : 0;
  
  return {
    weightDiff: parseFloat((latest.weight - m1.weight).toFixed(1)),
    bmiDiff: parseFloat((latest.bmi - m1.bmi).toFixed(2)),
    bodyageDiff: parseInt(latest.bodyage - m1.bodyage),
    muscleDiff,
    fatDiff,
    hasProgress: true,
    latestLabel: label
  };
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

  // Close gallery listeners
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
  
  // Filter by text search (name / department)
  if (currentSearchQuery) {
    list = list.filter(emp => 
      emp.name.toLowerCase().includes(currentSearchQuery) || 
      emp.department.toLowerCase().includes(currentSearchQuery)
    );
  }
  
  // Filter by Department select dropdown
  if (currentFilterDept) {
    list = list.filter(emp => emp.department === currentFilterDept);
  }
  
  // Filter by Progress status
  if (currentFilterProgress === 'has-records') {
    // Has records for all 3 months
    list = list.filter(emp => emp.months.m1 && emp.months.m2 && emp.months.m3);
  } else if (currentFilterProgress === 'missing-records') {
    // Missing either month 2 or month 3
    list = list.filter(emp => !emp.months.m2 || !emp.months.m3);
  } else if (currentFilterProgress === 'bodyage-reduced') {
    // Body age decreased
    list = list.filter(emp => {
      const comp = getComparison(emp);
      return comp.hasProgress && comp.bodyageDiff < 0;
    });
  }
  
  // Sorting logic
  list.sort((a, b) => {
    let valA, valB;
    
    if (currentSortField === 'name') {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
      if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
      return 0;
    } else {
      // Comparison metrics
      const compA = getComparison(a);
      const compB = getComparison(b);
      
      if (currentSortField === 'weightDiff') {
        valA = compA.hasProgress ? compA.weightDiff : 999; // put incomplete at bottom
        valB = compB.hasProgress ? compB.weightDiff : 999;
      } else if (currentSortField === 'bodyageDiff') {
        valA = compA.hasProgress ? compA.bodyageDiff : 999;
        valB = compB.hasProgress ? compB.bodyageDiff : 999;
      }
      
      // Since negative difference means improvement (weight loss, age reduction),
      // we handle sorting: asc = biggest loss (e.g. -8 is smaller than -2, so it rises to top)
      return currentSortOrder === 'asc' ? valA - valB : valB - valA;
    }
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
  const predefined = ['Corporate', 'Finance & Acc', 'Logistics', 'Sales', 'Procurement', 'Executive'];
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
    const comp = getComparison(emp);
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
      const c = getComparison(emp);
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
  
  // Top Body Age Reducer
  if (maxAgeLoss > 0 && maxAgeWinner) {
    elements.maxBodyageLoss.textContent = `${maxAgeLoss} ปี`;
    elements.maxBodyageWinner.textContent = `${maxAgeWinner.name} (${maxAgeWinner.department})`;
  } else {
    elements.maxBodyageLoss.textContent = '0 ปี';
    elements.maxBodyageWinner.textContent = 'ไม่มีข้อมูลการบันทึก';
  }
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
  
  // Pagination calculations
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
    const m1 = emp.months.m1;
    const m2 = emp.months.m2;
    const m3 = emp.months.m3;
    
    const tr = document.createElement('tr');
    
    // Col 1: Basic Info Name
    const tdName = document.createElement('td');
    const hasPhotos = (emp.months.m1 && emp.months.m1.photo) || 
                      (emp.months.m2 && emp.months.m2.photo) || 
                      (emp.months.m3 && emp.months.m3.photo);
                      
    const galleryBtn = hasPhotos 
      ? `<button class="btn-gallery-trigger" onclick="openPhotoGallery('${emp.id}')" title="ดูรูปถ่ายเปรียบเทียบ">🖼️ รูปถ่าย</button>`
      : `<button class="btn-gallery-trigger btn-gallery-empty" onclick="openPhotoGallery('${emp.id}')" title="ไม่มีรูปถ่าย">🖼️ ไม่มีรูป</button>`;
      
    tdName.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; width: 100%;">
        <div>
          <div class="td-name">${emp.name}</div>
          <div class="td-subtitle">ส่วนสูง ${emp.height} ซม.</div>
        </div>
        <div>
          ${galleryBtn}
        </div>
      </div>
    `;
    tr.appendChild(tdName);
    
    // Col 2: Age
    const tdAge = document.createElement('td');
    tdAge.innerHTML = `
      <div>จริง: ${emp.age} ปี</div>
      <div class="td-subtitle">สูง: ${emp.height} ซม.</div>
    `;
    tr.appendChild(tdAge);
    
    // Col 3: Department
    const tdDept = document.createElement('td');
    tdDept.textContent = emp.department;
    tr.appendChild(tdDept);
    
    // Col 4: Month 1
    const tdM1 = document.createElement('td');
    const m1_muscle_text = m1.muscle !== undefined && m1.muscle !== null ? `${m1.muscle}%` : '-';
    const m1_fat_text = m1.fat !== undefined && m1.fat !== null ? `${m1.fat}%` : '-';
    tdM1.innerHTML = `
      <div>⚖️ ${m1.weight} kg</div>
      <div class="td-subtitle">🧠 อายุร่างกาย: ${m1.bodyage} ปี (BMI: ${m1.bmi})</div>
      <div class="td-subtitle">💪 กล้ามเนื้อ: ${m1_muscle_text} | 📉 ไขมัน: ${m1_fat_text}</div>
    `;
    tr.appendChild(tdM1);
    
    // Col 5: Month 2
    const tdM2 = document.createElement('td');
    if (m2 && m2.weight) {
      const m2_muscle_text = m2.muscle !== undefined && m2.muscle !== null ? `${m2.muscle}%` : '-';
      const m2_fat_text = m2.fat !== undefined && m2.fat !== null ? `${m2.fat}%` : '-';
      tdM2.innerHTML = `
        <div>⚖️ ${m2.weight} kg</div>
        <div class="td-subtitle">🧠 อายุร่างกาย: ${m2.bodyage} ปี (BMI: ${m2.bmi})</div>
        <div class="td-subtitle">💪 กล้ามเนื้อ: ${m2_muscle_text} | 📉 ไขมัน: ${m2_fat_text}</div>
      `;
    } else {
      tdM2.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">ยังไม่บันทึก</span>`;
    }
    tr.appendChild(tdM2);
    
    // Col 6: Month 3
    const tdM3 = document.createElement('td');
    if (m3 && m3.weight) {
      const m3_muscle_text = m3.muscle !== undefined && m3.muscle !== null ? `${m3.muscle}%` : '-';
      const m3_fat_text = m3.fat !== undefined && m3.fat !== null ? `${m3.fat}%` : '-';
      tdM3.innerHTML = `
        <div>⚖️ ${m3.weight} kg</div>
        <div class="td-subtitle">🧠 อายุร่างกาย: ${m3.bodyage} ปี (BMI: ${m3.bmi})</div>
        <div class="td-subtitle">💪 กล้ามเนื้อ: ${m3_muscle_text} | 📉 ไขมัน: ${m3_fat_text}</div>
      `;
    } else {
      tdM3.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">ยังไม่บันทึก</span>`;
    }
    tr.appendChild(tdM3);
    
    // Col 7: Weight comparison diff
    const tdWDiff = document.createElement('td');
    if (comp.hasProgress) {
      const diffVal = comp.weightDiff;
      if (diffVal < 0) {
        tdWDiff.innerHTML = `<span class="metric-badge metric-badge-improved">↓ ${Math.abs(diffVal)} kg</span><div class="td-subtitle">เทียบกับ ม.1 (${comp.latestLabel})</div>`;
      } else if (diffVal > 0) {
        tdWDiff.innerHTML = `<span class="metric-badge metric-badge-worsened">↑ ${diffVal} kg</span><div class="td-subtitle">เทียบกับ ม.1 (${comp.latestLabel})</div>`;
      } else {
        tdWDiff.innerHTML = `<span class="metric-badge metric-badge-neutral">0.0 kg</span>`;
      }
    } else {
      tdWDiff.innerHTML = `<span style="color: var(--text-muted);">-</span>`;
    }
    tr.appendChild(tdWDiff);
    
    // Col 8: Body age comparison diff
    const tdAgeDiff = document.createElement('td');
    if (comp.hasProgress) {
      const diffVal = comp.bodyageDiff;
      if (diffVal < 0) {
        tdAgeDiff.innerHTML = `<span class="metric-badge metric-badge-improved">ลดลง ${Math.abs(diffVal)} ปี</span><div class="td-subtitle">เทียบกับ ม.1 (${comp.latestLabel})</div>`;
      } else if (diffVal > 0) {
        tdAgeDiff.innerHTML = `<span class="metric-badge metric-badge-worsened">เพิ่ม ${diffVal} ปี</span><div class="td-subtitle">เทียบกับ ม.1 (${comp.latestLabel})</div>`;
      } else {
        tdAgeDiff.innerHTML = `<span class="metric-badge metric-badge-neutral">คงที่</span>`;
      }
    } else {
      tdAgeDiff.innerHTML = `<span style="color: var(--text-muted);">-</span>`;
    }
    tr.appendChild(tdAgeDiff);
    
    // Col 9: Manage Actions
    const tdAction = document.createElement('td');
    tdAction.innerHTML = `
      <div class="action-buttons">
        <button class="btn-icon btn-icon-edit" onclick="openModal('edit', '${emp.id}')" title="แก้ไขข้อมูล">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button class="btn-icon btn-icon-delete" onclick="deleteEmployee('${emp.id}')" title="ลบข้อมูล">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `;
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

// Render Top 5 Leaderboard (Decreased Body Age)
function renderLeaderboard() {
  elements.leaderboardContainer.innerHTML = '';
  
  // Get all employees who have progressed and sort by body age reduction (most negative bodyageDiff)
  const achievers = employees
    .filter(emp => {
      const comp = getComparison(emp);
      return comp.hasProgress && comp.bodyageDiff < 0 && emp.department !== 'Executive';
    })
    .map(emp => {
      const comp = getComparison(emp);
      return {
        emp: emp,
        reduction: -comp.bodyageDiff // make it positive for display
      };
    })
    .sort((a, b) => b.reduction - a.reduction) // highest reduction first
    .slice(0, 5);
    
  if (achievers.length === 0) {
    elements.leaderboardContainer.innerHTML = `
      <div class="empty-state" style="padding: 2rem;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌿</div>
        <p>ยังไม่มีข้อมูลพนักงานที่ลดอายุร่างกายได้ในระบบขณะนี้</p>
      </div>
    `;
    return;
  }
  
  achievers.forEach((item, index) => {
    const rank = index + 1;
    let badgeClass = 'rank-other';
    if (rank === 1) badgeClass = 'rank-1';
    else if (rank === 2) badgeClass = 'rank-2';
    else if (rank === 3) badgeClass = 'rank-3';
    
    const div = document.createElement('div');
    div.className = 'leaderboard-item';
    div.innerHTML = `
      <div class="leaderboard-rank-badge ${badgeClass}">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}</div>
      <div class="leaderboard-info">
        <div class="leaderboard-name">${item.emp.name}</div>
        <div class="leaderboard-dept">${item.emp.department} • อายุจริง ${item.emp.age} ปี</div>
      </div>
      <div class="leaderboard-metric">
        <div class="leaderboard-val">-${item.reduction} ปี</div>
        <div class="leaderboard-desc">อายุร่างกายลดลง</div>
      </div>
    `;
    elements.leaderboardContainer.appendChild(div);
  });
}

// Render Summary Progress bars
function renderProgressBars() {
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
    const comp = getComparison(emp);
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
  
  if (mode === 'add') {
    elements.modalHeadline.textContent = 'เพิ่มข้อมูลพนักงานใหม่';
    elements.formId.value = '';
    
    // Clear disabled computed BMI placeholder fields
    elements.formM1Bmi.value = '';
    elements.formM2Bmi.value = '';
    elements.formM3Bmi.value = '';
    
    // Reset Photos
    removePhoto(1);
    removePhoto(2);
    removePhoto(3);
  } else {
    elements.modalHeadline.textContent = 'แก้ไขข้อมูลพนักงาน';
    const emp = employees.find(e => e.id === id);
    if (!emp) {
      showToast('ไม่พบข้อมูลพนักงานที่ต้องการแก้ไข', 'error');
      return;
    }
    
    elements.formId.value = emp.id;
    elements.formName.value = emp.name;
    elements.formDept.value = emp.department;
    elements.formAge.value = emp.age;
    elements.formHeight.value = emp.height;
    
    // Fill Month 1
    elements.formM1Weight.value = emp.months.m1.weight;
    elements.formM1Bodyage.value = emp.months.m1.bodyage;
    elements.formM1Bmi.value = emp.months.m1.bmi || calcBMI(emp.months.m1.weight, emp.height);
    elements.formM1Muscle.value = emp.months.m1.muscle || '';
    elements.formM1Fat.value = emp.months.m1.fat || '';
    
    if (emp.months.m1.photo) {
      document.getElementById('form-m1-photo-data').value = emp.months.m1.photo;
      document.getElementById('form-m1-photo-preview').querySelector('img').src = emp.months.m1.photo;
      document.getElementById('form-m1-photo-preview').style.display = 'block';
    } else {
      removePhoto(1);
    }
    
    // Fill Month 2
    if (emp.months.m2) {
      elements.formM2Weight.value = emp.months.m2.weight || '';
      elements.formM2Bodyage.value = emp.months.m2.bodyage || '';
      elements.formM2Bmi.value = emp.months.m2.bmi || '';
      elements.formM2Muscle.value = emp.months.m2.muscle || '';
      elements.formM2Fat.value = emp.months.m2.fat || '';
      
      if (emp.months.m2.photo) {
        document.getElementById('form-m2-photo-data').value = emp.months.m2.photo;
        document.getElementById('form-m2-photo-preview').querySelector('img').src = emp.months.m2.photo;
        document.getElementById('form-m2-photo-preview').style.display = 'block';
      } else {
        removePhoto(2);
      }
    } else {
      elements.formM2Weight.value = '';
      elements.formM2Bodyage.value = '';
      elements.formM2Bmi.value = '';
      elements.formM2Muscle.value = '';
      elements.formM2Fat.value = '';
      removePhoto(2);
    }
    
    // Fill Month 3
    if (emp.months.m3) {
      elements.formM3Weight.value = emp.months.m3.weight || '';
      elements.formM3Bodyage.value = emp.months.m3.bodyage || '';
      elements.formM3Bmi.value = emp.months.m3.bmi || '';
      elements.formM3Muscle.value = emp.months.m3.muscle || '';
      elements.formM3Fat.value = emp.months.m3.fat || '';
      
      if (emp.months.m3.photo) {
        document.getElementById('form-m3-photo-data').value = emp.months.m3.photo;
        document.getElementById('form-m3-photo-preview').querySelector('img').src = emp.months.m3.photo;
        document.getElementById('form-m3-photo-preview').style.display = 'block';
      } else {
        removePhoto(3);
      }
    } else {
      elements.formM3Weight.value = '';
      elements.formM3Bodyage.value = '';
      elements.formM3Bmi.value = '';
      elements.formM3Muscle.value = '';
      elements.formM3Fat.value = '';
      removePhoto(3);
    }
  }
  
  elements.employeeModal.classList.add('active');
}

// Close Modal
function closeModal() {
  elements.employeeModal.classList.remove('active');
}

// Save Form Data (Add or Edit)
// Save Form Data (Add or Edit)
async function saveForm() {
  const name = elements.formName.value.trim();
  const department = elements.formDept.value.trim();
  const age = parseInt(elements.formAge.value);
  const height = parseInt(elements.formHeight.value);
  
  // Month 1
  const m1_weight = parseFloat(elements.formM1Weight.value);
  const m1_bodyage = parseInt(elements.formM1Bodyage.value);
  const m1_muscle = parseFloat(elements.formM1Muscle.value);
  const m1_fat = parseFloat(elements.formM1Fat.value);
  const m1_bmi = calcBMI(m1_weight, height);
  const m1_photo = document.getElementById('form-m1-photo-data').value || null;
  
  // Month 2
  const m2_weight = parseFloat(elements.formM2Weight.value);
  const m2_bodyage = parseInt(elements.formM2Bodyage.value);
  const m2_muscle = parseFloat(elements.formM2Muscle.value);
  const m2_fat = parseFloat(elements.formM2Fat.value);
  const m2_photo = document.getElementById('form-m2-photo-data').value || null;
  let m2 = null;
  if (!isNaN(m2_weight) && !isNaN(m2_bodyage)) {
    m2 = {
      weight: m2_weight,
      bodyage: m2_bodyage,
      bmi: calcBMI(m2_weight, height),
      muscle: isNaN(m2_muscle) ? null : m2_muscle,
      fat: isNaN(m2_fat) ? null : m2_fat,
      photo: m2_photo
    };
  } else if (m2_photo) {
    m2 = {
      weight: null,
      bodyage: null,
      bmi: null,
      muscle: null,
      fat: null,
      photo: m2_photo
    };
  }
  
  // Month 3
  const m3_weight = parseFloat(elements.formM3Weight.value);
  const m3_bodyage = parseInt(elements.formM3Bodyage.value);
  const m3_muscle = parseFloat(elements.formM3Muscle.value);
  const m3_fat = parseFloat(elements.formM3Fat.value);
  const m3_photo = document.getElementById('form-m3-photo-data').value || null;
  let m3 = null;
  if (!isNaN(m3_weight) && !isNaN(m3_bodyage)) {
    m3 = {
      weight: m3_weight,
      bodyage: m3_bodyage,
      bmi: calcBMI(m3_weight, height),
      muscle: isNaN(m3_muscle) ? null : m3_muscle,
      fat: isNaN(m3_fat) ? null : m3_fat,
      photo: m3_photo
    };
  } else if (m3_photo) {
    m3 = {
      weight: null,
      bodyage: null,
      bmi: null,
      muscle: null,
      fat: null,
      photo: m3_photo
    };
  }
  
  const months = {
    m1: { 
      weight: m1_weight, 
      bodyage: m1_bodyage, 
      bmi: m1_bmi, 
      muscle: isNaN(m1_muscle) ? null : m1_muscle, 
      fat: isNaN(m1_fat) ? null : m1_fat,
      photo: m1_photo
    },
    m2,
    m3
  };
  
  showLoader(true);
  try {
    if (modalMode === 'add') {
      const { error } = await supabaseClient
        .from('pfig_employees')
        .insert([{ name, department, age, height, months }]);
        
      if (error) {
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message, 'error');
        console.error(error);
      } else {
        showToast('เพิ่มพนักงานสำเร็จเรียบร้อย', 'success');
      }
    } else {
      const id = elements.formId.value;
      const { error } = await supabaseClient
        .from('pfig_employees')
        .update({ name, department, age, height, months })
        .eq('id', id);
        
      if (error) {
        showToast('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + error.message, 'error');
        console.error(error);
      } else {
        showToast('อัปเดตข้อมูลพนักงานสำเร็จ', 'success');
      }
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์', 'error');
  }
  
  closeModal();
  showLoader(false);
}

// Delete Employee record
async function deleteEmployee(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  
  if (confirm(`คุณต้องการลบข้อมูลของ ${emp.name} ใช่หรือไม่?`)) {
    showLoader(true);
    try {
      const { error } = await supabaseClient
        .from('pfig_employees')
        .delete()
        .eq('id', id);
        
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
function exportCSV() {
  if (employees.length === 0) {
    showToast('ไม่มีข้อมูลพนักงานสำหรับส่งออก', 'error');
    return;
  }
  
  let csvContent = "\ufeff"; // UTF-8 BOM for Excel compatibility with Thai text
  csvContent += "ชื่อ-นามสกุล,แผนก,อายุจริง,ส่วนสูง,น้ำหนัก เดือน 1,อายุร่างกาย เดือน 1,กล้ามเนื้อ% เดือน 1,ไขมัน% เดือน 1,น้ำหนัก เดือน 2,อายุร่างกาย เดือน 2,กล้ามเนื้อ% เดือน 2,ไขมัน% เดือน 2,น้ำหนัก เดือน 3,อายุร่างกาย เดือน 3,กล้ามเนื้อ% เดือน 3,ไขมัน% เดือน 3\n";
  
  employees.forEach(emp => {
    const m1 = emp.months.m1 || {};
    const m2 = emp.months.m2 || {};
    const m3 = emp.months.m3 || {};
    
    const row = [
      `"${emp.name.replace(/"/g, '""')}"`,
      `"${emp.department.replace(/"/g, '""')}"`,
      emp.age,
      emp.height,
      m1.weight || '',
      m1.bodyage || '',
      m1.muscle || '',
      m1.fat || '',
      m2.weight || '',
      m2.bodyage || '',
      m2.muscle || '',
      m2.fat || '',
      m3.weight || '',
      m3.bodyage || '',
      m3.muscle || '',
      m3.fat || ''
    ];
    
    csvContent += row.join(",") + "\n";
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `PFIG_WellBeing_Data_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('ส่งออกไฟล์ CSV สำเร็จ!', 'success');
}

// Download CSV template
function downloadTemplateCSV() {
  let csvContent = "\ufeff"; // UTF-8 BOM
  csvContent += "ชื่อ-นามสกุล,แผนก,อายุจริง,ส่วนสูง,น้ำหนัก เดือน 1,อายุร่างกาย เดือน 1,กล้ามเนื้อ% เดือน 1,ไขมัน% เดือน 1,น้ำหนัก เดือน 2,อายุร่างกาย เดือน 2,กล้ามเนื้อ% เดือน 2,ไขมัน% เดือน 2,น้ำหนัก เดือน 3,อายุร่างกาย เดือน 3,กล้ามเนื้อ% เดือน 3,ไขมัน% เดือน 3\n";
  csvContent += "John Doe,Sales,30,175,85.5,42,32.5,28.4,83.0,40,33.1,27.2,79.5,38,34.0,25.8\n";
  csvContent += "Jane Smith,Finance,28,160,65.0,32,25.0,35.5,64.2,32,25.2,35.0,62.1,30,26.0,32.8\n";
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "PFIG_WellBeing_Template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('ดาวน์โหลดตัวอย่างไฟล์สำเร็จ นำไปกรอกและอัปโหลดได้ทันที', 'success');
}

// Import CSV File and Parse
function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file, "UTF-8");
  // reset file input
  elements.csvFileInput.value = '';
}

// Parse CSV content into employee objects
// Parse CSV content into employee objects
async function parseCSV(text) {
  const lines = text.split(/\r\n|\n/);
  if (lines.length < 2) {
    showToast('ไฟล์ CSV ไม่มีข้อมูลเพียงพอ', 'error');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  const importedList = [];
  
  // Skip header (i=0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling potential quotes properly
    const columns = [];
    let insideQuotes = false;
    let currentColumn = '';
    
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        columns.push(currentColumn.trim());
        currentColumn = '';
      } else {
        currentColumn += char;
      }
    }
    columns.push(currentColumn.trim());
    
    // Validate we have minimum columns (Name, Dept, Age, Height, M1_W, M1_BA, M1_M, M1_F)
    if (columns.length < 8) {
      errorCount++;
      continue;
    }
    
    const name = columns[0].replace(/^"|"$/g, '').trim();
    const department = columns[1].replace(/^"|"$/g, '').trim();
    const age = parseInt(columns[2]);
    const height = parseInt(columns[3]);
    
    // M1
    const m1_weight = parseFloat(columns[4]);
    const m1_bodyage = parseInt(columns[5]);
    const m1_muscle = parseFloat(columns[6]);
    const m1_fat = parseFloat(columns[7]);
    
    if (!name || !department || isNaN(age) || isNaN(height) || isNaN(m1_weight) || isNaN(m1_bodyage)) {
      errorCount++;
      continue;
    }
    
    // Optional M2
    let m2 = null;
    if (columns.length >= 12) {
      const m2_weight = parseFloat(columns[8]);
      const m2_bodyage = parseInt(columns[9]);
      const m2_muscle = parseFloat(columns[10]);
      const m2_fat = parseFloat(columns[11]);
      if (!isNaN(m2_weight) && !isNaN(m2_bodyage)) {
        m2 = {
          weight: m2_weight,
          bodyage: m2_bodyage,
          bmi: calcBMI(m2_weight, height),
          muscle: isNaN(m2_muscle) ? null : m2_muscle,
          fat: isNaN(m2_fat) ? null : m2_fat
        };
      }
    }
    
    // Optional M3
    let m3 = null;
    if (columns.length >= 16) {
      const m3_weight = parseFloat(columns[12]);
      const m3_bodyage = parseInt(columns[13]);
      const m3_muscle = parseFloat(columns[14]);
      const m3_fat = parseFloat(columns[15]);
      if (!isNaN(m3_weight) && !isNaN(m3_bodyage)) {
        m3 = {
          weight: m3_weight,
          bodyage: m3_bodyage,
          bmi: calcBMI(m3_weight, height),
          muscle: isNaN(m3_muscle) ? null : m3_muscle,
          fat: isNaN(m3_fat) ? null : m3_fat
        };
      }
    }
    
    importedList.push({
      name: name,
      department: department,
      age: age,
      height: height,
      months: {
        m1: {
          weight: m1_weight,
          bodyage: m1_bodyage,
          bmi: calcBMI(m1_weight, height),
          muscle: isNaN(m1_muscle) ? null : m1_muscle,
          fat: isNaN(m1_fat) ? null : m1_fat
        },
        m2: m2,
        m3: m3
      }
    });
    
    successCount++;
  }
  
  if (successCount > 0) {
    showLoader(true);
    try {
      const { error } = await supabaseClient
        .from('pfig_employees')
        .insert(importedList);
        
      if (error) {
        showToast('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + error.message, 'error');
        console.error(error);
      } else {
        showToast(`นำเข้าพนักงานสำเร็จ ${successCount} คน ${errorCount > 0 ? `(ผิดพลาด ${errorCount} แถว)` : ''}`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
    showLoader(false);
  } else {
    showToast('ไม่มีข้อมูลพนักงานที่ถูกต้องได้รับการนำเข้า กรุณาตรวจสอบรูปแบบไฟล์', 'error');
  }
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
  // Grab top 3 winners (body age reducers)
  const achievers = employees
    .filter(emp => {
      const comp = getComparison(emp);
      return comp.hasProgress && comp.bodyageDiff < 0 && emp.department !== 'Executive';
    })
    .map(emp => {
      const comp = getComparison(emp);
      return {
        emp: emp,
        reduction: -comp.bodyageDiff,
        weightLoss: -comp.weightDiff,
        bmiLoss: -comp.bmiDiff,
        muscleDiff: comp.muscleDiff,
        fatDiff: comp.fatDiff
      };
    })
    .sort((a, b) => b.reduction - a.reduction); // Sorted highest reduction first
    
  if (achievers.length < 3) {
    // Fail safe check: We need at least 3 people with progress who decreased body age
    // To make it easy to test, if we don't have enough, warn the user.
    showToast('กรุณาสุ่มข้อมูลพนักงาน หรือบันทึกความคืบหน้าให้มีผู้ลดอายุร่างกายสำเร็จอย่างน้อย 3 คนก่อนประกาศผล', 'error', 5000);
    return;
  }
  
  // Rank 1: index 0 (Winner, Gold)
  // Rank 2: index 1 (Silver)
  // Rank 3: index 2 (Bronze)
  presentationWinners = [achievers[0], achievers[1], achievers[2]];
  
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
    
    document.getElementById('pres-rev-m1-age').textContent = `${winnerData.emp.months.m1.bodyage} ปี`;
    
    // Latest body age calculation
    const comp = getComparison(winnerData.emp);
    const m3 = winnerData.emp.months.m3;
    const latestAge = m3 ? m3.bodyage : winnerData.emp.months.m2.bodyage;
    document.getElementById('pres-rev-latest-age').textContent = `${latestAge} ปี`;
    
    document.getElementById('pres-rev-diff-age').textContent = `ลดลง ${winnerData.reduction} ปี`;
    
    // Extra details (Weight, BMI, Muscle, Fat changes)
    const muscleSign = winnerData.muscleDiff > 0 ? '+' : '';
    const fatSign = winnerData.fatDiff > 0 ? '+' : '';
    const muscleText = winnerData.muscleDiff !== 0 ? `💪 กล้ามเนื้อ: <strong>${muscleSign}${winnerData.muscleDiff}%</strong>` : '';
    const fatText = winnerData.fatDiff !== 0 ? `📉 ไขมัน: <strong>${fatSign}${winnerData.fatDiff}%</strong>` : '';
    
    let subStatsHtml = `⚖️ น้ำหนักลดลง: <strong>${winnerData.weightLoss.toFixed(1)} kg</strong> &nbsp;&nbsp;|&nbsp;&nbsp; 📊 BMI ลดลง: <strong>${winnerData.bmiLoss.toFixed(2)}</strong>`;
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
    document.getElementById('podium-1-stat').textContent = `ลดอายุร่างกายได้ -${p1.reduction} ปี`;
    
    // Winner 2nd
    document.getElementById('podium-2-name').textContent = p2.emp.name;
    document.getElementById('podium-2-dept').textContent = p2.emp.department;
    document.getElementById('podium-2-stat').textContent = `ลดอายุร่างกายได้ -${p2.reduction} ปี`;
    
    // Winner 3rd
    document.getElementById('podium-3-name').textContent = p3.emp.name;
    document.getElementById('podium-3-dept').textContent = p3.emp.department;
    document.getElementById('podium-3-stat').textContent = `ลดอายุร่างกายได้ -${p3.reduction} ปี`;
    
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
      const wText = m.weight ? `${m.weight} kg` : '- kg';
      const bmiText = m.bmi ? `BMI: ${m.bmi}` : 'BMI: -';
      meta.textContent = `${wText} | ${bmiText}`;
    } else {
      container.innerHTML = `<div class="image-placeholder">ไม่มีรูปถ่าย</div>`;
      meta.textContent = `- kg | BMI: -`;
    }
  };
  
  renderCard('m1', 'เดือน 1', 'gallery-m1-img-container', 'gallery-m1-meta');
  renderCard('m2', 'เดือน 2', 'gallery-m2-img-container', 'gallery-m2-meta');
  renderCard('m3', 'เดือน 3', 'gallery-m3-img-container', 'gallery-m3-meta');
  
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
}

function openPinModal() {
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
function showPersonalProfile(empId) {
  const emp = employees.find(e => e.id === empId);
  if (!emp) return;

  const comp = getComparison(emp);
  const m1 = emp.months.m1 || {};
  const m2 = emp.months.m2;
  const m3 = emp.months.m3;
  
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
    
    const bmiText = m.bmi ? m.bmi : (calcBMI(m.weight, emp.height) || '-');
    const muscleText = (m.muscle !== undefined && m.muscle !== null) ? `${m.muscle}%` : '-';
    const fatText = (m.fat !== undefined && m.fat !== null) ? `${m.fat}%` : '-';
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
            <span class="personal-metric-val">${weightText}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">🧠 อายุร่างกาย</span>
            <span class="personal-metric-val">${bodyageText}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">📊 ค่า BMI</span>
            <span class="personal-metric-val">${bmiText}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">💪 กล้ามเนื้อ</span>
            <span class="personal-metric-val">${muscleText}</span>
          </div>
          <div class="personal-metric-item">
            <span class="personal-metric-name">📉 ไขมัน</span>
            <span class="personal-metric-val">${fatText}</span>
          </div>
        </div>
        ${photoFrame}
      </div>
    `;
  };

  const colM1 = renderMonthColumn(m1, 'เดือน 1 (เริ่มต้น)', 'personal-month-badge-1');
  const colM2 = renderMonthColumn(m2, 'เดือน 2 (ความคืบหน้า)', 'personal-month-badge-2');
  const colM3 = renderMonthColumn(m3, 'เดือน 3 (ผลลัพธ์สุดท้าย)', 'personal-month-badge-3');

  // Generate Profile HTML
  elements.personalProfileDisplay.innerHTML = `
    <div class="personal-profile-card">
      <!-- Profile Info Header -->
      <div class="personal-profile-header">
        <div class="personal-profile-title-group">
          <div class="personal-avatar">👤</div>
          <div class="personal-name">
            <h3>${emp.name}</h3>
            <div class="personal-meta-info">
              <span class="personal-meta-badge personal-meta-badge-dept">🏢 แผนก: ${emp.department}</span>
              <span class="personal-meta-badge">🎂 อายุจริง: ${emp.age} ปี</span>
              <span class="personal-meta-badge">📏 ส่วนสูง: ${emp.height} ซม.</span>
            </div>
          </div>
        </div>
        <div style="text-align: right; font-size: 0.8rem; color: var(--text-muted);">
          ID: ${emp.id.substring(0, 8)}...
        </div>
      </div>

      <!-- Comparative stats grid (latest vs month 1) -->
      <h4 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
        <span>🏆</span> สรุปความเปลี่ยนแปลงทั้งหมด (เริ่มต้น ➔ ล่าสุดที่บันทึก)
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
          <div class="personal-stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #f87171;">📉</div>
          <div class="personal-stat-details">
            <span class="personal-stat-label">อัตราไขมัน</span>
            <span class="personal-stat-value">${fatChangeHtml}</span>
          </div>
        </div>
      </div>

      <!-- 3 columns months details -->
      <h4 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--text-main);">
        <span>📈</span> รายละเอียดข้อมูลรายเดือน
      </h4>
      <div class="personal-months-grid">
        ${colM1}
        ${colM2}
        ${colM3}
      </div>
    </div>
  `;
  
  elements.personalProfileDisplay.style.display = 'block';
}

