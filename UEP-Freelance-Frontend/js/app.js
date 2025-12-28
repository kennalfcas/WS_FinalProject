// UEP FREELANCE APP - MAIN APPLICATION FILE
class UEPFreelanceApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.apiBaseUrl = 'http://localhost:8080/api';
        this.demoAccounts = {
            'admin@uep.edu.ph': { 
                role: 'ADMIN', 
                firstName: 'Admin', 
                lastName: 'User',
                id: 1
            },
            'client@uep.edu.ph': { 
                role: 'CLIENT', 
                firstName: 'Juan', 
                lastName: 'Dela Cruz',
                id: 2
            },
            'student@uep.edu.ph': { 
                role: 'STUDENT', 
                firstName: 'Maria', 
                lastName: 'Santos',
                id: 3
            }
        };
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupGlobalEventListeners();
        this.loadPage('home');
        this.setupServiceWorker();
    }

    // ==========================================
    //  EVENT LISTENERS (Fixed & Consolidated)
    // ==========================================
    setupGlobalEventListeners() {
        // 1. NAVIGATION - Single event delegation
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Navigation links
            if (target.matches('.nav-link') || target.closest('.nav-link')) {
                e.preventDefault();
                const link = target.matches('.nav-link') ? target : target.closest('.nav-link');
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    this.loadPage(href.substring(1));
                    this.closeMobileMenu();
                }
            }

            // User dropdown toggle
            if (target.matches('#userMenu') || target.closest('#userMenu')) {
                e.stopPropagation();
                const dropdown = document.querySelector('.dropdown-content');
                if (dropdown) {
                    const isVisible = dropdown.style.display === 'block';
                    this.closeAllDropdowns();
                    dropdown.style.display = isVisible ? 'none' : 'block';
                }
            }

            // Dropdown links inside user menu
            if (target.matches('.dropdown-link') || target.closest('.dropdown-link')) {
                e.preventDefault();
                e.stopPropagation();
                const link = target.matches('.dropdown-link') ? target : target.closest('.dropdown-link');
                
                if (link.id === 'logoutBtn') {
                    this.logout();
                } else {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        this.loadPage(href.substring(1));
                    }
                }
                this.closeAllDropdowns();
            }

            // Demo account pills
            if (target.matches('.demo-account') || target.closest('.demo-account')) {
                const el = target.matches('.demo-account') ? target : target.closest('.demo-account');
                const email = el.getAttribute('data-email') || this.getEmailFromText(el.textContent);
                if (email) this.fillDemoAccount(email);
            }

            // Close modals on background click
            if (target.classList.contains('modal')) {
                this.hideModal(target.id);
            }

            // Close modals on X button click
            if (target.matches('.close') || target.closest('.close')) {
                const modal = target.closest('.modal');
                if (modal) this.hideModal(modal.id);
            }
        });

        // 2. FORM SUBMISSIONS - Static forms
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // 3. STATIC BUTTONS
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }

        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // 4. WINDOW CLICKS - Close dropdowns when clicking outside
        window.addEventListener('click', (e) => {
            if (!e.target.closest('#userMenu') && !e.target.closest('.dropdown-content')) {
                this.closeAllDropdowns();
            }
        });
    }

    getEmailFromText(text) {
        if (text.includes('Admin')) return 'admin@uep.edu.ph';
        if (text.includes('Client')) return 'client@uep.edu.ph';
        if (text.includes('Student')) return 'student@uep.edu.ph';
        return null;
    }

    // ==========================================
    //  AUTH & USER STATE
    // ==========================================
    async checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUIForAuth();
            } catch (error) {
                console.error('Data corruption:', error);
                this.logout();
            }
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        // Demo Login Logic
        if (password === 'password123' && this.demoAccounts[email]) {
            this.showLoading();
            setTimeout(() => {
                const userData = {
                    ...this.demoAccounts[email],
                    email: email,
                    token: 'demo-token-' + Date.now()
                };
                
                this.saveUserSession(userData);
                this.hideModal('loginModal');
                this.showAlert(`Welcome back, ${userData.firstName}!`, 'success');
                document.getElementById('loginForm').reset();
                
                this.loadPage(this.currentUser.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
                this.hideLoading();
            }, 800);
        } else {
            this.showAlert('Invalid credentials. Use demo accounts: admin@uep.edu.ph, client@uep.edu.ph, student@uep.edu.ph (password: password123)', 'error');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const role = document.getElementById('regRole').value;
        const first = document.getElementById('regFirstName').value;
        const last = document.getElementById('regLastName').value;

        if (!email.endsWith('@uep.edu.ph')) {
            this.showAlert('Must use a UEP email address.', 'error');
            return;
        }

        this.showLoading();
        setTimeout(() => {
            // Register locally in demo memory
            this.demoAccounts[email] = { 
                role, 
                firstName: first, 
                lastName: last, 
                id: Date.now() 
            };
            
            this.hideModal('registerModal');
            this.showAlert('Registration successful! Please login.', 'success');
            document.getElementById('registerForm').reset();
            this.hideLoading();
            
            // Auto-fill login
            this.fillDemoAccount(email);
        }, 1000);
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        document.getElementById('navAuth').style.display = 'flex';
        document.getElementById('navUser').style.display = 'none';
        
        this.closeAllDropdowns();
        this.loadPage('home');
        this.showAlert('Logged out successfully.', 'success');
    }

    saveUserSession(userData) {
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('userData', JSON.stringify(userData));
        this.currentUser = userData;
        this.updateUIForAuth();
    }

    updateUIForAuth() {
        if (!this.currentUser) return;

        document.getElementById('navAuth').style.display = 'none';
        document.getElementById('navUser').style.display = 'flex';
        
        const userNameElement = document.getElementById('userNameMenu');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.firstName;
        }

        // Admin Link Visibility
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = this.currentUser.role === 'ADMIN' ? 'block' : 'none';
        }

        // Post Job Link Visibility
        const postJobLink = document.querySelector('a[href="#post-job"]');
        if (postJobLink) {
            postJobLink.style.display = this.currentUser.role === 'STUDENT' ? 'none' : 'block';
        }
    }

    fillDemoAccount(email) {
        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPassword');
        
        if (emailInput && passInput) {
            emailInput.value = email;
            passInput.value = 'password123';
            this.showLoginModal();
            this.showAlert(`Demo account filled: ${email}`, 'info');
        }
    }

    // ==========================================
    //  NAVIGATION & UI HELPERS
    // ==========================================
    toggleMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.toggle('active');
        }
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-content').forEach(d => {
            d.style.display = 'none';
        });
    }

    showModal(id) { 
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'block'; 
    }
    
    hideModal(id) { 
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none'; 
    }
    
    // Wrappers for specific modals
    showLoginModal() { 
        this.showModal('loginModal'); 
        this.hideModal('registerModal');
    }
    
    showRegisterModal() { 
        this.showModal('registerModal'); 
        this.hideModal('loginModal');
    }
    
    showJobModal() { this.showModal('jobModal'); }
    showProposalModal() { this.showModal('proposalModal'); }

    // ==========================================
    //  PAGE LOADING ROUTER
    // ==========================================
    async loadPage(page) {
        this.currentPage = page;
        const appContainer = document.getElementById('app');
        
        if (!appContainer) {
            console.error('App container not found');
            return;
        }
        
        this.showLoading();

        // Update Active Nav Link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });

        try {
            let html = '';
            
            // Route Logic
            switch(page) {
                case 'home': 
                    html = this.renderHomePage(); 
                    break;
                    
                case 'jobs': 
                    html = this.renderJobsPage(); 
                    break;
                    
                case 'freelancers': 
                    html = this.renderFreelancersPage(); 
                    break;
                
                case 'post-job':
                    if (!this.currentUser) { 
                        this.showLoginModal(); 
                        return; 
                    }
                    html = this.renderPostJobPage(); 
                    break;
                
                case 'dashboard':
                    if (!this.currentUser) { 
                        this.showLoginModal(); 
                        return; 
                    }
                    html = this.renderDashboard();
                    break;

                case 'admin-dashboard':
                    if (!this.currentUser || this.currentUser.role !== 'ADMIN') { 
                        this.showAlert('Admin access only', 'error'); 
                        this.loadPage('home');
                        return; 
                    }
                    html = this.renderAdminDashboard();
                    break;
                
                case 'my-jobs':
                    if (!this.currentUser) { 
                        this.showLoginModal(); 
                        return; 
                    }
                    html = this.renderMyJobsPage();
                    break;

                case 'my-proposals':
                    if (!this.currentUser) { 
                        this.showLoginModal(); 
                        return; 
                    }
                    html = this.renderMyProposalsPage();
                    break;
                
                case 'messages':
                    if (!this.currentUser) { 
                        this.showLoginModal(); 
                        return; 
                    }
                    html = this.renderMessagesPage();
                    break;

                case 'profile':
                    if (!this.currentUser) { 
                        this.showLoginModal(); 
                        return; 
                    }
                    html = this.renderProfilePage();
                    break;

                case 'settings':
                    if (!this.currentUser) { 
                        this.showLoginModal(); 
                        return; 
                    }
                    html = this.renderSettingsPage();
                    break;

                default: 
                    html = this.renderHomePage();
            }

            appContainer.innerHTML = html;
            appContainer.classList.add('page-transition');
            
            // Attach Page-Specific Events
            this.attachPageEvents(page);

            // Load page-specific data
            await this.loadPageData(page);

        } catch (error) {
            console.error('Page Load Error', error);
            this.showAlert('Error loading page', 'error');
        } finally {
            this.hideLoading();
        }
    }

    attachPageEvents(page) {
        // Jobs Search & Filter
        if (page === 'jobs') {
            const search = document.getElementById('searchJobs');
            if (search) {
                search.addEventListener('input', this.debounce(() => this.loadJobs(), 500));
            }
            
            const cat = document.getElementById('categoryFilter');
            if (cat) {
                cat.addEventListener('change', () => this.loadJobs());
            }
        }

        // Post Job Form
        if (page === 'post-job') {
            const form = document.getElementById('postJobForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handlePostJobSubmit(e));
            }
        }

        // Admin Tabs
        if (page === 'admin-dashboard') {
            document.querySelectorAll('.admin-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchAdminTab(e.target.dataset.tab);
                });
            });
        }

        // My Jobs Tabs
        if (page === 'my-jobs') {
            document.querySelectorAll('.my-jobs-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabType = e.target.getAttribute('data-tab');
                    this.switchMyJobsTab(tabType);
                });
            });
        }

        // My Proposals Tabs
        if (page === 'my-proposals') {
            document.querySelectorAll('.proposal-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const tabType = e.target.getAttribute('data-tab');
                    this.switchProposalsTab(tabType);
                });
            });
        }
    }

    async loadPageData(page) {
        switch(page) {
            case 'jobs':
                await this.loadJobs();
                break;
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'admin-dashboard':
                await this.loadAdminData();
                break;
            case 'freelancers':
                await this.loadFreelancers();
                break;
            case 'my-jobs':
                await this.loadMyJobs();
                break;
            case 'my-proposals':
                await this.loadMyProposals();
                break;
        }
    }

    // ==========================================
    //  RENDERERS (HTML GENERATORS)
    // ==========================================
    renderHomePage() {
        return `
            <section class="hero">
                <div class="hero-content">
                    <h1>UEP Student Freelance Network</h1>
                    <p>Connect with talented UEP student freelancers and find amazing opportunities.</p>
                    <div class="hero-buttons">
                        <button class="btn-primary" onclick="app.loadPage('jobs')">
                            <i class="fas fa-search"></i> Find Work
                        </button>
                        ${!this.currentUser || this.currentUser.role !== 'STUDENT' ? 
                            `<button class="btn-secondary" onclick="app.loadPage('post-job')">
                                <i class="fas fa-briefcase"></i> Post Job
                            </button>` : ''
                        }
                        <button class="btn-secondary" onclick="app.loadPage('freelancers')">
                            <i class="fas fa-users"></i> Find Talent
                        </button>
                    </div>
                </div>
            </section>
            
            <section class="features">
                <div class="container">
                    <h2>Why Choose UEP Freelance?</h2>
                    <div class="feature-grid">
                        <div class="feature-card">
                            <i class="fas fa-shield-alt"></i>
                            <h3>Secure & Verified</h3>
                            <p>All users are verified with UEP email addresses for a trusted community.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-graduation-cap"></i>
                            <h3>Student Focused</h3>
                            <p>Designed specifically for UEP students to gain real-world experience.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-handshake"></i>
                            <h3>Easy Collaboration</h3>
                            <p>Simple tools for posting jobs, submitting proposals, and managing projects.</p>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    renderJobsPage() {
        return `
            <section class="container">
                <h1>Browse Available Jobs</h1>
                <div class="filters">
                    <input type="text" id="searchJobs" placeholder="Search jobs...">
                    <select id="categoryFilter">
                        <option value="">All Categories</option>
                        <option value="WEB">Web Development</option>
                        <option value="DESIGN">Design</option>
                        <option value="CONTENT">Content Writing</option>
                        <option value="OTHER">Other</option>
                    </select>
                    <button class="btn-secondary" onclick="app.loadJobs()">
                        <i class="fas fa-filter"></i> Filter
                    </button>
                </div>
                <div id="jobsList" class="jobs-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading jobs...</p>
                    </div>
                </div>
            </section>
        `;
    }

    renderFreelancersPage() {
        return `
            <section class="container">
                <h1>UEP Freelancers</h1>
                <p>Browse talented UEP students available for hire.</p>
                <div id="freelancersList" class="jobs-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading freelancers...</p>
                    </div>
                </div>
            </section>
        `;
    }

    renderPostJobPage() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        
        return `
            <section class="container">
                <div style="max-width:800px; margin:0 auto">
                    <h1>Post a Job</h1>
                    <form id="postJobForm" class="styled-form">
                        <div class="form-group">
                            <label>Title *</label>
                            <input type="text" id="jobTitle" required placeholder="e.g., Website Design for Business">
                        </div>
                        <div class="form-group">
                            <label>Category *</label>
                            <select id="jobCategory" required>
                                <option value="">Select Category</option>
                                <option value="WEB">Web Development</option>
                                <option value="DESIGN">Graphic Design</option>
                                <option value="CONTENT">Content Writing</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Budget (₱) *</label>
                            <input type="number" id="jobBudget" required min="100" placeholder="1000">
                        </div>
                        <div class="form-group">
                            <label>Description *</label>
                            <textarea id="jobDescription" rows="5" required placeholder="Describe the job requirements..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Deadline</label>
                            <input type="date" id="jobDeadline" min="${minDate}">
                        </div>
                        <div class="form-group">
                            <label>Required Skills (comma separated)</label>
                            <input type="text" id="jobSkills" placeholder="e.g., HTML, CSS, JavaScript">
                        </div>
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-paper-plane"></i> Post Job
                        </button>
                    </form>
                </div>
            </section>
        `;
    }

    renderDashboard() {
        const isStudent = this.currentUser?.role === 'STUDENT';
        
        return `
            <section class="dashboard">
                <div class="container">
                    <h1>Welcome, ${this.currentUser?.firstName || 'User'}!</h1>
                    <p>Your freelance dashboard</p>
                    
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <h3>${isStudent ? 'Active Proposals' : 'Active Jobs'}</h3>
                            <div class="value" id="dashActive">0</div>
                        </div>
                        <div class="dashboard-card">
                            <h3>${isStudent ? 'Total Earnings' : 'Total Spent'}</h3>
                            <div class="value" id="dashMoney">₱0</div>
                        </div>
                        <div class="dashboard-card">
                            <h3>${isStudent ? 'Rating' : 'Jobs Posted'}</h3>
                            <div class="value" id="dashRating">0</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-actions">
                        <div>
                            <h3>Recent Activity</h3>
                            <div id="recentActivity">
                                <p>No recent activity</p>
                            </div>
                        </div>
                        
                        <div>
                            <h3>Quick Actions</h3>
                            <div class="quick-actions">
                                ${isStudent ? `
                                    <button class="btn-primary" onclick="app.loadPage('jobs')">
                                        <i class="fas fa-search"></i> Browse Jobs
                                    </button>
                                    <button class="btn-secondary" onclick="app.loadPage('my-proposals')">
                                        <i class="fas fa-list"></i> My Proposals
                                    </button>
                                ` : `
                                    <button class="btn-primary" onclick="app.loadPage('post-job')">
                                        <i class="fas fa-plus"></i> Post New Job
                                    </button>
                                    <button class="btn-secondary" onclick="app.loadPage('my-jobs')">
                                        <i class="fas fa-briefcase"></i> Manage Jobs
                                    </button>
                                `}
                                <button class="btn-secondary" onclick="app.loadPage('profile')">
                                    <i class="fas fa-user"></i> Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    renderAdminDashboard() {
        return `
            <section class="admin-dashboard">
                <div class="container">
                    <h1>Admin Dashboard</h1>
                    <div class="admin-tabs">
                        <button class="admin-tab active" data-tab="overview">Overview</button>
                        <button class="admin-tab" data-tab="users">Users</button>
                        <button class="admin-tab" data-tab="jobs">Jobs</button>
                    </div>
                    <div id="adminTabContent">
                        <div id="overviewTab" class="admin-tab-content">
                            <div class="admin-grid">
                                <div class="admin-card">
                                    <h3>Total Users</h3>
                                    <div class="value" id="totalUsers">0</div>
                                </div>
                                <div class="admin-card">
                                    <h3>Active Jobs</h3>
                                    <div class="value" id="activeJobs">0</div>
                                </div>
                                <div class="admin-card">
                                    <h3>Total Revenue</h3>
                                    <div class="value" id="totalRevenue">₱0</div>
                                </div>
                            </div>
                        </div>
                        <div id="usersTab" class="admin-tab-content" style="display:none">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody id="usersTable">
                                    <!-- Users will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                        <div id="jobsTab" class="admin-tab-content" style="display:none">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Client</th>
                                        <th>Budget</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="adminJobsTable">
                                    <!-- Jobs will be loaded here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    renderMyJobsPage() {
        return `
            <section class="container">
                <h1>My Jobs</h1>
                <div class="my-jobs-tabs">
                    <button class="my-jobs-tab active" data-tab="posted">Posted Jobs</button>
                    <button class="my-jobs-tab" data-tab="in-progress">In Progress</button>
                    <button class="my-jobs-tab" data-tab="completed">Completed</button>
                </div>
                <div id="postedJobsList" class="jobs-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading your jobs...</p>
                    </div>
                </div>
            </section>
        `;
    }

    renderMyProposalsPage() {
        return `
            <section class="container">
                <h1>My Proposals</h1>
                <div class="proposals-tabs">
                    <button class="proposal-tab active" data-tab="pending">Pending</button>
                    <button class="proposal-tab" data-tab="accepted">Accepted</button>
                    <button class="proposal-tab" data-tab="rejected">Rejected</button>
                </div>
                <div id="pendingProposalsList" class="jobs-grid">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <p>Loading your proposals...</p>
                    </div>
                </div>
            </section>
        `;
    }

    renderMessagesPage() {
        return `
            <section class="container">
                <h1>Messages</h1>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    Messaging feature coming soon.
                </div>
            </section>
        `;
    }
    
    renderProfilePage() {
        return `
            <section class="container">
                <div style="max-width:800px; margin:0 auto">
                    <h1>Profile</h1>
                    <form id="profileForm" class="styled-form">
                        <div class="form-group">
                            <label>First Name</label>
                            <input type="text" value="${this.currentUser?.firstName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Last Name</label>
                            <input type="text" value="${this.currentUser?.lastName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="text" value="${this.currentUser?.email || ''}" disabled>
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <input type="text" value="${this.currentUser?.role || ''}" disabled>
                        </div>
                        <button type="button" class="btn-primary" onclick="app.handleProfileUpdate(event)">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </form>
                </div>
            </section>
        `;
    }

    renderSettingsPage() {
        return `
            <section class="container">
                <h1>Settings</h1>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    This feature is under development.
                </div>
                <button class="btn-warning" onclick="app.logout()">
                    <i class="fas fa-sign-out-alt"></i> Log Out
                </button>
            </section>
        `;
    }

    // ==========================================
    //  DATA LOADING & ACTIONS
    // ==========================================
    async loadJobs() {
        const list = document.getElementById('jobsList');
        if (!list) return;

        // Mock Data
        let jobs = [
            { 
                id: 1, 
                title: 'Website Design for Bakery', 
                budget: 15000, 
                desc: 'Need a responsive website for local bakery with online ordering.', 
                cat: 'WEB',
                client: 'Juan Dela Cruz',
                deadline: '2024-12-31',
                status: 'OPEN',
                proposals: 3
            },
            { 
                id: 2, 
                title: 'Logo Design for Tech Startup', 
                budget: 5000, 
                desc: 'Modern minimalist logo design for new tech company.', 
                cat: 'DESIGN',
                client: 'Maria Santos',
                deadline: '2024-12-20',
                status: 'OPEN',
                proposals: 5
            },
            { 
                id: 3, 
                title: 'Blog Content Writing', 
                budget: 8000, 
                desc: '10 blog articles about digital marketing trends 2024.', 
                cat: 'CONTENT',
                client: 'Carlos Reyes',
                deadline: '2024-12-25',
                status: 'OPEN',
                proposals: 2
            }
        ];

        // Filter
        const term = document.getElementById('searchJobs')?.value.toLowerCase();
        const cat = document.getElementById('categoryFilter')?.value;

        if (term) {
            jobs = jobs.filter(j => 
                j.title.toLowerCase().includes(term) || 
                j.desc.toLowerCase().includes(term)
            );
        }
        
        if (cat) {
            jobs = jobs.filter(j => j.cat === cat);
        }

        list.innerHTML = jobs.map(job => `
            <div class="job-card" onclick="app.viewJob(${job.id})">
                <div class="status-badge status-${job.status.toLowerCase()}">
                    ${job.status}
                </div>
                <h3>${job.title}</h3>
                <div class="job-budget">₱${job.budget.toLocaleString()}</div>
                <p>${job.desc}</p>
                <div class="job-meta">
                    <span class="category-tag">${job.cat}</span>
                    <span class="deadline">
                        <i class="fas fa-clock"></i> ${new Date(job.deadline).toLocaleDateString()}
                    </span>
                </div>
                <div class="job-footer">
                    <span style="color: var(--text-light); font-size: 0.9rem;">
                        <i class="fas fa-users"></i> ${job.proposals} proposals
                    </span>
                    <button class="btn-primary" onclick="event.stopPropagation(); app.viewJob(${job.id})">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    async viewJob(id) {
        // Mock job details
        const job = {
            id: id,
            title: 'Website Design for Bakery',
            budget: 15000,
            desc: 'Need a responsive website for local bakery with online ordering system. Must include menu display, contact form, and mobile optimization.',
            client: 'Juan Dela Cruz',
            deadline: '2024-12-31',
            status: 'OPEN',
            category: 'WEB',
            skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
            proposalsCount: 3
        };

        this.showJobDetails(job);
    }

    showJobDetails(job) {
        const content = document.getElementById('jobModalContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="job-details">
                <div class="job-details-header">
                    <h2>${job.title}</h2>
                    <div class="status-badge status-${job.status.toLowerCase()}">
                        ${job.status}
                    </div>
                </div>
                
                <div class="job-budget-large">₱${job.budget.toLocaleString()}</div>
                
                <div class="job-details-meta">
                    <span class="category-tag">${job.category}</span>
                    <span><i class="fas fa-clock"></i> Deadline: ${new Date(job.deadline).toLocaleDateString()}</span>
                    <span><i class="fas fa-user"></i> Client: ${job.client}</span>
                    <span><i class="fas fa-users"></i> ${job.proposalsCount} proposals</span>
                </div>
                
                <div class="job-details-description">
                    <h3>Description</h3>
                    <p>${job.desc}</p>
                    
                    ${job.skills ? `
                        <h4>Required Skills:</h4>
                        <div class="skills-list">
                            ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="job-details-actions">
                    ${this.currentUser?.role === 'STUDENT' ? `
                        <button class="btn-primary" onclick="app.submitProposal(${job.id})">
                            <i class="fas fa-paper-plane"></i> Submit Proposal
                        </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="app.hideModal('jobModal')">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        this.showJobModal();
    }

    submitProposal(jobId) {
        if (!this.currentUser) {
            this.showLoginModal();
            return;
        }

        const content = document.getElementById('proposalModalContent');
        content.innerHTML = `
            <div class="proposal-form">
                <h2>Submit Proposal for Job</h2>
                <form id="proposalForm">
                    <div class="form-group">
                        <label>Cover Letter *</label>
                        <textarea id="proposalCoverLetter" rows="4" required 
                                  placeholder="Explain why you're the best fit for this job..."></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Proposed Amount (₱) *</label>
                            <input type="number" id="proposalAmount" required min="100" placeholder="15000">
                        </div>
                        <div class="form-group">
                            <label>Estimated Days *</label>
                            <input type="number" id="proposalDays" required min="1" placeholder="14">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Additional Notes</label>
                        <textarea id="proposalNotes" rows="2" placeholder="Any additional information..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-primary" onclick="app.finalizeProposal(${jobId})">
                            <i class="fas fa-paper-plane"></i> Submit Proposal
                        </button>
                        <button type="button" class="btn-secondary" onclick="app.hideModal('proposalModal')">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.showProposalModal();
    }

    async finalizeProposal(jobId) {
        const coverLetter = document.getElementById('proposalCoverLetter').value;
        const amount = document.getElementById('proposalAmount').value;
        const days = document.getElementById('proposalDays').value;
        
        if (!coverLetter || !amount || !days) {
            this.showAlert('Please fill all required fields', 'error');
            return;
        }
        
        this.showLoading();
        setTimeout(() => {
            this.hideModal('proposalModal');
            this.hideModal('jobModal');
            this.showAlert('Proposal submitted successfully!', 'success');
            this.hideLoading();
        }, 1000);
    }

    async handlePostJobSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('jobTitle').value;
        const category = document.getElementById('jobCategory').value;
        const budget = document.getElementById('jobBudget').value;
        const description = document.getElementById('jobDescription').value;
        
        if (!title || !category || !budget || !description) {
            this.showAlert('Please fill all required fields', 'error');
            return;
        }
        
        this.showLoading();
        setTimeout(() => {
            this.showAlert('Job posted successfully!', 'success');
            this.loadPage('my-jobs');
            this.hideLoading();
        }, 1000);
    }

    async loadDashboardData() {
        // Mock data
        setTimeout(() => {
            const isStudent = this.currentUser?.role === 'STUDENT';
            
            document.getElementById('dashActive').textContent = isStudent ? '3' : '2';
            document.getElementById('dashMoney').textContent = isStudent ? '₱25,400' : '₱42,000';
            document.getElementById('dashRating').textContent = isStudent ? '4.8' : '5';
            
            const activity = document.getElementById('recentActivity');
            if (activity) {
                if (isStudent) {
                    activity.innerHTML = `
                        <div class="activity-item">
                            <i class="fas fa-check-circle success"></i>
                            <div>
                                <strong>Proposal accepted for "Website Redesign"</strong>
                                <small>2 hours ago • ₱5,000</small>
                            </div>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-money-bill-wave success"></i>
                            <div>
                                <strong>Payment received for "Logo Design"</strong>
                                <small>1 day ago • ₱2,500</small>
                            </div>
                        </div>
                    `;
                } else {
                    activity.innerHTML = `
                        <div class="activity-item">
                            <i class="fas fa-bell info"></i>
                            <div>
                                <strong>New proposal for "Website Design"</strong>
                                <small>1 hour ago • ₱15,000</small>
                            </div>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-check-circle success"></i>
                            <div>
                                <strong>Job "Mobile App UI" completed</strong>
                                <small>2 days ago • ₱8,000</small>
                            </div>
                        </div>
                    `;
                }
            }
        }, 500);
    }

    async loadAdminData() {
        setTimeout(() => {
            // Overview data
            document.getElementById('totalUsers').textContent = '156';
            document.getElementById('activeJobs').textContent = '24';
            document.getElementById('totalRevenue').textContent = '₱452,800';
            
            // Users table
            const usersTable = document.getElementById('usersTable');
            if (usersTable) {
                usersTable.innerHTML = `
                    <tr>
                        <td>Admin User</td>
                        <td>admin@uep.edu.ph</td>
                        <td>ADMIN</td>
                        <td>2024-10-01</td>
                    </tr>
                    <tr>
                        <td>Juan Dela Cruz</td>
                        <td>client@uep.edu.ph</td>
                        <td>CLIENT</td>
                        <td>2024-10-15</td>
                    </tr>
                    <tr>
                        <td>Maria Santos</td>
                        <td>student@uep.edu.ph</td>
                        <td>STUDENT</td>
                        <td>2024-10-20</td>
                    </tr>
                `;
            }
            
            // Jobs table
            const jobsTable = document.getElementById('adminJobsTable');
            if (jobsTable) {
                jobsTable.innerHTML = `
                    <tr>
                        <td>Website Design Project</td>
                        <td>Juan Dela Cruz</td>
                        <td>₱15,000</td>
                        <td>OPEN</td>
                    </tr>
                    <tr>
                        <td>Mobile App Development</td>
                        <td>Maria Santos</td>
                        <td>₱25,000</td>
                        <td>IN PROGRESS</td>
                    </tr>
                `;
            }
        }, 500);
    }

    async loadFreelancers() {
        const list = document.getElementById('freelancersList');
        if (!list) return;
        
        setTimeout(() => {
            list.innerHTML = `
                <div class="job-card">
                    <div class="freelancer-avatar">
                        ${'MS'.split('').map(l => l[0]).join('')}
                    </div>
                    <h3>Maria Santos</h3>
                    <p class="freelancer-title">Graphic Designer</p>
                    <div class="freelancer-rating">
                        ⭐ 4.9 (15 reviews)
                    </div>
                    <p class="freelancer-skills">
                        <strong>Skills:</strong> Photoshop, Illustrator, UI/UX Design
                    </p>
                    <div class="freelancer-rate">₱500/hour</div>
                    <button class="btn-primary" onclick="app.viewFreelancerProfile(1)">
                        View Profile
                    </button>
                </div>
            `;
        }, 500);
    }

    async loadMyJobs() {
        const list = document.getElementById('postedJobsList');
        if (!list) return;
        
        setTimeout(() => {
            list.innerHTML = `
                <div class="job-card">
                    <div class="status-badge status-open">OPEN</div>
                    <h3>Website Design for Business</h3>
                    <div class="job-budget">₱15,000</div>
                    <p>Responsive website with e-commerce functionality</p>
                    <div class="job-meta">
                        <span class="category-tag">WEB</span>
                        <span>3 proposals</span>
                    </div>
                    <div class="job-actions">
                        <button class="btn-primary" onclick="app.viewJobProposals(1)">
                            View Proposals
                        </button>
                        <button class="btn-secondary" onclick="app.editJob(1)">
                            Edit
                        </button>
                    </div>
                </div>
            `;
        }, 500);
    }

    async loadMyProposals() {
        const list = document.getElementById('pendingProposalsList');
        if (!list) return;
        
        setTimeout(() => {
            list.innerHTML = `
                <div class="job-card">
                    <div class="status-badge status-pending">PENDING</div>
                    <h3>Website Design for Bakery</h3>
                    <div class="job-budget">₱15,000</div>
                    <p>Proposed: ₱14,000 • 14 days</p>
                    <p class="proposal-excerpt">I have extensive experience in creating responsive websites...</p>
                    <div class="job-meta">
                        <span>Submitted: 2 days ago</span>
                    </div>
                    <button class="btn-primary" onclick="app.viewProposalDetails(1)">
                        View Details
                    </button>
                </div>
            `;
        }, 500);
    }

    // ==========================================
    //  TAB SWITCHING FUNCTIONS
    // ==========================================
    switchAdminTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const tabContent = document.getElementById(`${tabId}Tab`);
        if (tabContent) {
            tabContent.style.display = 'block';
        }
        
        // Add active class to clicked tab
        const activeTab = document.querySelector(`.admin-tab[data-tab="${tabId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Load data for the tab if needed
        if (tabId === 'users' || tabId === 'jobs') {
            this.loadAdminData();
        }
    }

    switchMyJobsTab(tabType) {
        // Update UI for my jobs tabs
        document.querySelectorAll('.my-jobs-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabType) {
                tab.classList.add('active');
            }
        });
        
        // In a real app, this would load different job lists
        this.showAlert(`Showing ${tabType} jobs`, 'info');
    }

    switchProposalsTab(tabType) {
        // Update UI for proposals tabs
        document.querySelectorAll('.proposal-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabType) {
                tab.classList.add('active');
            }
        });
        
        // In a real app, this would load different proposal lists
        this.showAlert(`Showing ${tabType} proposals`, 'info');
    }

    // ==========================================
    //  UTILITY FUNCTIONS
    // ==========================================
    showLoading() { 
        const spinner = document.getElementById('loadingSpinner'); 
        if (spinner) spinner.style.display = 'flex'; 
    }
    
    hideLoading() { 
        const spinner = document.getElementById('loadingSpinner'); 
        if (spinner) spinner.style.display = 'none'; 
    }

    showAlert(message, type = 'info') {
        const container = document.getElementById('alertContainer');
        if (!container) return;
        
        const div = document.createElement('div');
        div.className = `alert alert-${type}`;
        div.innerHTML = `
            <i class="fas fa-${this.getAlertIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(div);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (div.parentNode === container) {
                container.removeChild(div);
            }
        }, 4000);
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            // Service worker registration can be added here
            console.log('Service Worker support detected');
        }
    }

    // ==========================================
    //  STUB FUNCTIONS (for future implementation)
    // ==========================================
    viewFreelancerProfile(id) {
        this.showAlert(`Freelancer profile ${id}`, 'info');
    }

    viewJobProposals(jobId) {
        this.showAlert(`Viewing proposals for job ${jobId}`, 'info');
    }

    editJob(jobId) {
        this.showAlert(`Editing job ${jobId}`, 'info');
    }

    viewProposalDetails(proposalId) {
        this.showAlert(`Viewing proposal ${proposalId} details`, 'info');
    }

    handleProfileUpdate(e) {
        e.preventDefault();
        this.showAlert('Profile updated successfully', 'success');
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new UEPFreelanceApp();
});