// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const html = document.documentElement;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Sidebar Toggle Functionality
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarToggle.classList.toggle('active');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('open');
            sidebarToggle.classList.remove('active');
        }
    }
});

// Workflows Dropdown Functionality
const workflowsHeader = document.getElementById('workflowsHeader');
const workflowsList = document.getElementById('workflowsList');

workflowsHeader.addEventListener('click', () => {
    workflowsHeader.classList.toggle('active');
    workflowsList.classList.toggle('open');
});

// Fetch and populate workflows
async function loadWorkflows() {
    try {
        const response = await fetch('/api/workflows');
        if (!response.ok) {
            throw new Error('Failed to fetch workflows');
        }
        const workflows = await response.json();
        
        workflowsList.innerHTML = '';
        
        if (workflows.length === 0) {
            workflowsList.innerHTML = '<p class="empty-text">No workflows found</p>';
            return;
        }
        
        workflows.forEach(workflow => {
            const item = document.createElement('div');
            item.className = 'workflow-item';
            item.textContent = workflow.name;
            item.dataset.filename = workflow.filename;
            item.addEventListener('click', async () => {
                // Remove selected class from all items
                document.querySelectorAll('.workflow-item').forEach(i => {
                    i.classList.remove('selected');
                });
                // Add selected class to clicked item
                item.classList.add('selected');
                // Store selected workflow
                localStorage.setItem('selectedWorkflow', workflow.filename);
                // Load workflow requirements and update UI
                await loadWorkflowRequirements(workflow.filename);
            });
            workflowsList.appendChild(item);
        });
        
        // Restore previously selected workflow
        const selectedFilename = localStorage.getItem('selectedWorkflow');
        if (selectedFilename) {
            const selectedItem = Array.from(workflowsList.querySelectorAll('.workflow-item'))
                .find(item => item.dataset.filename === selectedFilename);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }
        }
    } catch (error) {
        console.error('Error loading workflows:', error);
        workflowsList.innerHTML = '<p class="error-text">Error loading workflows</p>';
    }
}

// Load models on page load
let modelsTree = null;

async function loadModels() {
    try {
        const response = await fetch('/api/models');
        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }
        modelsTree = await response.json();
    } catch (error) {
        console.error('Error loading models:', error);
        modelsTree = null;
    }
}

// Load workflows and models when page loads
loadWorkflows();
loadModels();

// Wire apply inputs button
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('applyInputsButton');
    if (btn) btn.addEventListener('click', applyWorkflowInputs);
});

// Load workflow requirements and update UI
async function loadWorkflowRequirements(filename) {
    const inputSection = document.getElementById('inputSection');
    
    try {
        inputSection.innerHTML = '<p class="loading-text">Loading workflow requirements...</p>';
        
        // Ensure models are loaded before generating inputs
        if (!modelsTree) {
            await loadModels();
        }
        
        const response = await fetch(`/api/workflow/${filename}`);
        if (!response.ok) {
            throw new Error('Failed to fetch workflow requirements');
        }
        
        const data = await response.json();
        if (data.error) {
            inputSection.innerHTML = `<p class="error-text">Error parsing workflow: ${data.error}</p>`;
            return;
        }
        // Render simple node boxes for each node in the workflow
        renderNodeBoxes(data.nodes || []);
        
        // Restore previously selected workflow's inputs if available
        const savedInputs = localStorage.getItem(`workflow_inputs_${filename}`);
        if (savedInputs) {
            try {
                const inputs = JSON.parse(savedInputs);
                restoreInputValues(inputs);
            } catch (e) {
                console.error('Error restoring inputs:', e);
            }
        }
    } catch (error) {
        console.error('Error loading workflow requirements:', error);
        inputSection.innerHTML = '<p class="error-text">Error loading workflow requirements</p>';
    }
}

