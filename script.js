// Global utility functions and shared JavaScript functionality

// Toast notification system
function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showToast(message, type) {
    const toastId = type === 'error' ? 'errorToast' : 'successToast';
    const toast = document.getElementById(toastId);
    
    if (!toast) {
        console.error(`Toast element with ID '${toastId}' not found`);
        return;
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Password visibility toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentNode.querySelector('.password-toggle');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.708zm.792.887a4.5 4.5 0 0 0 5.517 5.517l.82.82a5.5 5.5 0 0 1-7.157-7.157l.82.82z"/>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
            </svg>
        `;
    }
}

// Authentication helpers
function getAuthToken() {
    return localStorage.getItem('token');
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function isAuthenticated() {
    return !!getAuthToken();
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.isAdmin === true;
}

function clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// API request helper with authentication
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        
        // Handle unauthorized responses
        if (response.status === 401 || response.status === 403) {
            clearAuthData();
            window.location.href = 'login.html';
            throw new Error('Authentication failed');
        }
        
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Modal management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Close modal when clicking outside
function setupModalCloseHandlers() {
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal[style*="display: block"]');
            openModals.forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = 'auto';
        }
    });
}

// Initialize modal handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', setupModalCloseHandlers);

// Form validation helpers
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    return usernameRegex.test(username);
}

// Format currency for Indonesian Rupiah
function formatCurrency(amount) {
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
}

// Format date for Indonesian locale
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Loading state management
function setLoadingState(element, isLoading, originalText = 'Submit') {
    if (!element) return;
    
    const spinner = element.querySelector('.loading-spinner');
    const textElement = element.querySelector('span') || element;
    
    if (isLoading) {
        element.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (textElement !== element) {
            textElement.textContent = 'Memproses...';
        } else {
            element.textContent = 'Memproses...';
        }
    } else {
        element.disabled = false;
        if (spinner) spinner.style.display = 'none';
        if (textElement !== element) {
            textElement.textContent = originalText;
        } else {
            element.textContent = originalText;
        }
    }
}

// Network error handling
function handleNetworkError(error) {
    console.error('Network error:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } else if (error.message.includes('Authentication failed')) {
        showError('Sesi Anda telah berakhir. Silakan masuk kembali.');
    } else {
        showError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    }
}

// Safe JSON parsing
function safeJsonParse(jsonString, defaultValue = null) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('JSON parsing error:', error);
        return defaultValue;
    }
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Scroll to top utility
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Check if element is in viewport
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Setup auto-resize for all textareas
function setupAutoResizeTextareas() {
    document.querySelectorAll('textarea[data-auto-resize]').forEach(textarea => {
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
        autoResizeTextarea(textarea); // Initial resize
    });
}

// Initialize auto-resize when DOM is loaded
document.addEventListener('DOMContentLoaded', setupAutoResizeTextareas);

// Generate random string for voucher codes
function generateRandomString(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Teks berhasil disalin ke clipboard');
    } catch (error) {
        console.error('Failed to copy text:', error);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showSuccess('Teks berhasil disalin ke clipboard');
        } catch (fallbackError) {
            showError('Gagal menyalin teks ke clipboard');
        }
        document.body.removeChild(textArea);
    }
}

// Local storage helpers with error handling
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to read from localStorage:', error);
        return defaultValue;
    }
}

function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Failed to remove from localStorage:', error);
        return false;
    }
}

// Connection status monitoring
function setupConnectionMonitoring() {
    function updateConnectionStatus() {
        if (navigator.onLine) {
            // Connection restored
            const offlineIndicator = document.querySelector('.offline-indicator');
            if (offlineIndicator) {
                offlineIndicator.remove();
            }
        } else {
            // Connection lost
            if (!document.querySelector('.offline-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'toast error offline-indicator';
                indicator.textContent = 'Koneksi internet terputus';
                indicator.style.transform = 'translateY(0)';
                indicator.style.opacity = '1';
                indicator.style.position = 'fixed';
                indicator.style.top = '20px';
                indicator.style.zIndex = '9999';
                document.body.appendChild(indicator);
            }
        }
    }

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Initial check
    updateConnectionStatus();
}

// Initialize connection monitoring when DOM is loaded
document.addEventListener('DOMContentLoaded', setupConnectionMonitoring);

// Prevent form double submission
function preventDoubleSubmission(form) {
    if (!form) return;
    
    let isSubmitting = false;
    
    form.addEventListener('submit', (event) => {
        if (isSubmitting) {
            event.preventDefault();
            return false;
        }
        
        isSubmitting = true;
        
        // Reset after 3 seconds as a safety measure
        setTimeout(() => {
            isSubmitting = false;
        }, 3000);
    });
}

// Setup double submission prevention for all forms
function setupFormProtection() {
    document.querySelectorAll('form').forEach(form => {
        preventDoubleSubmission(form);
    });
}

// Initialize form protection when DOM is loaded
document.addEventListener('DOMContentLoaded', setupFormProtection);

// Smooth scrolling for anchor links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize smooth scrolling when DOM is loaded
document.addEventListener('DOMContentLoaded', setupSmoothScrolling);

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Don't show error toast for every JavaScript error as it might be too intrusive
    // Only log to console for debugging
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default browser behavior (console error)
    event.preventDefault();
});

// Bottom navigation functions
let selectedTopupAmount = 0;

function showBottomTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Hide main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Update active states
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab and update active state
    if (tabName === 'home') {
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        document.querySelector('.bottom-nav-item[onclick="showBottomTab(\'home\')"]').classList.add('active');
    } else {
        const tabContent = document.getElementById(tabName + 'Content');
        if (tabContent) {
            tabContent.style.display = 'block';
        }
        document.querySelector(`.bottom-nav-item[onclick="showBottomTab('${tabName}')"]`).classList.add('active');
        
        // Load content based on tab
        if (tabName === 'profile') {
            loadProfileInfo();
        } else if (tabName === 'topup') {
            loadCurrentBalance();
        }
    }
}

// Category filter function
function filterByCategory(category) {
    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter movies by category
    loadMoviesByCategory(category);
}

async function loadMoviesByCategory(category) {
    try {
        const url = category === 'all' ? '/api/movies' : `/api/movies?category=${category}`;
        const response = await authenticatedFetch(url);
        const movies = await response.json();
        
        displayMovies(movies);
    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Gagal memuat film');
    }
}

// Top up functions
function selectTopupAmount(amount) {
    selectedTopupAmount = amount;
    
    // Update button states
    document.querySelectorAll('.topup-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // Clear custom amount
    document.getElementById('customAmount').value = '';
    
    // Show selected amount
    document.getElementById('selectedValue').textContent = formatCurrency(amount);
    document.getElementById('selectedAmount').style.display = 'block';
}

function useCustomAmount() {
    const customInput = document.getElementById('customAmount');
    const amount = parseInt(customInput.value);
    
    if (!amount || amount < 5000) {
        showError('Minimal top up adalah Rp 5.000');
        return;
    }
    
    if (amount > 1000000) {
        showError('Maksimal top up adalah Rp 1.000.000');
        return;
    }
    
    selectedTopupAmount = amount;
    
    // Clear button selections
    document.querySelectorAll('.topup-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Show selected amount
    document.getElementById('selectedValue').textContent = formatCurrency(amount);
    document.getElementById('selectedAmount').style.display = 'block';
}

async function processTopup() {
    if (!selectedTopupAmount) {
        showError('Pilih nominal top up terlebih dahulu');
        return;
    }
    
    try {
        const response = await authenticatedFetch('/api/topup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: selectedTopupAmount
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccess(`Berhasil top up ${formatCurrency(selectedTopupAmount)}`);
            
            // Update balance display
            updateBalanceDisplay(result.newBalance);
            
            // Reset form
            selectedTopupAmount = 0;
            document.getElementById('selectedAmount').style.display = 'none';
            document.querySelectorAll('.topup-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.getElementById('customAmount').value = '';
        } else {
            const error = await response.json();
            showError(error.message || 'Gagal melakukan top up');
        }
    } catch (error) {
        console.error('Top up error:', error);
        showError('Gagal melakukan top up');
    }
}

async function loadCurrentBalance() {
    const balanceElement = document.getElementById('currentBalance');
    if (balanceElement) {
        const user = getCurrentUser();
        if (user) {
            balanceElement.textContent = formatCurrency(user.balance || 0);
        }
    }
}

function updateBalanceDisplay(newBalance) {
    // Update header balance
    const headerBalance = document.getElementById('headerBalance');
    if (headerBalance) {
        headerBalance.textContent = formatCurrency(newBalance);
    }
    
    // Update current balance in topup section
    const currentBalance = document.getElementById('currentBalance');
    if (currentBalance) {
        currentBalance.textContent = formatCurrency(newBalance);
    }
    
    // Update user balance in package info
    const userBalance = document.getElementById('userBalance');
    if (userBalance) {
        userBalance.textContent = formatCurrency(newBalance);
    }
    
    // Update localStorage
    const user = getCurrentUser();
    if (user) {
        user.balance = newBalance;
        localStorage.setItem('user', JSON.stringify(user));
    }
}

// Chat functions
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('chatInputNew');
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Add user message to chat
    addMessageToChat(message, true);
    
    // Clear input
    input.value = '';
    
    // Simulate support response (in real app, this would be real chat)
    setTimeout(() => {
        const responses = [
            'Terima kasih atas pesan Anda. Tim support kami akan segera membantu.',
            'Apakah ada yang bisa kami bantu lebih lanjut?',
            'Kami sedang memproses permintaan Anda. Mohon tunggu sebentar.',
            'Untuk bantuan lebih lanjut, silakan hubungi customer service kami.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessageToChat(randomResponse, false);
    }, 1000);
}

function addMessageToChat(message, isUser) {
    const chatMessages = document.getElementById('chatMessagesNew');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'support-message'}`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? 'U' : 'CS'}</div>
        <div class="message-content">
            <p>${message}</p>
            <span class="message-time">${timeString}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Profile functions
async function loadProfileInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('profileName').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email;
        
        const statusBadge = document.getElementById('profileStatus');
        if (user.isPremium) {
            statusBadge.textContent = 'Premium User';
            statusBadge.className = 'status-badge premium';
        } else if (user.premiumRequestStatus === 'pending') {
            statusBadge.textContent = 'Premium Pending';
            statusBadge.className = 'status-badge pending';
        } else {
            statusBadge.textContent = 'Pengguna Biasa';
            statusBadge.className = 'status-badge';
        }
    }
}

