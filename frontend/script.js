/**
 * Fibonacci Compression System - Frontend JavaScript
 * Handles user interactions, API calls, and dynamic UI updates
 */

// Configuration
const CONFIG = {
    // Backend API base URL - update this to match your backend server
    API_BASE_URL: 'https://kaos-fibo-production.up.railway.app',
    
    // API Endpoints
    ENDPOINTS: {
        COMPRESS: '/compress',
        COMPRESS_FILE: '/compress-file',
        LOGS: '/logs'
    },
    
    // UI Settings
    MAX_COMPRESSED_DISPLAY: 50, // Max characters to display in table
    PROGRESS_ANIMATION_DURATION: 300, // milliseconds
};

// State Management
const state = {
    isCompressing: false,
    compressionHistory: [],
    selectedFile: null,
};

// ================================================
// DOM ELEMENTS
// ================================================
const elements = {
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    manualTab: document.getElementById('manualTab'),
    pasteTab: document.getElementById('pasteTab'),
    fileTab: document.getElementById('fileTab'),
    
    // Input & Button
    dataInput: document.getElementById('dataInput'),
    compressBtn: document.getElementById('compressBtn'),
    
    // CSV Paste
    csvTextarea: document.getElementById('csvTextarea'),
    compressCsvBtn: document.getElementById('compressCsvBtn'),
    csvPreview: document.getElementById('csvPreview'),
    previewCount: document.getElementById('previewCount'),
    previewNumbers: document.getElementById('previewNumbers'),
    
    // File Upload
    fileInput: document.getElementById('fileInput'),
    compressFileBtn: document.getElementById('compressFileBtn'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    clearFileBtn: document.getElementById('clearFile'),
    
    // Loading & Error
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorMessage: document.getElementById('errorMessage'),
    
    // Modal
    metricsModal: document.getElementById('metricsModal'),
    modalClose: document.getElementById('modalClose'),
    modalMetricsContent: document.getElementById('modalMetricsContent'),
    
    // Metrics Area
    metricsArea: document.getElementById('metricsArea'),
    toggleAdvancedBtn: document.getElementById('toggleAdvanced'),
    advancedMetrics: document.getElementById('advancedMetrics'),
    progressBar: document.getElementById('progressBar'),
    
    // Quick Metrics
    compressionRatio: document.getElementById('compressionRatio'),
    sizeReduction: document.getElementById('sizeReduction'),
    timeTaken: document.getElementById('timeTaken'),
    
    // Advanced Metrics
    originalSize: document.getElementById('originalSize'),
    compressedSize: document.getElementById('compressedSize'),
    bytesSaved: document.getElementById('bytesSaved'),
    compressionTime: document.getElementById('compressionTime'),
    compressionSpeed: document.getElementById('compressionSpeed'),
    throughput: document.getElementById('throughput'),
    dataType: document.getElementById('dataType'),
    method: document.getElementById('method'),
    numbersCount: document.getElementById('numbersCount'),
    maxFibonacci: document.getElementById('maxFibonacci'),
    vsHuffman: document.getElementById('vsHuffman'),
    vsLZW: document.getElementById('vsLZW'),
    bestMethod: document.getElementById('bestMethod'),
    originalHash: document.getElementById('originalHash'),
    compressedHash: document.getElementById('compressedHash'),
    cpuTime: document.getElementById('cpuTime'),
    memoryUsed: document.getElementById('memoryUsed'),
    networkLatency: document.getElementById('networkLatency'),
    minValue: document.getElementById('minValue'),
    maxValue: document.getElementById('maxValue'),
    avgValue: document.getElementById('avgValue'),
    
    // Authentication
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userInfo: document.getElementById('userInfo'),
    
    // Authentication Modals
    loginModal: document.getElementById('loginModal'),
    signupModal: document.getElementById('signupModal'),
    loginModalClose: document.getElementById('loginModalClose'),
    signupModalClose: document.getElementById('signupModalClose'),
    switchToSignup: document.getElementById('switchToSignup'),
    switchToLogin: document.getElementById('switchToLogin'),
    
    // Authentication Forms
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    signupUsername: document.getElementById('signupUsername'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    signupConfirmPassword: document.getElementById('signupConfirmPassword'),
};

// ================================================
// AUTHENTICATION UI MANAGEMENT
// ================================================

// Enable compression features for authenticated users
function enableCompressionFeatures() {
    // Remove disabled styling and overlays
    const overlay = document.querySelector('.auth-required-overlay');
    if (overlay) overlay.remove();
    
    // Re-enable buttons
    elements.compressBtn.disabled = false;
    elements.compressCsvBtn.disabled = false;
    elements.compressFileBtn.disabled = false;
    
    // Remove auth-required classes
    elements.dataInput.classList.remove('auth-required');
    elements.csvTextarea.classList.remove('auth-required');
    elements.fileInput.classList.remove('auth-required');
}

// Disable compression features for unauthenticated users
function disableCompressionFeatures() {
    // Add auth-required overlay to the main card
    const glassCard = document.querySelector('.glass-card');
    if (!glassCard.querySelector('.auth-required-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'auth-required-overlay';
        overlay.innerHTML = `
            <div class="auth-required-message">
                <h3>🔐 Login Required</h3>
                <p>Please sign up or log in to use the compression features.</p>
                <div class="auth-required-buttons">
                    <button class="auth-btn login-btn" onclick="showModal(elements.loginModal)">Login</button>
                    <button class="auth-btn signup-btn" onclick="showModal(elements.signupModal)">Sign Up</button>
                </div>
            </div>
        `;
        glassCard.appendChild(overlay);
    }
    
    // Disable compression buttons
    elements.compressBtn.disabled = true;
    elements.compressCsvBtn.disabled = true;
    elements.compressFileBtn.disabled = true;
    
    // Add visual indication
    elements.dataInput.classList.add('auth-required');
    elements.csvTextarea.classList.add('auth-required');
    elements.fileInput.classList.add('auth-required');
}

// ================================================
// AUTHENTICATION STATE MANAGEMENT
// ================================================

let authState = {
    isAuthenticated: false,
    user: null,
    token: null
};

// Initialize authentication state from localStorage
function initializeAuth() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (token && user) {
        try {
            authState.token = token;
            authState.user = JSON.parse(user);
            authState.isAuthenticated = true;
            updateAuthUI();
        } catch (e) {
            // Invalid stored data, clear it
            clearAuth();
        }
    }
}

// Save authentication state to localStorage
function saveAuth(token, user) {
    authState.isAuthenticated = true;
    authState.token = token;
    authState.user = user;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
}

// Clear authentication state
function clearAuth() {
    authState.isAuthenticated = false;
    authState.token = null;
    authState.user = null;
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

// Update UI based on authentication state
function updateAuthUI() {
    if (authState.isAuthenticated) {
        elements.loginBtn.classList.add('hidden');
        elements.signupBtn.classList.add('hidden');
        elements.logoutBtn.classList.remove('hidden');
        elements.userInfo.classList.remove('hidden');
        elements.userInfo.textContent = `Welcome, ${authState.user.username}!`;
        
        // Enable compression features
        enableCompressionFeatures();
    } else {
        elements.loginBtn.classList.remove('hidden');
        elements.signupBtn.classList.remove('hidden');
        elements.logoutBtn.classList.add('hidden');
        elements.userInfo.classList.add('hidden');
        elements.userInfo.textContent = '';
        
        // Disable compression features and show login prompt
        disableCompressionFeatures();
    }
}

// ================================================
// AUTHENTICATION API CALLS
// ================================================

// Make authenticated API call
async function authenticatedFetch(url, options = {}) {
    if (!authState.token) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        'Authorization': `Bearer ${authState.token}`,
        ...options.headers
    };
    
    return fetch(url, { ...options, headers });
}

// Login user
async function loginUser(usernameOrEmail, password) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: usernameOrEmail, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Login failed');
    }
    
    return data;
}

