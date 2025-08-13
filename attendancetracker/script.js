// Application State
let subjects = [];
let chart = null;

// DOM Elements
const subjectNameInput = document.getElementById('subjectName');
const subjectsGrid = document.getElementById('subjectsGrid');
const emptyState = document.getElementById('emptyState');
const deleteModal = document.getElementById('deleteModal');

// Statistics Elements
const totalSubjectsEl = document.getElementById('totalSubjects');
const totalAttendedEl = document.getElementById('totalAttended');
const totalMissedEl = document.getElementById('totalMissed');
const overallPercentageEl = document.getElementById('overallPercentage');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderSubjects();
    updateStatistics();
    initializeChart();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Enter key to add subject
    subjectNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addSubject();
        }
    });

    // Close modal on outside click
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            closeModal();
        }
    });

    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Data Management - Using in-memory storage since localStorage is not available
function saveData() {
    try {
        // Store data in a global variable for persistence during session
        window.attendanceData = subjects;
        console.log('Data saved:', subjects);
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function loadData() {
    try {
        // Load data from global variable
        if (window.attendanceData && Array.isArray(window.attendanceData)) {
            subjects = window.attendanceData;
        } else {
            subjects = [];
        }
        console.log('Data loaded:', subjects);
    } catch (error) {
        console.error('Error loading data:', error);
        subjects = [];
    }
}

// Subject Management
function addSubject() {
    const name = subjectNameInput.value.trim();
    
    if (!name) {
        showNotification('Please enter a subject name', 'error');
        subjectNameInput.focus();
        return;
    }

    if (subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Subject already exists', 'error');
        subjectNameInput.focus();
        return;
    }

    const newSubject = {
        id: generateId(),
        name: name,
        attended: 0,
        missed: 0,
        createdAt: new Date().toISOString()
    };

    subjects.push(newSubject);
    saveData();
    renderSubjects();
    updateStatistics();
    updateChart();
    
    // Clear input and show success message
    subjectNameInput.value = '';
    subjectNameInput.focus();
    showNotification(`${name} added successfully!`, 'success');
}

function markAttendance(subjectId, type) {
    const subjectIndex = subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) return;

    if (type === 'attend') {
        subjects[subjectIndex].attended++;
        showNotification('Attendance marked ✓', 'success');
    } else if (type === 'miss') {
        subjects[subjectIndex].missed++;
        showNotification('Absence recorded ✗', 'info');
    }

    saveData();
    renderSubjects();
    updateStatistics();
    updateChart();
}

function deleteSubject(subjectId) {
    const subjectIndex = subjects.findIndex(s => s.id === subjectId);
    if (subjectIndex === -1) return;
    
    const subjectName = subjects[subjectIndex].name;
    subjects.splice(subjectIndex, 1);
    
    saveData();
    renderSubjects();
    updateStatistics();
    updateChart();
    showNotification(`${subjectName} deleted`, 'info');
}

// UI Rendering
function renderSubjects() {
    if (subjects.length === 0) {
        subjectsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No subjects added yet</h3>
                <p>Add your first subject to start tracking attendance</p>
            </div>
        `;
        return;
    }
    
    subjectsGrid.innerHTML = subjects.map(subject => {
        const total = subject.attended + subject.missed;
        const percentage = total > 0 ? ((subject.attended / total) * 100) : 0;
        const status = getAttendanceStatus(percentage);
        
        return `
            <div class="subject-card" data-subject-id="${subject.id}">
                <div class="subject-header">
                    <h3 class="subject-name">${escapeHtml(subject.name)}</h3>
                    <div class="status-badge ${status.class}">
                        <span>${status.icon}</span>
                        ${status.text}
                    </div>
                </div>
                
                <div class="subject-stats">
                    <div class="stat-item">
                        <span class="stat-value">${subject.attended}</span>
                        <span class="stat-label">Attended</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${subject.missed}</span>
                        <span class="stat-label">Missed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${total}</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${percentage.toFixed(1)}%</span>
                        <span class="stat-label">Attendance</span>
                    </div>
                </div>

                <div class="attendance-percentage ${status.class}">
                    ${percentage.toFixed(1)}%
                </div>

                <div class="subject-actions">
                    <button 
                        onclick="markAttendance('${subject.id}', 'attend')" 
                        class="action-btn attend-btn"
                        title="Mark as attended"
                    >
                        <span>✓</span>
                        Present
                    </button>
                    <button 
                        onclick="markAttendance('${subject.id}', 'miss')" 
                        class="action-btn miss-btn"
                        title="Mark as missed"
                    >
                        <span>✗</span>
                        Absent
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateStatistics() {
    const totalSubjects = subjects.length;
    const totalAttended = subjects.reduce((sum, subject) => sum + subject.attended, 0);
    const totalMissed = subjects.reduce((sum, subject) => sum + subject.missed, 0);
    const totalClasses = totalAttended + totalMissed;
    const overallPercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100) : 0;

    // Update statistics with animation
    animateNumber(totalSubjectsEl, totalSubjects);
    animateNumber(totalAttendedEl, totalAttended);
    animateNumber(totalMissedEl, totalMissed);
    animateNumber(overallPercentageEl, overallPercentage.toFixed(1), '%');
}

// Chart Management
function initializeChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Attended',
                    data: [],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                },
                {
                    label: 'Missed',
                    data: [],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, weight: '600' },
                    bodyFont: { size: 12 },
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        afterLabel: function(context) {
                            const subjectIndex = context.dataIndex;
                            if (subjects[subjectIndex]) {
                                const subject = subjects[subjectIndex];
                                const total = subject.attended + subject.missed;
                                const percentage = total > 0 ? ((subject.attended / total) * 100) : 0;
                                return `Attendance: ${percentage.toFixed(1)}%`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 12 },
                        maxRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        }
    });

    updateChart();
}

