// Initialize data
let appData = JSON.parse(localStorage.getItem('startPageData')) || defaultData;

// Elements
const gridContainer = document.getElementById('grid-container');
const clockEl = document.getElementById('clock');
const weatherEl = document.getElementById('weather');
const editModeBtn = document.getElementById('edit-mode-btn');
const settingsBtn = document.getElementById('settings-btn');
const body = document.body;

// Modals
const addGroupModal = document.getElementById('add-group-modal');
const editGroupModal = document.getElementById('edit-group-modal');
const settingsModal = document.getElementById('settings-modal');

// State
let isEditMode = false;
let currentEditGroupId = null;

// --- Initialization ---
function init() {
    renderGrid();
    startClock();
    fetchWeather();
    setupEventListeners();
}

// --- Rendering ---
function renderGrid() {
    gridContainer.innerHTML = '';
    
    appData.groups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.groupId = group.id;
        card.draggable = false; // Default false

        const header = document.createElement('div');
        header.className = 'card-header';
        
        // Header HTML
        header.innerHTML = `
            <div class="header-content">
                <i class="fas fa-grip-horizontal handle group-handle" title="Drag to reorder group"></i>
                <span class="group-title">${group.title}</span>
            </div>
            <div class="header-actions">
                <i class="fas fa-pen header-btn edit-group-btn" title="Edit Group"></i>
            </div>
        `;
        
        // Setup Card Dragging (Only in Edit Mode via Handle)
        if (isEditMode) {
            setupCardDragEvents(card, header.querySelector('.group-handle'));
        }
        
        // Edit Group Handler
        header.querySelector('.edit-group-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditGroupModal(group.id);
        });

        const body = document.createElement('div');
        body.className = 'card-body';

        if (group.links) {
            group.links.forEach(link => {
                if (link.type === 'list') {
                    // Render a list (dropdown)
                    const listContainer = document.createElement('div');
                    listContainer.className = 'list-container';
                    
                    const listHeader = document.createElement('div');
                    listHeader.className = 'list-header';
                    listHeader.innerHTML = `
                        <span>${link.name}</span>
                        <i class="fas fa-chevron-down"></i>
                    `;
                    
                    const listItems = document.createElement('div');
                    listItems.className = 'list-items';
                    
                    if (link.links) {
                        link.links.forEach(subLink => {
                            const a = document.createElement('a');
                            a.className = 'link-item';
                            a.href = isEditMode ? '#' : subLink.url;
                            a.textContent = subLink.name;
                            a.target = "_blank";
                            if (isEditMode) a.addEventListener('click', (e) => e.preventDefault());
                            listItems.appendChild(a);
                        });
                    }
                    
                    listHeader.addEventListener('click', () => {
                        listItems.classList.toggle('open');
                        listHeader.classList.toggle('open');
                    });
                    
                    listContainer.appendChild(listHeader);
                    listContainer.appendChild(listItems);
                    body.appendChild(listContainer);
                    
                } else {
                    // Render a normal link
                    const a = document.createElement('a');
                    a.className = 'link-item';
                    a.href = isEditMode ? '#' : link.url;
                    a.textContent = link.name;
                    a.target = "_blank"; 
                    
                    if (isEditMode) {
                        a.addEventListener('click', (e) => e.preventDefault());
                    }

                    body.appendChild(a);
                }
            });
        }

        card.appendChild(header);
        card.appendChild(body);
        gridContainer.appendChild(card);
    });

    // Add Group Card (Visible in Edit Mode)
    const addGroupCard = document.createElement('div');
    addGroupCard.className = 'card add-group-card';
    addGroupCard.innerHTML = '<i class="fas fa-plus"></i>';
    addGroupCard.addEventListener('click', () => {
        document.getElementById('new-group-name').value = '';
        document.getElementById('add-group-modal').classList.remove('hidden');
    });
    gridContainer.appendChild(addGroupCard);
}

function setupCardDragEvents(card, handle) {
    if (!handle) return;

    let isHandleClicked = false;

    handle.addEventListener('mousedown', () => {
        isHandleClicked = true;
        card.draggable = true;
    });

    handle.addEventListener('mouseup', () => {
        isHandleClicked = false;
        card.draggable = false;
    });

    handle.addEventListener('mouseleave', () => {
        if (!card.classList.contains('dragging')) {
            isHandleClicked = false;
            card.draggable = false;
        }
    });

    card.addEventListener('dragstart', (e) => {
        if (!isHandleClicked) {
            e.preventDefault();
            return;
        }
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.groupId);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        card.draggable = false; // Reset
        // Force save explicitly after a short timeout to ensure DOM has settled
        setTimeout(saveGroupOrder, 50);
    });
}

