(function () {
  'use strict';
  
  // --- Category metadata ---
  var CATEGORIES = {
    groceries:     { label: 'Groceries',     icon: '\uD83D\uDED2', color: '#10b981' },
    transport:     { label: 'Transport',     icon: '\uD83D\uDE97', color: '#3b82f6' },
    dining:        { label: 'Dining Out',    icon: '\uD83C\uDF7D', color: '#f59e0b' },
    utilities:     { label: 'Utilities',    icon: '\uD83D\uDD0B', color: '#8b5cf6' },
    entertainment: { label: 'Entertainment', icon: '\uD83C\uDFAC', color: '#ec4899' },
    shopping:      { label: 'Shopping',      icon: '\uD83D\uDECD', color: '#06b6d4' },
    health:        { label: 'Health',        icon: '\u2764\uFE0F', color: '#ef4444' },
    other:         { label: 'Other',         icon: '\uD83D\uDCC4', color: '#64748b' },
  };

  var expenseForm = document.getElementById('expenseForm');
  var descriptionInput = document.getElementById('description');
  var amountInput = document.getElementById('amount');
  var categorySelect = document.getElementById('category');
  var dateInput = document.getElementById('date');
  var isRecurringSelect = document.getElementById('isRecurring');
  var expenseList = document.getElementById('expenseList');
  var filterCategory = document.getElementById('filterCategory');
  var filterPeriod = document.getElementById('filterPeriod');
  var searchInput = document.getElementById('searchInput');
  var categoryBreakdown = document.getElementById('categoryBreakdown');
  var trendChart = document.getElementById('trendChart');
  var pieChart = document.getElementById('pieChart');
  var editModal = document.getElementById('editModal');
  var editForm = document.getElementById('editForm');
  var editDescription = document.getElementById('editDescription');
  var editAmount = document.getElementById('editAmount');
  var editCategory = document.getElementById('editCategory');
  var editDate = document.getElementById('editDate');
  var toastEl = document.getElementById('toast');

  var budgetDisplay = document.getElementById('budgetDisplay');
  var budgetBarFill = document.getElementById('budgetBarFill');
  var budgetSpent = document.getElementById('budgetSpent');
  var budgetLimit = document.getElementById('budgetLimit');
  var budgetStatus = document.getElementById('budgetStatus');
  var setBudgetBtn = document.getElementById('setBudgetBtn');
  var budgetModal = document.getElementById('budgetModal');
  var budgetForm = document.getElementById('budgetForm');
  var budgetAmount = document.getElementById('budgetAmount');

  var allExpenses = [];
  var editingId = null;
  var currentBudget = null;
  function loadFromStorage(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

  // --- Utilities ---
  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var opts = { month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', opts);
  }

  function formatMoney(num) {
    return '\u20B9' + Number(num).toFixed(2);
  }

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function showToast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(function () { toastEl.className = 'toast'; }, 2500);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  // --- Budget ---
  async function loadBudget() {
  currentBudget = loadFromStorage('budget', null);
  renderBudget();
}

  function renderBudget() {
    if (!currentBudget) {
      budgetDisplay.classList.remove('active');
      budgetBarFill.style.width = '0%';
      budgetSpent.textContent = formatMoney(0);
      budgetLimit.textContent = formatMoney(0);
      budgetStatus.textContent = '';
      return;
    }

    var limit = parseFloat(currentBudget.monthly_limit);
    var now = new Date();
    var monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var spent = 0;
    allExpenses.forEach(function (e) {
      if (e.date && e.date.substring(0, 7) === monthStr && !e.is_recurring) {
        spent += parseFloat(e.amount);
      }
    });

    budgetDisplay.classList.add('active');
    var pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    budgetBarFill.style.width = pct + '%';
    budgetSpent.textContent = formatMoney(spent);
    budgetLimit.textContent = formatMoney(limit);

    if (spent >= limit) {
      budgetBarFill.classList.add('over');
      budgetStatus.textContent = 'Over budget!';
      budgetStatus.className = 'budget-status over';
    } else if (pct >= 80) {
      budgetBarFill.classList.add('warning');
      budgetStatus.textContent = 'Approaching limit';
      budgetStatus.className = 'budget-status warning';
    } else {
      budgetBarFill.classList.remove('over', 'warning');
      budgetStatus.textContent = '';
      budgetStatus.className = 'budget-status';
    }
  }

  setBudgetBtn.addEventListener('click', function () {
    budgetAmount.value = currentBudget ? currentBudget.monthly_limit : '';
    budgetModal.classList.add('active');
  });

  document.getElementById('closeBudgetModal').addEventListener('click', function () {
    budgetModal.classList.remove('active');
  });
  document.getElementById('cancelBudget').addEventListener('click', function () {
    budgetModal.classList.remove('active');
  });
  budgetModal.addEventListener('click', function (e) {
    if (e.target === budgetModal) budgetModal.classList.remove('active');
  });

  budgetForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var amt = parseFloat(budgetAmount.value);
    if (!amt || amt <= 0) { showToast('Enter a valid amount', 'error'); return; }

    try {
  currentBudget = { id: currentBudget ? currentBudget.id : generateId(), category: 'all', monthly_limit: amt };
  saveToStorage('budget', currentBudget);
  budgetModal.classList.remove('active');
  renderBudget();
  showToast('Budget saved!', 'success');
} catch (err) {
  showToast('Failed to save budget', 'error');
}
  });

  // --- Recurring expenses ---
  async function processRecurringExpenses() {
  var all = loadFromStorage('expenses', []);
  var recurring = all.filter(function (e) { return e.is_recurring; });
  var today = todayStr();
  var created = 0;

  recurring.forEach(function (parent) {
    if (parent.next_due_date && parent.next_due_date <= today) {
      all.push({
        id: generateId(),
        description: parent.description,
        amount: parent.amount,
        category: parent.category,
        date: parent.next_due_date,
        is_recurring: false,
        parent_expense_id: parent.id,
      });
      created++;

      var nextDate = new Date(parent.next_due_date + 'T00:00:00');
      if (parent.recurring_frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      parent.next_due_date = nextDate.getFullYear() + '-' + String(nextDate.getMonth() + 1).padStart(2, '0') + '-' + String(nextDate.getDate()).padStart(2, '0');
    }
  });

  if (created > 0) {
    saveToStorage('expenses', all);
    showToast(created + ' recurring expense(s) added', 'success');
  }
}

  // --- Data loading ---
  async function loadExpenses() {
  allExpenses = loadFromStorage('expenses', []);
  allExpenses.sort(function (a, b) { return b.date.localeCompare(a.date); });
  render();
}

  // --- Add expense ---
  async function handleAdd(e) {
    e.preventDefault();
    var desc = descriptionInput.value.trim();
    var amt = parseFloat(amountInput.value);
    var cat = categorySelect.value;
    var dt = dateInput.value;
    var recurringVal = isRecurringSelect.value;

    if (!desc || !amt || amt <= 0 || !dt) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    var btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Adding\u2026';

    try {
      var insertData = {
        description: desc,
        amount: amt,
        category: cat,
        date: dt,
        is_recurring: recurringVal !== 'false',
      };

      if (recurringVal !== 'false') {
        insertData.recurring_frequency = recurringVal;
        var nextDate = new Date(dt + 'T00:00:00');
        if (recurringVal === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        insertData.next_due_date = nextDate.getFullYear() + '-' + String(nextDate.getMonth() + 1).padStart(2, '0') + '-' + String(nextDate.getDate()).padStart(2, '0');
      }

      insertData.id = generateId();
      allExpenses.unshift(insertData);
      saveToStorage('expenses', allExpenses);
      render();
      expenseForm.reset();
      dateInput.value = todayStr();
      showToast('Expense added!', 'success');
    } catch (err) {
      showToast('Failed to add expense', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Add Expense';
    }
  }

  // --- Delete expense ---
  async function handleDelete(id) {
  if (!confirm('Delete this expense? This cannot be undone.')) return;
  allExpenses = allExpenses.filter(function (e) { return e.id !== id; });
  saveToStorage('expenses', allExpenses);
  render();
  showToast('Expense deleted', 'success');
}

  // --- Edit expense ---
  function openEdit(id) {
    var exp = allExpenses.find(function (e) { return e.id === id; });
    if (!exp) return;
    editingId = id;
    editDescription.value = exp.description;
    editAmount.value = exp.amount;
    editCategory.value = exp.category;
    editDate.value = exp.date;
    editModal.classList.add('active');
  }

  function closeEdit() {
    editModal.classList.remove('active');
    editingId = null;
  }

  async function handleEdit(e) {
    e.preventDefault();
    var desc = editDescription.value.trim();
    var amt = parseFloat(editAmount.value);
    var cat = editCategory.value;
    var dt = editDate.value;

    if (!desc || !amt || amt <= 0 || !dt) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      allExpenses = allExpenses.map(function (e) {
        if (e.id === editingId) {
          return Object.assign({}, e, { description: desc, amount: amt, category: cat, date: dt });
        }
        return e;
      });
      saveToStorage('expenses', allExpenses);
      render();
      closeEdit();
      showToast('Expense updated!', 'success');
    } catch (err) {
      showToast('Failed to update expense', 'error');
    }
  }

  // --- Filtering + Search ---
  function getFilteredExpenses() {
    var catFilter = filterCategory.value;
    var periodFilter = filterPeriod.value;
    var searchTerm = searchInput.value.trim().toLowerCase();
    var now = new Date();
    var todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return allExpenses.filter(function (e) {
      if (catFilter !== 'all' && e.category !== catFilter) return false;

      if (periodFilter !== 'all') {
        var expDate = new Date(e.date + 'T00:00:00');
        if (periodFilter === 'today') {
          if (expDate.getTime() !== todayDate.getTime()) return false;
        } else if (periodFilter === 'week') {
          var dayOfWeek = todayDate.getDay();
          var weekStart = new Date(todayDate);
          weekStart.setDate(weekStart.getDate() - dayOfWeek);
          var weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          if (expDate < weekStart || expDate >= weekEnd) return false;
        } else if (periodFilter === 'month') {
          if (expDate.getMonth() !== todayDate.getMonth() || expDate.getFullYear() !== todayDate.getFullYear()) return false;
        }
      }

      if (searchTerm) {
        var desc = (e.description || '').toLowerCase();
        var catLabel = (CATEGORIES[e.category] || { label: '' }).label.toLowerCase();
        if (desc.indexOf(searchTerm) === -1 && catLabel.indexOf(searchTerm) === -1) return false;
      }

      return true;
    });
  }

  // --- Rendering ---
  function render() {
    renderSummary();
    renderBudget();
    renderCategoryBreakdown();
    renderTrendChart();
    renderPieChart();
    renderExpenseList();
  }

  function renderSummary() {
    var now = new Date();
    var monthTotal = 0;
    var todayTotal = 0;
    var todayDate = todayStr();
    var uniqueDates = {};

    allExpenses.forEach(function (e) {
      if (e.date) {
        var monthStr = e.date.substring(0, 7);
        var nowMonthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        if (monthStr === nowMonthStr && !e.is_recurring) {
          monthTotal += parseFloat(e.amount);
        }
        if (e.date === todayDate) {
          todayTotal += parseFloat(e.amount);
        }
        uniqueDates[e.date] = true;
      }
    });

    document.getElementById('totalMonth').textContent = formatMoney(monthTotal);
    document.getElementById('totalToday').textContent = formatMoney(todayTotal);
    document.getElementById('totalCount').textContent = allExpenses.filter(function(e){ return !e.is_recurring; }).length;
    var avg = Object.keys(uniqueDates).length > 0
      ? monthTotal / Object.keys(uniqueDates).length
      : 0;
    document.getElementById('avgDay').textContent = formatMoney(avg);
  }

  function renderCategoryBreakdown() {
    var totals = {};
    var grandTotal = 0;

    allExpenses.forEach(function (e) {
      if (e.is_recurring) return;
      var amt = parseFloat(e.amount);
      totals[e.category] = (totals[e.category] || 0) + amt;
      grandTotal += amt;
    });

    var cats = Object.keys(totals).sort(function (a, b) {
      return totals[b] - totals[a];
    });

    if (cats.length === 0) {
      categoryBreakdown.innerHTML = '<p class="empty-hint">Add an expense to see your category breakdown.</p>';
      return;
    }

    categoryBreakdown.innerHTML = cats.map(function (cat) {
      var meta = CATEGORIES[cat] || CATEGORIES.other;
      var amt = totals[cat];
      var pct = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;
      return (
        '<div class="category-bar-item">' +
          '<div class="category-bar-header">' +
            '<span class="category-bar-label">' +
              '<span class="category-dot" style="background:' + meta.color + '"></span>' +
              meta.icon + ' ' + meta.label +
            '</span>' +
            '<span class="category-bar-amount">' + formatMoney(amt) + ' (' + pct.toFixed(0) + '%)</span>' +
          '</div>' +
          '<div class="category-bar-track">' +
            '<div class="category-bar-fill" style="width:' + pct + '%;background:' + meta.color + '"></div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  // --- Trend Chart (last 6 months, CSS bars) ---
  function renderTrendChart() {
    var months = [];
    var now = new Date();
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      var label = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({ key: key, label: label, total: 0 });
    }

    allExpenses.forEach(function (e) {
      if (e.is_recurring) return;
      var monthKey = e.date ? e.date.substring(0, 7) : null;
      months.forEach(function (m) {
        if (m.key === monthKey) m.total += parseFloat(e.amount);
      });
    });

    var maxVal = Math.max.apply(null, months.map(function (m) { return m.total; }));
    if (maxVal === 0) {
      trendChart.innerHTML = '<p class="empty-hint">Add expenses to see your trend.</p>';
      return;
    }

    trendChart.innerHTML =
      '<div class="trend-chart">' +
        months.map(function (m) {
          var h = maxVal > 0 ? (m.total / maxVal) * 100 : 0;
          return (
            '<div class="trend-col">' +
              '<div class="trend-bar-wrap">' +
                '<div class="trend-bar" style="height:' + h + '%">' +
                  '<span class="trend-value">' + (m.total > 0 ? formatMoney(m.total) : '') + '</span>' +
                '</div>' +
              '</div>' +
              '<span class="trend-label">' + m.label + '</span>' +
            '</div>'
          );
        }).join('') +
      '</div>';
  }

  // --- Pie Chart (CSS conic-gradient) ---
  function renderPieChart() {
    var totals = {};
    var grandTotal = 0;

    allExpenses.forEach(function (e) {
      if (e.is_recurring) return;
      var amt = parseFloat(e.amount);
      totals[e.category] = (totals[e.category] || 0) + amt;
      grandTotal += amt;
    });

    if (grandTotal === 0) {
      pieChart.innerHTML = '<p class="empty-hint">Add expenses to see your category split.</p>';
      return;
    }

    var cats = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; });
    var gradientParts = [];
    var cumulative = 0;

    cats.forEach(function (cat) {
      var meta = CATEGORIES[cat] || CATEGORIES.other;
      var pct = (totals[cat] / grandTotal) * 100;
      gradientParts.push(meta.color + ' ' + cumulative + '% ' + (cumulative + pct) + '%');
      cumulative += pct;
    });

    var legend = cats.map(function (cat) {
      var meta = CATEGORIES[cat] || CATEGORIES.other;
      var pct = ((totals[cat] / grandTotal) * 100).toFixed(0);
      return (
        '<div class="pie-legend-item">' +
          '<span class="pie-legend-dot" style="background:' + meta.color + '"></span>' +
          '<span class="pie-legend-label">' + meta.label + '</span>' +
          '<span class="pie-legend-pct">' + pct + '%</span>' +
        '</div>'
      );
    }).join('');

    pieChart.innerHTML =
      '<div class="pie-chart-wrap">' +
        '<div class="pie-chart" style="background:conic-gradient(' + gradientParts.join(', ') + ')">' +
          '<div class="pie-chart-hole">' +
            '<span class="pie-chart-total">' + formatMoney(grandTotal) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="pie-legend">' + legend + '</div>' +
      '</div>';
  }

  function renderExpenseList() {
    var filtered = getFilteredExpenses();

    if (filtered.length === 0) {
      expenseList.innerHTML =
        '<div class="empty-state">No expenses found. Add one above to get started!</div>';
      return;
    }

    expenseList.innerHTML = filtered.map(function (e) {
      var meta = CATEGORIES[e.category] || CATEGORIES.other;
      var recurringBadge = e.is_recurring
        ? '<span class="recurring-badge" title="Recurring">&#128257;</span>'
        : '';
      return (
        '<div class="expense-item">' +
          '<div class="expense-cat-icon" style="background:' + meta.color + '22;color:' + meta.color + '">' +
            meta.icon +
          '</div>' +
          '<div class="expense-details">' +
            '<div class="expense-desc">' + escapeHtml(e.description) + ' ' + recurringBadge + '</div>' +
            '<div class="expense-meta">' +
              '<span class="expense-cat-tag" style="color:' + meta.color + '">' + meta.label + '</span>' +
              '<span>\u00B7</span>' +
              '<span>' + formatDate(e.date) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="expense-amount-text">' + formatMoney(e.amount) + '</div>' +
          '<div class="expense-actions">' +
            '<button class="btn-icon edit" onclick="window.__editExpense(\'' + e.id + '\')" title="Edit">&#9998;</button>' +
            '<button class="btn-icon delete" onclick="window.__deleteExpense(\'' + e.id + '\')" title="Delete">&#128465;</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  // --- Expose handlers ---
  window.__editExpense = openEdit;
  window.__deleteExpense = handleDelete;

  // --- Event listeners ---
  expenseForm.addEventListener('submit', handleAdd);
  editForm.addEventListener('submit', handleEdit);
  filterCategory.addEventListener('change', renderExpenseList);
  filterPeriod.addEventListener('change', renderExpenseList);
  searchInput.addEventListener('input', renderExpenseList);
  document.getElementById('closeModal').addEventListener('click', closeEdit);
  document.getElementById('cancelEdit').addEventListener('click', closeEdit);
  editModal.addEventListener('click', function (e) {
    if (e.target === editModal) closeEdit();
  });

  // --- Theme toggle ---
  var themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  var savedTheme = localStorage.getItem('expense-theme') || 'light';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('expense-theme', next);
  });

  (async function () {
  dateInput.value = todayStr();
  await loadBudget();
  await processRecurringExpenses();
  await loadExpenses();
})();
})();