// Generate input fields based on workflow requirements
function generateInputFields(userInputs) {
    const inputSection = document.getElementById('inputSection');
    inputSection.innerHTML = '';
    
    if (userInputs.length === 0) {
        inputSection.innerHTML = '<p class="empty-state">This workflow has no user inputs</p>';
        return;
    }
    
    userInputs.forEach((input, index) => {
        const container = document.createElement('div');
        container.className = 'input-field-container';
        if (input.required) {
            container.classList.add('required');
        }
        
        const label = document.createElement('label');
        label.className = 'input-label';
        label.textContent = input.localized_name || input.input_name || `Input ${index + 1}`;
        container.appendChild(label);
        
        let inputElement;
        
        if (input.input_type === 'image' || (input.widget_type && input.widget_type.toUpperCase().includes('IMAGE')) ) {
            // Image upload field
            const uploadContainer = document.createElement('div');
            uploadContainer.className = 'file-upload-container';
            
            const uploadLabel = document.createElement('label');
            uploadLabel.className = 'file-upload-label';
            uploadLabel.htmlFor = `input-${input.node_id}-${input.widget_index}`;
            
            const uploadInput = document.createElement('input');
            uploadInput.type = 'file';
            uploadInput.id = `input-${input.node_id}-${input.widget_index}`;
            uploadInput.className = 'file-upload-input';
            uploadInput.accept = 'image/*';
            uploadInput.dataset.nodeId = input.node_id;
            uploadInput.dataset.widgetIndex = input.widget_index;
            uploadInput.dataset.inputName = input.input_name;
            
            const uploadText = document.createElement('div');
            uploadText.className = 'file-upload-text';
            uploadText.textContent = 'Click to upload image';
            
            const filenameDisplay = document.createElement('div');
            filenameDisplay.className = 'file-upload-filename';
            filenameDisplay.style.display = 'none';
            
            uploadLabel.appendChild(uploadText);
            uploadLabel.appendChild(filenameDisplay);
            
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    filenameDisplay.textContent = file.name;
                    filenameDisplay.style.display = 'block';
                    uploadLabel.classList.add('has-file');
                    saveInputValue(input.node_id, input.widget_index, file.name);
                }
            });
            
            uploadContainer.appendChild(uploadLabel);
            uploadContainer.appendChild(uploadInput);
            container.appendChild(uploadContainer);
        } else if (input.input_type === 'text' || (input.widget_type && input.widget_type.toUpperCase() === 'STRING')) {
            // Text input field
            inputElement = document.createElement('textarea');
            inputElement.className = 'text-input';
            inputElement.id = `input-${input.node_id}-${input.widget_index}`;
            inputElement.placeholder = input.localized_name || 'Enter text...';
            inputElement.dataset.nodeId = input.node_id;
            inputElement.dataset.widgetIndex = input.widget_index;
            inputElement.dataset.inputName = input.input_name;
            
            if (input.current_value !== null && input.current_value !== undefined) {
                inputElement.value = input.current_value;
            }
            
            inputElement.addEventListener('input', () => {
                saveInputValue(input.node_id, input.widget_index, inputElement.value);
            });
            
            container.appendChild(inputElement);
        } else if (input.widget_type && (input.widget_type === 'INT' || input.widget_type === 'FLOAT' || input.raw_type === 'INT' || input.raw_type === 'FLOAT')) {
            // Number input field
            inputElement = document.createElement('input');
            inputElement.type = 'number';
            inputElement.className = 'text-input';
            inputElement.id = `input-${input.node_id}-${input.widget_index}`;
            inputElement.placeholder = input.localized_name || 'Enter number...';
            inputElement.dataset.nodeId = input.node_id;
            inputElement.dataset.widgetIndex = input.widget_index;
            inputElement.dataset.inputName = input.input_name;
            
            if (input.current_value !== null && input.current_value !== undefined) {
                inputElement.value = input.current_value;
            }
            
            inputElement.addEventListener('input', () => {
                saveInputValue(input.node_id, input.widget_index, inputElement.value);
            });
            
            container.appendChild(inputElement);
        } else if (input.widget_type && input.widget_type === 'BOOLEAN') {
            // Boolean checkbox
            inputElement = document.createElement('input');
            inputElement.type = 'checkbox';
            inputElement.className = 'text-input';
            inputElement.id = `input-${input.node_id}-${input.widget_index}`;
            inputElement.dataset.nodeId = input.node_id;
            inputElement.dataset.widgetIndex = input.widget_index;
            inputElement.dataset.inputName = input.input_name;
            
            if (input.current_value === true) {
                inputElement.checked = true;
            }
            
            inputElement.addEventListener('change', () => {
                saveInputValue(input.node_id, input.widget_index, inputElement.checked);
            });
            
            container.appendChild(inputElement);
        } else if (input.widget_type === 'COMBO' && isModelNode(input.node_type, input.input_name)) {
            // Model selection dropdown
            inputElement = createModelDropdown(input);
            container.appendChild(inputElement);
        } else {
            // Default to text input for unknown types
            inputElement = document.createElement('textarea');
            inputElement.className = 'text-input';
            inputElement.id = `input-${input.node_id}-${input.widget_index}`;
            inputElement.placeholder = input.localized_name || 'Enter value...';
            inputElement.dataset.nodeId = input.node_id;
            inputElement.dataset.widgetIndex = input.widget_index;
            inputElement.dataset.inputName = input.input_name;
            
            if (input.current_value !== null && input.current_value !== undefined) {
                inputElement.value = input.current_value;
            }
            
            inputElement.addEventListener('input', () => {
                saveInputValue(input.node_id, input.widget_index, inputElement.value);
            });
            
            container.appendChild(inputElement);
        }
        
        inputSection.appendChild(container);
    });
}

