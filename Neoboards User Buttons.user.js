// ==UserScript==
// @name         [sn0tspoon] Neoboards User Buttons
// @namespace    http://snotspoon.neocities.com
// @version      1.3
// @description  Inserts "Neomail User" and "Copy Username" buttons to the left of report buttons on Neoboards posts
// @match        *://www.neopets.com/neoboards/*
// @grant        none
// @author       @nadinejun0
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════

    const CONFIG = {
        selectors: {
            reportButton: '.reportButton-neoboards',
            byline: '.boardPostByline',
            userLink: 'a[href*="userlookup.phtml?user="]'
        },
        classes: {
            container: 'np-extra-buttons',
            button: 'np-extra-button'
        },
        urls: {
            neomail: 'https://www.neopets.com/neomessages.phtml?type=send&recipient='
        },
        buttons: [
            { label: 'Neomail User', action: 'neomail', class: 'neomail' },
            { label: 'Copy Username', action: 'copy', class: 'copy' }
        ],
        dataAttribute: 'npExtraAdded'
    };

    const CSS_STYLES = `
        /* Container for our extra buttons */
        #boardTopic ul li .np-extra-buttons {
          margin-bottom: 5px;
          clear: both;
        }
        /* Extra button style */
        #boardTopic ul li .np-extra-buttons .np-extra-button {
          border: 1px solid #CACACA;
          font-family: "Palanquin", "Arial Bold", sans-serif;
          font-size: 9pt;
          line-height: 9pt;
          padding: 5px 10px;
          box-sizing: border-box;
          color: #CACACA;
          background-color: #FFF;
          border-radius: 10px;
          margin: 5px 5px 5px 0;
          display: inline-block;
          float: left;
          position: relative;
        }
        /* Hover state */
        #boardTopic ul li .np-extra-buttons .np-extra-button:hover {
          background-color: #CACACA;
          color: #FFF;
          cursor: pointer;
        }
        /* Active state: while pressed, show "Copied!" overlay only for copy button */
        #boardTopic ul li .np-extra-buttons .np-extra-button.copy:active::after {
          content: "Copied!";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFF;
          background-color: #CACACA;
          border-radius: 10px;
        }
    `;

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════════════════════════

    /** extracts username from neopets user lookup link */
    const extractUsername = (userLink) => {
        try {
            return new URL(userLink.href, window.location.href).searchParams.get('user');
        } catch {
            const match = userLink.href.match(/[?&]user=([^&#]+)/);
            return match ? decodeURIComponent(match[1]) : null;
        }
    };

    /** copies text to clipboard with fallback for older browsers */
    const copyToClipboard = (text) => {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(() => {}); // silent fail
        } else {
            // legacy fallback
            const input = Object.assign(document.createElement('input'), { value: text });
            document.body.append(input);
            input.select();
            document.execCommand('copy');
            input.remove();
        }
    };

    /** creates DOM element with properties */
    const createElement = (tag, properties = {}) => 
        Object.assign(document.createElement(tag), properties);

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // BUTTON ACTIONS
    // ═══════════════════════════════════════════════════════════════════════════════════════════════

    const buttonActions = {
        neomail: (username) => () => {
            window.open(`${CONFIG.urls.neomail}${encodeURIComponent(username)}`, '_blank');
        },
        copy: (username) => (event) => {
            event.preventDefault();
            copyToClipboard(username);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // DOM MANIPULATION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════

    /** injects CSS styles into document head */
    const injectStyles = () => {
        document.head.append(createElement('style', { textContent: CSS_STYLES }));
    };

    /** creates button with specified configuration */
    const createButton = ({ label, action, class: buttonClass }, username) => {
        const button = createElement('button', {
            textContent: label,
            className: `${CONFIG.classes.button} ${buttonClass}`
        });
        button.addEventListener('click', buttonActions[action](username));
        return button;
    };

    /** creates container with all buttons for username */
    const createButtonContainer = (username) => {
        const container = createElement('div', { className: CONFIG.classes.container });
        CONFIG.buttons.forEach(buttonConfig => {
            container.append(createButton(buttonConfig, username));
        });
        return container;
    };

    /** processes byline element to add buttons if needed */
    const processPostByline = (bylineElement) => {
        const { selectors, dataAttribute } = CONFIG;
        
        // early returns for efficiency
        if (bylineElement.dataset[dataAttribute]) return null;
        
        const userLink = bylineElement.querySelector(selectors.userLink);
        if (!userLink) return null;
        
        const username = extractUsername(userLink);
        if (!username) return null;
        
        // mark as processed and return container
        bylineElement.dataset[dataAttribute] = 'true';
        return createButtonContainer(username);
    };

    /** processes all report buttons and adds user buttons */
    const enhanceReportButtons = () => {
        const { selectors } = CONFIG;
        
        document.querySelectorAll(selectors.reportButton).forEach(reportButton => {
            const postItem = reportButton.closest('li');
            const bylineElement = postItem?.querySelector(selectors.byline);
            
            if (!bylineElement) return;
            
            const buttonContainer = processPostByline(bylineElement);
            if (buttonContainer) {
                reportButton.parentNode.insertBefore(buttonContainer, reportButton);
            }
        });
    };

    // ═══════════════════════════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════════════════════════

    /** main initialization function */
    const initialize = () => {
        injectStyles();
        enhanceReportButtons();
    };

    // start when DOM is ready
    document.readyState === 'loading' 
        ? document.addEventListener('DOMContentLoaded', initialize)
        : initialize();

})();
