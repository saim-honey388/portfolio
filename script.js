// ===================================
// Modern Portfolio JavaScript
// AI/ML Engineer - Saim Khalid
// ===================================

'use strict';

// ===================================
// Global Variables & Configuration
// ===================================
const config = {
    animationDuration: 800,
    scrollOffset: 100,
    typingSpeed: 50,
    typingPause: 1000,
    loadingMinTime: 1500,
    debounceDelay: 16,
    mobile: {
        breakpoint: 768,
        navHeight: 70
    }
};

// State management
const state = {
    isLoading: true,
    isMobile: window.innerWidth <= config.mobile.breakpoint,
    currentSection: 'home',
    isScrolling: false,
    typingInstances: new Map(),
    intersectionObserver: null,
    skillsAnimated: false,
    projectFilter: 'all'
};

// ===================================
// Utility Functions
// ===================================
const utils = {
    // Debounce function for performance optimization
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    },

    // Check if element is in viewport
    isInViewport(element, threshold = 0.1) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        return (
            rect.top >= -rect.height * threshold &&
            rect.top <= windowHeight + rect.height * threshold
        );
    },

    // Generate random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Animate number counting
    animateNumber(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    },

    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }
};

// ===================================
// Loading Screen Manager
// ===================================
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.startTime = Date.now();
    }

    init() {
        // Ensure minimum loading time for smooth experience
        const elapsedTime = Date.now() - this.startTime;
        const remainingTime = Math.max(0, config.loadingMinTime - elapsedTime);

        setTimeout(() => {
            this.hide();
        }, remainingTime);

        // Also hide when page is fully loaded
        if (document.readyState === 'complete') {
            setTimeout(() => this.hide(), config.loadingMinTime);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.hide(), remainingTime);
            });
        }
    }

    hide() {
        if (!this.loadingScreen) return;
        
        this.loadingScreen.classList.add('fade-out');
        
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            state.isLoading = false;
            document.body.style.overflow = 'auto';
            
            // Trigger initial animations
            this.triggerInitialAnimations();
        }, 500);
    }

    triggerInitialAnimations() {
        // Start typing animation
        typingEffect.init();
        
        // Animate hero stats
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const target = parseInt(stat.dataset.target);
            utils.animateNumber(stat, target);
        });

        // Initialize intersection observer for scroll animations
        scrollAnimations.init();
    }
}

// ===================================
// Navigation Manager
// ===================================
class NavigationManager {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navMenu = document.getElementById('nav-menu');
        this.hamburger = document.getElementById('hamburger');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.lastScrollY = window.scrollY;
        this.isMenuOpen = false;
    }

    init() {
        this.bindEvents();
        this.updateActiveSection();
    }

    bindEvents() {
        // Hamburger menu toggle
        if (this.hamburger) {
            this.hamburger.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Navigation link clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Scroll events
        window.addEventListener('scroll', utils.throttle(() => {
            this.handleScroll();
        }, config.debounceDelay));

        // Resize events
        window.addEventListener('resize', utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.navMenu.contains(e.target) && !this.hamburger.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMobileMenu();
            }
        });
    }

    handleNavClick(e) {
        e.preventDefault();
        const link = e.currentTarget;
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            const offset = state.isMobile ? config.mobile.navHeight : config.scrollOffset;
            utils.scrollToElement(targetSection, offset);
            
            // Close mobile menu if open
            if (this.isMenuOpen) {
                this.closeMobileMenu();
            }

            // Update active state
            this.updateActiveNav(link);
        }
    }

    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Add scrolled class to navbar
        if (currentScrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }

        // Update active section
        this.updateActiveSection();

        this.lastScrollY = currentScrollY;
    }

    handleResize() {
        const wasMobile = state.isMobile;
        state.isMobile = window.innerWidth <= config.mobile.breakpoint;

        // Close mobile menu if switching to desktop
        if (wasMobile && !state.isMobile && this.isMenuOpen) {
            this.closeMobileMenu();
        }
    }

    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.isMenuOpen = true;
        this.navMenu.classList.add('active');
        this.hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeMobileMenu() {
        this.isMenuOpen = false;
        this.navMenu.classList.remove('active');
        this.hamburger.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + config.scrollOffset;

        let activeSection = 'home';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                activeSection = section.id;
            }
        });

        if (activeSection !== state.currentSection) {
            state.currentSection = activeSection;
            this.updateActiveNav();
        }
    }

    updateActiveNav(clickedLink = null) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            
            if (clickedLink) {
                if (link === clickedLink) {
                    link.classList.add('active');
                }
            } else {
                const section = link.dataset.section || link.getAttribute('href').substring(1);
                if (section === state.currentSection) {
                    link.classList.add('active');
                }
            }
        });
    }
}