// Render rectangular box per node: show node type and bullet list of inputs/outputs
function renderNodeBoxes(nodes) {
    const inputSection = document.getElementById('inputSection');
    inputSection.innerHTML = '';

    if (!nodes || nodes.length === 0) {
        inputSection.innerHTML = '<p class="empty-state">This workflow has no nodes</p>';
        return;
    }

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '12px';

    nodes.forEach(node => {
        // Skip nodes that have neither useful inputs nor outputs
        if ((!node.inputs || node.inputs.length === 0) && (!node.outputs || node.outputs.length === 0)) {
            return;
        }
        const box = document.createElement('div');
        box.className = 'node-box';

        const title = document.createElement('div');
        title.className = 'node-title';
        title.textContent = node.node_type || `Node ${node.node_id}`;
        box.appendChild(title);

        // Inputs container
        const inputsContainer = document.createElement('div');
        inputsContainer.className = 'node-section inputs';
        const inputsLabel = document.createElement('div');
        inputsLabel.className = 'section-label';
        inputsLabel.textContent = 'Inputs';
        inputsContainer.appendChild(inputsLabel);

        (node.inputs || []).forEach(it => {
            // it expected to be { widget_name, raw_type }
            const name = (it && it.widget_name) ? it.widget_name : '(unnamed)';
            const raw = (it && it.raw_type) ? it.raw_type.toUpperCase() : '';

            const bar = document.createElement('div');
            bar.className = 'io-bar';

            const label = document.createElement('div');
            label.className = 'io-label';
            label.textContent = name;
            bar.appendChild(label);

            const inputWrap = document.createElement('div');
            inputWrap.className = 'io-input';

            // Special handling: if widget_name contains 'image' or 'video', show
            // a dropdown populated from server /api/media and an upload control.
            const lname = (name || '').toLowerCase();
            if (lname.includes('image') || lname.includes('video')) {
                const type = lname.includes('image') ? 'image' : 'video';

                // Create a dropdown-style panel placed under the input label
                const mediaDropdown = document.createElement('div');
                mediaDropdown.className = 'media-dropdown';

                const displayBtn = document.createElement('button');
                displayBtn.type = 'button';
                displayBtn.className = 'media-dropdown-display';
                const displayText = document.createElement('span');
                displayText.className = 'media-dropdown-text';
                displayText.textContent = `Choose ${type}...`;
                const displayArrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                displayArrow.setAttribute('class', 'dropdown-arrow');
                displayArrow.setAttribute('viewBox', '0 0 24 24');
                displayArrow.setAttribute('fill', 'none');
                displayArrow.setAttribute('stroke', 'currentColor');
                displayArrow.setAttribute('stroke-width', '2');
                displayArrow.setAttribute('stroke-linecap', 'round');
                displayArrow.setAttribute('stroke-linejoin', 'round');
                displayArrow.innerHTML = '<path d="M6 9l6 6 6-6"/>';

                displayBtn.appendChild(displayText);
                displayBtn.appendChild(displayArrow);

                const panel = document.createElement('div');
                panel.className = 'media-dropdown-panel';
                panel.style.display = 'none';

                // Dropdown (select) moved into panel
                const select = document.createElement('select');
                select.className = 'media-select';
                select.dataset.mediaType = type;
                const placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = `Select ${type}...`;
                select.appendChild(placeholder);

                // Fetch media list into select
                fetch(`/api/media?type=${type}`).then(r => r.json()).then(list => {
                    if (Array.isArray(list)) {
                        list.forEach(p => {
                            const opt = document.createElement('option');
                            opt.value = p;
                            opt.textContent = p.split('/').pop();
                            select.appendChild(opt);
                        });
                    }
                }).catch(e => { console.error('Error loading media list', e); });

                // File upload input
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = type === 'image' ? 'image/*' : 'video/*';
                fileInput.className = 'media-file-input';

                // Preview area inside panel
                const previewArea = document.createElement('div');
                previewArea.className = 'media-preview-panel';

                const clearBtn = document.createElement('button');
                clearBtn.type = 'button';
                clearBtn.className = 'clear-input';
                clearBtn.title = 'Clear this input';
                clearBtn.textContent = '✕';

                // Track object URL
                let currentObjectUrl = null;

                function setPreviewToMediaPath(relpath) {
                    if (currentObjectUrl) {
                        URL.revokeObjectURL(currentObjectUrl);
                        currentObjectUrl = null;
                    }
                    previewArea.innerHTML = '';
                    if (!relpath) return;
                    const src = `/media/${encodeURIComponent(relpath)}`.replace(/%2F/g,'/');
                    if (type === 'image') {
                        const img = document.createElement('img');
                        img.src = src;
                        previewArea.appendChild(img);
                        displayText.textContent = src.split('/').pop();
                    } else {
                        const vid = document.createElement('video');
                        vid.src = src;
                        vid.controls = true;
                        vid.playsInline = true;
                        previewArea.appendChild(vid);
                        displayText.textContent = src.split('/').pop();
                    }
                }

                function setPreviewToFile(file) {
                    previewArea.innerHTML = '';
                    if (!file) return;
                    if (currentObjectUrl) {
                        URL.revokeObjectURL(currentObjectUrl);
                        currentObjectUrl = null;
                    }
                    currentObjectUrl = URL.createObjectURL(file);
                    if (type === 'image') {
                        const img = document.createElement('img');
                        img.src = currentObjectUrl;
                        previewArea.appendChild(img);
                        displayText.textContent = file.name;
                    } else {
                        const vid = document.createElement('video');
                        vid.src = currentObjectUrl;
                        vid.controls = true;
                        previewArea.appendChild(vid);
                        displayText.textContent = file.name;
                    }
                }

                // Wire interactions
                displayBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const opened = panel.style.display === 'block';
                    panel.style.display = opened ? 'none' : 'block';
                    displayBtn.classList.toggle('open', !opened);
                });

                select.addEventListener('change', () => {
                    const val = select.value || '';
                    if (val) {
                        setPreviewToMediaPath(val);
                        fileInput.value = '';
                        saveInputValue(node.node_id, node.inputs.indexOf(it), `media:${val}`);
                    } else {
                        previewArea.innerHTML = '';
                        saveInputValue(node.node_id, node.inputs.indexOf(it), '');
                    }
                });

                fileInput.addEventListener('change', (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) {
                        select.value = '';
                        setPreviewToFile(f);
                        saveInputValue(node.node_id, node.inputs.indexOf(it), `local:${f.name}`);
                    } else {
                        previewArea.innerHTML = '';
                        saveInputValue(node.node_id, node.inputs.indexOf(it), '');
                    }
                });

                clearBtn.addEventListener('click', () => {
                    select.value = '';
                    fileInput.value = '';
                    previewArea.innerHTML = '';
                    displayText.textContent = `Choose ${type}...`;
                    saveInputValue(node.node_id, node.inputs.indexOf(it), '');
                });

                // Assemble panel
                panel.appendChild(select);
                panel.appendChild(fileInput);
                panel.appendChild(previewArea);
                panel.appendChild(clearBtn);

                mediaDropdown.appendChild(displayBtn);
                mediaDropdown.appendChild(panel);

                // Insert dropdown below the label
                bar.appendChild(mediaDropdown);
            } else {
                // Create control based on raw type
                let control = null;
                if (raw.includes('INT') || raw === 'INT') {
                    control = document.createElement('input');
                    control.type = 'number';
                    control.step = '1';
                } else if (raw.includes('FLOAT') || raw === 'FLOAT' || raw === 'NUMBER') {
                    control = document.createElement('input');
                    control.type = 'number';
                    control.step = 'any';
                } else if (raw.includes('COMBO')) {
                    control = document.createElement('select');
                    // placeholder option (no values known yet)
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = 'Select...';
                    control.appendChild(opt);
                } else if (raw.includes('BOOLEAN')) {
                    control = document.createElement('input');
                    control.type = 'checkbox';
                } else {
                    // Default to text
                    control = document.createElement('input');
                    control.type = 'text';
                }

                if (control) {
                    control.addEventListener('change', () => {
                        let val = control.value;
                        if (control.type === 'checkbox') val = control.checked;
                        saveInputValue(node.node_id, node.inputs.indexOf(it), val);
                    });
                    inputWrap.appendChild(control);
                }
            }

            bar.appendChild(inputWrap);
            inputsContainer.appendChild(bar);
        });
        box.appendChild(inputsContainer);

        if (node.outputs && node.outputs.length) {
            const outputsContainer = document.createElement('div');
            outputsContainer.className = 'node-section outputs';
            const outputsLabel = document.createElement('div');
            outputsLabel.className = 'section-label';
            outputsLabel.textContent = 'Outputs';
            outputsContainer.appendChild(outputsLabel);

            (node.outputs || []).forEach(it => {
                const bar = document.createElement('div');
                bar.className = 'io-bar';
                const label = document.createElement('div');
                label.className = 'io-label';
                label.textContent = it || '(empty)';
                bar.appendChild(label);
                outputsContainer.appendChild(bar);
            });

            box.appendChild(outputsContainer);
        }

        container.appendChild(box);
    });

    inputSection.appendChild(container);
}