// Signup user
async function signupUser(username, email, password) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
    }
    
    return data;
}

// Logout user
async function logoutUser() {
    try {
        await authenticatedFetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
            method: 'POST'
        });
    } catch (e) {
        // Logout on server may fail, but we clear local state anyway
        console.log('Server logout failed, clearing local state');
    }
    
    clearAuth();
    updateAuthUI();
}

// ================================================
// INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeEventListeners();
    loadCompressionHistory();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
    // Tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Manual input compress button
    elements.compressBtn.addEventListener('click', handleCompress);
    
    // Enter key in input field
    elements.dataInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCompress();
        }
    });
    
    // CSV paste handling
    elements.csvTextarea.addEventListener('input', handleCsvPaste);
    elements.compressCsvBtn.addEventListener('click', handleCsvCompress);
    
    // File upload handling
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.clearFileBtn.addEventListener('click', clearFileSelection);
    elements.compressFileBtn.addEventListener('click', handleFileCompress);
    
    // Toggle advanced metrics
    elements.toggleAdvancedBtn.addEventListener('click', toggleAdvancedMetrics);
    
    // Modal controls
    elements.modalClose.addEventListener('click', closeMetricsModal);
    elements.metricsModal.addEventListener('click', (e) => {
        if (e.target === elements.metricsModal) {
            closeMetricsModal();
        }
    });
    
    // Authentication event listeners
    elements.loginBtn.addEventListener('click', () => showModal(elements.loginModal));
    elements.signupBtn.addEventListener('click', () => showModal(elements.signupModal));
    elements.logoutBtn.addEventListener('click', logoutUser);
    
    elements.loginModalClose.addEventListener('click', () => hideModal(elements.loginModal));
    elements.signupModalClose.addEventListener('click', () => hideModal(elements.signupModal));
    
    elements.switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(elements.loginModal);
        showModal(elements.signupModal);
    });
    
    elements.switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(elements.signupModal);
        showModal(elements.loginModal);
    });
    
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.signupForm.addEventListener('submit', handleSignup);
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value;
    
    if (!username || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        const result = await loginUser(username, password);
        saveAuth(result.access_token, result.user);
        updateAuthUI();
        hideModal(elements.loginModal);
        elements.loginForm.reset();
        
        // Refresh history since we now have user-specific data
        await loadCompressionHistory();
        
        showSuccess('Login successful!');
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Handle signup form submission
 */
async function handleSignup(e) {
    e.preventDefault();
    
    const username = elements.signupUsername.value.trim();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;
    const confirmPassword = elements.signupConfirmPassword.value;
    
    if (!username || !email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    try {
        const result = await signupUser(username, email, password);
        saveAuth(result.access_token, result.user);
        updateAuthUI();
        hideModal(elements.signupModal);
        elements.signupForm.reset();
        
        showSuccess('Account created successfully!');
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Show modal
 */
function showModal(modal) {
    modal.classList.remove('hidden');
}

/**
 * Hide modal
 */
function hideModal(modal) {
    modal.classList.add('hidden');
}

/**
 * Show success message
 */
function showSuccess(message) {
    // For now, just use the error message area with different styling
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    elements.errorMessage.style.color = 'var(--success-green)';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideError();
        elements.errorMessage.style.color = 'var(--error-red)';
    }, 3000);
}

// ================================================

/**
 * Switch between manual input and file upload tabs
 * @param {string} tabName - Name of tab to switch to ('manual' or 'file')
 */
function switchTab(tabName) {
    // Update tab buttons
    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update tab content
    elements.manualTab.classList.remove('active');
    elements.pasteTab.classList.remove('active');
    elements.fileTab.classList.remove('active');
    
    if (tabName === 'manual') {
        elements.manualTab.classList.add('active');
    } else if (tabName === 'paste') {
        elements.pasteTab.classList.add('active');
    } else if (tabName === 'file') {
        elements.fileTab.classList.add('active');
    }
    
    // Clear any errors
    hideError();
}

// ================================================
// CSV PASTE HANDLING
// ================================================
/**
 * Handle CSV paste input with live preview
 */
function handleCsvPaste() {
    const csvContent = elements.csvTextarea.value.trim();
    
    if (!csvContent) {
        elements.csvPreview.classList.add('hidden');
        return;
    }
    
    try {
        // Parse CSV content
        const numbers = parseCsvContent(csvContent);
        
        if (numbers && numbers.length > 0) {
            // Show preview
            elements.csvPreview.classList.remove('hidden');
            elements.previewCount.textContent = `${numbers.length} numbers detected`;
            elements.previewNumbers.textContent = formatArrayForDisplay(numbers, 20);
            hideError();
        } else {
            elements.csvPreview.classList.add('hidden');
            showError('No valid numbers found in CSV content.');
        }
    } catch (error) {
        elements.csvPreview.classList.add('hidden');
        showError(`CSV parse error: ${error.message}`);
    }
}

/**
 * Parse CSV content from textarea
 * @param {string} csvContent - Raw CSV text
 * @returns {Array<number>} - Array of parsed positive integers
 */
function parseCsvContent(csvContent) {
    const numbers = [];
    const lines = csvContent.split(/\r?\n/);
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        // Split by comma, tab, or semicolon
        const cells = line.split(/[,;\t]/);
        
        for (const cell of cells) {
            const trimmed = cell.trim();
            
            // Skip empty cells
            if (!trimmed) continue;
            
            // Skip if starts with non-digit (likely header)
            if (!/^\d/.test(trimmed)) continue;
            
            try {
                // Parse as number
                const num = parseInt(trimmed, 10);
                
                // Validate positive integer
                if (!isNaN(num) && num > 0) {
                    numbers.push(num);
                }
            } catch (e) {
                // Skip invalid cells
                continue;
            }
        }
    }
    
    return numbers;
}

/**
 * Handle CSV compression from pasted content
 */
async function handleCsvCompress() {
    // Check authentication first
    if (!authState.isAuthenticated) {
        showError('Please login to use compression features.');
        showModal(elements.loginModal);
        return;
    }
    
    const csvContent = elements.csvTextarea.value.trim();
    
    if (!csvContent) {
        showError('Please paste some CSV content to compress.');
        return;
    }
    
    try {
        // Parse CSV content
        const numbers = parseCsvContent(csvContent);
        
        if (!numbers || numbers.length === 0) {
            showError('No valid numerical data found in CSV content.');
            return;
        }
        
        // Start compression
        setCompressionState(true);
        hideError();
        
    try {
        // Prepare request payload
        const payload = {
            data: numbers,
            timestamp: new Date().toISOString()
        };
        
        // Make API call
        const startTime = performance.now();
        const response = await (authState.isAuthenticated 
            ? authenticatedFetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
            : fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            }));
        
        const endTime = performance.now();
        const networkLatency = endTime - startTime;
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Add network latency to result
        result.metrics = result.metrics || {};
        result.metrics.network_latency = networkLatency;
        
        // Display results
        displayCompressionResults(result);
        
        // Update history
        await loadCompressionHistory();
        
        // Clear textarea
        elements.csvTextarea.value = '';
        elements.csvPreview.classList.add('hidden');
        
    } catch (error) {
        console.error('CSV compression error:', error);
        showError(`Failed to compress CSV: ${error.message}`);
    } finally {
        setCompressionState(false);
    }
}