// ===================================
// Typing Effect Manager
// ===================================
class TypingEffect {
    constructor() {
        this.elements = document.querySelectorAll('.typing-text');
        this.instances = new Map();
    }

    init() {
        this.elements.forEach(element => {
            const texts = JSON.parse(element.dataset.text || '[]');
            if (texts.length > 0) {
                this.startTyping(element, texts);
            }
        });
    }

    startTyping(element, texts) {
        const instance = {
            element,
            texts,
            currentTextIndex: 0,
            currentCharIndex: 0,
            isDeleting: false,
            isWaiting: false
        };

        this.instances.set(element, instance);
        this.type(instance);
    }

    type(instance) {
        const { element, texts, currentTextIndex } = instance;
        const currentText = texts[currentTextIndex];
        
        if (instance.isWaiting) {
            setTimeout(() => {
                instance.isWaiting = false;
                this.type(instance);
            }, config.typingPause);
            return;
        }

        if (instance.isDeleting) {
            // Deleting characters
            instance.currentCharIndex--;
            element.textContent = currentText.substring(0, instance.currentCharIndex);

            if (instance.currentCharIndex === 0) {
                instance.isDeleting = false;
                instance.currentTextIndex = (instance.currentTextIndex + 1) % texts.length;
                instance.isWaiting = true;
            }
        } else {
            // Typing characters
            instance.currentCharIndex++;
            element.textContent = currentText.substring(0, instance.currentCharIndex);

            if (instance.currentCharIndex === currentText.length) {
                instance.isDeleting = true;
                instance.isWaiting = true;
            }
        }

        const speed = instance.isDeleting ? config.typingSpeed / 2 : config.typingSpeed;
        setTimeout(() => this.type(instance), speed);
    }

    stop(element) {
        if (this.instances.has(element)) {
            this.instances.delete(element);
        }
    }

    stopAll() {
        this.instances.clear();
    }
}

// ===================================
// Scroll Animations Manager
// ===================================
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
    }

    init() {
        // Create intersection observer
        state.intersectionObserver = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            this.observerOptions
        );

        // Observe elements for animation
        this.observeElements();

        // Setup scroll-triggered animations
        this.setupScrollTriggers();
    }

    observeElements() {
        const animateElements = document.querySelectorAll(`
            .about-content,
            .skill-category,
            .project-card,
            .timeline-item,
            .contact-method
        `);

        animateElements.forEach(element => {
            state.intersectionObserver.observe(element);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.animateElement(entry.target);
                state.intersectionObserver.unobserve(entry.target);
            }
        });
    }

    animateElement(element) {
        element.classList.add('fade-in-up');
        
        // Special handling for different element types
        if (element.classList.contains('skill-category')) {
            this.animateSkillBars(element);
        } else if (element.classList.contains('timeline-item')) {
            this.animateTimeline(element);
        }
    }

    animateSkillBars(skillCategory) {
        const skillBars = skillCategory.querySelectorAll('.skill-progress');
        
        skillBars.forEach((bar, index) => {
            setTimeout(() => {
                const width = bar.dataset.width;
                bar.style.width = width + '%';
            }, index * 200);
        });
    }

    animateTimeline(timelineItem) {
        const marker = timelineItem.querySelector('.timeline-marker');
        const content = timelineItem.querySelector('.timeline-content');
        
        if (marker) {
            setTimeout(() => {
                marker.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    marker.style.transform = 'scale(1)';
                }, 200);
            }, 300);
        }
    }

    setupScrollTriggers() {
        window.addEventListener('scroll', utils.throttle(() => {
            this.handleScrollTriggers();
        }, config.debounceDelay));
    }

    handleScrollTriggers() {
        // Parallax effects
        this.updateParallax();
        
        // Neural network animation
        this.updateNeuralNetwork();
    }

    updateParallax() {
        const scrollY = window.scrollY;
        const parallaxElements = document.querySelectorAll('.animated-bg');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    updateNeuralNetwork() {
        const neuralNetwork = document.querySelector('.neural-network');
        if (!neuralNetwork || !utils.isInViewport(neuralNetwork)) return;

        const scrollY = window.scrollY;
        const networkRect = neuralNetwork.getBoundingClientRect();
        const networkCenter = networkRect.top + networkRect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distance = Math.abs(networkCenter - viewportCenter);
        const maxDistance = window.innerHeight;
        const intensity = Math.max(0, 1 - distance / maxDistance);

        // Update neural node animations based on scroll position
        const nodes = neuralNetwork.querySelectorAll('.node');
        nodes.forEach((node, index) => {
            const delay = index * 0.1;
            const scale = 1 + intensity * 0.3;
            const glow = intensity * 20;
            
            node.style.transform = `scale(${scale})`;
            node.style.boxShadow = `0 0 ${glow}px currentColor`;
        });
    }
}

