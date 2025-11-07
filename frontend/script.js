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
    user: null,
    token: null,
    isAuthenticated: false
};

// ================================================
// AUTHENTICATION UTILITIES
// ================================================

function getToken() {
    return localStorage.getItem('auth_token');
}

function getUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

function clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    state.token = null;
    state.user = null;
    state.isAuthenticated = false;
}

function checkAuth() {
    const token = getToken();
    const user = getUser();
    
    if (token && user) {
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
        updateAuthUI();
        return true;
    }
    
    return false;
}

function updateAuthUI() {
    const loginLink = document.getElementById('loginLink');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const welcomeUserName = document.getElementById('welcomeUserName');
    
    if (state.isAuthenticated && state.user) {
        // Hide login link, show user menu
        if (loginLink) loginLink.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (userName) userName.textContent = state.user.email;
        
        // Show welcome message on index page
        if (welcomeMessage && welcomeUserName) {
            welcomeMessage.classList.remove('hidden');
            welcomeUserName.textContent = state.user.email;
        }
    } else {
        // Show login link, hide user menu
        if (loginLink) loginLink.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
        
        // Hide welcome message
        if (welcomeMessage) welcomeMessage.classList.add('hidden');
    }
}

function logout() {
    clearAuth();
    window.location.href = 'login.html';
}

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
    
    // History Table
    historyTableBody: document.getElementById('historyTableBody'),
    noHistory: document.getElementById('noHistory'),
    historyLoading: document.getElementById('historyLoading'),
};