function editProfile() {
    showError('Fitur edit profil sedang dalam pengembangan');
}

function changePassword() {
    showError('Fitur ubah password sedang dalam pengembangan');
}

async function requestPremium() {
    const user = getCurrentUser();
    if (user.isPremium) {
        showError('Anda sudah menjadi pengguna premium');
        return;
    }
    
    if (user.premiumRequestStatus === 'pending') {
        showError('Permintaan premium Anda sedang diproses');
        return;
    }
    
    try {
        const response = await authenticatedFetch('/api/request-premium', {
            method: 'POST'
        });
        
        if (response.ok) {
            showSuccess('Permintaan premium berhasil dikirim! Menunggu persetujuan admin.');
            
            // Update user status
            user.premiumRequestStatus = 'pending';
            localStorage.setItem('user', JSON.stringify(user));
            loadProfileInfo();
        } else {
            const error = await response.json();
            showError(error.message || 'Gagal mengirim permintaan premium');
        }
    } catch (error) {
        console.error('Premium request error:', error);
        showError('Gagal mengirim permintaan premium');
    }
}

// Initialize balance display on load
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (user) {
        updateBalanceDisplay(user.balance || 0);
    }
});

// Export functions for module use (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showError,
        showSuccess,
        togglePassword,
        getAuthToken,
        getCurrentUser,
        isAuthenticated,
        isAdmin,
        clearAuthData,
        authenticatedFetch,
        openModal,
        closeModal,
        validateEmail,
        validatePassword,
        validateUsername,
        formatCurrency,
        formatDate,
        formatDateTime,
        setLoadingState,
        handleNetworkError,
        safeJsonParse,
        debounce,
        generateRandomString,
        copyToClipboard,
        showBottomTab,
        filterByCategory,
        selectTopupAmount,
        useCustomAmount,
        processTopup,
        sendMessage,
        requestPremium
    };
}