// ================================================
// FILE UPLOAD HANDLING
// ================================================
/**
 * Handle file selection
 * @param {Event} event - File input change event
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel'];
    const validExtensions = ['.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showError('Invalid file type. Please upload a CSV file only.');
        clearFileSelection();
        return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        showError('File is too large. Maximum size is 10MB.');
        clearFileSelection();
        return;
    }
    
    // Store file and display info
    state.selectedFile = file;
    displayFileInfo(file);
    hideError();
}

/**
 * Display file information
 * @param {File} file - Selected file object
 */
function displayFileInfo(file) {
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatBytes(file.size);
    elements.fileInfo.classList.remove('hidden');
}

/**
 * Clear file selection
 */
function clearFileSelection() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.fileInfo.classList.add('hidden');
    hideError();
}

/**
 * Handle file compression
 */
async function handleFileCompress() {
    // Check authentication first
    if (!authState.isAuthenticated) {
        showError('Please login to use compression features.');
        showModal(elements.loginModal);
        return;
    }
    
    // Validate file is selected
    if (!state.selectedFile) {
        showError('Please select a file to compress.');
        return;
    }
    
    // Start compression
    setCompressionState(true);
    hideError();
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', state.selectedFile);
        formData.append('timestamp', new Date().toISOString());
        
        // Make API call
        const startTime = performance.now();
        const response = await (authState.isAuthenticated 
            ? authenticatedFetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS_FILE}`, {
                method: 'POST',
                body: formData  // Don't set Content-Type header - browser will set it with boundary
            })
            : fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS_FILE}`, {
                method: 'POST',
                body: formData  // Don't set Content-Type header - browser will set it with boundary
            }));
        
        const endTime = performance.now();
        const networkLatency = endTime - startTime;
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Add network latency to result
        result.metrics = result.metrics || {};
        result.metrics.network_latency = networkLatency;
        
        // Display results
        displayCompressionResults(result);
        
        // Update history
        await loadCompressionHistory();
        
        // Clear file selection
        clearFileSelection();
        
    } catch (error) {
        console.error('File compression error:', error);
        showError(`Failed to compress file: ${error.message}`);
    } finally {
        setCompressionState(false);
    }
}

