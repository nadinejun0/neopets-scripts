// ==UserScript==
// @name         [sn0tspoon] Neopets URL Linkifier
// @namespace    snotspoon.neocities.org
// @version      1.7
// @description  Convert plaintext URLs into clickable links on Neopets
// @author       nadinejun0
// @match        https://www.neopets.com/*
// @match        http://www.neopets.com/*
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/524570/Neopets%20URL%20Linkifier.user.js
// @updateURL    https://update.greasyfork.org/scripts/524570/Neopets%20URL%20Linkifier.meta.js
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // URL pattern used by both matching and testing
  const URL_PATTERN =
    '(?:https?:\\/\\/)?(?:www\\.)?(?:(?:neopets\\.com\\/[^\\s<>"\']+)|(?:impress\\.openneo\\.net\\/[^\\s<>"\']+)|(?:impress-2020\\.openneo\\.net\\/[^\\s<>"\']+)|(?:items\\.jellyneo\\.net\\/[^\\s<>"\']+))';

  const urlRegex = new RegExp(URL_PATTERN, 'g');      // for exec loop
  const urlTest = new RegExp(URL_PATTERN);            // for quick .test

  const SKIP_SELECTOR = 'a,script,style,textarea,input';

  // replace plaintext URLs inside <a> elements
  function processTextNode(node) {
    const text = node.textContent;
    if (!text || !urlTest.test(text)) return;
    if (!node.parentNode) return;

    // exclusions
    if (node.parentNode.closest && node.parentNode.closest(SKIP_SELECTOR)) return;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    urlRegex.lastIndex = 0;

    let match;
    while ((match = urlRegex.exec(text)) !== null) {
      const matchedUrl = match[0];
      const start = match.index;

      // append text before the match
      if (start > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      }

      // create link
      const link = document.createElement('a');
      const href = matchedUrl.startsWith('http') ? matchedUrl : 'https://' + matchedUrl;
      link.href = href;
      link.textContent = matchedUrl;

      if (
        matchedUrl.includes('neopets.com') ||
        matchedUrl.includes('impress.openneo.net') ||
        matchedUrl.includes('impress-2020.openneo.net') ||
        matchedUrl.includes('jellyneo.net')
      ) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      fragment.appendChild(link);
      lastIndex = start + matchedUrl.length;
    }

    // append any remaining trailing text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }


      if (node.parentNode) {
      node.parentNode.replaceChild(fragment, node);
    }
  }

  function processContainer(container) {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (n) => {
          if (!n.nodeValue || !urlTest.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
          const p = n.parentNode;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.closest && p.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false
    );

    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    for (const tn of nodes) processTextNode(tn);
  }

  // Process specific sections of board posts
  function processNeoPosts(root = document) {
    // main post content
    root.querySelectorAll('.boardPostMessage').forEach((post) => processContainer(post));

    // signatures area after separator span
    root.querySelectorAll('span[style*="color:#818181"]').forEach((separator) => {
      const nextNode = separator.nextSibling;
      if (!nextNode) return;
      if (nextNode.nodeType === Node.TEXT_NODE) {
        processTextNode(nextNode);
      } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
        processContainer(nextNode);
      }
    });
  }

  // init
  processNeoPosts(document);

  // observer
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        if (node.classList && node.classList.contains('boardPostMessage')) {
          processContainer(node);
          continue;
        }

        const post = node.querySelector && node.querySelector('.boardPostMessage');
        if (post) processContainer(post);

        // Also handle new separators that might appear
        if (node.matches && node.matches('span[style*="color:#818181"]')) {
          const nextNode = node.nextSibling;
          if (nextNode) {
            if (nextNode.nodeType === Node.TEXT_NODE) processTextNode(nextNode);
            else if (nextNode.nodeType === Node.ELEMENT_NODE) processContainer(nextNode);
          }
        } else if (node.querySelector) {
          node.querySelectorAll('span[style*="color:#818181"]').forEach((sep) => {
            const nn = sep.nextSibling;
            if (!nn) return;
            if (nn.nodeType === Node.TEXT_NODE) processTextNode(nn);
            else if (nn.nodeType === Node.ELEMENT_NODE) processContainer(nn);
          });
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();