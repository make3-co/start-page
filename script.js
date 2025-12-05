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
                const a = document.createElement('a');
                a.className = 'link-item';
                a.href = isEditMode ? '#' : link.url;
                a.textContent = link.name;
                a.target = "_blank"; 
                
                if (isEditMode) {
                    a.addEventListener('click', (e) => e.preventDefault());
                }

                body.appendChild(a);
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
        // Access the function from the event listener scope or ensure it's global. 
        // Since we moved it inside setupEventListeners, we can't call it directly from here if init() calls renderGrid() before setupEventListeners().
        // BUT renderGrid is called in init() BEFORE setupEventListeners().
        // So we must move openAddGroupModal to global scope as well.
        
        // Actually, let's fix the root cause: move all modal functions to global scope.
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
    // No renderGrid() call here if we want to avoid flicker during drag, 
    // but generally needed for other updates. 
    // For dragend saving, we might not need to re-render immediately since the DOM is already correct.
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

// Add Group Modal - Global Scope
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
        addLinkRow(link.name, link.url);
    });

    editGroupModal.classList.remove('hidden');
}

function addLinkRow(name = '', url = '') {
    const container = document.getElementById('group-links-container');
    const div = document.createElement('div');
    div.className = 'link-edit-row';
    div.draggable = false;
    div.innerHTML = `
        <i class="fas fa-grip-vertical handle" title="Drag to reorder"></i>
        <input type="text" class="link-name" placeholder="Name" value="${name}">
        <input type="text" class="link-url" placeholder="URL" value="${url}">
        <i class="fas fa-trash remove-link-btn" title="Remove link"></i>
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

    // Remove the restrictive mouseleave logic that was breaking drags
    // If the user moves the mouse fast, it leaves the handle before dragstart fires on the div
    // handle.addEventListener('mouseleave', () => { ... }); 

    div.addEventListener('dragstart', (e) => {
        if (!isHandleClicked) {
            e.preventDefault();
            return;
        }
        
        div.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    });

    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        div.draggable = false;
        // Ensure we clean up global drag state if any
    });

    div.querySelector('.remove-link-btn').addEventListener('click', () => {
        div.remove();
    });

    container.appendChild(div);
}

// Helper for Drag & Drop
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.link-edit-row:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Helper for Grid Drag & Drop
function getDragAfterElementGrid(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.card:not(.dragging):not(.add-group-card)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        // Simple 2D distance approach to find closest center
        // Not perfect insert-before/after logic, but standard for grids often involves just "closest" swap
        // or iterating to find the first element that is "after" in flow.
        
        // Flow logic:
        // Elements are ordered. We find the one we are immediately before.
        // Check if we are to the left or above the center of the element.
        
        // Since standard reducing is tricky for 2D, let's try a simplified approach:
        // Find the element whose center is closest to the mouse.
        // Then decide if we are before or after it.
        
        // Reverting to simple "after" logic in reading order (left-to-right, top-to-bottom):
        // An element is "after" the cursor if its center is after the cursor position.
        // (box.top + box.height/2) > y || (sameRow && (box.left + box.width/2) > x)
        
        // Let's stick to a simpler metric: Distance to center.
        // If we are in the first half of the element -> insert before.
        // If in the second half -> insert after (which is before next).
        // Actually, standard "insert before" API needs the element *after* us.
        
        // Let's use the "closest center" metric, and if we are 'before' that center, return it.
        // If 'after' that center, return its next sibling?
        
        // Let's stick to standard 1D-style reduction but strictly based on DOM order distance? No.
        
        // Let's try the 1D logic applied to the whole list flow:
        // We want the element whose center is closest to [x,y] but definitely "after" [x,y]?
        
        // Let's try this simple implementation:
        // Just return the element closest to the cursor?
        // No, we need the "after" element.
        
        // Let's use a simplified check:
        // Find the element under the cursor? No, dragover.
        
        // Let's reuse the reducing logic but considering reading order?
        // No, let's just check every element.
        
        // If cursor is left/above the element center, we are before it.
        
        // Calculate center of box
        const boxCenterX = box.left + box.width / 2;
        const boxCenterY = box.top + box.height / 2;
        
        // We want an element where the cursor is "behind" (left/above) its center.
        // But we want the *closest* one of those.
        
        // Check if cursor is "before" this element center
        // We define "before" as:
        // (y < boxCenterY) - strictly above? No, could be same row.
        // Rough approximation: 
        // If same row (y within box top/bottom), check x.
        // If earlier row (y < box top), definitely before.
        
        // Since grid flow is standard:
        // We are before if we are significantly left or up.
        
        // Let's stick to the standard reduction logic but simplified:
        // We want the element that is the *immediate next* in flow order.
        // That element has its center *after* the cursor.
        // And it should be the "closest" such element.
        
        // This is still tricky.
        // Let's try a robust library-free approach:
        // Just find closest element by Euclidean distance.
        // If cursor is "after" that element (right/bottom), we insert after it (next sibling).
        // If cursor is "before", insert before it.
        // But `insertBefore` requires the "after" element.
        
        // So:
        // 1. Find closest element.
        // 2. Determine relative position.
        // 3. If before -> return element.
        // 4. If after -> return element.nextElementSibling.
        
        const distX = x - boxCenterX;
        const distY = y - boxCenterY;
        const distance = Math.hypot(distX, distY);
        
        if (closest.distance === undefined || distance < closest.distance) {
            return { distance: distance, element: child, box: box };
        } else {
            return closest;
        }
    }, { distance: undefined }).element;

    // Now refine: we have the closest element. Are we before or after it?
    // This helper needs to return the element to insert *before*.
    
    // Refined helper logic inside event listener instead.
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
    
    rows.forEach(row => {
        const name = row.querySelector('.link-name').value;
        const url = row.querySelector('.link-url').value;
        if (name && url) {
            newLinks.push({
                id: 'l' + Math.random().toString(36).substr(2, 9),
                name,
                url
            });
        }
    });

    const groupIndex = appData.groups.findIndex(g => g.id === currentEditGroupId);
    if (groupIndex !== -1) {
        appData.groups[groupIndex].title = title;
        appData.groups[groupIndex].links = newLinks;
        saveData();
        renderGrid(); // Need to re-render to show changes
    }
    closeEditGroupModal();
}

// Settings Modal - Moved to global scope
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

    // --- Modal Link Dragging ---
    const linksContainer = document.getElementById('group-links-container');
    
    linksContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
        const draggable = document.querySelector('.link-edit-row.dragging');
        if (!draggable) return;

        const afterElement = getDragAfterElement(linksContainer, e.clientY);
        if (afterElement == null) {
            linksContainer.appendChild(draggable);
        } else {
            linksContainer.insertBefore(draggable, afterElement);
        }
    });

    // No specific dragend needed for links container logic as we don't save on drop here,
    // we save on "Save Changes" button click. But we need to clean up classes.
    // The individual row dragend listener handles cleanup.


    // --- Grid Group Dragging ---
    gridContainer.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
        const draggable = document.querySelector('.card.dragging');
        if (!draggable) return;

        const addButton = gridContainer.querySelector('.add-group-card');
        
        // Get all other cards
        const cards = [...gridContainer.querySelectorAll('.card:not(.dragging):not(.add-group-card)')];
        
        // Find closest card
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
            // Determine if we should be before or after the closest element
            // Logic: If we are to the right of the center, insert after.
            // This works well for row-based grids.
            const isRightOfCenter = e.clientX > (box.left + box.width / 2);
            
            if (isRightOfCenter) {
                // Insert after closest (before next sibling)
                gridContainer.insertBefore(draggable, closest.element.nextElementSibling);
            } else {
                // Insert before closest
                gridContainer.insertBefore(draggable, closest.element);
            }
        } else {
            // No other cards, or far away? Just put before add button
            gridContainer.insertBefore(draggable, addButton);
        }
        
        // Safety: Ensure Add Button is always last
        if (gridContainer.lastElementChild !== addButton) {
            gridContainer.appendChild(addButton);
        }
    });
}

// Start
init();