// ================================================
// COMPRESSION HANDLING
// ================================================
/**
 * Main compression handler
 */
async function handleCompress() {
    // Check authentication first
    if (!authState.isAuthenticated) {
        showError('Please login to use compression features.');
        showModal(elements.loginModal);
        return;
    }
    
    // Validate input
    const inputValue = elements.dataInput.value.trim();
    if (!inputValue) {
        showError('Please enter some data to compress.');
        return;
    }
    
    // Parse and validate numerical input
    const numbers = parseInput(inputValue);
    if (!numbers) {
        return; // Error already shown in parseInput
    }
    
    // Start compression
    setCompressionState(true);
    hideError();
    
    try {
        // Prepare request payload
        const payload = {
            data: numbers,
            timestamp: new Date().toISOString()
        };
        
        // Make API call
        const startTime = performance.now();
        const response = await (authState.isAuthenticated 
            ? authenticatedFetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
            : fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            }));
        
        const endTime = performance.now();
        const networkLatency = endTime - startTime;
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Add network latency to result
        result.metrics = result.metrics || {};
        result.metrics.network_latency = networkLatency;
        
        // Display results
        displayCompressionResults(result);
        
        // Update history
        await loadCompressionHistory();
        
        // Clear input
        elements.dataInput.value = '';
        
    } catch (error) {
        console.error('Compression error:', error);
        showError(`Failed to compress data: ${error.message}`);
    } finally {
        setCompressionState(false);
    }
}