// ================================================
// INITIALIZATION
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status and require login for index page
    const isIndexPage = window.location.pathname.endsWith('index.html') || 
                        window.location.pathname.endsWith('/') ||
                        window.location.pathname === '/kaos-fib/frontend/' ||
                        window.location.pathname === '/kaos-fib/frontend/index.html';
    
    if (isIndexPage && !checkAuth()) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    // For other pages, just update UI based on auth status
    checkAuth();
    
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
    
    // User menu
    const userMenuTrigger = document.getElementById('userMenuTrigger');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (userMenuTrigger && userMenuDropdown) {
        userMenuTrigger.addEventListener('click', () => {
            userMenuDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userMenuDropdown.classList.add('hidden');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ================================================
// TAB SWITCHING
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
        
        // Prepare request payload
        const payload = {
            data: numbers,
            timestamp: new Date().toISOString()
        };
        
        // Make API call
        const startTime = performance.now();
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
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
        hideError();
        
        // Show success toast
        showToast('CSV data compressed successfully!', 'success');
        
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
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS_FILE}`, {
            method: 'POST',
            body: formData  // Don't set Content-Type header - browser will set it with boundary
        });
        
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
        
        // Show success toast
        showToast('File compressed successfully!', 'success');
        
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
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.COMPRESS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
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
        hideError();
        
        // Show success toast
        showToast('Compression completed successfully!', 'success');
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
    
    // Show metrics area with smooth animation
    elements.metricsArea.classList.remove('hidden');
    
    // Smooth scroll to metrics
    setTimeout(() => {
        elements.metricsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
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
// CHART MANAGEMENT (MODAL)
// ================================================
/**
 * Modal chart instances storage
 */
const modalCharts = {
    comparison: null,
    size: null,
    performance: null
};

/**
 * Chart color scheme
 */
const chartColors = {
    fibonacci: 'rgba(54, 162, 235, 0.8)',
    huffman: 'rgba(255, 99, 132, 0.8)',
    lzw: 'rgba(255, 206, 86, 0.8)',
    original: 'rgba(255, 99, 132, 0.8)',
    compressed: 'rgba(75, 192, 192, 0.8)',
    primary: 'rgba(54, 162, 235, 0.8)',
    secondary: 'rgba(153, 102, 255, 0.8)',
    success: 'rgba(75, 192, 192, 0.8)',
    info: 'rgba(54, 162, 235, 0.8)',
    warning: 'rgba(255, 206, 86, 0.8)',
    danger: 'rgba(255, 99, 132, 0.8)'
};

/**
 * Initialize modal comparison chart
 * @param {Object} comparative - Comparative metrics data
 */
function initModalComparisonChart(comparative) {
    const ctx = document.getElementById('modalComparisonChart');
    if (!ctx) return;
    
    if (modalCharts.comparison) {
        modalCharts.comparison.destroy();
    }
    
    // Extract ratios from comparative data
    const fibRatio = parseFloat(comparative?.fibonacci?.ratio) || 0;
    const huffmanRatio = parseFloat(comparative?.huffman?.ratio) || 0;
    const lzwRatio = parseFloat(comparative?.lzw?.ratio) || 0;
    
    modalCharts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Fibonacci', 'Huffman', 'LZW'],
            datasets: [{
                label: 'Compression Ratio',
                data: [fibRatio, huffmanRatio, lzwRatio],
                backgroundColor: [
                    chartColors.fibonacci,
                    chartColors.huffman,
                    chartColors.lzw
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Compression Ratio',
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12
                        }
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 9 : 11
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 9 : 11
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize modal size metrics chart
 * @param {Object} metrics - Metrics object with size data
 */
function initModalSizeChart(metrics) {
    const ctx = document.getElementById('modalSizeChart');
    if (!ctx) return;
    
    if (modalCharts.size) {
        modalCharts.size.destroy();
    }
    
    // Parse size values from metrics
    const originalSize = parseSizeValue(metrics?.original_size) || 0;
    const compressedSize = parseSizeValue(metrics?.compressed_size) || 0;
    const bytesSaved = parseSizeValue(metrics?.bytes_saved) || 0;
    
    modalCharts.size = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Original', 'Compressed', 'Saved'],
            datasets: [{
                label: 'Size (bytes)',
                data: [originalSize, compressedSize, bytesSaved],
                backgroundColor: [
                    chartColors.danger,
                    chartColors.success,
                    chartColors.info
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Size (bytes)',
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12
                        }
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 9 : 11
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 9 : 11
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize modal performance timeline graph (line graph)
 * @param {Object} metrics - Metrics object with performance data
 */
function initModalPerformanceChart(metrics) {
    const ctx = document.getElementById('modalPerformanceChart');
    if (!ctx) return;
    
    if (modalCharts.performance) {
        modalCharts.performance.destroy();
    }
    
    // Parse time values to milliseconds
    const compressionTime = parseTimeValue(metrics.compression_time) || 0;
    const cpuTime = parseTimeValue(metrics.cpu_time) || 0;
    const networkLatency = parseTimeValue(metrics.network_latency, 'ms') || 0;
    const totalTime = compressionTime + cpuTime + networkLatency;
    
    // Parse size values to bytes
    const originalSize = parseSizeValue(metrics.original_size) || 0;
    const compressedSize = parseSizeValue(metrics.compressed_size) || 0;
    
    // Create timeline data: Time on X-axis, Data Size on Y-axis
    const timelineData = [
        { time: 0, size: originalSize, label: 'Start' },
        { time: compressionTime * 0.5, size: originalSize * 0.7, label: 'Compressing...' },
        { time: compressionTime, size: compressedSize, label: 'Compressed' },
        { time: compressionTime + cpuTime, size: compressedSize, label: 'CPU Done' },
        { time: totalTime, size: compressedSize, label: 'Complete' }
    ];
    
    // Create compression rate line (bytes per millisecond)
    const compressionRate = compressionTime > 0 ? (originalSize - compressedSize) / compressionTime : 0;
    const rateData = timelineData.map(point => {
        if (point.time === 0) return 0;
        if (point.time <= compressionTime) return compressionRate;
        return 0;
    });
    
    modalCharts.performance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.map(d => d.time.toFixed(2)),
            datasets: [
                {
                    label: 'Data Size (bytes)',
                    data: timelineData.map(d => d.size),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.15)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 9,
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Compression Rate (bytes/ms)',
                    data: rateData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.1,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12
                        },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: function(context) {
                            const dataPoint = timelineData[context[0].dataIndex];
                            return `${dataPoint.label} (${context[0].label} ms)`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            if (context.datasetIndex === 0) {
                                return `Size: ${formatBytes(value)}`;
                            } else {
                                return value > 0 ? `Rate: ${formatBytes(value)}/ms` : 'No compression';
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Time (milliseconds)',
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 9 : 11
                        },
                        callback: function(value) {
                            return value.toFixed(1) + ' ms';
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Data Size',
                        font: {
                            size: window.innerWidth < 640 ? 10 : 12,
                            weight: 'bold'
                        },
                        color: 'rgba(54, 162, 235, 1)'
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 9 : 11
                        },
                        color: 'rgba(54, 162, 235, 1)',
                        callback: function(value) {
                            return formatBytes(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Compression Rate',
                        font: {
                            size: window.innerWidth < 640 ? 9 : 11,
                            weight: 'bold'
                        },
                        color: 'rgba(75, 192, 192, 1)'
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 640 ? 8 : 10
                        },
                        color: 'rgba(75, 192, 192, 1)',
                        callback: function(value) {
                            return formatBytes(value) + '/ms';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

/**
 * Parse size value string to number (in bytes)
 * @param {string} sizeStr - Size string with unit (e.g., "1.5 KB")
 * @returns {number} - Size in bytes
 */
function parseSizeValue(sizeStr) {
    if (!sizeStr || typeof sizeStr !== 'string') return 0;
    
    const match = sizeStr.match(/([\d.]+)\s*(\w+)/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers = {
        'BYTES': 1,
        'BYTE': 1,
        'B': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024
    };
    
    return value * (multipliers[unit] || 1);
}

/**
 * Parse time value to milliseconds
 * @param {number|string} timeValue - Time value
 * @param {string} inputUnit - Input unit ('s', 'ms', or 'μs')
 * @returns {number} - Time in milliseconds
 */
function parseTimeValue(timeValue, inputUnit = 's') {
    if (timeValue === undefined || timeValue === null) return 0;
    
    // If it's a string, try to parse it
    if (typeof timeValue === 'string') {
        const match = timeValue.match(/([\d.]+)(μs|ms|s)?/);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2] || 's';
        
        if (unit === 'μs') return value / 1000;
        if (unit === 'ms') return value;
        if (unit === 's') return value * 1000;
    }
    
    // If it's a number
    const value = parseFloat(timeValue);
    if (isNaN(value)) return 0;
    
    if (inputUnit === 'μs') return value / 1000;
    if (inputUnit === 'ms') return value;
    if (inputUnit === 's') return value * 1000;
    
    return value;
}

// ================================================
// HISTORY MANAGEMENT
// ================================================
/**
 * Load compression history from backend
 */
async function loadCompressionHistory() {
    try {
        // Show loading indicator
        if (elements.historyLoading) {
            elements.historyLoading.classList.remove('hidden');
        }
        if (elements.noHistory) {
            elements.noHistory.classList.add('hidden');
        }
        
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGS}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to load history');
        }
        
        const logs = await response.json();
        state.compressionHistory = logs;
        
        displayHistory(logs);
        
    } catch (error) {
        console.error('Failed to load compression history:', error);
        // Show no history message on error
        if (elements.noHistory) {
            elements.noHistory.classList.remove('hidden');
            elements.noHistory.textContent = 'Failed to load compression history. Please refresh the page.';
        }
    } finally {
        // Hide loading indicator
        if (elements.historyLoading) {
            elements.historyLoading.classList.add('hidden');
        }
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
        <div class="modal-download-section">
            <button class="download-btn" onclick="downloadCompressedData(${id}, '${escapeHtml(record.compressed_data || '')}', '${metrics.method || 'fibonacci'}')">
                <span class="download-icon">⬇️</span>
                <span class="download-text">Download Compressed File</span>
                <span class="download-size">${metrics.compressed_size || 'N/A'} <span class="original-size">(Original: ${metrics.original_size || 'N/A'})</span></span>
            </button>
        </div>
        
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
            <div class="compressed-data-preview" id="compressedDataPreview" data-full="${escapeHtml(record.compressed_data || '')}">
                ${truncateString(record.compressed_data, 200)}
            </div>
            ${record.compressed_data && record.compressed_data.length > 200 ? 
                '<button class="show-more-btn" onclick="toggleDataPreview()">Show More</button>' : ''}
        </div>
    `;
    
    elements.modalMetricsContent.innerHTML = html;
    
    // Initialize modal charts with the record's data
    initModalComparisonChart(comparative);
    initModalSizeChart(metrics);
    initModalPerformanceChart(metrics);
    
    // Show modal
    elements.metricsModal.classList.remove('hidden');
    
    // Reset scroll position to top
    const modalContent = elements.metricsModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

/**
 * Close metrics detail modal
 */
function closeMetricsModal() {
    elements.metricsModal.classList.add('hidden');
}

/**
 * Download compressed data as a file
 * @param {number} recordId - Record ID
 * @param {string} compressedData - Compressed data string
 * @param {string} method - Compression method used
 */
function downloadCompressedData(recordId, compressedData, method) {
    if (!compressedData) {
        showToast('No compressed data available to download', 'error');
        return;
    }
    
    try {
        // Create blob from compressed data
        const blob = new Blob([compressedData], { type: 'application/octet-stream' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp and method
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `compressed_${method}_record${recordId}_${timestamp}.fib`;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showToast('Compressed file downloaded successfully!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download compressed file', 'error');
    }
}

/**
 * Toggle expanded/collapsed state of compressed data preview
 */
function toggleDataPreview() {
    const preview = document.getElementById('compressedDataPreview');
    const btn = event.target;
    
    if (!preview) return;
    
    const fullData = preview.getAttribute('data-full');
    const isExpanded = btn.textContent === 'Show Less';
    
    if (isExpanded) {
        preview.textContent = truncateString(fullData, 200);
        btn.textContent = 'Show More';
    } else {
        preview.textContent = fullData;
        btn.textContent = 'Show Less';
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success', 'error', 'info', 'warning')
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    }[type] || 'ℹ';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);
    
    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
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