// Save input values to localStorage
function saveInputValue(nodeId, widgetIndex, value) {
    const selectedWorkflow = localStorage.getItem('selectedWorkflow');
    if (!selectedWorkflow) return;
    
    const key = `workflow_inputs_${selectedWorkflow}`;
    let inputs = {};
    
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            inputs = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading saved inputs:', e);
    }
    
    inputs[`${nodeId}_${widgetIndex}`] = value;
    localStorage.setItem(key, JSON.stringify(inputs));
}

// Send saved inputs to backend to apply to workflow JSON
async function applyWorkflowInputs() {
    const selectedWorkflow = localStorage.getItem('selectedWorkflow');
    if (!selectedWorkflow) return;

    const key = `workflow_inputs_${selectedWorkflow}`;
    let inputs = {};
    try {
        const saved = localStorage.getItem(key);
        if (saved) inputs = JSON.parse(saved);
    } catch (e) {
        console.error('Error reading saved inputs:', e);
    }

    const resp = await fetch(`/api/workflow/${selectedWorkflow}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs })
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Unknown' }));
        alert('Failed to apply inputs: ' + (err.error || resp.statusText));
        return;
    }

    const result = await resp.json();
    // Show a simple preview of the modified workflow
    const inputSection = document.getElementById('inputSection');
    const pre = document.createElement('pre');
    pre.className = 'workflow-preview';
    pre.textContent = JSON.stringify(result.workflow, null, 2);
    inputSection.innerHTML = '';
    inputSection.appendChild(pre);
}

// Restore input values from localStorage
function restoreInputValues(savedInputs) {
    Object.keys(savedInputs).forEach(key => {
        const [nodeId, widgetIndex] = key.split('_');
        const inputElement = document.getElementById(`input-${nodeId}-${widgetIndex}`);
        
        if (inputElement) {
            if (inputElement.type === 'checkbox') {
                inputElement.checked = savedInputs[key];
            } else if (inputElement.type === 'file') {
                // For file inputs, we can't restore the file, but we can show the filename
                const filenameDisplay = inputElement.parentElement.querySelector('.file-upload-filename');
                if (filenameDisplay && savedInputs[key]) {
                    filenameDisplay.textContent = savedInputs[key];
                    filenameDisplay.style.display = 'block';
                    inputElement.parentElement.querySelector('.file-upload-label').classList.add('has-file');
                }
            } else if (inputElement.classList && inputElement.classList.contains('model-select-container')) {
                // For model dropdown, update the display text
                const display = inputElement.querySelector('.model-select-text');
                const dropdown = inputElement.querySelector('.model-dropdown-list');
                if (display && dropdown && savedInputs[key]) {
                    display.textContent = getModelNameFromPath(savedInputs[key]);
                    // Also select the item in the dropdown
                    const modelItem = dropdown.querySelector(`[data-path="${savedInputs[key]}"]`);
                    if (modelItem) {
                        dropdown.querySelectorAll('.model-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        modelItem.classList.add('selected');
                    }
                }
            } else {
                inputElement.value = savedInputs[key];
            }
        }
    });
}

// Check if a node type and input name indicate a model selection
function isModelNode(nodeType, inputName) {
    const modelNodeTypes = [
        'CheckpointLoaderSimple',
        'CheckpointLoader',
        'UpscaleModelLoader',
        'ControlNetLoader',
        'LoraLoader',
        'VAELoader',
        'UNETLoader',
        'CLIPLoader'
    ];
    
    const modelInputNames = [
        'model_name',
        'ckpt_name',
        'upscale_model_name',
        'control_net_name',
        'lora_name',
        'vae_name',
        'unet_name',
        'clip_name'
    ];
    
    return modelNodeTypes.includes(nodeType) || modelInputNames.includes(inputName);
}

// Create model selection dropdown with nested folder structure
function createModelDropdown(input) {
    const container = document.createElement('div');
    container.className = 'model-select-container';
    container.id = `input-${input.node_id}-${input.widget_index}`;
    container.dataset.nodeId = input.node_id;
    container.dataset.widgetIndex = input.widget_index;
    container.dataset.inputName = input.input_name;
    
    // Create the selected value display
    const selectedDisplay = document.createElement('div');
    selectedDisplay.className = 'model-select-display';
    selectedDisplay.id = `model-display-${input.node_id}-${input.widget_index}`;
    
    const selectedText = document.createElement('span');
    selectedText.className = 'model-select-text';
    selectedText.textContent = input.current_value ? getModelNameFromPath(input.current_value) : 'Select a model...';
    
    const dropdownArrow = document.createElement('svg');
    dropdownArrow.className = 'model-dropdown-arrow';
    dropdownArrow.setAttribute('viewBox', '0 0 24 24');
    dropdownArrow.setAttribute('fill', 'none');
    dropdownArrow.setAttribute('stroke', 'currentColor');
    dropdownArrow.setAttribute('stroke-width', '2');
    dropdownArrow.innerHTML = '<path d="M9 18l6-6-6-6"/>'; // Right arrow (closed)
    
    selectedDisplay.appendChild(selectedText);
    selectedDisplay.appendChild(dropdownArrow);
    
    // Create the dropdown list (initially hidden)
    const dropdownList = document.createElement('div');
    dropdownList.className = 'model-dropdown-list';
    dropdownList.id = `model-dropdown-${input.node_id}-${input.widget_index}`;
    
    // Create search bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'model-search-container';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'model-search-input';
    searchInput.placeholder = 'Search files and folders...';
    
    searchContainer.appendChild(searchInput);
    dropdownList.appendChild(searchContainer);
    
    // Create tree container
    const treeContainer = document.createElement('div');
    treeContainer.className = 'model-tree-container';
    treeContainer.id = `model-tree-${input.node_id}-${input.widget_index}`;
    
    // Render nested tree structure
    if (modelsTree && modelsTree.children) {
        renderModelTree(treeContainer, modelsTree.children, input, selectedText, dropdownList, selectedDisplay, 0);
    }
    
    dropdownList.appendChild(treeContainer);
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterModelTree(treeContainer, searchTerm);
    });
    
    // Toggle dropdown on display click
    selectedDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = selectedDisplay.classList.contains('active');
        selectedDisplay.classList.toggle('active');
        dropdownList.classList.toggle('open');
        dropdownArrow.innerHTML = isOpen ? '<path d="M9 18l6-6-6-6"/>' : '<path d="M6 9l6 6 6-6"/>'; // Right when closed, down when open
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            selectedDisplay.classList.remove('active');
            dropdownList.classList.remove('open');
            dropdownArrow.innerHTML = '<path d="M9 18l6-6-6-6"/>'; // Reset to right arrow
        }
    });
    
    container.appendChild(selectedDisplay);
    container.appendChild(dropdownList);
    
    return container;
}

// Render nested tree structure recursively
function renderModelTree(container, children, input, selectedText, dropdownList, selectedDisplay, indentLevel) {
    children.forEach(item => {
        if (item.type === 'file') {
            // File item - show with extension
            const fileItem = document.createElement('div');
            fileItem.className = 'model-item';
            fileItem.style.paddingLeft = `${15 + indentLevel * 15}px`;
            fileItem.dataset.path = item.path;
            
            // Extract filename and extension
            const nameParts = item.name.split('.');
            const extension = nameParts.length > 1 ? '.' + nameParts.pop() : '';
            const fileName = nameParts.join('.');
            
            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = fileName;
            
            const extensionSpan = document.createElement('span');
            extensionSpan.className = 'model-file-extension';
            extensionSpan.textContent = extension;
            
            fileItem.appendChild(fileNameSpan);
            if (extension) {
                fileItem.appendChild(extensionSpan);
            }
            
            // Check if this is the selected model
            if (input.current_value === item.path || input.current_value === item.name) {
                fileItem.classList.add('selected');
                selectedText.textContent = item.name;
            }
            
            fileItem.addEventListener('click', (e) => {
                e.stopPropagation();
                // Remove selected from all items
                dropdownList.querySelectorAll('.model-item').forEach(i => {
                    i.classList.remove('selected');
                });
                // Add selected to clicked item
                fileItem.classList.add('selected');
                // Update display
                selectedText.textContent = item.name;
                // Save value
                saveInputValue(input.node_id, input.widget_index, item.path);
                // Close dropdown
                dropdownList.classList.remove('open');
                selectedDisplay.classList.remove('active');
            });
            
            container.appendChild(fileItem);
        } else if (item.type === 'directory' && item.children) {
            // Directory item
            const folderSection = document.createElement('div');
            folderSection.className = 'model-folder-section';
            
            // Folder header
            const folderHeader = document.createElement('div');
            folderHeader.className = 'model-folder-header';
            folderHeader.style.paddingLeft = `${15 + indentLevel * 15}px`;
            
            const folderName = document.createElement('span');
            folderName.className = 'model-folder-name';
            folderName.textContent = item.name;
            
            const folderArrow = document.createElement('svg');
            folderArrow.className = 'model-folder-arrow';
            folderArrow.setAttribute('viewBox', '0 0 24 24');
            folderArrow.setAttribute('fill', 'none');
            folderArrow.setAttribute('stroke', 'currentColor');
            folderArrow.setAttribute('stroke-width', '2');
            folderArrow.innerHTML = '<path d="M9 18l6-6-6-6"/>'; // Right arrow (closed)
            
            folderHeader.appendChild(folderName);
            folderHeader.appendChild(folderArrow);
            
            // Folder children (initially hidden)
            const folderChildren = document.createElement('div');
            folderChildren.className = 'model-folder-items';
            
            // Render children recursively
            renderModelTree(folderChildren, item.children, input, selectedText, dropdownList, selectedDisplay, indentLevel + 1);
            
            folderSection.appendChild(folderHeader);
            folderSection.appendChild(folderChildren);
            container.appendChild(folderSection);
            
            // Toggle folder on header click
            folderHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = folderHeader.classList.contains('active');
                folderHeader.classList.toggle('active');
                folderChildren.classList.toggle('open');
                folderArrow.innerHTML = isOpen ? '<path d="M9 18l6-6-6-6"/>' : '<path d="M6 9l6 6 6-6"/>'; // Right when closed, down when open
            });
        }
    });
}

// Filter tree based on search term
function filterModelTree(container, searchTerm) {
    if (!searchTerm) {
        // Show all items
        container.querySelectorAll('.model-item, .model-folder-section').forEach(item => {
            item.style.display = '';
        });
        return;
    }
    
    // Hide/show items based on search
    container.querySelectorAll('.model-item').forEach(item => {
        const name = item.textContent.toLowerCase();
        const path = (item.dataset.path || '').toLowerCase();
        if (name.includes(searchTerm) || path.includes(searchTerm)) {
            item.style.display = '';
            // Show parent folders
            let parent = item.parentElement;
            while (parent && parent !== container) {
                if (parent.classList.contains('model-folder-items')) {
                    parent.style.display = '';
                    const header = parent.previousElementSibling;
                    if (header && header.classList.contains('model-folder-header')) {
                        header.style.display = '';
                        header.classList.add('active');
                        parent.classList.add('open');
                    }
                }
                parent = parent.parentElement;
            }
        } else {
            item.style.display = 'none';
        }
    });
    
    // Filter folders
    container.querySelectorAll('.model-folder-section').forEach(section => {
        const header = section.querySelector('.model-folder-header');
        const items = section.querySelector('.model-folder-items');
        const folderName = header ? header.textContent.toLowerCase() : '';
        
        // Check if folder name matches or has visible children
        const hasVisibleChildren = items && Array.from(items.querySelectorAll('.model-item')).some(item => {
            return item.style.display !== 'none';
        });
        
        if (folderName.includes(searchTerm) || hasVisibleChildren) {
            section.style.display = '';
            if (hasVisibleChildren && header) {
                header.classList.add('active');
                if (items) items.classList.add('open');
            }
        } else {
            section.style.display = 'none';
        }
    });
}

// Helper function to get model name from path
function getModelNameFromPath(path) {
    if (!path) return 'Select a model...';
    const parts = path.split('/');
    return parts[parts.length - 1];
}

// Restore workflow selection and load requirements on page load
window.addEventListener('DOMContentLoaded', () => {
    const selectedWorkflow = localStorage.getItem('selectedWorkflow');
    if (selectedWorkflow) {
        // Wait for workflows and models to load, then trigger selection
        setTimeout(async () => {
            await loadModels(); // Ensure models are loaded
            const selectedItem = Array.from(document.querySelectorAll('.workflow-item'))
                .find(item => item.dataset.filename === selectedWorkflow);
            if (selectedItem) {
                selectedItem.click();
            }
        }, 500);
    }
});