// ===================================
// Projects Filter Manager
// ===================================
class ProjectsFilter {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.projectCards = document.querySelectorAll('.project-card');
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleFilterClick(e));
        });
    }

    handleFilterClick(e) {
        const button = e.target;
        const filter = button.dataset.filter;

        // Update active button
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Filter projects
        this.filterProjects(filter);
        
        state.projectFilter = filter;
    }

    filterProjects(filter) {
        this.projectCards.forEach((card, index) => {
            const categories = card.dataset.category;
            const shouldShow = filter === 'all' || categories.includes(filter);

            setTimeout(() => {
                if (shouldShow) {
                    card.classList.remove('hidden');
                    card.style.animationDelay = `${index * 0.1}s`;
                } else {
                    card.classList.add('hidden');
                }
            }, index * 50);
        });
    }

    // Method to programmatically set filter
    setFilter(filter) {
        const button = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (button) {
            button.click();
        }
    }
}

// ===================================
// Contact Form Manager
// ===================================
class ContactForm {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.submitButton = this.form?.querySelector('.submit-btn');
        this.isSubmitting = false;
    }

    init() {
        if (!this.form) return;
        this.bindEvents();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;
        
        // Validate form
        if (!this.validateForm()) {
            this.showNotification('Please fill in all required fields correctly.', 'error');
            return;
        }

        this.isSubmitting = true;
        this.setSubmitState(true);

        try {
            // Simulate form submission (replace with actual endpoint)
            await this.submitForm();
            this.showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            this.form.reset();
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            this.isSubmitting = false;
            this.setSubmitState(false);
        }
    }

    async submitForm() {
        // Simulate network delay
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Here you would typically send data to your backend
                // For now, we'll just resolve successfully
                resolve();
            }, 2000);
        });
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing errors
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Show error if validation failed
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Create error message element
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        // Insert after field
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    setSubmitState(isLoading) {
        if (!this.submitButton) return;
        
        this.submitButton.disabled = isLoading;
        this.submitButton.classList.toggle('loading', isLoading);
        
        const buttonText = this.submitButton.querySelector('.btn-text');
        if (buttonText) {
            buttonText.textContent = isLoading ? 'Sending...' : 'Send Message';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideNotification(notification), 5000);

        // Close button functionality
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => this.hideNotification(notification));
    }

    hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// ===================================