/**
 * Parse and validate input string
 * @param {string} input - User input string
 * @returns {number[]|null} - Array of numbers or null if invalid
 */
function parseInput(input) {
    // Split by comma and trim whitespace
    const parts = input.split(',').map(s => s.trim());
    const numbers = [];
    
    for (const part of parts) {
        // Check if empty
        if (part === '') {
            showError('Invalid input: Empty values detected. Please enter comma-separated integers.');
            return null;
        }
        
        // Try to parse as integer
        const num = parseInt(part, 10);
        
        // Validate
        if (isNaN(num)) {
            showError(`Invalid input: "${part}" is not a valid integer.`);
            return null;
        }
        
        if (num <= 0) {
            showError(`Invalid input: "${num}" is not a positive integer. Only positive integers are supported.`);
            return null;
        }
        
        numbers.push(num);
    }
    
    if (numbers.length === 0) {
        showError('Invalid input: No valid numbers found.');
        return null;
    }
    
    return numbers;
}

/**
 * Display compression results in the metrics area
 * @param {Object} result - Compression result from API
 */
function displayCompressionResults(result) {
    const metrics = result.metrics || {};
    
    // Show metrics area
    elements.metricsArea.classList.remove('hidden');
    
    // Animate progress bar
    animateProgressBar();
    
    // Update quick metrics
    elements.compressionRatio.textContent = metrics.compression_ratio || '-';
    elements.sizeReduction.textContent = metrics.size_reduction_percentage || '-';
    elements.timeTaken.textContent = formatTime(metrics.compression_time);
    
    // Update advanced metrics - Size
    elements.originalSize.textContent = metrics.original_size || '-';
    elements.compressedSize.textContent = metrics.compressed_size || '-';
    elements.bytesSaved.textContent = metrics.bytes_saved || '-';
    
    // Performance
    elements.compressionTime.textContent = formatTime(metrics.compression_time);
    elements.compressionSpeed.textContent = metrics.compression_speed || '-';
    elements.throughput.textContent = metrics.throughput || '-';
    
    // File Details
    elements.dataType.textContent = 'Numerical';
    elements.method.textContent = 'Fibonacci Coding';
    elements.numbersCount.textContent = metrics.numbers_count || '-';
    
    // Algorithm Specific
    elements.maxFibonacci.textContent = formatNumber(metrics.max_fibonacci_used) || '-';
    
    // Comparative
    if (metrics.comparative) {
        const comp = metrics.comparative;
        elements.vsHuffman.textContent = comp.vs_huffman || '-';
        elements.vsLZW.textContent = comp.vs_lzw || '-';
        elements.bestMethod.textContent = comp.best_method || '-';
    }
    
    // Integrity
    elements.originalHash.textContent = truncateHash(metrics.original_hash);
    elements.compressedHash.textContent = truncateHash(metrics.compressed_hash);
    
    // Resource Usage
    elements.cpuTime.textContent = formatTime(metrics.cpu_time);
    elements.memoryUsed.textContent = metrics.memory_used || '-';  // Already formatted by backend
    elements.networkLatency.textContent = formatTime(metrics.network_latency, 'ms');
    
    // Batch Statistics
    if (metrics.batch_stats) {
        const stats = metrics.batch_stats;
        elements.minValue.textContent = formatNumber(stats.min_value);
        elements.maxValue.textContent = formatNumber(stats.max_value);
        elements.avgValue.textContent = formatNumber(stats.avg_value);
    }
}