function updateChart() {
    if (!chart) return;

    chart.data.labels = subjects.map(s => s.name);
    chart.data.datasets[0].data = subjects.map(s => s.attended);
    chart.data.datasets[1].data = subjects.map(s => s.missed);
    chart.update();
}

// Utility Functions
function getAttendanceStatus(percentage) {
    if (percentage >= 75) {
        return { 
            text: 'Safe', 
            class: 'safe', 
            icon: '✅' 
        };
    } else if (percentage >= 65) {
        return { 
            text: 'Caution', 
            class: 'caution', 
            icon: '⚠️' 
        };
    } else {
        return { 
            text: 'Danger', 
            class: 'danger', 
            icon: '🚨' 
        };
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function animateNumber(element, targetValue, suffix = '') {
    if (!element) return;
    
    const startValue = parseFloat(element.textContent) || 0;
    const difference = targetValue - startValue;
    const steps = 20;
    const increment = difference / steps;
    let current = startValue;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        current += increment;
        
        if (step >= steps) {
            current = targetValue;
            clearInterval(timer);
        }
        
        const displayValue = suffix === '%' ? current.toFixed(1) : Math.round(current);
        element.textContent = displayValue + suffix;
    }, 50);
}

// Modal Functions
function resetData() {
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    deleteModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function confirmReset() {
    subjects = [];
    saveData();
    renderSubjects();
    updateStatistics();
    updateChart();
    closeModal();
    showNotification('All data has been reset', 'success');
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const colors = {
        success: 'linear-gradient(135deg, #22c55e, #16a34a)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)'
    };

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    notification.innerHTML = `
        <span style="margin-right: 8px;">${icons[type] || icons.info}</span>
        <span>${escapeHtml(message)}</span>
    `;

    // Apply styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        zIndex: '1001',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '300px',
        background: colors[type] || colors.info
    });

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to add subject
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (document.activeElement === subjectNameInput) {
            addSubject();
        }
    }
});

// Initialize data on page load
window.addEventListener('load', function() {
    // Focus on input for better UX
    if (subjectNameInput) {
        subjectNameInput.focus();
    }
});

// Global functions for onclick handlers
window.addSubject = addSubject;
window.markAttendance = markAttendance;
window.deleteSubject = deleteSubject;
window.resetData = resetData;
window.closeModal = closeModal;
window.confirmReset = confirmReset;