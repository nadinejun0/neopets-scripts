// ==UserScript==
// @name         SDB Quick Quantity Buttons - Neopets
// @namespace    snotspoon.neocities.org
// @version      1.1
// @description  Add +/- buttons next to quantity inputs in Safety Deposit Box
// @author       nadinejun0
// @match        https://www.neopets.com/safetydeposit.phtml*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Style for the buttons
    const style = document.createElement('style');
    style.textContent = `
        .quantity-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }
        .quantity-btn {
            cursor: pointer;
            padding: 2px 8px;
            background: #4479BA;
            color: white;
            border: 1px solid #20538D;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
        }
        .quantity-btn:hover {
            background: #356094;
        }
        .remove_safety_deposit {
            text-align: center;
            width: 40px !important;
            margin: 0 5px;
        }
    `;
    document.head.appendChild(style);

    // Modification part
    document.querySelectorAll('input[class="remove_safety_deposit"]').forEach(input => {
        const maxQty = parseInt(input.dataset.total_count);
        const container = document.createElement('div');
        container.className = 'quantity-controls';

        // Create minus button
        const minusBtn = document.createElement('button');
        minusBtn.textContent = '-';
        minusBtn.className = 'quantity-btn';
        minusBtn.type = 'button';

        // Create plus button
        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.className = 'quantity-btn';
        plusBtn.type = 'button';

        // Wrap input in container with buttons on either side
        input.parentNode.insertBefore(container, input);
        container.appendChild(minusBtn);
        container.appendChild(input.cloneNode(true));
        container.appendChild(plusBtn);
        input.remove();  // Remove original input after cloning

        // Get the new input reference
        const newInput = container.querySelector('input');

        // Add button handlers
        minusBtn.onclick = () => {
            const currentVal = parseInt(newInput.value) || 0;
            if (currentVal > 0) {
                newInput.value = currentVal - 1;
                newInput.setAttribute('data-remove_val', newInput.value > 0 ? 'y' : 'n');
            }
        };

        plusBtn.onclick = () => {
            const currentVal = parseInt(newInput.value) || 0;
            if (currentVal < maxQty) {
                newInput.value = currentVal + 1;
                newInput.setAttribute('data-remove_val', 'y');
            }
        };

        // Input validation
        newInput.addEventListener('change', () => {
            let val = parseInt(newInput.value) || 0;
            if (val < 0) val = 0;
            if (val > maxQty) val = maxQty;
            newInput.value = val;
            newInput.setAttribute('data-remove_val', val > 0 ? 'y' : 'n');
        });
    });
})();