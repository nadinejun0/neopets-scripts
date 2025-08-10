// ==UserScript==
// @name         [sn0tspoon] Alien Aisha Vending Machine Mash-o-Matic
// @namespace    http://snotspoon.neocities.com
// @version      1.0
// @description  Replaces the GO!!! submit button with a clickable link that opens the form submission in a new tab so u can mash
// @match        *.neopets.com/vending2.phtml
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  function styleMashLink(link) {
    // Base look
    const base = () => {
      link.style.display = 'inline-block';
      link.style.padding = '10px 18px';
      link.style.minWidth = '96px';
      link.style.textAlign = 'center';
      link.style.textDecoration = 'none';
      link.style.fontWeight = '700';
      link.style.letterSpacing = '0.5px';
      link.style.borderRadius = '8px';
      link.style.border = '1px solid #0b6b2a';
      link.style.background = 'linear-gradient(#34c759, #2aa84f)';
      link.style.color = '#ffffff';
      link.style.boxShadow = '0 2px 0 #0b6b2a, 0 2px 6px rgba(0,0,0,0.25)';
      link.style.userSelect = 'none';
      link.style.webkitUserSelect = 'none';
      link.style.MozUserSelect = 'none';
      link.style.cursor = 'pointer';
      link.style.transition = 'transform 60ms ease, box-shadow 60ms ease, background-color 120ms ease';
      link.style.outline = 'none';
      link.style.touchAction = 'manipulation';
      link.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
      link.style.transform = 'translateY(0)';
    };

    const hover = () => {
      link.style.background = 'linear-gradient(#37d761, #2fb956)';
      link.style.boxShadow = '0 3px 0 #0b6b2a, 0 4px 10px rgba(0,0,0,0.28)';
    };

    const active = () => {
      link.style.background = 'linear-gradient(#2fb956, #279e49)';
      link.style.boxShadow = '0 1px 0 #0b6b2a, 0 2px 6px rgba(0,0,0,0.25)';
      link.style.transform = 'translateY(1px)';
    };

    const focus = () => {
      link.style.boxShadow = '0 0 0 3px rgba(52,199,89,0.45), 0 2px 0 #0b6b2a, 0 2px 6px rgba(0,0,0,0.25)';
    };

    base();

    link.addEventListener('mouseenter', hover);
    link.addEventListener('mouseleave', base);
    link.addEventListener('mousedown', active);
    link.addEventListener('mouseup', hover);
    link.addEventListener('touchstart', active, { passive: true });
    link.addEventListener('touchend', base);
    link.addEventListener('focus', focus);
    link.addEventListener('blur', base);
  }

  function openInNewTabGET(action, form) {
    const formData = new FormData(form);
    const params = new URLSearchParams(formData).toString();
    const baseURL = action.split('?')[0];
    const url = baseURL + (params ? '?' + params : '');
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      try { win.opener = null; } catch (_) {}
    }
  }

  function openInNewTabPOST(action, form) {
    const temp = document.createElement('form');
    temp.method = 'POST';
    temp.action = action;
    temp.target = '_blank';

    const formData = new FormData(form);
    for (const [name, value] of formData.entries()) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      temp.appendChild(input);
    }

    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    document.body.appendChild(temp);
    temp.submit();
    temp.remove();
  }

  function makeLinkFromSubmit(input, form) {
    const link = document.createElement('a');
    link.textContent = input.value;
    link.className = input.className; // keep any site styling
    link.setAttribute('role', 'button');
    link.setAttribute('tabindex', '0');
    link.title = 'Open submission in a new tab';

    // New visual styling
    styleMashLink(link);

    const action = form.getAttribute('action') || window.location.href;
    const method = (form.getAttribute('method') || 'GET').toUpperCase();

    function activate(e) {
      e.preventDefault();
      if (method === 'POST') openInNewTabPOST(action, form);
      else openInNewTabGET(action, form);
    }

    link.addEventListener('click', activate);
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') activate(e);
    });

    return link;
  }

  function transformSubmitButton(root = document) {
    const inputs = root.querySelectorAll("input[type='submit']");
    inputs.forEach((input) => {
      if ((input.value || '').trim() !== 'GO!!!') return;
      const form = input.closest('form');
      if (!form) return;
      if (form.dataset.goMashApplied === '1') return;

      const link = makeLinkFromSubmit(input, form);
      input.parentNode.replaceChild(link, input);
      form.dataset.goMashApplied = '1';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => transformSubmitButton());
  } else {
    transformSubmitButton();
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches && node.matches("input[type='submit'], form")) {
          transformSubmitButton(node.closest('form') || node);
        } else if (node.querySelector) {
          const submit = node.querySelector("input[type='submit'][value='GO!!!']");
          if (submit) transformSubmitButton(node);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();