/**
 * Animate the progress bar
 */
function animateProgressBar() {
    elements.progressBar.style.width = '0%';
    setTimeout(() => {
        elements.progressBar.style.width = '100%';
    }, 50);
}

/**
 * Toggle advanced metrics visibility
 */
function toggleAdvancedMetrics() {
    const isHidden = elements.advancedMetrics.classList.contains('hidden');
    
    if (isHidden) {
        elements.advancedMetrics.classList.remove('hidden');
        elements.toggleAdvancedBtn.textContent = 'Hide Advanced';
    } else {
        elements.advancedMetrics.classList.add('hidden');
        elements.toggleAdvancedBtn.textContent = 'Show Advanced';
    }
}

// ================================================
// HISTORY MANAGEMENT
// ================================================
/**
 * Load compression history from backend
 */
async function loadCompressionHistory() {
    // Only load history if authenticated
    if (!authState.isAuthenticated) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGS}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to load history');
        }
        
        const logs = await response.json();
        state.compressionHistory = logs;
        
        displayHistory(logs);
        
    } catch (error) {
        console.error('Failed to load compression history:', error);
        // Don't show error to user, just log it
    }
}

/**
 * Display compression history in table
 * @param {Array} history - Array of compression records
 */
function displayHistory(history) {
    // Clear existing rows
    elements.historyTableBody.innerHTML = '';
    
    if (!history || history.length === 0) {
        elements.noHistory.classList.remove('hidden');
        return;
    }
    
    elements.noHistory.classList.add('hidden');
    
    // Backend already returns newest first (sorted by timestamp desc)
    history.forEach((record, index) => {
        const row = createHistoryRow(record, index + 1);
        elements.historyTableBody.appendChild(row);
    });
}

/**
 * Create a table row for a history record
 * @param {Object} record - Compression record
 * @param {number} id - Row ID
 * @returns {HTMLElement} - Table row element
 */
function createHistoryRow(record, id) {
    const row = document.createElement('tr');
    const metrics = record.metrics || {};
    const comparative = metrics.comparative || {};
    
    // ID
    const idCell = document.createElement('td');
    idCell.textContent = id;
    idCell.className = 'cell-center';
    row.appendChild(idCell);
    
    // Input (truncated)
    const inputCell = document.createElement('td');
    const inputPreview = formatArrayForDisplay(record.raw_input);
    inputCell.textContent = truncateString(inputPreview, 20);
    inputCell.title = inputPreview;
    row.appendChild(inputCell);
    
    // Size (original → compressed)
    const sizeCell = document.createElement('td');
    sizeCell.innerHTML = `<span class="size-info">${metrics.compressed_size || '-'}</span>`;
    sizeCell.title = `Original: ${metrics.original_size || '-'}`;
    row.appendChild(sizeCell);
    
    // Compression Ratio
    const ratioCell = document.createElement('td');
    ratioCell.textContent = metrics.compression_ratio || record.compression_ratio || '-';
    ratioCell.className = 'cell-center';
    row.appendChild(ratioCell);
    
    // Size Reduction
    const reductionCell = document.createElement('td');
    reductionCell.textContent = metrics.size_reduction_percentage || record.size_reduction || '-';
    reductionCell.className = 'cell-center metric-highlight';
    row.appendChild(reductionCell);
    
    // Time
    const timeCell = document.createElement('td');
    timeCell.textContent = formatTime(metrics.compression_time || record.time_taken);
    timeCell.className = 'cell-center';
    row.appendChild(timeCell);
    
    // Speed
    const speedCell = document.createElement('td');
    speedCell.textContent = metrics.compression_speed || '-';
    row.appendChild(speedCell);
    
    // Best Method
    const methodCell = document.createElement('td');
    const bestMethod = comparative.best_method || 'Fibonacci';
    methodCell.innerHTML = `<span class="method-badge ${bestMethod.toLowerCase()}">${bestMethod}</span>`;
    methodCell.className = 'cell-center';
    row.appendChild(methodCell);
    
    // Details Button
    const detailsCell = document.createElement('td');
    detailsCell.className = 'cell-center';
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'details-btn';
    detailsBtn.textContent = 'View';
    detailsBtn.onclick = () => showMetricsDetails(record, id);
    detailsCell.appendChild(detailsBtn);
    row.appendChild(detailsCell);
    
    return row;
}

