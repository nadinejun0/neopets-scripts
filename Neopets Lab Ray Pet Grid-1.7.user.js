// ==UserScript==
// @name         Neopets Lab Ray Pet Grid
// @description  Displays all your pet portraits in a grid. No more click to scroll!
// @namespace    snotspoon.neocities.org
// @author       nadinejun0
// @version      1.7
// @match        https://www.neopets.com/lab2.phtml
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', function() {
        // Hide bxSlider wrapper and default display
        const bxWrap = document.getElementById('bxwrap');
        if (bxWrap) bxWrap.style.display = 'none';

        const defaultPetDisplay = document.querySelector('form[action="process_lab2.phtml"] > table > tbody > tr > table');
        if (defaultPetDisplay) defaultPetDisplay.style.display = 'none';

        const form = document.querySelector('form[action="process_lab2.phtml"]');
        if (!form) return;

        const seenPets = new Set();
        const petList = [];

        document.querySelectorAll('input[name="chosen"]').forEach(radio => {
            if (!seenPets.has(radio.value)) {
                seenPets.add(radio.value);
                petList.push(radio);
            }
        });

        const gridContainer = document.createElement('div');
        gridContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 160px);
            gap: 12px;
            justify-content: center;
            margin: 20px auto;
            padding: 10px;
            max-width: 700px;
        `;

        petList.forEach(radio => {
            const originalContainer = radio.closest('div');
            const img = originalContainer.querySelector('img');
            const text = originalContainer.querySelector('b').textContent;

            const card = document.createElement('div');
            card.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px;
                border: 2px solid #e0e0e0;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                background: white;
                position: relative;
                height: 180px;
            `;

            const imgContainer = document.createElement('div');
            imgContainer.style.cssText = `
                width: 130px;
                height: 130px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 6px;
            `;

            const newImg = img.cloneNode(true);
            newImg.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            `;

            const label = document.createElement('div');
            label.textContent = text;
            label.style.cssText = `
                font-size: 11px;
                text-align: center;
                color: #444;
                font-weight: bold;
                line-height: 1.2;
                margin-top: auto;
            `;

            radio.style.display = 'none';

            const selectedOverlay = document.createElement('div');
            selectedOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border: 3px solid #88ff88;
                border-radius: 6px;
                display: none;
            `;

            card.addEventListener('click', () => {
                radio.checked = true;
                document.querySelectorAll('.selected-overlay').forEach(overlay => overlay.style.display = 'none');
                selectedOverlay.style.display = 'block';
            });

            card.addEventListener('mouseenter', () => {
                if (!radio.checked) {
                    card.style.transform = 'translateY(-2px)';
                    card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }
            });

            card.addEventListener('mouseleave', () => {
                if (!radio.checked) {
                    card.style.transform = 'none';
                    card.style.boxShadow = 'none';
                }
            });

            imgContainer.appendChild(newImg);
            card.appendChild(imgContainer);
            card.appendChild(label);
            card.appendChild(radio);
            card.appendChild(selectedOverlay);
            selectedOverlay.classList.add('selected-overlay');

            gridContainer.appendChild(card);
        });

        const table = form.querySelector('table');
        table.innerHTML = '';

        const newRow = document.createElement('tr');
        const newCell = document.createElement('td');
        newCell.appendChild(gridContainer);
        newRow.appendChild(newCell);
        table.appendChild(newRow);

       
    });
})();