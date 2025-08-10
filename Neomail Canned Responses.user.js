// ==UserScript==
// @name         [sn0tspoon] NeoMail Canned Responses
// @namespace    http://snotspoon.neocities.com
// @version      1.1
// @description  Adds canned response functionality to Neopets NeoMail
// @author       nadinejun0
// @match        https://www.neopets.com/neomessages.phtml?type=send*
// @match        https://www.neopets.com/neomessages.phtml?*recipient=*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const EDITOR_IFRAME_ID = 'message_body';
  const FONT_STACK = 'Verdana, Arial, Helvetica, sans-serif';

  const storageKeyFor = (i) => `cannedResponse${i}`;

  // load saved responses
  function loadResponses() {
    return {
      response1: GM_getValue(storageKeyFor(1), ''),
      response2: GM_getValue(storageKeyFor(2), ''),
      response3: GM_getValue(storageKeyFor(3), ''),
    };
  }

  // save responses
  function saveResponses(responses) {
    for (let i = 1; i <= 3; i++) {
      GM_setValue(storageKeyFor(i), responses[`response${i}`]);
    }
  }

  // get rich text editor document
  function getEditorDoc() {
    const iframe = document.getElementById(EDITOR_IFRAME_ID);
    if (!iframe || !iframe.contentWindow) return null;
    const doc = iframe.contentWindow.document;
    if (!doc || !doc.body) return null;
    return doc;
  }

  // insert text into editor or textarea
  function insertCannedResponse(text) {
    if (!text) return;

    const rteDoc = getEditorDoc();

    if (rteDoc) {
      try {
        rteDoc.defaultView.focus();

        let inserted = false;

        // Try execCommand first
        if (typeof rteDoc.execCommand === 'function') {
          inserted = rteDoc.execCommand('insertHTML', false, text);
        }

        // Fallback to Selection API
        if (!inserted) {
          const sel = rteDoc.getSelection ? rteDoc.getSelection() : rteDoc.defaultView.getSelection?.();
          if (sel && sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const temp = rteDoc.createElement('div');
            temp.innerHTML = text;
            const frag = rteDoc.createDocumentFragment();
            while (temp.firstChild) frag.appendChild(temp.firstChild);
            range.insertNode(frag);
            // Move caret to end of insertion
            sel.collapseToEnd?.();
            inserted = true;
          }
        }

        // Final fallback: append to end
        if (!inserted) {
          rteDoc.body.insertAdjacentHTML('beforeend', text);
        }
      } catch (e) {
        console.error('Error inserting text into rich text editor:', e);
        alert('There was an error inserting the canned response. Please try again or edit your message manually.');
      }
      return;
    }

    // Plain textarea path
    try {
      const textArea = document.querySelector('textarea[name="message"]');
      if (textArea) {
        const hasSelectionAPI = typeof textArea.selectionStart === 'number' && typeof textArea.selectionEnd === 'number';
        const start = hasSelectionAPI ? textArea.selectionStart : textArea.value.length;
        const end = hasSelectionAPI ? textArea.selectionEnd : textArea.value.length;

        const before = textArea.value.slice(0, start);
        const after = textArea.value.slice(end);
        textArea.value = before + text + after;

        const pos = start + text.length;
        if (hasSelectionAPI) {
          textArea.setSelectionRange(pos, pos);
        }
        textArea.focus();

        // Trigger input event in case the site listens for it
        textArea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (e) {
      console.error('Error inserting text into plain text editor:', e);
      alert('There was an error inserting the canned response. Please try again or edit your message manually.');
    }
  }

  // Create and show edit dialog
  function showEditDialog(responseIndex, responses) {
    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'background-color: rgba(0, 0, 0, 0.7)',
      'z-index: 9998',
    ].join(';');
    document.body.appendChild(overlay);

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'canned-dialog-title');
    dialog.style.cssText = [
      'position: fixed',
      'top: 50%',
      'left: 50%',
      'transform: translate(-50%, -50%)',
      'background-color: white',
      'border: 1px solid #000000',
      'padding: 15px',
      'width: 500px',
      'max-width: 90%',
      'z-index: 9999',
      `font-family: ${FONT_STACK}`,
      'font-size: 9pt',
    ].join(';');

    const titleTable = document.createElement('table');
    titleTable.width = '100%';
    titleTable.cellPadding = '2';
    titleTable.cellSpacing = '0';
    titleTable.border = '0';
    titleTable.style.marginBottom = '10px';

    const titleRow = document.createElement('tr');
    const titleCell = document.createElement('td');
    titleCell.style.backgroundColor = '#C8E3FF';
    titleCell.innerHTML = `<b id="canned-dialog-title" class="medText">Edit Canned Response ${responseIndex}</b>`;
    titleRow.appendChild(titleCell);
    titleTable.appendChild(titleRow);
    dialog.appendChild(titleTable);

    const textArea = document.createElement('textarea');
    textArea.value = responses[`response${responseIndex}`];
    textArea.style.cssText = [
      'width: 100%',
      'height: 150px',
      'margin-bottom: 15px',
      'padding: 5px',
      'box-sizing: border-box',
      `font-family: ${FONT_STACK}`,
      'font-size: 9pt',
      'border: 1px solid #000000',
    ].join(';');
    dialog.appendChild(textArea);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = ['display: flex', 'justify-content: flex-end'].join(';');

    const saveButton = document.createElement('input');
    saveButton.type = 'button';
    saveButton.value = 'Save';
    saveButton.style.cssText = [`margin-left: 10px`, 'padding: 2px 8px', `font-family: ${FONT_STACK}`, 'font-size: 9pt'].join(';');

    const cancelButton = document.createElement('input');
    cancelButton.type = 'button';
    cancelButton.value = 'Cancel';
    cancelButton.style.cssText = ['padding: 2px 8px', `font-family: ${FONT_STACK}`, 'font-size: 9pt'].join(';');

    function closeDialog() {
      document.removeEventListener('keydown', onKeyDown, true);
      if (overlay.parentNode) document.body.removeChild(overlay);
      if (dialog.parentNode) document.body.removeChild(dialog);
    }

    function onKeyDown(evt) {
      if (evt.key === 'Escape') {
        evt.preventDefault();
        closeDialog();
      }
    }

    saveButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      responses[`response${responseIndex}`] = textArea.value;
      saveResponses(responses);
      closeDialog();

      const oldContainer = document.getElementById('canned-responses-container');
      if (oldContainer) {
        const newContainer = createUI();
        oldContainer.parentNode.replaceChild(newContainer, oldContainer);
      }
      return false;
    });

    cancelButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDialog();
      return false;
    });

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    dialog.appendChild(buttonContainer);
    document.body.appendChild(dialog);

    document.addEventListener('keydown', onKeyDown, true);
    textArea.focus();
  }

  // build UI
  function createUI() {
    const responses = loadResponses();

    const container = document.createElement('div');
    container.id = 'canned-responses-container';
    container.style.cssText = 'margin-bottom: 10px';

    const table = document.createElement('table');
    table.width = '100%';
    table.cellPadding = '6';
    table.cellSpacing = '1';
    table.border = '0';
    table.style.border = '1px solid #000000';
    table.style.borderCollapse = 'collapse';

    const headerRow = document.createElement('tr');
    const headerCell = document.createElement('td');
    headerCell.width = '100%';
    headerCell.style.backgroundColor = '#C8E3FF';
    headerCell.innerHTML = '<b class="medText">Canned Responses</b>';
    headerRow.appendChild(headerCell);
    table.appendChild(headerRow);

    const contentRow = document.createElement('tr');
    const contentCell = document.createElement('td');
    contentCell.style.backgroundColor = '#F6F6F6';
    contentCell.classList.add('medText');

    for (let i = 1; i <= 3; i++) {
      const responseKey = `response${i}`;

      const buttonRow = document.createElement('div');
      buttonRow.style.cssText = ['margin-bottom: 8px', 'display: flex', 'align-items: center'].join(';');

      const useButton = document.createElement('input');
      useButton.type = 'button';
      useButton.value = `Use Response ${i}`;
      useButton.style.cssText = [`margin-right: 10px`, 'padding: 2px 8px', `font-family: ${FONT_STACK}`, 'font-size: 7.5pt'].join(';');
      useButton.disabled = !responses[responseKey];
      if (!responses[responseKey]) {
        useButton.title = 'No response saved';
      }
      useButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        insertCannedResponse(responses[responseKey]);
        return false;
      });
      buttonRow.appendChild(useButton);

      const editButton = document.createElement('input');
      editButton.type = 'button';
      editButton.value = 'Edit';
      editButton.style.cssText = [`margin-right: 10px`, 'padding: 2px 8px', `font-family: ${FONT_STACK}`, 'font-size: 7.5pt'].join(';');
      editButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showEditDialog(i, responses);
        return false;
      });
      buttonRow.appendChild(editButton);

      const preview = document.createElement('span');
      preview.style.cssText = [
        'color: #666',
        'font-style: italic',
        'font-size: 7.5pt',
        'white-space: nowrap',
        'overflow: hidden',
        'text-overflow: ellipsis',
        'max-width: 300px',
        'display: inline-block',
      ].join(';');

      const fullText = responses[responseKey] || '';
      preview.title = fullText;

      if (fullText) {
        const cut = fullText.substring(0, 50);
        preview.textContent = cut + (fullText.length > 50 ? '...' : '');
      } else {
        preview.textContent = '(No response saved)';
      }
      buttonRow.appendChild(preview);

      contentCell.appendChild(buttonRow);
    }

    contentRow.appendChild(contentCell);
    table.appendChild(contentRow);
    container.appendChild(table);

    return container;
  }

  // init
  window.addEventListener('load', () => {
    if (document.getElementById('canned-responses-container')) return;

    const messageForm = document.querySelector('form[name="neomessage"]');
    if (!messageForm) return;

    const submitDiv = messageForm.querySelector('div[align="center"]');
    if (!submitDiv) return;

    messageForm.insertBefore(createUI(), submitDiv);
  });
})();