/**
 * Show detailed metrics in modal
 * @param {Object} record - Compression record
 * @param {number} id - Record ID
 */
function showMetricsDetails(record, id) {
    const metrics = record.metrics || {};
    const comparative = metrics.comparative || {};
    const batchStats = metrics.batch_stats || {};
    
    const html = `
        <div class="modal-section">
            <h4>📋 Record #${id}</h4>
            <p><strong>Timestamp:</strong> ${record.timestamp ? new Date(record.timestamp).toLocaleString() : '-'}</p>
            <p><strong>Input Data:</strong> ${formatArrayForDisplay(record.raw_input)}</p>
        </div>
        
        <div class="modal-section">
            <h4>📏 Size Metrics</h4>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Original Size:</span>
                    <span class="metric-value">${metrics.original_size || '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Compressed Size:</span>
                    <span class="metric-value">${metrics.compressed_size || '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Bytes Saved:</span>
                    <span class="metric-value">${metrics.bytes_saved || '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Compression Ratio:</span>
                    <span class="metric-value">${metrics.compression_ratio || '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Size Reduction:</span>
                    <span class="metric-value highlight">${metrics.size_reduction_percentage || '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>⚡ Performance Metrics</h4>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Compression Time:</span>
                    <span class="metric-value">${formatTime(metrics.compression_time)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Compression Speed:</span>
                    <span class="metric-value">${metrics.compression_speed || '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Throughput:</span>
                    <span class="metric-value">${metrics.throughput || '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">CPU Time:</span>
                    <span class="metric-value">${formatTime(metrics.cpu_time)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Memory Used:</span>
                    <span class="metric-value">${metrics.memory_used || '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>🔬 Algorithm Metrics</h4>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Method:</span>
                    <span class="metric-value">${metrics.method || 'Fibonacci Coding'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Max Fibonacci:</span>
                    <span class="metric-value">${formatNumber(metrics.max_fibonacci_used)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Encoding:</span>
                    <span class="metric-value">${metrics.encoding_method || "Zeckendorf's Theorem"}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Prefix-Free:</span>
                    <span class="metric-value">${metrics.prefix_free ? '✓ Yes' : '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Lossless:</span>
                    <span class="metric-value">${metrics.integrity_verified ? '✓ Verified' : '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>📊 Comparative Analysis</h4>
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>Size</th>
                        <th>Ratio</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="${comparative.best_method === 'Fibonacci' ? 'best-method' : ''}">
                        <td><strong>Fibonacci</strong></td>
                        <td>${comparative.fibonacci?.size || '-'}</td>
                        <td>${comparative.fibonacci?.ratio || '-'}</td>
                        <td>${comparative.fibonacci?.time || '-'}</td>
                    </tr>
                    <tr class="${comparative.best_method === 'Huffman' ? 'best-method' : ''}">
                        <td><strong>Huffman</strong></td>
                        <td>${comparative.huffman?.size || '-'}</td>
                        <td>${comparative.huffman?.ratio || '-'}</td>
                        <td>${comparative.huffman?.time || '-'}</td>
                    </tr>
                    <tr class="${comparative.best_method === 'LZW' ? 'best-method' : ''}">
                        <td><strong>LZW</strong></td>
                        <td>${comparative.lzw?.size || '-'}</td>
                        <td>${comparative.lzw?.ratio || '-'}</td>
                        <td>${comparative.lzw?.time || '-'}</td>
                    </tr>
                </tbody>
            </table>
            <p class="comparison-summary">
                <strong>Best Method:</strong> <span class="method-badge ${comparative.best_method?.toLowerCase() || 'fibonacci'}">${comparative.best_method || 'Fibonacci'}</span>
                <br>
                <strong>vs Huffman:</strong> ${comparative.vs_huffman || '-'} | 
                <strong>vs LZW:</strong> ${comparative.vs_lzw || '-'}
            </p>
        </div>
        
        <div class="modal-section">
            <h4>📦 Batch Statistics</h4>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Numbers Count:</span>
                    <span class="metric-value">${batchStats.count || metrics.numbers_count || '-'}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Min Value:</span>
                    <span class="metric-value">${formatNumber(batchStats.min_value)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Max Value:</span>
                    <span class="metric-value">${formatNumber(batchStats.max_value)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Average Value:</span>
                    <span class="metric-value">${batchStats.avg_value || '-'}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>🔐 Integrity</h4>
            <div class="metric-grid">
                <div class="metric-item">
                    <span class="metric-label">Original Hash:</span>
                    <span class="metric-value hash">${truncateHash(metrics.original_hash)}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Compressed Hash:</span>
                    <span class="metric-value hash">${truncateHash(metrics.compressed_hash)}</span>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h4>💾 Compressed Data Preview</h4>
            <div class="compressed-data-preview">
                ${truncateString(record.compressed_data, 200)}
            </div>
        </div>
    `;
    
    elements.modalMetricsContent.innerHTML = html;
    elements.metricsModal.classList.remove('hidden');
}

