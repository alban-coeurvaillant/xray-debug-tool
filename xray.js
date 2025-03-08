/**
 * XRay.js - Outil de débogage visuel pour pages web
 * Version améliorée avec plus de fonctionnalités et une meilleure interface
 */

(function() {
    // Configuration
    const config = {
        enabled: false,
        highlightColor: '#09367278',
        textColor: '#0f0',
        outlineColor: '#f00',
        outlineWidth: '1px',
        popoverBgColor: '#000c',
        popoverTextColor: '#0f0',
        keyboardShortcut: 'x', // Touche pour activer/désactiver (avec Alt)
        showComputedStyles: true, // Afficher les styles calculés
        showDOMTree: true, // Afficher l'arborescence DOM
        includeAllElements: false // Si false, ne montre que les divs avec id/class
    };

    // Variables globales pour la popover permanente et la navigation
    let permanentPopover = null;
    let currentElementInfo = null;
    let navigationHistory = [];  // Pour stocker l'historique de navigation
    let controlPanel = null;
    let elementHighlight = null;
    let xrayStyleSheet = null;

    // Créer une feuille de style pour XRay
    const createXRayStyle = () => {
        const xray = document.createElement('style');
        xray.id = 'xray-debug-style';
        xray.innerHTML = `
            *[data-xray="true"] {
                background: ${config.highlightColor} !important;
                color: ${config.textColor} !important;
                outline: solid ${config.outlineColor} ${config.outlineWidth} !important;
            }
            
            .xray-popover {
                position: fixed;
                background: ${config.popoverBgColor};
                color: ${config.popoverTextColor};
                border: 1px solid ${config.outlineColor};
                font-size: 12px;
                z-index: 999999;
                width: 400px;
                max-height: 80vh;
                overflow-y: hidden;
                border-radius: 4px;
                box-shadow: 0 0 15px rgba(0,0,0,0.6);
                font-family: monospace;
                transition: box-shadow 0.2s ease;
                resize: both;
                overflow: auto;
            }
            
            .xray-popover > div:last-child {
                max-height: calc(80vh - 30px);
                overflow-y: auto;
            }
            
            .xray-dragging {
                box-shadow: 0 0 20px rgba(255, 255, 0, 0.4) !important;
                opacity: 0.9;
            }
            
            .xray-element-highlight {
                position: absolute;
                pointer-events: none;
                background: rgba(255, 255, 0, 0.2);
                outline: 2px solid yellow;
                box-shadow: 0 0 8px rgba(255, 255, 0, 0.6);
                z-index: 999998;
                transition: all 0.2s ease;
            }
            
            .xray-control-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #333c;
                color: white;
                padding: 10px;
                border-radius: 4px;
                z-index: 1000000;
                font-family: sans-serif;
                font-size: 12px;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            }
            
            .xray-control-panel button {
                margin: 2px;
                padding: 3px 8px;
                background: #555;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .xray-control-panel button:hover {
                background: #777;
            }
            
            .xray-children-explorer {
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid #555;
                border-radius: 3px;
                margin-top: 5px;
                background: #1a1a1a;
            }
            
            .xray-child-item {
                padding: 4px 8px;
                border-bottom: 1px solid #333;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .xray-child-item:hover {
                background: #333;
            }
            
            .xray-child-item:last-child {
                border-bottom: none;
            }
            
            .xray-inspect-btn {
                background: #444;
                color: #0f0;
                border: none;
                border-radius: 3px;
                margin-right: 8px;
                cursor: pointer;
                font-size: 10px;
                padding: 2px 5px;
            }
            
            .xray-inspect-btn:hover {
                background: #555;
            }
            
            .xray-child-text {
                margin-left: 8px;
                color: #999;
                font-style: italic;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .xray-breadcrumb {
                padding: 5px 10px;
                background: #333;
                border-radius: 3px;
                margin-bottom: 10px;
                font-size: 12px;
                display: flex;
                flex-wrap: wrap;
            }
            
            .xray-breadcrumb-item {
                margin-right: 5px;
                cursor: pointer;
                color: #0f0;
            }
            
            .xray-breadcrumb-item:hover {
                text-decoration: underline;
            }
        `;
        return xray;
    };

    // Créer le panneau de contrôle
    const createControlPanel = () => {
        const panel = document.createElement('div');
        panel.classList.add('xray-control-panel');
        
        const panelContent = document.createElement('div');
        panelContent.innerHTML = `
            <div style="margin-bottom:8px;font-weight:bold;">XRay Debugger</div>
            <div>
                <button id="xray-toggle">Désactiver</button>
                <button id="xray-toggle-all">Tous les éléments</button>
                <button id="xray-toggle-styles">Styles calculés</button>
                <button id="xray-toggle-tree">Arbre DOM</button>
            </div>
            <div style="margin-top:5px;font-size:10px;">Alt+X pour activer/désactiver</div>
        `;
        
        // Créer une barre de titre pour le drag
        const titleBar = document.createElement('div');
        titleBar.innerHTML = '<span>⣿</span>';
        titleBar.style.cssText = `
            cursor: move;
            padding: 3px;
            text-align: center;
            background: #444;
            border-radius: 3px 3px 0 0;
            border-bottom: 1px solid #555;
            user-select: none;
            font-size: 10px;
        `;
        
        panel.appendChild(titleBar);
        panel.appendChild(panelContent);
        
        // Rendre le panneau de contrôle déplaçable
        makeDraggable(panel, titleBar);
        
        return panel;
    };

    // Obtenir les informations détaillées d'un élément
    const getElementInfo = (element) => {
        const rect = element.getBoundingClientRect();
        let info = '';
        
        // Infos de base
        if (element.id) info += `<strong>ID:</strong> ${element.id}<br>`;
        if (element.className && typeof element.className === 'string') {
            info += `<strong>Classes:</strong> ${element.className.split(' ').join(', ')}<br>`;
        }
        
        // Type d'élément et dimensions
        info += `<strong>Élément:</strong> ${element.tagName.toLowerCase()}<br>`;
        info += `<strong>Dimensions:</strong> ${Math.round(rect.width)}px × ${Math.round(rect.height)}px<br>`;
        info += `<strong>Position:</strong> ${Math.round(rect.left)}px, ${Math.round(rect.top)}px<br>`;
        
        // Contenu texte (limité)
        const textContent = element.textContent?.trim();
        if (textContent && textContent.length > 0) {
            info += `<strong>Texte:</strong> ${textContent.substring(0, 50)}${textContent.length > 50 ? '...' : ''}<br>`;
        }
        
        // Attributs
        if (element.attributes.length > 0) {
            info += `<strong>Attributs:</strong><br>`;
            for (let i = 0; i < element.attributes.length; i++) {
                if (element.attributes[i].name !== 'class' && element.attributes[i].name !== 'id' && element.attributes[i].name !== 'style') {
                    info += `- ${element.attributes[i].name}: ${element.attributes[i].value}<br>`;
                }
            }
        }
        
        // Styles calculés (optionnel)
        if (config.showComputedStyles) {
            const computedStyle = window.getComputedStyle(element);
            info += `<strong>Styles calculés:</strong><br>`;
            const importantStyles = ['display', 'position', 'z-index', 'flex', 'grid', 'float', 'margin', 'padding', 'width', 'height'];
            
            importantStyles.forEach(style => {
                const value = computedStyle[style];
                if (value && value !== 'none' && value !== 'auto' && value !== '0px') {
                    info += `- ${style}: ${value}<br>`;
                }
            });
        }
        
        // Arborescence DOM (optionnel)
        if (config.showDOMTree) {
            info += `<strong>Arborescence DOM:</strong><br>`;
            let parent = element.parentElement;
            let path = [];
            
            while (parent) {
                let identifier = parent.tagName.toLowerCase();
                if (parent.id) identifier += `#${parent.id}`;
                else if (parent.className && typeof parent.className === 'string') {
                    identifier += `.${parent.className.split(' ')[0]}`;
                }
                path.unshift(identifier);
                parent = parent.parentElement;
            }
            
            info += path.join(' > ') + ` > <span style="color:yellow">${element.tagName.toLowerCase()}</span>`;
        }
        
        // Explorer les éléments enfants
        if (element.children.length > 0) {
            info += `<br><br><strong>Éléments enfants (${element.children.length}):</strong><br>`;
            info += `<div class="xray-children-explorer">`;
            
            for (let i = 0; i < element.children.length; i++) {
                const child = element.children[i];
                let childIdentifier = child.tagName.toLowerCase();
                
                if (child.id) childIdentifier += ` #${child.id}`;
                else if (child.className && typeof child.className === 'string') {
                    const firstClass = child.className.split(' ')[0];
                    if (firstClass) childIdentifier += ` .${firstClass}`;
                }
                
                // Limiter le texte à 30 caractères
                let childText = child.textContent?.trim() || '';
                if (childText.length > 30) {
                    childText = childText.substring(0, 27) + '...';
                }
                
                // Échapper les caractères HTML dans le texte
                childText = childText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                // Ajouter un bouton pour explorer chaque enfant
                info += `
                    <div class="xray-child-item" data-element-index="${i}">
                        <button class="xray-inspect-btn" data-element-index="${i}">▶</button>
                        <span>${childIdentifier}</span>
                        ${childText ? `<span class="xray-child-text">"${childText}"</span>` : ''}
                    </div>
                `;
            }
            
            info += `</div>`;
        }
        
        return info;
    };

    // Créer une surbrillance d'élément
    const createElementHighlight = () => {
        const highlight = document.createElement('div');
        highlight.classList.add('xray-element-highlight');
        highlight.style.display = 'none';
        return highlight;
    };

    // Mettre à jour la position et la taille de la surbrillance
    const updateElementHighlight = (element) => {
        if (!elementHighlight) return;
        
        const rect = element.getBoundingClientRect();
        elementHighlight.style.left = rect.left + window.scrollX + 'px';
        elementHighlight.style.top = rect.top + window.scrollY + 'px';
        elementHighlight.style.width = rect.width + 'px';
        elementHighlight.style.height = rect.height + 'px';
        elementHighlight.style.display = 'block';
    };

    // Créer une popover d'information
    const createInfoPopover = (element, x, y, isPermanent = false) => {
        const popover = document.createElement('div');
        popover.classList.add('xray-popover');
        
        // Créer une barre de titre avec boutons
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #222;
            padding: 5px 10px;
            border-bottom: 1px solid #444;
            cursor: move;
            user-select: none;
        `;
        
        // Titre dynamique basé sur l'élément
        let title = element.tagName.toLowerCase();
        if (element.id) title += ` #${element.id}`;
        else if (element.className && typeof element.className === 'string') {
            const firstClass = element.className.split(' ')[0];
            if (firstClass) title += ` .${firstClass}`;
        }
        
        titleBar.innerHTML = `
            <span style="font-weight:bold">${title}</span>
            <div>
                ${isPermanent ? `
                    <button class="xray-back-btn" style="background:#444;border:none;color:white;border-radius:3px;margin-right:5px;cursor:pointer;font-size:10px;padding:2px 5px;">◀ Retour</button>
                ` : ''}
                <button class="xray-close-btn" style="background:#444;border:none;color:white;border-radius:3px;cursor:pointer;font-size:10px;padding:2px 5px;">✕</button>
            </div>
        `;
        
        // Contenu avec les infos sur l'élément
        const content = document.createElement('div');
        content.style.padding = '10px';
        content.innerHTML = getElementInfo(element);
        
        popover.appendChild(titleBar);
        popover.appendChild(content);
        
        // Positionnement initial
        popover.style.left = `${x}px`;
        popover.style.top = `${y}px`;
        
        // Gérer la fermeture
        const closeBtn = popover.querySelector('.xray-close-btn');
        closeBtn.addEventListener('click', () => {
            popover.remove();
            if (isPermanent) {
                permanentPopover = null;
                currentElementInfo = null;
                if (elementHighlight) elementHighlight.style.display = 'none';
            }
        });
        
        // Gérer le bouton retour si c'est une popover permanente
        if (isPermanent) {
            const backBtn = popover.querySelector('.xray-back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    if (navigationHistory.length > 0) {
                        const previousElement = navigationHistory.pop();
                        inspectElement(previousElement, true);
                    }
                });
                
                // Désactiver le bouton retour s'il n'y a pas d'historique
                backBtn.disabled = navigationHistory.length === 0;
            }
            
            // Ajouter des gestionnaires pour les boutons d'inspection des enfants
            popover.querySelectorAll('.xray-inspect-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.getAttribute('data-element-index'));
                    if (!isNaN(index) && element.children[index]) {
                        // Ajouter l'élément actuel à l'historique
                        navigationHistory.push(currentElementInfo);
                        // Inspecter l'élément enfant
                        inspectElement(element.children[index], true);
                    }
                });
            });
            
            // Rendre également les lignes d'éléments enfants cliquables
            popover.querySelectorAll('.xray-child-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('xray-inspect-btn')) return;
                    
                    const index = parseInt(item.getAttribute('data-element-index'));
                    if (!isNaN(index) && element.children[index]) {
                        navigationHistory.push(currentElementInfo);
                        inspectElement(element.children[index], true);
                    }
                });
            });
        }
        
        // Rendre la popover déplaçable
        makeDraggable(popover, titleBar);
        
        return popover;
    };

    // Rendre un élément déplaçable
    const makeDraggable = (element, handle) => {
        let isDragging = false;
        let offsetX, offsetY;
        
        const onMouseDown = (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            element.classList.add('xray-dragging');
            
            // Calculer le décalage par rapport au coin supérieur gauche
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            e.preventDefault();
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        };
        
        const onMouseUp = () => {
            isDragging = false;
            element.classList.remove('xray-dragging');
        };
        
        handle.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Fonction principale pour inspecter un élément
    const inspectElement = (element, isPermanent = false) => {
        if (!element) return;
        
        // Mettre à jour l'élément actuellement inspecté
        if (isPermanent) {
            currentElementInfo = element;
            updateElementHighlight(element);
        }
        
        // Si une popover permanente existe déjà, la supprimer
        if (isPermanent && permanentPopover) {
            permanentPopover.remove();
        }
        
        // Calculer la position optimale pour la popover
        const rect = element.getBoundingClientRect();
        let x = rect.right + 10;
        let y = rect.top;
        
        // Ajuster si elle dépasse du viewport
        if (x + 400 > window.innerWidth) {
            x = Math.max(0, rect.left - 410);
        }
        
        if (y + 300 > window.innerHeight) {
            y = Math.max(0, window.innerHeight - 310);
        }
        
        // Créer la popover
        const popover = createInfoPopover(element, x, y, isPermanent);
        document.body.appendChild(popover);
        
        // Si c'est une popover permanente, la stocker
        if (isPermanent) {
            permanentPopover = popover;
        }
    };

    // Activer/désactiver XRay
    const toggleXRay = () => {
        config.enabled = !config.enabled;
        
        if (config.enabled) {
            // Injecter la feuille de style si elle n'existe pas
            if (!xrayStyleSheet) {
                xrayStyleSheet = createXRayStyle();
                document.head.appendChild(xrayStyleSheet);
            }
            
            // Créer le panneau de contrôle s'il n'existe pas
            if (!controlPanel) {
                controlPanel = createControlPanel();
                document.body.appendChild(controlPanel);
                
                // Ajouter les gestionnaires d'événements pour le panneau de contrôle
                controlPanel.querySelector('#xray-toggle').addEventListener('click', toggleXRay);
                controlPanel.querySelector('#xray-toggle-all').addEventListener('click', () => {
                    config.includeAllElements = !config.includeAllElements;
                    controlPanel.querySelector('#xray-toggle-all').textContent = 
                        config.includeAllElements ? 'Éléments principaux' : 'Tous les éléments';
                });
                
                controlPanel.querySelector('#xray-toggle-styles').addEventListener('click', () => {
                    config.showComputedStyles = !config.showComputedStyles;
                    controlPanel.querySelector('#xray-toggle-styles').textContent = 
                        config.showComputedStyles ? 'Masquer styles' : 'Afficher styles';
                    
                    // Mettre à jour la popover si elle existe
                    if (permanentPopover && currentElementInfo) {
                        const content = permanentPopover.querySelector('div:last-child');
                        content.innerHTML = getElementInfo(currentElementInfo);
                    }
                });
                
                controlPanel.querySelector('#xray-toggle-tree').addEventListener('click', () => {
                    config.showDOMTree = !config.showDOMTree;
                    controlPanel.querySelector('#xray-toggle-tree').textContent = 
                        config.showDOMTree ? 'Masquer arbre' : 'Afficher arbre';
                    
                    // Mettre à jour la popover si elle existe
                    if (permanentPopover && currentElementInfo) {
                        const content = permanentPopover.querySelector('div:last-child');
                        content.innerHTML = getElementInfo(currentElementInfo);
                    }
                });
            } else {
                controlPanel.style.display = 'block';
            }
            
            // Créer la surbrillance si elle n'existe pas
            if (!elementHighlight) {
                elementHighlight = createElementHighlight();
                document.body.appendChild(elementHighlight);
            }
            
            // Mettre à jour le texte du bouton
            controlPanel.querySelector('#xray-toggle').textContent = 'Désactiver';
            
            // Ajouter les gestionnaires d'événements
            document.addEventListener('mouseover', onElementHover);
            document.addEventListener('click', onElementClick);
        } else {
            // Désactiver XRay
            if (controlPanel) controlPanel.style.display = 'none';
            if (elementHighlight) elementHighlight.style.display = 'none';
            if (permanentPopover) permanentPopover.remove();
            permanentPopover = null;
            currentElementInfo = null;
            
            // Supprimer les gestionnaires d'événements
            document.removeEventListener('mouseover', onElementHover);
            document.removeEventListener('click', onElementClick);
        }
    };

    // Gestionnaire pour le survol d'un élément
    const onElementHover = (e) => {
        if (!config.enabled) return;
        
        // Vérifier si c'est un élément XRay (pour éviter la récursion)
        if (e.target.closest('.xray-popover, .xray-control-panel, .xray-element-highlight')) {
            return;
        }
        
        // Filtrer les éléments selon les paramètres
        let targetElement = e.target;
        if (!config.includeAllElements) {
            if (!targetElement.id && (!targetElement.className || typeof targetElement.className !== 'string')) {
                return;
            }
        }
        
        // Mettre à jour la surbrillance
        updateElementHighlight(targetElement);
        
        // Marquer l'élément pour le style CSS
        document.querySelectorAll('[data-xray="true"]').forEach(el => {
            el.removeAttribute('data-xray');
        });
        
        targetElement.setAttribute('data-xray', 'true');
    };

    // Gestionnaire pour le clic sur un élément
    const onElementClick = (e) => {
        if (!config.enabled) return;
        
        // Vérifier si c'est un élément XRay (pour éviter la récursion)
        if (e.target.closest('.xray-popover, .xray-control-panel, .xray-element-highlight')) {
            return;
        }
        
        // Filtrer les éléments selon les paramètres
        let targetElement = e.target;
        if (!config.includeAllElements) {
            if (!targetElement.id && (!targetElement.className || typeof targetElement.className !== 'string')) {
                return;
            }
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // Inspecter l'élément de manière permanente
        inspectElement(targetElement, true);
    };

    // Gestionnaire pour le raccourci clavier
    const onKeyDown = (e) => {
        // Alt+X pour activer/désactiver
        if (e.altKey && e.key.toLowerCase() === config.keyboardShortcut) {
            toggleXRay();
        }
    };

    // Initialiser XRay
    const init = () => {
        // Ajouter le gestionnaire pour le raccourci clavier
        document.addEventListener('keydown', onKeyDown);
        
        // Créer un élément bouton flottant pour activer XRay
        const activateButton = document.createElement('button');
        activateButton.textContent = 'XRay';
        activateButton.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #333;
            color: #0f0;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            z-index: 999999;
            font-family: sans-serif;
            font-size: 12px;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
        `;
        
        activateButton.addEventListener('click', toggleXRay);
        document.body.appendChild(activateButton);
        
        console.log('XRay Debugger initialisé. Appuyez sur Alt+X pour activer/désactiver.');
    };

    // Lancer l'initialisation une fois le DOM chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
