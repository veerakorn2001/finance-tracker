// Finance Tracker App - Lightweight Version
class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTransactions();
        this.updateDashboard();
        this.setupCategories();
        this.setCurrentDate();
    }

    setupEventListeners() {
        // Modal controls
        const addBtn = document.getElementById('addTransactionBtn');
        const modal = document.getElementById('transactionModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const form = document.getElementById('transactionForm');

        addBtn.addEventListener('click', () => this.openModal());
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Form submission
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Type change handler
        document.getElementById('type').addEventListener('change', (e) => {
            this.updateCategories(e.target.value);
        });

        // Navigation
        document.querySelectorAll('.nav-item a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const navItem = e.target.closest('.nav-item');
                this.handleNavigation(navItem);
                // Show page by href
                const href = navItem.querySelector('a').getAttribute('href');
                if (href === '#dashboard') this.showPage('dashboard-page');
                else if (href === '#transactions') this.showPage('transactions-page');
                else if (href === '#reports') {
                    this.showPage('reports-page');
                    this.updateReportPage();
                }
            });
        });
    }

    openModal() {
        const modal = document.getElementById('transactionModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('description').focus();
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('transactionModal');
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Reset form
        document.getElementById('transactionForm').reset();
    }

    setupCategories() {
        const categories = {
            income: [
                'เงินเดือน', 'โบนัส', 'ค่าล่วงเวลา', 'งานเสริม',
                'ดอกเบี้ย', 'เงินปันผล', 'ขายของ', 'อื่นๆ'
            ],
            expense: [
                'อาหาร', 'เครื่องดื่ม', 'ค่าเดินทาง', 'ค่าเช่าบ้าน',
                'ค่าน้ำ-ค่าไฟ', 'ค่าโทรศัพท์', 'อินเทอร์เน็ต', 'เสื้อผ้า',
                'เครื่องสำอาง', 'ยา-สุขภาพ', 'บันเทิง', 'การศึกษา',
                'ช้อปปิ้ง', 'อื่นๆ'
            ]
        };

        this.categories = categories;
    }

    updateCategories(type) {
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">เลือกหมวดหมู่</option>';
        
        if (type && this.categories[type]) {
            this.categories[type].forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const transaction = {
            id: Date.now(),
            description: formData.get('description') || document.getElementById('description').value,
            amount: parseFloat(formData.get('amount') || document.getElementById('amount').value),
            type: formData.get('type') || document.getElementById('type').value,
            category: formData.get('category') || document.getElementById('category').value,
            date: formData.get('date') || document.getElementById('date').value,
            status: 'completed'
        };

        if (!this.validateTransaction(transaction)) {
            return;
        }

        this.addTransaction(transaction);
        this.closeModal();
        this.showNotification('เพิ่มรายการสำเร็จ!', 'success');
    }

    validateTransaction(transaction) {
        if (!transaction.description.trim()) {
            this.showNotification('กรุณากรอกรายละเอียด', 'error');
            return false;
        }
        
        if (!transaction.amount || transaction.amount <= 0) {
            this.showNotification('กรุณากรอกจำนวนเงินที่ถูกต้อง', 'error');
            return false;
        }
        
        if (!transaction.type) {
            this.showNotification('กรุณาเลือกประเภท', 'error');
            return false;
        }
        
        if (!transaction.category) {
            this.showNotification('กรุณาเลือกหมวดหมู่', 'error');
            return false;
        }
        
        if (!transaction.date) {
            this.showNotification('กรุณาเลือกวันที่', 'error');
            return false;
        }

        return true;
    }

    async addTransaction(transaction) {
        // ส่งข้อมูลไป backend API
        const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });
        const data = await res.json();
        transaction.id = data.id;
        this.transactions.push(transaction);
        this.updateDashboard();
        this.updateTransactionsTable();
        this.updateStats();
        this.updateReportPage();
    }

    async deleteTransaction(id) {
        await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.updateDashboard();
        this.updateTransactionsTable();
        this.updateStats();
        this.updateReportPage();
        this.showNotification('ลบรายการสำเร็จ!', 'success');
    }

    async loadTransactions() {
        // ดึงข้อมูลจาก backend API
        const res = await fetch('/api/transactions');
        this.transactions = await res.json();
    }

    async updateDashboard() {
        // ดึงข้อมูลจาก backend API
        const res = await fetch('/api/report');
        const report = await res.json();
        document.getElementById('totalIncome').textContent = this.formatCurrency(report.totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(report.totalExpense);
        document.getElementById('balance').textContent = this.formatCurrency(report.balance);
        const savingsRate = report.totalIncome > 0 ? ((report.balance / report.totalIncome) * 100).toFixed(1) : 0;
        document.getElementById('savingsRate').textContent = `${savingsRate}%`;
    }

    async updateStats() {
        // ดึงข้อมูลจาก backend API
        const res = await fetch('/api/transactions');
        const transactions = await res.json();
        // รายการเดือนนี้
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        }).length;
        document.getElementById('monthlyTransactions').textContent = `${monthlyTransactions} รายการ`;
        // หมวดหมู่ที่ใช้บ่อย
        const categoryCount = {};
        transactions.forEach(t => {
            categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
        });
        const topCategory = Object.keys(categoryCount).length > 0 
            ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
            : '-';
        document.getElementById('topCategory').textContent = topCategory;
        // รายการล่าสุด
        const lastTransaction = transactions.length > 0 
            ? transactions[transactions.length - 1].description
            : '-';
        document.getElementById('lastTransaction').textContent = lastTransaction;
    }

    updateTransactionsTable() {
        const tbody = document.getElementById('transactionsTableBody');
        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        tbody.innerHTML = '';

        if (recentTransactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 2rem; color: var(--text-secondary);">
                        ยังไม่มีรายการใดๆ
                    </td>
                </tr>
            `;
            return;
        }

        recentTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>
                    <span class="category-badge ${transaction.type}">
                        ${transaction.category}
                    </span>
                </td>
                <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </td>
                <td>
                    <span class="status-badge ${transaction.status}">
                        ${this.getStatusText(transaction.status)}
                    </span>
                </td>
                <td>
                    <button class="btn-delete" onclick="app.deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    handleNavigation(navItem) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        navItem.classList.add('active');
        
        // Handle navigation logic here
        const href = navItem.querySelector('a').getAttribute('href');
        console.log('Navigating to:', href);
    }

    showPage(pageId) {
        const pages = ['dashboard-page', 'transactions-page', 'reports-page'];
        pages.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (id === pageId) ? '' : 'none';
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'เสร็จสิ้น',
            'pending': 'รอดำเนินการ',
            'cancelled': 'ยกเลิก'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async updateReportPage() {
        // ดึงข้อมูลรายงานจาก backend API
        const res = await fetch('/api/report');
        const report = await res.json();
        document.getElementById('reportTotalIncome').textContent = this.formatCurrency(report.totalIncome);
        document.getElementById('reportTotalExpense').textContent = this.formatCurrency(report.totalExpense);
        document.getElementById('reportBalance').textContent = this.formatCurrency(report.balance);
        document.getElementById('reportCount').textContent = report.count;
        // Table
        const tbody = document.getElementById('reportTableBody');
        tbody.innerHTML = '';
        if (report.count === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary); padding:2rem;">ยังไม่มีข้อมูล</td></tr>`;
            return;
        }
        report.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(t => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.formatDate(t.date)}</td>
                    <td>${t.description}</td>
                    <td>${t.category}</td>
                    <td class="${t.type === 'income' ? 'text-success' : 'text-danger'}">${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}</td>
                    <td>${t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</td>
                `;
                tbody.appendChild(row);
            });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanceTracker();
});

// Add some CSS for additional styling
const additionalStyles = `
    .category-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .category-badge.income {
        background: #dcfce7;
        color: #166534;
    }
    
    .category-badge.expense {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-badge.completed {
        background: #dcfce7;
        color: #166534;
    }
    
    .status-badge.pending {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-badge.cancelled {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .btn-delete {
        background: #fee2e2;
        color: #991b1b;
        border: none;
        padding: 0.5rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    
    .btn-delete:hover {
        background: #fecaca;
    }
    
    .text-success {
        color: #10b981 !important;
    }
    
    .text-danger {
        color: #ef4444 !important;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 