document.addEventListener('DOMContentLoaded', () => {
    // --- Sélection des éléments du DOM ---
    const partnersContainer = document.getElementById('partners-container');
    const roomsContainer = document.getElementById('rooms-container');
    const plansContainer = document.getElementById('plans-container');
    const addPartnerBtn = document.getElementById('add-partner');
    const addRoomBtn = document.getElementById('add-room');
    const addPlanBtn = document.getElementById('add-plan');
    const generateJsonBtn = document.getElementById('generate-json');
    const jsonResultSection = document.getElementById('json-result-section');
    const jsonOutput = document.getElementById('json-output');
    const copyJsonBtn = document.getElementById('copy-json');
    const saveAsJsonBtn = document.getElementById('save-as-json');
    const downloadJsonBtn = document.getElementById('download-json');

    // --- Fonctions de création d'éléments ---

    function createPartnerItem(partner = { name: '', commission: '', codes: '' }) {
        const div = document.createElement('div');
        div.classList.add('partner-item');
        div.innerHTML = `
            <div class="input-group">
                <label>Nom du partenaire (ID) *</label>
                <input type="text" class="partner-name" value="${partner.name}" placeholder="Ex: Agoda (6144)" required>
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
            <button type="button" class="move-button move-up" aria-label="Monter">▲</button>
            <button type="button" class="move-button move-down" aria-label="Descendre">▼</button>
            <button type="button" class="remove-button" aria-label="Supprimer">Supprimer</button>
        `;
        div.querySelector('.remove-button').addEventListener('click', () => div.remove());
        div.querySelector('.move-up').addEventListener('click', () => moveItem(div, -1));
        div.querySelector('.move-down').addEventListener('click', () => moveItem(div, 1));
        container.appendChild(div);
    }

    // --- Fonction pour déplacer les éléments ---
    function moveItem(item, direction) {
        const parent = item.parentNode;
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(item);
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < siblings.length) {
            parent.removeChild(item);
            parent.insertBefore(item, siblings[newIndex]);
        }
    }

    // --- Fonction de téléchargement DIRECT (méthode classique) ---
    function downloadFile(content, fileName, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href); // Libère la mémoire
    }
    
    // --- NOUVELLE FONCTION "Enregistrer sous" avec API moderne et fallback ---
    async function saveFileAs(content, fileName, contentType) {
        // Option 1: Utiliser l'API moderne si elle est supportée
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                return; // Succès, on arrête ici
            } catch (err) {
                // L'utilisateur a annulé la boîte de dialogue ou une erreur est survenue
                console.log('Save As dialog was cancelled or failed.', err);
                return; // Ne pas exécuter le fallback si l'utilisateur annule
            }
        }

        // Option 2: Fallback pour les navigateurs non compatibles (Firefox, Safari)
        // Cette méthode se comportera comme un téléchargement standard
        console.log('File System Access API not supported. Falling back to standard download.');
        downloadFile(content, fileName, contentType);
    }


    // --- Écouteurs d'événements pour les boutons "Ajouter" ---
    addPartnerBtn.addEventListener('click', () => createPartnerItem());
    addRoomBtn.addEventListener('click', () => createSortableItem(roomsContainer, 'Nom du type de chambre *'));
    addPlanBtn.addEventListener('click', () => createSortableItem(plansContainer, 'Nom du plan tarifaire *'));

    // --- Écouteur pour la génération du JSON ---
    generateJsonBtn.addEventListener('click', () => {
        const config = { partners: {}, displayOrder: { rooms: [], plans: [] } };
        let isValid = true;

        partnersContainer.querySelectorAll('.partner-item').forEach(item => {
            const nameInput = item.querySelector('.partner-name');
            const commissionInput = item.querySelector('input[type="number"]');
            const codesTextarea = item.querySelector('textarea');
            const partnerNameId = nameInput.value.trim();
            if (!partnerNameId) {
                isValid = false;
                nameInput.style.borderColor = 'red';
            } else {
                nameInput.style.borderColor = '';
                const commissionValue = commissionInput.value !== '' ? parseFloat(commissionInput.value) : null;
                const codes = codesTextarea.value.split('\n').map(code => code.trim()).filter(Boolean);
                config.partners[partnerNameId] = { commission: commissionValue, codes: codes };
            }
        });
        
        function getSortableData(container, key) {
             container.querySelectorAll('.sortable-item input[type="text"]').forEach(input => {
                const value = input.value.trim();
                if (value) {
                    config.displayOrder[key].push(value);
                    input.style.borderColor = '';
                } else {
                    isValid = false;
                    input.style.borderColor = 'red';
                }
            });
        }
        
        getSortableData(roomsContainer, 'rooms');
        getSortableData(plansContainer, 'plans');
        
        if (!isValid) {
            alert("Veuillez remplir tous les champs obligatoires (marqués d'un * dans le placeholder ou le label).");
            return;
        }

        const jsonString = JSON.stringify(config, null, 2);
        jsonOutput.textContent = jsonString;
        jsonResultSection.style.display = 'block';
    });

    // --- Écouteurs pour les boutons d'action du JSON généré ---
    
    copyJsonBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
            copyJsonBtn.textContent = 'Copié !';
            copyJsonBtn.classList.add('copied');
            setTimeout(() => {
                copyJsonBtn.textContent = 'Copier le code';
                copyJsonBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Erreur lors de la copie : ', err);
            alert('La copie a échoué. Votre navigateur n\'est peut-être pas compatible ou la page n\'est pas sécurisée (https).');
        });
    });

    // Le bouton "Enregistrer sous" utilise la nouvelle fonction asynchrone
    saveAsJsonBtn.addEventListener('click', () => {
        saveFileAs(jsonOutput.textContent, 'config_hotel.json', 'application/json');
    });

    // Le bouton "Télécharger" utilise l'ancienne fonction pour un téléchargement direct
    downloadJsonBtn.addEventListener('click', () => {
        downloadFile(jsonOutput.textContent, 'config_hotel.json', 'application/json');
    });

    // --- Initialisation avec des éléments d'exemple ---
    createPartnerItem({ name: 'Booking.com (1234)', commission: '15', codes: 'OTA-RO-FLEX\nOTA-RO-NANR' });
    createPartnerItem();
    createSortableItem(roomsContainer, 'Nom du type de chambre *', 'Chambre Double Classique');
    createSortableItem(roomsContainer, 'Nom du type de chambre *');
    createSortableItem(plansContainer, 'Nom du plan tarifaire *', 'OTA-RO-FLEX - OTA RO FLEX');
    createSortableItem(plansContainer, 'Nom du plan tarifaire *');
});
