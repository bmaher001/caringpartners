/**
 * CPI Components Loader
 * Dynamically loads navbar and footer components
 * and reinitializes all necessary scripts after loading
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // Load Navbar
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        fetch('components/navbar.html')
            .then(response => response.text())
            .then(html => {
                navbarPlaceholder.innerHTML = html;
                
                // Execute inline scripts from loaded navbar
                executeScripts(navbarPlaceholder);
                
                // Initialize navbar functionality after loading
                initNavbarFunctionality();
                
                // Reinitialize Webflow after navbar loads
                reinitializeWebflow();
            })
            .catch(err => console.error('Error loading navbar:', err));
    }

    // Load Footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('components/footer.html')
            .then(response => response.text())
            .then(html => {
                footerPlaceholder.innerHTML = html;
            })
            .catch(err => console.error('Error loading footer:', err));
    }
});

/**
 * Execute inline scripts from dynamically loaded content
 */
function executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        // Copy attributes
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        // Copy inline content
        newScript.textContent = oldScript.textContent;
        
        // Replace old script with new one to execute it
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

/**
 * Initialize all navbar functionality after dynamic loading
 */
function initNavbarFunctionality() {
    // Initialize mobile menu close on outside click
    initMobileMenuClose();
    
    // Initialize extended tablet breakpoint
    initExtendedTabletBreakpoint();
    
    // Initialize sticky navbar
    initStickyNavbar();
}

/**
 * Close mobile menu when clicking outside
 */
function initMobileMenuClose() {
    const btn = document.querySelector('.lottie-wrap');
    if (!btn) return;
    
    const nav = btn.closest('.w-nav') || document;
    const menu = nav.querySelector('.navbar_menu') || nav.querySelector('.w-nav-menu');
    if (!menu) return;
    
    document.addEventListener('click', function(e) {
        if (window.innerWidth >= 992) return;
        
        const open = menu.classList.contains('w--nav-menu-open') || 
                     getComputedStyle(menu).display !== 'none';
        if (!open) return;
        if (menu.contains(e.target)) return;
        if (btn.contains(e.target)) return;
        
        btn.click();
    }, true);
}

/**
 * Handle extended tablet breakpoint (992px - 1297px)
 */
function initExtendedTabletBreakpoint() {
    const EXTENDED_TABLET_MAX = 1297;
    
    function updateNavbarCollapse() {
        const navbar = document.querySelector('.navbar_component');
        if (!navbar) return;
        
        if (window.innerWidth <= EXTENDED_TABLET_MAX) {
            navbar.setAttribute('data-collapse', 'all');
        } else {
            navbar.setAttribute('data-collapse', 'medium');
        }
    }
    
    // Run immediately
    updateNavbarCollapse();
    
    // Run on resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateNavbarCollapse, 100);
    });
}

/**
 * Initialize sticky navbar behavior
 */
function initStickyNavbar() {
    const navbar = document.querySelector('.navbar_component');
    if (!navbar) return;
    
    const navMenu = navbar.querySelector('.navbar_menu');
    const THRESHOLD = 150;
    let lastScrollY = window.scrollY;
    let rafId = null;
    let isMenuOpen = false;
    
    // Watch for menu open/close state
    if (navMenu) {
        new MutationObserver(function() {
            isMenuOpen = navMenu.classList.contains('w--open') || 
                         navMenu.classList.contains('w--nav-menu-open');
        }).observe(navMenu, { attributes: true, attributeFilter: ['class'] });
    }
    
    const update = () => {
        const currentScrollY = window.scrollY;
        const scrollingUp = currentScrollY < lastScrollY;
        const pastThreshold = currentScrollY > THRESHOLD;
        
        if (pastThreshold && scrollingUp) {
            navbar.classList.add('is-sticky');
        } else if (!pastThreshold || (!scrollingUp && !isMenuOpen)) {
            navbar.classList.remove('is-sticky');
        }
        
        lastScrollY = currentScrollY;
        rafId = null;
    };
    
    window.addEventListener('scroll', () => {
        if (!rafId) rafId = requestAnimationFrame(update);
    }, { passive: true });
}

/**
 * Reinitialize Webflow functionality
 */
function reinitializeWebflow() {
    if (window.Webflow) {
        window.Webflow.destroy();
        window.Webflow.ready();
        
        // Reinitialize IX2 (interactions)
        if (window.Webflow.require) {
            try {
                window.Webflow.require('ix2').init();
            } catch (e) {
                console.warn('IX2 reinitialization warning:', e);
            }
        }
    }
}