function saveGroupOrder() {
    const newGroupOrder = [];
    const cards = gridContainer.querySelectorAll('.card:not(.add-group-card)');
    
    cards.forEach(card => {
        const groupId = card.dataset.groupId;
        const group = appData.groups.find(g => g.id === groupId);
        if (group) {
            newGroupOrder.push(group);
        }
    });

    if (newGroupOrder.length === appData.groups.length) {
        appData.groups = newGroupOrder;
        saveData();
    }
}

// --- Logic ---

function saveData() {
    localStorage.setItem('startPageData', JSON.stringify(appData));
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    body.classList.toggle('edit-mode', isEditMode);
    renderGrid();
    editModeBtn.classList.toggle('active', isEditMode);
    editModeBtn.innerHTML = isEditMode ? '<i class="fas fa-check"></i>' : '<i class="fas fa-edit"></i>';
}

// Clock
function startClock() {
    function update() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        clockEl.textContent += ` | ${dateStr}`;
    }
    update();
    setInterval(update, 1000);
}

// Weather
async function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            getWeather(position.coords.latitude, position.coords.longitude);
        }, (error) => {
            console.log("Geolocation error, defaulting to NYC", error);
            getWeather(40.7128, -74.0060); 
        });
    } else {
        getWeather(40.7128, -74.0060);
    }
}

