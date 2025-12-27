/**
 * CPI - Caring Partners International
 * Main JavaScript File
 * Handles component loading, navbar functionality, and animations
 */

(function() {
  'use strict';

  // =====================================================
  // CONFIGURATION
  // =====================================================
  const CONFIG = {
    EXTENDED_TABLET_MAX: 1297,
    STICKY_THRESHOLD: 150,
    COMPONENT_BASE_PATH: 'components/'
  };

  // =====================================================
  // COMPONENT LOADER (with script execution)
  // =====================================================
  async function loadComponent(elementId, componentPath) {
    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
      const response = await fetch(componentPath);
      if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
      const html = await response.text();
      
      // Parse HTML and extract scripts
      const template = document.createElement('template');
      template.innerHTML = html;
      
      // Insert content
      element.innerHTML = '';
      const content = template.content.cloneNode(true);
      
      // Extract scripts before inserting
      const scripts = content.querySelectorAll('script');
      const scriptContents = [];
      scripts.forEach(script => {
        scriptContents.push(script.textContent);
        script.remove();
      });
      
      // Insert HTML content
      element.appendChild(content);
      
      // Execute scripts
      scriptContents.forEach(scriptContent => {
        if (scriptContent.trim()) {
          try {
            const scriptEl = document.createElement('script');
            scriptEl.textContent = scriptContent;
            document.body.appendChild(scriptEl);
          } catch (e) {
            console.error('Error executing script:', e);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error(`Error loading component: ${error.message}`);
      return false;
    }
  }

  // =====================================================
  // NAVBAR FUNCTIONALITY
  // =====================================================
  function initNavbar() {
    const navbar = document.querySelector('.navbar_component');
    if (!navbar) return;

    // Extended breakpoint handling
    function updateNavbarCollapse() {
      if (window.innerWidth <= CONFIG.EXTENDED_TABLET_MAX) {
        navbar.setAttribute('data-collapse', 'all');
      } else {
        navbar.setAttribute('data-collapse', 'medium');
      }
    }

    updateNavbarCollapse();
    
    let resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateNavbarCollapse, 100);
    });

    // Sticky navbar
    const navMenu = navbar.querySelector('.navbar_menu');
    let lastScrollY = window.scrollY;
    let rafId = null;
    let isMenuOpen = false;

    if (navMenu) {
      new MutationObserver(function() {
        isMenuOpen = navMenu.classList.contains('w--open') || 
                     navMenu.classList.contains('w--nav-menu-open');
      }).observe(navMenu, { attributes: true, attributeFilter: ['class'] });
    }

    const updateSticky = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < lastScrollY;
      const pastThreshold = currentScrollY > CONFIG.STICKY_THRESHOLD;

      if (pastThreshold && scrollingUp) {
        navbar.classList.add('is-sticky');
      } else if (!pastThreshold || (!scrollingUp && !isMenuOpen)) {
        navbar.classList.remove('is-sticky');
      }

      lastScrollY = currentScrollY;
      rafId = null;
    };

    window.addEventListener('scroll', () => {
      if (!rafId) rafId = requestAnimationFrame(updateSticky);
    }, { passive: true });

    // Mobile menu close on outside click
    const btn = document.querySelector('.lottie-wrap');
    if (btn && navMenu) {
      document.addEventListener('click', function(e) {
        if (window.innerWidth >= 992) return;
        
        const open = navMenu.classList.contains('w--nav-menu-open') || 
                     getComputedStyle(navMenu).display !== 'none';
        if (!open) return;
        if (navMenu.contains(e.target)) return;
        if (btn.contains(e.target)) return;
        
        btn.click();
      }, true);
    }

    // Re-initialize Webflow interactions for navbar
    if (window.Webflow && window.Webflow.require) {
      try {
        window.Webflow.require('ix2').init();
      } catch (e) {
        // IX2 may not be available
      }
    }
  }

  // =====================================================
  // FADE-IN ANIMATIONS
  // =====================================================
  function initFadeAnimations() {
    const selectors = 'h1, h2, h3, p, img, .w-button, section > div, .card, .w-col';
    document.querySelectorAll(selectors).forEach(el => {
      // Skip navbar and footer elements
      if (el.closest('#navbar-placeholder') || el.closest('#footer-placeholder')) return;
      el.classList.add('fade-in');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.15
    });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // =====================================================
  // LOTTIE ANIMATIONS REINITIALIZATION
  // =====================================================
  function initLottieAnimations() {
    // Find all Lottie elements and reinitialize them
    const lottieElements = document.querySelectorAll('[data-animation-type="lottie"]');
    
    lottieElements.forEach(el => {
      // Skip if already initialized
      if (el._lottieInstance) return;
      
      const src = el.getAttribute('data-src');
      const loop = el.getAttribute('data-loop') === '1';
      const autoplay = el.getAttribute('data-autoplay') === '1';
      const renderer = el.getAttribute('data-renderer') || 'svg';
      
      if (src && window.lottie) {
        try {
          const animation = window.lottie.loadAnimation({
            container: el,
            renderer: renderer,
            loop: loop,
            autoplay: autoplay,
            path: src
          });
          el._lottieInstance = animation;
        } catch (e) {
          console.warn('Lottie init error:', e);
        }
      }
    });
  }

  // =====================================================
  // WEBFLOW REINITIALIZATION
  // =====================================================
  function reinitWebflow() {
    if (window.Webflow) {
      try {
        window.Webflow.destroy();
        window.Webflow.ready();
        if (window.Webflow.require) {
          window.Webflow.require('ix2').init();
        }
      } catch (e) {
        console.warn('Webflow reinit error:', e);
      }
    }
  }

  // =====================================================
  // INITIALIZE ALL AFTER COMPONENTS LOAD
  // =====================================================
  function initWebflowAfterLoad() {
    // Small delay to ensure DOM is fully updated
    setTimeout(() => {
      reinitWebflow();
      initLottieAnimations();
    }, 100);
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================
  async function init() {
    // Load components
    const navbarLoaded = await loadComponent('navbar-placeholder', CONFIG.COMPONENT_BASE_PATH + 'navbar.html');
    const footerLoaded = await loadComponent('footer-placeholder', CONFIG.COMPONENT_BASE_PATH + 'footer.html');

    // Initialize functionality after components are loaded
    if (navbarLoaded) {
      initNavbar();
    }
    
    initFadeAnimations();

    // Reinitialize Webflow and Lottie after components load
    initWebflowAfterLoad();

    // Trigger custom event for other scripts that might need it
    document.dispatchEvent(new CustomEvent('cpi:componentsLoaded'));
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
