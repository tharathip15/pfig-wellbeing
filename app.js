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
  btnClearDb: document.getElementById('btn-clear-db'),
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
  presIndicators: document.getElementById('pres-indicators')
};



// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  updateUI();
  
  // Check if DB is empty and show welcome toast
  if (employees.length === 0) {
    showToast('ยินดีต้อนรับสู่ระบบ PFIG Well Being! เริ่มบันทึกข้อมูลพนักงานใหม่ได้ทันที', 'info', 5000);
  }
});

// Load data from localStorage
function loadData() {
  const stored = localStorage.getItem('pfig_wellbeing_employees');
  if (stored) {
    try {
      employees = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing localStorage data:", e);
      employees = [];
    }
  } else {
    employees = [];
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('pfig_wellbeing_employees', JSON.stringify(employees));
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
      hasProgress: false,
      latestLabel: '-'
    };
  }
  
  return {
    weightDiff: parseFloat((latest.weight - m1.weight).toFixed(1)),
    bmiDiff: parseFloat((latest.bmi - m1.bmi).toFixed(2)),
    bodyageDiff: parseInt(latest.bodyage - m1.bodyage),
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

  // Clear Database
  elements.btnClearDb.addEventListener('click', () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างฐานข้อมูลพนักงานทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      employees = [];
      saveData();
      updateUI();
      showToast('ล้างฐานข้อมูลเรียบร้อยแล้ว', 'success');
    }
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
  const depts = [...new Set(employees.map(emp => emp.department))].filter(Boolean).sort();
  
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
      
      // Top body age reduction (bodyageDiff is negative, e.g. -5 is reduction of 5)
      const reduction = -comp.bodyageDiff;
      if (reduction > maxAgeLoss) {
        maxAgeLoss = reduction;
        maxAgeWinner = emp;
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
    tdName.innerHTML = `
      <div class="td-name">${emp.name}</div>
      <div class="td-subtitle">ส่วนสูง ${emp.height} ซม.</div>
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
      return comp.hasProgress && comp.bodyageDiff < 0;
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
    
    // Fill Month 2
    if (emp.months.m2) {
      elements.formM2Weight.value = emp.months.m2.weight || '';
      elements.formM2Bodyage.value = emp.months.m2.bodyage || '';
      elements.formM2Bmi.value = emp.months.m2.bmi || '';
      elements.formM2Muscle.value = emp.months.m2.muscle || '';
      elements.formM2Fat.value = emp.months.m2.fat || '';
    } else {
      elements.formM2Weight.value = '';
      elements.formM2Bodyage.value = '';
      elements.formM2Bmi.value = '';
      elements.formM2Muscle.value = '';
      elements.formM2Fat.value = '';
    }
    
    // Fill Month 3
    if (emp.months.m3) {
      elements.formM3Weight.value = emp.months.m3.weight || '';
      elements.formM3Bodyage.value = emp.months.m3.bodyage || '';
      elements.formM3Bmi.value = emp.months.m3.bmi || '';
      elements.formM3Muscle.value = emp.months.m3.muscle || '';
      elements.formM3Fat.value = emp.months.m3.fat || '';
    } else {
      elements.formM3Weight.value = '';
      elements.formM3Bodyage.value = '';
      elements.formM3Bmi.value = '';
      elements.formM3Muscle.value = '';
      elements.formM3Fat.value = '';
    }
  }
  
  elements.employeeModal.classList.add('active');
}

// Close Modal
function closeModal() {
  elements.employeeModal.classList.remove('active');
}

// Save Form Data (Add or Edit)
function saveForm() {
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
  
  // Month 2
  const m2_weight = parseFloat(elements.formM2Weight.value);
  const m2_bodyage = parseInt(elements.formM2Bodyage.value);
  const m2_muscle = parseFloat(elements.formM2Muscle.value);
  const m2_fat = parseFloat(elements.formM2Fat.value);
  let m2 = null;
  if (!isNaN(m2_weight) && !isNaN(m2_bodyage)) {
    m2 = {
      weight: m2_weight,
      bodyage: m2_bodyage,
      bmi: calcBMI(m2_weight, height),
      muscle: isNaN(m2_muscle) ? null : m2_muscle,
      fat: isNaN(m2_fat) ? null : m2_fat
    };
  }
  
  // Month 3
  const m3_weight = parseFloat(elements.formM3Weight.value);
  const m3_bodyage = parseInt(elements.formM3Bodyage.value);
  const m3_muscle = parseFloat(elements.formM3Muscle.value);
  const m3_fat = parseFloat(elements.formM3Fat.value);
  let m3 = null;
  if (!isNaN(m3_weight) && !isNaN(m3_bodyage)) {
    m3 = {
      weight: m3_weight,
      bodyage: m3_bodyage,
      bmi: calcBMI(m3_weight, height),
      muscle: isNaN(m3_muscle) ? null : m3_muscle,
      fat: isNaN(m3_fat) ? null : m3_fat
    };
  }
  
  const record = {
    name,
    department,
    age,
    height,
    months: {
      m1: { weight: m1_weight, bodyage: m1_bodyage, bmi: m1_bmi, muscle: isNaN(m1_muscle) ? null : m1_muscle, fat: isNaN(m1_fat) ? null : m1_fat },
      m2,
      m3
    }
  };
  
  if (modalMode === 'add') {
    record.id = 'emp-' + Date.now();
    employees.push(record);
    showToast('เพิ่มพนักงานสำเร็จเรียบร้อย', 'success');
  } else {
    const id = elements.formId.value;
    const index = employees.findIndex(e => e.id === id);
    if (index !== -1) {
      record.id = id;
      employees[index] = record;
      showToast('อัปเดตข้อมูลพนักงานสำเร็จ', 'success');
    } else {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      closeModal();
      return;
    }
  }
  
  saveData();
  closeModal();
  updateUI();
}

// Delete Employee record
function deleteEmployee(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  
  if (confirm(`คุณต้องการลบข้อมูลของ ${emp.name} ใช่หรือไม่?`)) {
    employees = employees.filter(e => e.id !== id);
    saveData();
    updateUI();
    showToast('ลบข้อมูลพนักงานเรียบร้อย', 'success');
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
  csvContent += "นายสมชาย ใจงาม,การตลาด,30,175,85.5,42,32.5,28.4,83.0,40,33.1,27.2,79.5,38,34.0,25.8\n";
  csvContent += "นางสาวสมหญิง ยิ้มแย้ม,การเงิน,28,160,65.0,32,25.0,35.5,64.2,32,25.2,35.0,62.1,30,26.0,32.8\n";
  
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
function parseCSV(text) {
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
      id: 'csv-' + Date.now() + '-' + successCount + '-' + Math.floor(Math.random() * 1000),
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
    // Append or replace? Let's append to existing list
    employees = [...employees, ...importedList];
    saveData();
    updateUI();
    showToast(`นำเข้าพนักงานสำเร็จ ${successCount} คน ${errorCount > 0 ? `(ผิดพลาด ${errorCount} แถว)` : ''}`, 'success');
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
      return comp.hasProgress && comp.bodyageDiff < 0;
    })
    .map(emp => {
      const comp = getComparison(emp);
      return {
        emp: emp,
        reduction: -comp.bodyageDiff,
        weightLoss: -comp.weightDiff,
        bmiLoss: -comp.bmiDiff
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

