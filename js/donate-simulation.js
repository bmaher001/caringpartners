/**
 * Donation Simulation Logic
 * 
 * This script handles simulated payment flow for the demo donate page.
 * No real payment processing - just UI simulation for testing/demo purposes.
 * 
 * The success message displays:
 * - Donated amount
 * - Donation type (one-time or monthly)
 * - Donation destination (CPI, missionary, or program)
 */
(function () {
    'use strict';

    let fullPageAnimation = null;

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function () {
        // Initialize full-page Lottie animation
        initFullPageLottie();

        // Attach click handlers to all donate buttons
        attachSimulatedDonationHandlers();
    });

    // Initialize Lottie animation for success overlay
    function initFullPageLottie() {
        const container = document.getElementById('lottieContainer');
        if (container && typeof lottie !== 'undefined') {
            fullPageAnimation = lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: true,
                autoplay: false,
                path: 'documents/1035802.json'
            });
        }
    }

    // Attach handlers to donate buttons for simulated payment
    function attachSimulatedDonationHandlers() {
        // Main donation form button
        const mainDonateBtn = document.querySelector('a[data-w-id="ef499592-6aae-2376-763b-43fbd51128ce"]');
        if (mainDonateBtn) {
            mainDonateBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleMainDonation();
            });
        }

        // Missionary donation button
        const missionaryDonateBtn = document.querySelector('.missionary-donate-btn');
        if (missionaryDonateBtn) {
            missionaryDonateBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleMissionaryDonation();
            });
        }

        // Programs donation button
        const programsDonateBtn = document.querySelector('.program-donate-btn');
        if (programsDonateBtn) {
            programsDonateBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleProgramsDonation();
            });
        }
    }

    // Handle main donation form
    function handleMainDonation() {
        const selectedAmount = document.querySelector('input[name="amount"]:checked');
        const otherAmount = document.getElementById('Other-amount');
        const frequency = document.querySelector('input[name="frequency"]:checked');

        let amount = 0;
        if (otherAmount && otherAmount.value) {
            amount = parseFloat(otherAmount.value);
        } else if (selectedAmount) {
            amount = parseFloat(selectedAmount.value);
        }

        if (!amount || amount <= 0) {
            alert('Please select or enter a donation amount.');
            return;
        }

        // Determine donation type (one-time or monthly)
        const donationType = (frequency && frequency.value === 'monthly') ? 'monthly' : 'one-time';

        // General donation goes to CPI
        const destination = 'Caring Partners International';

        processSimulatedPayment(amount, donationType, destination);
    }

    // Handle missionary donation
    function handleMissionaryDonation() {
        const missionarySelect = document.getElementById('Missionary');
        const amountInput = document.getElementById('MissionaryAmount');
        const frequencySelect = document.getElementById('MissionaryFrequency');

        if (!missionarySelect || !missionarySelect.value) {
            alert('Please select a missionary.');
            return;
        }

        const amount = amountInput ? parseFloat(amountInput.value.replace('$', '')) : 0;
        if (!amount || amount <= 0) {
            alert('Please enter a donation amount.');
            return;
        }

        // Determine donation type from frequency select
        const donationType = (frequencySelect && frequencySelect.value === 'Monthly') ? 'monthly' : 'one-time';

        // Destination is the selected missionary
        const destination = missionarySelect.value;

        processSimulatedPayment(amount, donationType, destination);
    }

    // Handle programs donation
    function handleProgramsDonation() {
        const programSelect = document.getElementById('Program');
        const amountInput = document.getElementById('ProgramAmount');
        const frequencySelect = document.getElementById('ProgramFrequency');

        if (!programSelect || !programSelect.value) {
            alert('Please select a program.');
            return;
        }

        const amount = amountInput ? parseFloat(amountInput.value.replace('$', '')) : 0;
        if (!amount || amount <= 0) {
            alert('Please enter a donation amount.');
            return;
        }

        // Determine donation type from frequency select
        const donationType = (frequencySelect && frequencySelect.value === 'Monthly') ? 'monthly' : 'one-time';

        // Destination is the selected program
        const destination = programSelect.value;

        processSimulatedPayment(amount, donationType, destination);
    }

    // Process simulated payment with delay
    function processSimulatedPayment(amount, donationType, destination) {
        showProcessingOverlay();

        // Simulate 2-second processing delay
        setTimeout(function () {
            hideProcessingOverlay();
            showFullPageLottie(amount, donationType, destination);
        }, 2000);
    }

    // Show processing overlay
    function showProcessingOverlay() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    // Hide processing overlay
    function hideProcessingOverlay() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    // Show full-page Lottie success animation with dynamic content
    function showFullPageLottie(amount, donationType, destination) {
        const overlay = document.getElementById('fullPageLottie');
        if (overlay) {
            // Update dynamic content
            updateSuccessMessage(amount, donationType, destination);

            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            if (fullPageAnimation) {
                fullPageAnimation.goToAndPlay(0);
            }
        }
    }

    // Update success message with donation details
    function updateSuccessMessage(amount, donationType, destination) {
        const amountEl = document.getElementById('successDonationAmount');
        const typeEl = document.getElementById('successDonationType');
        const destinationEl = document.getElementById('successDonationDestination');

        if (amountEl) {
            amountEl.textContent = '$' + amount.toFixed(2);
        }

        if (typeEl) {
            typeEl.textContent = donationType;
        }

        if (destinationEl) {
            destinationEl.textContent = destination || 'Caring Partners International';
        }
    }

    // Close full-page Lottie (exposed globally)
    window.closeFullPageLottie = function () {
        const overlay = document.getElementById('fullPageLottie');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';

            if (fullPageAnimation) {
                fullPageAnimation.stop();
            }
        }
    };

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            window.closeFullPageLottie();
        }
    });

})();