// Theme Manager
// ===================================
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    init() {
        this.applyTheme();
        this.bindEvents();
    }

    bindEvents() {
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.systemTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    applyTheme() {
        const theme = this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme;
        document.documentElement.setAttribute('data-theme', theme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.applyTheme();
    }
}

// ===================================
// Performance Monitor
// ===================================
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now()
        };
    }

    init() {
        if ('requestIdleCallback' in window) {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        const measureFPS = (time) => {
            this.metrics.frameCount++;
            
            if (time - this.metrics.lastTime >= 1000) {
                this.metrics.fps = Math.round((this.metrics.frameCount * 1000) / (time - this.metrics.lastTime));
                this.metrics.frameCount = 0;
                this.metrics.lastTime = time;
                
                // Adjust animations based on performance
                this.adjustPerformance();
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    adjustPerformance() {
        // Reduce animations if FPS is too low
        if (this.metrics.fps < 30) {
            document.body.classList.add('reduce-animations');
        } else if (this.metrics.fps > 50) {
            document.body.classList.remove('reduce-animations');
        }
    }
}

// ===================================
// Accessibility Manager
// ===================================
class AccessibilityManager {
    constructor() {
        this.focusableElements = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
    }

    init() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupARIA();
    }

    setupKeyboardNavigation() {
        // Skip to main content
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && e.shiftKey && document.activeElement === document.body) {
                const skipLink = document.createElement('a');
                skipLink.href = '#main';
                skipLink.className = 'skip-link';
                skipLink.textContent = 'Skip to main content';
                document.body.insertBefore(skipLink, document.body.firstChild);
            }
        });

        // Escape key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close mobile menu
                if (navigation.isMenuOpen) {
                    navigation.closeMobileMenu();
                }
                
                // Remove focus from active element
                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }
            }
        });
    }

    setupFocusManagement() {
        // Focus trap for mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && navigation.isMenuOpen) {
                this.trapFocus(e, navigation.navMenu);
            }
        });
    }

    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(this.focusableElements);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    setupARIA() {
        // Update ARIA labels and states
        const hamburger = document.getElementById('hamburger');
        if (hamburger) {
            hamburger.setAttribute('aria-label', 'Toggle navigation menu');
            hamburger.setAttribute('aria-expanded', 'false');
        }

        // Update ARIA states on menu toggle
        document.addEventListener('menuToggle', (e) => {
            if (hamburger) {
                hamburger.setAttribute('aria-expanded', e.detail.isOpen);
            }
        });
    }
}

// ===================================
// Initialize Components
// ===================================
const loadingManager = new LoadingManager();
const navigation = new NavigationManager();
const typingEffect = new TypingEffect();
const scrollAnimations = new ScrollAnimations();
const projectsFilter = new ProjectsFilter();
const contactForm = new ContactForm();
const themeManager = new ThemeManager();
const performanceMonitor = new PerformanceMonitor();
const accessibilityManager = new AccessibilityManager();

// ===================================
// Application Initialization
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize core components
    loadingManager.init();
    navigation.init();
    projectsFilter.init();
    contactForm.init();
    themeManager.init();
    performanceMonitor.init();
    accessibilityManager.init();

    // Initialize resume button
    initResumeButton();

    // Initialize scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                utils.scrollToElement(aboutSection, config.scrollOffset);
            }
        });
    }

    // Add smooth reveal animation to sections
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.animationDelay = `${index * 0.1}s`;
    });

    // Initialize Easter eggs and advanced features
    initEasterEggs();
    initAdvancedFeatures();
});

// ===================================
// Resume Button Handler
// ===================================
function initResumeButton() {
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show notification that resume will be available soon
            showResumeNotification();
            
            // Alternative: Open a resume PDF (uncomment when you have a resume file)
            // const resumeURL = 'path/to/your/resume.pdf';
            // window.open(resumeURL, '_blank');
        });
    }
}

function showResumeNotification() {
    const notification = document.createElement('div');
    notification.className = 'resume-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-file-download"></i>
            </div>
            <div class="notification-text">
                <h4>Resume Download</h4>
                <p>Resume will be available soon! Please contact me directly for now.</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// ===================================
// Easter Eggs & Advanced Features
// ===================================
function initEasterEggs() {
    // Konami code easter egg
    let konamiCode = [];
    const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA

    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.keyCode);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join('') === konamiSequence.join('')) {
            triggerEasterEgg();
        }
    });

    // AI mode easter egg (double-click on logo)
    const logo = document.querySelector('.nav-logo');
    if (logo) {
        let clickCount = 0;
        logo.addEventListener('click', () => {
            clickCount++;
            setTimeout(() => clickCount = 0, 500);
            
            if (clickCount === 3) {
                toggleAIMode();
            }
        });
    }
}

