// ==UserScript==
// @name         Neopets Neolodge Auto-Settings
// @description  Automatically selects your last used lodge settings when the page loads
// @namespace    snotspoon.neocities.org
// @author       nadinejun0
// @version      1.1
// @match        https://www.neopets.com/neolodge.phtml*
// @match        https://*.neopets.com/neolodge.phtml*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Neolodge Auto-Settings script loaded!');

    function initializeScript() {
        console.log('Initializing script, looking for form...');
        const form = document.querySelector('form[action*="book_neolodge"]');
        if (!form) {
            console.log('Neolodge form not found');
            return;
        }

        console.log('Form found!');

        // restore saved settings on page load
        const saved = JSON.parse(localStorage.getItem('neolodge_settings') || '{}');
        console.log('Restoring settings:', saved);
        
        Object.keys(saved).forEach(name => {
            const field = document.querySelector(`[name="${name}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = saved[name];
                } else {
                    field.value = saved[name];
                }
                console.log(`Restored ${name}:`, saved[name]);
            } else {
                console.log(`Field not found: ${name}`);
            }
        });

        // save current settings when form is submitted
        form.addEventListener('submit', function() {
            const data = {};
            form.querySelectorAll('select, input').forEach(field => {
                if (field.name) {
                    data[field.name] = field.type === 'checkbox' ? field.checked : field.value;
                }
            });
            console.log('Saving settings:', data);
            localStorage.setItem('neolodge_settings', JSON.stringify(data));
        });
    }

    // run immediately if page is already loaded, otherwise wait for load event
    if (document.readyState === 'complete') {
        console.log('Page already loaded, running immediately');
        initializeScript();
    } else {
        console.log('Waiting for page to load...');
        window.addEventListener('load', initializeScript);
    }
})();