async function getWeather(lat, lon) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`);
        const data = await res.json();
        weatherEl.textContent = `${Math.round(data.current_weather.temperature)}°F`;
    } catch (e) {
        weatherEl.textContent = "Weather Unavailable";
    }
}

// --- CRUD Operations ---

function deleteGroup(groupId) {
    appData.groups = appData.groups.filter(g => g.id !== groupId);
    saveData();
    renderGrid(); // Explicit re-render
}

function addGroup(title) {
    const newGroup = {
        id: 'g' + Date.now(),
        title: title,
        links: []
    };
    appData.groups.push(newGroup);
    saveData();
    renderGrid();
}

// --- Modal Handlers ---

// Add Group Modal
function closeAddGroupModal() {
    document.getElementById('add-group-modal').classList.add('hidden');
}

// Edit Group Modal
function openEditGroupModal(groupId) {
    currentEditGroupId = groupId;
    const group = appData.groups.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('edit-group-title').value = group.title;
    const container = document.getElementById('group-links-container');
    container.innerHTML = '';

    // Render existing links
    group.links.forEach(link => {
        if (link.type === 'list') {
            // Add List Parent
            addLinkRow(link.name, '', 'list');
            
            // Add List Children
            if (link.links) {
                link.links.forEach(sub => {
                    addLinkRow(sub.name, sub.url, 'sub-link');
                });
            }
        } else {
            addLinkRow(link.name, link.url);
        }
    });

    editGroupModal.classList.remove('hidden');
}

function addLinkRow(name = '', url = '', type = 'link') {
    const container = document.getElementById('group-links-container');
    const div = document.createElement('div');
    div.className = 'link-edit-row';
    
    // Set type attribute for saving logic
    div.dataset.type = type; 
    
    if (type === 'list') {
        div.classList.add('list-row');
        div.dataset.isList = "true";
    }
    if (type === 'sub-link') {
        div.classList.add('sub-link-row');
    }
    
    div.draggable = false; // controlled by handle
    
    const urlInputDisabled = type === 'list' ? 'disabled style="background:#eee; display:none;"' : '';
    const placeholder = type === 'list' ? 'List Name' : 'URL';
    const namePlaceholder = type === 'list' ? 'List Name' : 'Name';
    
    // For list, maybe make name input wider since URL is hidden
    const nameStyle = type === 'list' ? 'flex: 3;' : '';

    div.innerHTML = `
        <i class="fas fa-grip-vertical handle" title="Drag to reorder"></i>
        <input type="text" class="link-name" placeholder="${namePlaceholder}" value="${name}" style="${nameStyle}">
        ${type !== 'list' ? `<input type="text" class="link-url" placeholder="${placeholder}" value="${url}" ${urlInputDisabled}>` : ''}
        <i class="fas fa-trash remove-link-btn" title="Remove"></i>
    `;
    
    // Drag Events
    let isHandleClicked = false;
    const handle = div.querySelector('.handle');
    
    handle.addEventListener('mousedown', () => {
        isHandleClicked = true;
        div.draggable = true;
    });

    handle.addEventListener('mouseup', () => {
        isHandleClicked = false;
        div.draggable = false;
    });

    div.addEventListener('dragstart', (e) => {
        if (!isHandleClicked) {
            e.preventDefault();
            return;
        }
        
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Set data to identify if it's a list or link
        e.dataTransfer.setData('text/plain', type);
        e.dataTransfer.setData('application/json', JSON.stringify({ type, name }));
    });

    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        div.draggable = false;
        
        // Cleanup visual markers
        document.querySelectorAll('.link-edit-row').forEach(row => {
            row.classList.remove('drag-over-list', 'drag-over-top', 'drag-over-bottom');
        });
        
        // Auto-update indentation based on position relative to lists
        updateIndentationStyles();
    });

    div.querySelector('.remove-link-btn').addEventListener('click', () => {
        if (type === 'list') {
            if (confirm('Delete this list and all its links?')) {
                div.remove();
            }
        } else {
            div.remove();
        }
    });

    container.appendChild(div);
}

// Helper to update visual indentation based on DOM order
function updateIndentationStyles() {
    const rows = document.querySelectorAll('#group-links-container .link-edit-row');
    let currentList = null;

    rows.forEach(row => {
        if (row.dataset.type === 'list') {
            currentList = row;
            row.classList.remove('sub-link-row');
        } else {
            if (!currentList) {
                row.classList.remove('sub-link-row');
                row.dataset.type = 'link';
            }
        }
    });
}

function closeEditGroupModal() {
    editGroupModal.classList.add('hidden');
    currentEditGroupId = null;
}

function saveGroupEdit() {
    const title = document.getElementById('edit-group-title').value;
    if (!title) {
        alert("Group title is required");
        return;
    }

    const rows = document.querySelectorAll('.link-edit-row');
    const newLinks = [];
    
    let currentListObj = null;

    rows.forEach(row => {
        const name = row.querySelector('.link-name').value;
        // Handle optional URL input if it exists
        const urlInput = row.querySelector('.link-url');
        const url = urlInput ? urlInput.value : '';
        
        const isList = row.classList.contains('list-row');
        const isSubLink = row.classList.contains('sub-link-row');

        if (name) {
            if (isList) {
                // Create new List Object
                currentListObj = {
                    id: 'l' + Math.random().toString(36).substr(2, 9),
                    name: name,
                    type: 'list',
                    links: []
                };
                newLinks.push(currentListObj);
            } else if (isSubLink && currentListObj) {
                // Add to current list
                currentListObj.links.push({
                    name: name,
                    url: url
                });
            } else {
                // Top level link
                newLinks.push({
                    id: 'l' + Math.random().toString(36).substr(2, 9),
                    name: name,
                    url: url
                });
                // Reset current list object because we hit a top level link
                currentListObj = null;
            }
        }
    });

    const groupIndex = appData.groups.findIndex(g => g.id === currentEditGroupId);
    if (groupIndex !== -1) {
        appData.groups[groupIndex].title = title;
        appData.groups[groupIndex].links = newLinks;
        saveData();
        renderGrid();
    }
    closeEditGroupModal();
}

// Settings Modal
function openSettingsModal() {
    document.getElementById('config-json').value = JSON.stringify(appData, null, 2);
    settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    settingsModal.classList.add('hidden');
}

// --- Event Listeners ---

function setupEventListeners() {
    editModeBtn.addEventListener('click', toggleEditMode);
    settingsBtn.addEventListener('click', openSettingsModal);

    // Group Edit Modal
    document.getElementById('cancel-group-edit').addEventListener('click', closeEditGroupModal);
    document.getElementById('save-group-edit').addEventListener('click', saveGroupEdit);
    document.getElementById('add-link-row-btn').addEventListener('click', () => addLinkRow());
    
    // NEW: Add List Button
    const addListBtn = document.getElementById('add-list-btn');
    if (addListBtn) {
        addListBtn.addEventListener('click', () => addLinkRow('', '', 'list'));
    }
    
    document.getElementById('delete-group-full').addEventListener('click', () => {
        if (confirm("Are you sure you want to delete this entire group?")) {
            deleteGroup(currentEditGroupId);
            closeEditGroupModal();
        }
    });

    // Add Group Modal
    document.getElementById('cancel-add-group').addEventListener('click', closeAddGroupModal);
    document.getElementById('confirm-add-group').addEventListener('click', () => {
        const title = document.getElementById('new-group-name').value;
        if (title) {
            addGroup(title);
            closeAddGroupModal();
        }
    });

    // Settings Modal
    document.getElementById('close-settings').addEventListener('click', closeSettingsModal);
    document.getElementById('save-settings').addEventListener('click', () => {
        try {
            const newData = JSON.parse(document.getElementById('config-json').value);
            appData = newData;
            saveData();
            renderGrid();
            closeSettingsModal();
        } catch (e) {
            alert('Invalid JSON');
        }
    });
    document.getElementById('reset-defaults').addEventListener('click', () => {
        if (confirm('Reset to default data?')) {
            appData = defaultData;
            saveData();
            renderGrid();
            closeSettingsModal();
        }
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === editGroupModal) closeEditGroupModal();
        if (e.target === addGroupModal) closeAddGroupModal();
        if (e.target === settingsModal) closeSettingsModal();
    });


    // --- Modal Link Dragging Improved ---
    const linksContainer = document.getElementById('group-links-container');
    
    linksContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingItem = document.querySelector('.link-edit-row.dragging');
        if (!draggingItem) return;

        const siblings = [...linksContainer.querySelectorAll('.link-edit-row:not(.dragging)')];
        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            return e.clientY <= box.top + box.height / 2;
        });
        
        // Visual Feedback logic
        siblings.forEach(sib => sib.classList.remove('drag-over-top', 'drag-over-bottom', 'drag-over-list'));

        if (nextSibling) {
             linksContainer.insertBefore(draggingItem, nextSibling);
        } else {
             linksContainer.appendChild(draggingItem);
        }
        
        // DYNAMIC INDENTATION CHECK
        const prev = draggingItem.previousElementSibling;
        const containerLeft = linksContainer.getBoundingClientRect().left;
        const mouseXOffset = e.clientX - containerLeft;
        
        if (prev && (prev.classList.contains('list-row') || prev.classList.contains('sub-link-row'))) {
            if (mouseXOffset > 50) {
                draggingItem.classList.add('sub-link-row');
                draggingItem.dataset.type = 'sub-link';
            } else {
                draggingItem.classList.remove('sub-link-row');
                draggingItem.dataset.type = 'link';
            }
        } else {
            draggingItem.classList.remove('sub-link-row');
            draggingItem.dataset.type = 'link';
        }
        
        if (draggingItem.dataset.isList === "true") {
             draggingItem.classList.remove('sub-link-row');
             draggingItem.dataset.type = 'list';
        }
    });

    // --- Grid Group Dragging ---
    gridContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        const draggable = document.querySelector('.card.dragging');
        if (!draggable) return;

        const addButton = gridContainer.querySelector('.add-group-card');
        const cards = [...gridContainer.querySelectorAll('.card:not(.dragging):not(.add-group-card)')];
        
        const closest = cards.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const boxCenterX = box.left + box.width / 2;
            const boxCenterY = box.top + box.height / 2;
            const dist = Math.hypot(e.clientX - boxCenterX, e.clientY - boxCenterY);
            
            if (closest.dist === undefined || dist < closest.dist) {
                return { dist: dist, element: child, box: box };
            }
            return closest;
        }, { dist: undefined });

        if (closest.element) {
            const box = closest.box;
            const isRightOfCenter = e.clientX > (box.left + box.width / 2);
            
            if (isRightOfCenter) {
                gridContainer.insertBefore(draggable, closest.element.nextElementSibling);
            } else {
                gridContainer.insertBefore(draggable, closest.element);
            }
        } else {
            gridContainer.insertBefore(draggable, addButton);
        }
        
        if (gridContainer.lastElementChild !== addButton) {
            gridContainer.appendChild(addButton);
        }
    });
}

// Start
init();
