/**
 * CPI Website - Image Sizes Fix
 * 
 * This script automatically corrects Webflow's incorrect sizes attributes
 * to ensure browsers load the highest quality images from srcset.
 * 
 * Problem: Webflow exports header images with sizes="240px" instead of "100vw",
 * causing browsers to load 500w variants for 1920px displays.
 */
(function() {
  'use strict';

  // Run early to fix sizes before images start loading
  function fixImageSizes() {
    // Fix header photos - these should always be 100vw (full viewport width)
    var headerPhotos = document.querySelectorAll('.header-photo');
    headerPhotos.forEach(function(img) {
      if (img.hasAttribute('sizes')) {
        var currentSizes = img.getAttribute('sizes');
        // Check if it's a small hardcoded value
        if (/^\d+(\.\d+)?px$/.test(currentSizes) || currentSizes.includes('239') || currentSizes.includes('240')) {
          img.setAttribute('sizes', '100vw');
        }
      }
    });

    // Fix hero slider images - these should be 100vw
    var heroImages = document.querySelectorAll('.img-hero-slider');
    heroImages.forEach(function(img) {
      if (img.hasAttribute('sizes')) {
        img.setAttribute('sizes', '100vw');
      }
    });

    // Fix CTA images that might have wrong sizes
    var ctaImages = document.querySelectorAll('.cta1_image');
    ctaImages.forEach(function(img) {
      if (img.hasAttribute('sizes')) {
        var currentSizes = img.getAttribute('sizes');
        if (/^\d+(\.\d+)?px$/.test(currentSizes)) {
          img.setAttribute('sizes', '(max-width: 767px) 100vw, (max-width: 991px) 50vw, 540px');
        }
      }
    });

    // Fix general content images with obviously wrong sizes (hardcoded small pixel values)
    var allImages = document.querySelectorAll('img[sizes]');
    allImages.forEach(function(img) {
      var sizes = img.getAttribute('sizes');
      
      // Detect hardcoded pixel values that are suspiciously small (like 239.8671875px)
      var pixelMatch = sizes.match(/^(\d+(?:\.\d+)?)(px)?$/);
      if (pixelMatch) {
        var pixelValue = parseFloat(pixelMatch[1]);
        
        // If sizes indicates less than 300px, it's likely wrong for most content
        if (pixelValue < 300) {
          // Check if this is inside a container class to determine correct sizes
          var parent = img.closest('.rl_header1_image-wrapper, .image-container, .image-container-2');
          if (parent) {
            img.setAttribute('sizes', '(max-width: 767px) 100vw, (max-width: 991px) 728px, 940px');
          } else if (img.closest('.div-block-8, ._3to1')) {
            // Smaller content images
            img.setAttribute('sizes', '(max-width: 479px) 100vw, (max-width: 767px) 50vw, 400px');
          }
        }
      }
    });
  }

  // Run immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixImageSizes);
  } else {
    fixImageSizes();
  }

  // Also run after a short delay to catch any dynamically loaded images
  setTimeout(fixImageSizes, 100);
})();
