# XRay.js

## Outil de débogage visuel pour pages web

XRay.js est un outil léger et non intrusif qui permet aux développeurs web d'inspecter visuellement les éléments d'une page web et d'obtenir des informations détaillées sur leur structure, leurs styles et leur positionnement.

![XRay Demo](https://via.placeholder.com/600x400?text=XRay.js+Demo)

## 🚀 Fonctionnalités

- **Inspection visuelle** : Surbrillance des éléments au survol
- **Informations détaillées** : Dimensions, position, classes, ID, attributs
- **Styles calculés** : Visualisation des styles CSS appliqués
- **Arborescence DOM** : Affichage de la hiérarchie des éléments
- **Navigation** : Exploration des éléments enfants et navigation dans l'historique
- **Interface conviviale** : Popups déplaçables et redimensionnables
- **Panneau de contrôle** : Configuration facile des options
- **Raccourcis clavier** : Activation/désactivation rapide avec Alt+X

## 📋 Installation

### Option 1 : Inclusion directe

```html
<script src="path/to/xray.js"></script>
```

### Option 2 : Bookmarklet

Créez un favori dans votre navigateur avec l'URL suivante :

```
javascript:(function(){var s=document.createElement('script');s.src='https://votre-domaine.com/xray.js';document.body.appendChild(s);})();
```

### Option 3 : Console du navigateur

Copiez-collez le contenu du fichier XRay.js dans la console de développement de votre navigateur.

## 🎮 Utilisation

### Activation

- **Raccourci clavier** : Appuyez sur `Alt+X`
- **Bouton flottant** : Cliquez sur le bouton "XRay" en bas à droite de la page
- **Panneau de contrôle** : Utilisez le bouton "Activer/Désactiver"

### Navigation

1. **Survol** : Passez la souris sur les éléments pour les mettre en surbrillance
2. **Inspection** : Cliquez sur un élément pour afficher ses informations détaillées
3. **Exploration** : Dans la popover d'information, cliquez sur les éléments enfants pour les inspecter
4. **Navigation historique** : Utilisez le bouton "Retour" pour revenir aux éléments précédemment inspectés

### Panneau de contrôle

- **Activer/Désactiver** : Active ou désactive XRay
- **Tous les éléments/Éléments principaux** : Bascule entre l'affichage de tous les éléments ou uniquement ceux avec ID/classe
- **Afficher/Masquer styles** : Affiche ou masque les informations de style calculées
- **Afficher/Masquer arbre** : Affiche ou masque l'arborescence DOM

## ⚙️ Configuration

Vous pouvez personnaliser XRay en modifiant l'objet `config` au début du fichier :

```javascript
const config = {
    enabled: false,                // État initial (activé/désactivé)
    highlightColor: '#09367278',   // Couleur de surbrillance
    textColor: '#0f0',             // Couleur du texte
    outlineColor: '#f00',          // Couleur de contour
    outlineWidth: '1px',           // Épaisseur du contour
    popoverBgColor: '#000c',       // Couleur de fond de la popover
    popoverTextColor: '#0f0',      // Couleur du texte de la popover
    keyboardShortcut: 'x',         // Touche pour activer/désactiver (avec Alt)
    showComputedStyles: true,      // Afficher les styles calculés
    showDOMTree: true,             // Afficher l'arborescence DOM
    includeAllElements: false      // Si false, ne montre que les divs avec id/class
};
```

## 🧩 Informations affichées

Pour chaque élément inspecté, XRay affiche :

- **Identifiants** : ID et classes
- **Type d'élément** : Balise HTML (div, span, p, etc.)
- **Dimensions** : Largeur et hauteur en pixels
- **Position** : Coordonnées X et Y
- **Contenu texte** : Aperçu du texte contenu (limité)
- **Attributs** : Liste des attributs HTML
- **Styles calculés** : Propriétés CSS importantes
- **Arborescence DOM** : Chemin depuis l'élément racine
- **Éléments enfants** : Liste des éléments contenus, navigable

## 🔍 Cas d'utilisation

- **Débogage de mise en page** : Identifiez rapidement les problèmes de positionnement et de dimension
- **Analyse de structure** : Comprenez l'arborescence DOM d'une page
- **Inspection CSS** : Visualisez les styles effectivement appliqués
- **Développement responsive** : Vérifiez les dimensions à différentes tailles d'écran
- **Intégration frontend** : Identifiez les éléments à cibler pour JavaScript ou CSS

## 📝 Notes techniques

- XRay est entièrement écrit en JavaScript vanilla et ne nécessite aucune dépendance
- Les styles XRay sont isolés pour ne pas interférer avec ceux de la page
- L'outil s'auto-désactive au rechargement de la page
- Les éléments de l'interface XRay sont exclus de l'inspection pour éviter la récursion

## 🔒 Compatibilité

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 80+

## 👥 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements (`git commit -m 'Ajout d'une fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

## 📜 Licence

Ce projet est distribué sous licence MIT. Voir le fichier `LICENSE` pour plus d'informations.
