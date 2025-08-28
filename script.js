document.addEventListener('DOMContentLoaded', () => {
    const partnersContainer = document.getElementById('partners-container');
    const roomsContainer = document.getElementById('rooms-container');
    const plansContainer = document.getElementById('plans-container');
    const addPartnerBtn = document.getElementById('add-partner');
    const addRoomBtn = document.getElementById('add-room');
    const addPlanBtn = document.getElementById('add-plan');
    const generateJsonBtn = document.getElementById('generate-json');
    const jsonOutput = document.getElementById('json-output');
    const downloadJsonBtn = document.getElementById('download-json');

    // --- Fonctions pour ajouter des éléments dynamiquement ---

    function createPartnerItem(partner = { name: '', commission: '', codes: '' }) {
        const div = document.createElement('div');
        div.classList.add('partner-item');
        div.innerHTML = `
            <div class="input-group">
                <label>Nom du partenaire (ID)</label>
                <input type="text" value="${partner.name}" placeholder="Ex: Agoda (6144)" required>
            </div>
            <div class="input-group">
                <label>Commission (%)</label>
                <input type="number" step="0.1" value="${partner.commission}" placeholder="Ex: 14.5 (optionnel)">
            </div>
            <div class="input-group full-width">
                <label>Codes tarifaires (séparés par des retours à la ligne)</label>
                <textarea placeholder="Ex: OTA-RO-FLEX&#10;OTA-RO-NANR">${partner.codes}</textarea>
            </div>
            <button type="button" class="remove-button">Supprimer</button>
        `;
        div.querySelector('.remove-button').addEventListener('click', () => div.remove());
        partnersContainer.appendChild(div);
    }

    function createSortableItem(container, placeholderText, value = '') {
        const div = document.createElement('div');
        div.classList.add('sortable-item');
        div.innerHTML = `
            <input type="text" value="${value}" placeholder="${placeholderText}" required>
            <button type="button" class="move-button move-up">▲</button>
            <button type="button" class="move-button move-down">▼</button>
            <button type="button" class="remove-button">Supprimer</button>
        `;

        div.querySelector('.remove-button').addEventListener('click', () => div.remove());
        div.querySelector('.move-up').addEventListener('click', () => moveItem(div, -1));
        div.querySelector('.move-down').addEventListener('click', () => moveItem(div, 1));
        container.appendChild(div);
    }

    // --- Fonctions pour déplacer les éléments (drag-and-drop-like) ---
    function moveItem(item, direction) {
        const parent = item.parentNode;
        const siblings = Array.from(parent.children).filter(child => child.classList.contains('sortable-item'));
        const index = siblings.indexOf(item);
        
        if (direction === -1 && index > 0) { // Move up
            parent.insertBefore(item, siblings[index - 1]);
        } else if (direction === 1 && index < siblings.length - 1) { // Move down
            parent.insertBefore(item, siblings[index + 1].nextSibling);
        }
    }


    // --- Écouteurs d'événements pour les boutons "Ajouter" ---
    addPartnerBtn.addEventListener('click', () => createPartnerItem());
    addRoomBtn.addEventListener('click', () => createSortableItem(roomsContainer, 'Nom du type de chambre (Ex: Chambre Double Classique)'));
    addPlanBtn.addEventListener('click', () => createSortableItem(plansContainer, 'Nom du plan tarifaire (Ex: OTA-RO-FLEX - OTA RO FLEX)'));

    // --- Fonction de génération du JSON ---
    generateJsonBtn.addEventListener('click', () => {
        const config = {
            partners: {},
            displayOrder: {
                rooms: [],
                plans: []
            }
        };

        // Récupérer les données des partenaires
        partnersContainer.querySelectorAll('.partner-item').forEach(item => {
            const nameInput = item.querySelector('input[type="text"]');
            const commissionInput = item.querySelector('input[type="number"]');
            const codesTextarea = item.querySelector('textarea');

            const partnerNameId = nameInput.value.trim();
            if (partnerNameId) {
                const commissionValue = commissionInput.value !== '' ? parseFloat(commissionInput.value) : null;
                const codes = codesTextarea.value
                                .split('\n')
                                .map(code => code.trim())
                                .filter(code => code !== '');

                config.partners[partnerNameId] = {
                    commission: commissionValue,
                    codes: codes
                };
            }
        });

        // Récupérer l'ordre d'affichage des chambres
        roomsContainer.querySelectorAll('.sortable-item input[type="text"]').forEach(input => {
            const roomName = input.value.trim();
            if (roomName) {
                config.displayOrder.rooms.push(roomName);
            }
        });

        // Récupérer l'ordre d'affichage des plans
        plansContainer.querySelectorAll('.sortable-item input[type="text"]').forEach(input => {
            const planName = input.value.trim();
            if (planName) {
                config.displayOrder.plans.push(planName);
            }
        });

        // Afficher le JSON
        const jsonString = JSON.stringify(config, null, 2);
        jsonOutput.textContent = jsonString;
        downloadJsonBtn.style.display = 'block'; // Afficher le bouton de téléchargement

        // Créer un Blob pour le téléchargement
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        downloadJsonBtn.href = url;
        downloadJsonBtn.download = 'config_hotel.json';
    });

    // --- Initialisation avec un exemple ou des éléments vides ---
    createPartnerItem({ name: 'Expedia (1903)', commission: '18', codes: 'OTA-RO-FLEX\nOTA-RO-NANR' });
    createPartnerItem(); // Un partenaire vide pour commencer
    createSortableItem(roomsContainer, 'Nom du type de chambre (Ex: Chambre Double Classique)', 'Chambre Double Classique');
    createSortableItem(roomsContainer, 'Nom du type de chambre (Ex: Chambre Double Classique)'); // Une chambre vide
    createSortableItem(plansContainer, 'Nom du plan tarifaire (Ex: OTA-RO-FLEX - OTA RO FLEX)', 'OTA-RO-FLEX - OTA RO FLEX');
    createSortableItem(plansContainer, 'Nom du plan tarifaire (Ex: OTA-RO-FLEX - OTA RO FLEX)'); // Un plan vide
});