function triggerEasterEgg() {
    // Create matrix effect
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    canvas.style.opacity = '0.7';
    
    document.body.appendChild(canvas);
    
    // Matrix rain effect
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");
    
    const fontSize = 10;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let x = 0; x < columns; x++) {
        drops[x] = 1;
    }
    
    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    const matrixInterval = setInterval(drawMatrix, 35);
    
    // Remove effect after 5 seconds
    setTimeout(() => {
        clearInterval(matrixInterval);
        document.body.removeChild(canvas);
    }, 5000);
}

function toggleAIMode() {
    document.body.classList.toggle('ai-mode');
    
    if (document.body.classList.contains('ai-mode')) {
        // Add AI mode effects
        const aiOverlay = document.createElement('div');
        aiOverlay.className = 'ai-overlay';
        aiOverlay.innerHTML = `
            <div class="ai-hud">
                <div class="ai-status">AI MODE: ACTIVE</div>
                <div class="ai-metrics">
                    <div>CPU: ${Math.floor(Math.random() * 40 + 60)}%</div>
                    <div>GPU: ${Math.floor(Math.random() * 30 + 70)}%</div>
                    <div>NEURAL: OPTIMIZED</div>
                </div>
            </div>
        `;
        document.body.appendChild(aiOverlay);
        
        // Remove after 10 seconds
        setTimeout(() => {
            document.body.classList.remove('ai-mode');
            if (aiOverlay.parentNode) {
                aiOverlay.parentNode.removeChild(aiOverlay);
            }
        }, 10000);
    }
}

function initAdvancedFeatures() {
    // Voice commands (experimental)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        initVoiceCommands();
    }

    // Cursor effects
    initCursorEffects();

    // Advanced scroll effects
    initAdvancedScrollEffects();
}

function initVoiceCommands() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    document.addEventListener('keydown', (e) => {
        // Hold Space + V to activate voice commands
        if (e.code === 'KeyV' && e.ctrlKey) {
            e.preventDefault();
            recognition.start();
        }
    });
    
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        handleVoiceCommand(command);
    };
}

function handleVoiceCommand(command) {
    const commands = {
        'go home': () => utils.scrollToElement(document.getElementById('home')),
        'about me': () => utils.scrollToElement(document.getElementById('about')),
        'show skills': () => utils.scrollToElement(document.getElementById('skills')),
        'view projects': () => utils.scrollToElement(document.getElementById('projects')),
        'contact me': () => utils.scrollToElement(document.getElementById('contact')),
        'dark mode': () => themeManager.setTheme('dark'),
        'light mode': () => themeManager.setTheme('light')
    };
    
    for (const [phrase, action] of Object.entries(commands)) {
        if (command.includes(phrase)) {
            action();
            break;
        }
    }
}

function initCursorEffects() {
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();
    
    // Add hover effects
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches('a, button, .project-card, .skill-item')) {
            cursor.classList.add('cursor-hover');
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.matches('a, button, .project-card, .skill-item')) {
            cursor.classList.remove('cursor-hover');
        }
    });
}

function initAdvancedScrollEffects() {
    // Scroll-based color transitions
    window.addEventListener('scroll', utils.throttle(() => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const hue = Math.floor(scrollPercent * 360);
        
        document.documentElement.style.setProperty('--dynamic-hue', hue);
    }, 32));
    
    // Reveal animations on scroll
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    function checkReveal() {
        revealElements.forEach(element => {
            if (utils.isInViewport(element, 0.1)) {
                element.classList.add('revealed');
            }
        });
    }
    
    window.addEventListener('scroll', utils.throttle(checkReveal, 16));
    checkReveal(); // Initial check
}

// ===================================
// Global Error Handling
// ===================================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // You could send this to an error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Handle unhandled promise rejections
});

// ===================================
// Export for module use (if needed)
// ===================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        utils,
        NavigationManager,
        TypingEffect,
        ScrollAnimations,
        ProjectsFilter,
        ContactForm,
        ThemeManager
    };
} 