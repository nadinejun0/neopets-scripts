// ==UserScript==
// @name         Neopets URL Linkifier
// @namespace    snotspoon.neocities.org
// @version      1.0
// @description  Convert plaintext URLs into clickable links on Neopets
// @author       AI mostly
// @match        https://www.neopets.com/*
// @match        http://www.neopets.com/*
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/524570/Neopets%20URL%20Linkifier.user.js
// @updateURL https://update.greasyfork.org/scripts/524570/Neopets%20URL%20Linkifier.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // DTI, JN, and Neopets URLs
    const urlRegex = /(https?:\/\/(?:www\.)?(?:neopets\.com|impress\.openneo\.net|jellyneo\.net)[^\s<>"]+)/g;
    
    // Function to process a text node
    function processTextNode(node) {
        const text = node.textContent;
        if (!text.match(urlRegex)) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        text.replace(urlRegex, (url, offset) => {
            // Add text before the URL
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, offset)));

            // Create the link
            const link = document.createElement('a');
            link.href = url;
            link.textContent = url;

            // Special handling for shop links
            if (url.includes('browseshop.phtml')) {
                link.className = 'shop-link';
                link.target = '_blank'; // Open shop links in new tab
            }

            fragment.appendChild(link);
            lastIndex = offset + url.length;
        });

        // Add any remaining text
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        // Replace the original text node with our fragment
        node.parentNode.replaceChild(fragment, node);
    }

    // Function to walk through DOM nodes
    function walkNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            processTextNode(node);
            return;
        }

        // Skip certain elements where we don't want to process URLs
        const skipTags = ['SCRIPT', 'STYLE', 'A', 'TEXTAREA', 'INPUT'];
        if (skipTags.includes(node.nodeName)) return;

        // Process child nodes
        Array.from(node.childNodes).forEach(walkNodes);
    }

    // Process the board posts specifically
    function processNeoPosts() {
        const boardPosts = document.querySelectorAll('.boardPostMessage');
        boardPosts.forEach(post => walkNodes(post));
    }

    // Initial processing
    processNeoPosts();

    // Set up a MutationObserver to handle dynamically added content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('boardPostMessage')) {
                        walkNodes(node);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