/**
 * Close metrics detail modal
 */
function closeMetricsModal() {
    elements.metricsModal.classList.add('hidden');
}

// ================================================
// UI STATE MANAGEMENT
// ================================================
/**
 * Set compression state (loading/idle)
 * @param {boolean} isCompressing - Whether compression is in progress
 */
function setCompressionState(isCompressing) {
    state.isCompressing = isCompressing;
    
    if (isCompressing) {
        elements.compressBtn.disabled = true;
        elements.dataInput.disabled = true;
        elements.loadingIndicator.classList.remove('hidden');
    } else {
        elements.compressBtn.disabled = false;
        elements.dataInput.disabled = false;
        elements.loadingIndicator.classList.add('hidden');
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

/**
 * Hide error message
 */
function hideError() {
    elements.errorMessage.classList.add('hidden');
}

// ================================================
// UTILITY FUNCTIONS
// ================================================
/**
 * Format time value with appropriate unit
 * @param {number} value - Time value in seconds or milliseconds
 * @param {string} inputUnit - Input unit ('s' or 'ms')
 * @returns {string} - Formatted time string
 */
function formatTime(value, inputUnit = 's') {
    if (value === undefined || value === null) return '-';
    
    let milliseconds = inputUnit === 'ms' ? value : value * 1000;
    
    if (milliseconds < 1) {
        return `${(milliseconds * 1000).toFixed(2)}μs`;
    } else if (milliseconds < 1000) {
        return `${milliseconds.toFixed(2)}ms`;
    } else {
        return `${(milliseconds / 1000).toFixed(2)}s`;
    }
}

/**
 * Format bytes with appropriate unit
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted bytes string
 */
function formatBytes(bytes) {
    if (bytes === undefined || bytes === null) return '-';
    
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString();
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
function truncateString(str, maxLength) {
    if (!str) return '-';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Truncate hash for display
 * @param {string} hash - Hash string
 * @returns {string} - Truncated hash
 */
function truncateHash(hash) {
    if (!hash) return '-';
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

/**
 * Format array for display
 * @param {Array} arr - Array to format
 * @param {number} maxCount - Maximum numbers to show
 * @returns {string} - Formatted array string
 */
function formatArrayForDisplay(arr, maxCount = 10) {
    if (!arr || arr.length === 0) return '-';
    if (arr.length <= maxCount) return arr.join(', ');
    return `${arr.slice(0, maxCount).join(', ')}... (+${arr.length - maxCount} more)`;
}

// ================================================
// ERROR HANDLING
// ================================================
/**
 * Global error handler for unhandled errors
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ================================================
// EXPORT FOR TESTING (if needed)
// ================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseInput,
        formatTime,
        formatBytes,
        formatNumber,
        truncateString,
        truncateHash,
        formatArrayForDisplay
    };
}
