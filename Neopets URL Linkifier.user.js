// ==UserScript==
// @name         Neopets URL Linkifier
// @namespace    snotspoon.neocities.org
// @version      1.5
// @description  Convert plaintext URLs into clickable links on Neopets
// @author       nadinejun0
// @match        https://www.neopets.com/*
// @match        http://www.neopets.com/*
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/524570/Neopets%20URL%20Linkifier.user.js
// @updateURL https://update.greasyfork.org/scripts/524570/Neopets%20URL%20Linkifier.meta.js
// ==/UserScript==

(function() {
    'use strict';
    // Regular expression for matching URLs - both with and without http(s)://
    const urlRegex = /((?:https?:\/\/)?(?:www\.)?(?:(?:neopets\.com\/[^\s<>"]+)|(?:impress\.openneo\.net\/[^\s<>"]+)|(?:impress-2020\.openneo\.net\/[^\s<>"]+)|(?:items\.jellyneo\.net\/[^\s<>"]+)))/g;

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
            // Add https:// if it's missing
            link.href = url.startsWith('http') ? url : 'https://' + url;
            link.textContent = url;

            // Special handling for shop links and fansite links
            if (url.includes('neopets.com') ||
                url.includes('impress.openneo.net') ||
                url.includes('impress-2020.openneo.net') ||
                url.includes('jellyneo.net')) {
                link.target = '_blank';
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

    // Function to walk through DOM nodes within a specific scope
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

    // Process specific sections of board posts
    function processNeoPosts() {
        // Process main post content
        const boardPosts = document.querySelectorAll('.boardPostMessage');
        boardPosts.forEach(post => walkNodes(post));

        // Process signatures (text after the separator)
        const postSeparators = document.querySelectorAll('span[style*="color:#818181"]');
        postSeparators.forEach(separator => {
            const nextNode = separator.nextSibling;
            if (nextNode) {
                walkNodes(nextNode);
            }
        });
    }

    // Initial processing
    processNeoPosts();

    // Set up a MutationObserver to handle dynamically added content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('boardPostMessage') ||
                        node.querySelector('.boardPostMessage')) {
                        processNeoPosts();
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
