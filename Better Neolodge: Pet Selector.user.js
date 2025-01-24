// ==UserScript==
// @name         Better Neolodge: Pet Selector
// @namespace    snotspoon.neocities.org
// @version      1.0
// @description  Enhances the Neolodge pet selection with checkboxes and multi-select
// @author       nadinejun0
// @match        https://www.neopets.com/neolodge.phtml
// @grant        none
// @license
// ==/UserScript==

(function() {
    'use strict';

    // Hide the original "Book All Pets" checkbox
    const bookAllCheckbox = document.querySelector('input[name="book_all"]');
    if (bookAllCheckbox) {
        bookAllCheckbox.parentElement.parentElement.style.display = 'none';
    }

    // Make the TD cell white and hide the original "Pet Name" header
    const tdCell = document.querySelector('td[bgcolor="#ffffee"]');
    if (tdCell) {
        tdCell.style.backgroundColor = '#fff';
        const originalHeader = tdCell.querySelector('b');
        if (originalHeader && originalHeader.textContent === 'Pet Name') {
            originalHeader.style.visibility = 'hidden';
        }
    }

    // Create and style the container for checkboxes
    const petListContainer = document.createElement('div');
    petListContainer.style.margin = '10px auto';
    petListContainer.style.padding = '10px';
    petListContainer.style.border = '1px solid #ccc';
    petListContainer.style.borderRadius = '5px';
    petListContainer.style.backgroundColor = '#ffffee';
    petListContainer.style.maxWidth = '600px';

    // header
    const header = document.createElement('div');
    header.style.fontWeight = 'bold';
    header.style.fontSize = '14px';
    header.style.marginBottom = '10px';
    header.style.paddingBottom = '5px';
    header.style.borderBottom = '1px solid #ddd';
    header.textContent = 'Pet Name';
    petListContainer.appendChild(header);

    // pet grid container
    const petGrid = document.createElement('div');
    petGrid.style.display = 'grid';
    petGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    petGrid.style.gap = '8px';
    petGrid.style.marginTop = '10px';

    // "Select All" checkbox with styling
    const selectAllLabel = document.createElement('label');
    selectAllLabel.style.display = 'block';
    selectAllLabel.style.marginTop = '5px';
    selectAllLabel.style.marginBottom = '10px';
    selectAllLabel.style.paddingBottom = '5px';
    selectAllLabel.style.borderBottom = '1px solid #ddd';

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-pets';
    selectAllCheckbox.style.marginRight = '5px';

    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(document.createTextNode('Select All Pets'));
    petListContainer.appendChild(selectAllLabel);

    // Get the original select element and hide it
    const originalSelect = document.querySelector('select[name="pet_name"]');
    originalSelect.style.display = 'none';

    // Get all pets from the original select
    const pets = Array.from(originalSelect.options)
        .filter(option => option.value !== '') // Remove the "Please Select a Neopet" option
        .map(option => option.text);

    // Create checkbox for each pet
    pets.forEach(pet => {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.padding = '5px';
        label.style.borderRadius = '3px';
        label.style.cursor = 'pointer';
        label.style.transition = 'background-color 0.2s';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = pet;
        checkbox.style.marginRight = '5px';

        // Add hover effect
        label.addEventListener('mouseover', () => {
            label.style.backgroundColor = '#f0f0f0';
        });
        label.addEventListener('mouseout', () => {
            label.style.backgroundColor = 'transparent';
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(pet));
        petGrid.appendChild(label);
    });

    petListContainer.appendChild(petGrid);

    // Insert the new container before the original select
    originalSelect.parentNode.insertBefore(petListContainer, originalSelect);

    // Handle "Select All" functionality
    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = petGrid.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    // Find the form and modify its submit behavior
    const form = document.querySelector('form[action="book_neolodge.phtml"]');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get all selected pets
        const selectedPets = Array.from(petGrid.querySelectorAll('input[type="checkbox"]'))
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        if (selectedPets.length === 0) {
            alert('Please select at least one pet!');
            return;
        }

        // Create hidden inputs for each selected pet
        const hiddenInputsContainer = document.createElement('div');
        selectedPets.forEach((pet, index) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `pet_name${index > 0 ? '_' + index : ''}`;
            input.value = pet;
            hiddenInputsContainer.appendChild(input);
        });

        // Replace the original select with our hidden inputs
        originalSelect.parentNode.replaceChild(hiddenInputsContainer, originalSelect);

        // Submit the form
        form.submit();
    });
})();
