
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
                padding: 10px;
                font-size: 12px;
                z-index: 999999;
                max-width: 400px;
                max-height: 300px;
                overflow-y: auto;
                border-radius: 4px;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                font-family: monospace;
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
            
            .xray-element-highlight {
                position: absolute;
                pointer-events: none;
                background: rgba(255, 255, 0, 0.2);
                z-index: 999998;
            }
        `;
        return xray;
    };

    // Créer le panneau de contrôle
    const createControlPanel = () => {
        const panel = document.createElement('div');
        panel.classList.add('xray-control-panel');
        panel.innerHTML = `
            <div style="margin-bottom:8px;font-weight:bold;">XRay Debugger</div>
            <div>
                <button id="xray-toggle">Désactiver</button>
                <button id="xray-toggle-all">Tous les éléments</button>
                <button id="xray-toggle-styles">Styles calculés</button>
                <button id="xray-toggle-tree">Arbre DOM</button>
            </div>
            <div style="margin-top:5px;font-size:10px;">Alt+X pour activer/désactiver</div>
        `;
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
        
        return info;
    };

    // Créer une popover pour afficher les informations
    const createPopover = (info) => {
        // Supprimer toute popover existante
        removeExistingPopovers();
        
        const popover = document.createElement('div');
        popover.classList.add('xray-popover');
        popover.innerHTML = info;
        
        // Positionner initialement la popover
        popover.style.top = '50px';
        popover.style.left = '50px';
        
        document.body.appendChild(popover);
        
        // Repositionner pour rester dans la fenêtre
        const rect = popover.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            popover.style.left = `${window.innerWidth - rect.width - 20}px`;
        }
        if (rect.bottom > window.innerHeight) {
            popover.style.top = `${window.innerHeight - rect.height - 20}px`;
        }
        
        return popover;
    };

    // Supprimer les popovers existantes
    const removeExistingPopovers = () => {
        document.querySelectorAll('.xray-popover').forEach(popover => {
            popover.remove();
        });
    };

    // Supprimer les surlignages existants
    const removeExistingHighlights = () => {
        document.querySelectorAll('.xray-element-highlight').forEach(highlight => {
            highlight.remove();
        });
    };

    // Appliquer le mode XRay
    const applyXRay = () => {
        // Appliquer l'attribut data-xray à tous les éléments nécessaires
        const selector = config.includeAllElements ? '*' : 'div[id], div[class]';
        document.querySelectorAll(selector).forEach(el => {
            el.setAttribute('data-xray', 'true');
            
            // Ajouter des événements de survol
            el.addEventListener('mouseover', elementMouseOverHandler);
            el.addEventListener('mouseout', elementMouseOutHandler);
        });
    };

    // Retirer le mode XRay
    const removeXRay = () => {
        // Retirer l'attribut data-xray
        document.querySelectorAll('[data-xray="true"]').forEach(el => {
            el.removeAttribute('data-xray');
            
            // Retirer les événements de survol
            el.removeEventListener('mouseover', elementMouseOverHandler);
            el.removeEventListener('mouseout', elementMouseOutHandler);
        });
        
        // Nettoyer les popovers et surlignages
        removeExistingPopovers();
        removeExistingHighlights();
    };

    // Gestionnaire d'événements pour mouseover
    const elementMouseOverHandler = function(event) {
        event.stopPropagation();
        
        // Créer un surlignage visuel
        const rect = this.getBoundingClientRect();
        const highlight = document.createElement('div');
        highlight.classList.add('xray-element-highlight');
        highlight.style.top = `${window.scrollY + rect.top}px`;
        highlight.style.left = `${window.scrollX + rect.left}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        document.body.appendChild(highlight);
        
        // Créer la popover d'information
        const info = getElementInfo(this);
        createPopover(info);
    };

    // Gestionnaire d'événements pour mouseout
    const elementMouseOutHandler = function(event) {
        // Vérifier que la souris n'est pas entrée dans un enfant de l'élément
        if (this.contains(event.relatedTarget)) return;
        
        removeExistingPopovers();
        removeExistingHighlights();
    };

    // Basculer l'état du XRay
    const toggleXRay = () => {
        if (config.enabled) {
            // Désactiver XRay
            document.querySelector('#xray-debug-style')?.remove();
            document.querySelector('.xray-control-panel')?.remove();
            removeXRay();
            config.enabled = false;
        } else {
            // Activer XRay
            document.body.appendChild(createXRayStyle());
            document.body.appendChild(createControlPanel());
            applyXRay();
            config.enabled = true;
            
            // Configurer les boutons du panneau de contrôle
            document.getElementById('xray-toggle').addEventListener('click', toggleXRay);
            document.getElementById('xray-toggle').textContent = 'Désactiver';
            
            document.getElementById('xray-toggle-all').addEventListener('click', () => {
                config.includeAllElements = !config.includeAllElements;
                document.getElementById('xray-toggle-all').textContent = 
                    config.includeAllElements ? 'Divs seulement' : 'Tous les éléments';
                removeXRay();
                applyXRay();
            });
            
            document.getElementById('xray-toggle-styles').addEventListener('click', () => {
                config.showComputedStyles = !config.showComputedStyles;
                document.getElementById('xray-toggle-styles').textContent = 
                    config.showComputedStyles ? 'Masquer styles' : 'Montrer styles';
            });
            
            document.getElementById('xray-toggle-tree').addEventListener('click', () => {
                config.showDOMTree = !config.showDOMTree;
                document.getElementById('xray-toggle-tree').textContent = 
                    config.showDOMTree ? 'Masquer arbre' : 'Montrer arbre';
            });
        }
    };

    // Ajouter un raccourci clavier (Alt+X)
    document.addEventListener('keydown', (event) => {
        if (event.altKey && event.key.toLowerCase() === config.keyboardShortcut) {
            toggleXRay();
        }
    });

    // Démarrer XRay
    toggleXRay();
})();
