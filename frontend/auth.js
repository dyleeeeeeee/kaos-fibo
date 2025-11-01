/**
 * Authentication Module
 * Handles login, signup, and authentication state
 */

// ================================================
// CONFIGURATION
// ================================================
const CONFIG = {
    API_BASE_URL: 'https://kaos-fibo-production.up.railway.app',
    ENDPOINTS: {
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        ME: '/auth/me'
    }
};

// ================================================
// STATE MANAGEMENT
// ================================================
const authState = {
    user: null,
    token: null,
    isAuthenticated: false
};

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Store auth token in localStorage
 */
function storeToken(token) {
    localStorage.setItem('auth_token', token);
}

/**
 * Get auth token from localStorage
 */
function getToken() {
    return localStorage.getItem('auth_token');
}

/**
 * Remove auth token from localStorage
 */
function clearToken() {
    localStorage.removeItem('auth_token');
}

/**
 * Store user data in localStorage
 */
function storeUser(user) {
    localStorage.setItem('user_data', JSON.stringify(user));
}

/**
 * Get user data from localStorage
 */
function getUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Clear user data from localStorage
 */
function clearUser() {
    localStorage.removeItem('user_data');
}

/**
 * Show error message
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

/**
 * Show success message
 */
function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.remove('hidden');
        setTimeout(() => {
            successElement.classList.add('hidden');
        }, 3000);
    }
}

/**
 * Hide all messages
 */
function hideMessages() {
    const messages = document.querySelectorAll('.auth-error, .auth-success');
    messages.forEach(msg => msg.classList.add('hidden'));
}

/**
 * Set button loading state
 */
function setButtonLoading(button, loading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (loading) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        button.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        button.disabled = false;
    }
}

// ================================================
// AUTHENTICATION FUNCTIONS
// ================================================

/**
 * Handle login
 */
async function handleLogin(event) {
    event.preventDefault();
    hideMessages();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showError('loginError', 'Please fill in all fields');
        return;
    }
    
    setButtonLoading(loginBtn, true);
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store token and user data
        storeToken(data.token);
        storeUser(data.user);
        
        // Update state
        authState.token = data.token;
        authState.user = data.user;
        authState.isAuthenticated = true;
        
        showSuccess('loginSuccess', 'Login successful! Redirecting...');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', error.message);
    } finally {
        setButtonLoading(loginBtn, false);
    }
}

/**
 * Handle signup
 */
async function handleSignup(event) {
    event.preventDefault();
    hideMessages();
    
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const signupBtn = document.getElementById('signupBtn');
    
    if (!email || !password) {
        showError('signupError', 'Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError('signupError', 'Password must be at least 6 characters');
        return;
    }
    
    setButtonLoading(signupBtn, true);
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SIGNUP}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Store token and user data
        storeToken(data.token);
        storeUser(data.user);
        
        // Update state
        authState.token = data.token;
        authState.user = data.user;
        authState.isAuthenticated = true;
        
        showSuccess('signupSuccess', 'Account created! Redirecting...');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showError('signupError', error.message);
    } finally {
        setButtonLoading(signupBtn, false);
    }
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const token = getToken();
    const user = getUser();
    
    if (token && user) {
        authState.token = token;
        authState.user = user;
        authState.isAuthenticated = true;
        return true;
    }
    
    return false;
}

/**
 * Logout user
 */
function logout() {
    clearToken();
    clearUser();
    authState.token = null;
    authState.user = null;
    authState.isAuthenticated = false;
    window.location.href = 'login.html';
}

// ================================================
// EVENT LISTENERS
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if already authenticated and redirect
    if (checkAuth()) {
        // User is already logged in, redirect to home
        window.location.href = 'index.html';
        return;
    }
    
    // Auth toggle buttons
    const toggleButtons = document.querySelectorAll('.auth-toggle-btn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;
            
            // Update active button
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Toggle forms
            if (mode === 'login') {
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                signupForm.classList.add('active');
            }
            
            // Hide messages
            hideMessages();
        });
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
});
