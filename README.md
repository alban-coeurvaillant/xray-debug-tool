# XRay Debug Tool

Un outil de débogage visuel avancé pour les développeurs web. Cet outil permet d'inspecter rapidement les éléments HTML d'une page web avec une interface utilisateur intuitive.

## Fonctionnalités

- Mode "rayon-X" pour visualiser la structure de la page
- Panneau de contrôle interactif
- Affichage détaillé des propriétés des éléments
- Visualisation de l'arborescence DOM
- Affichage des styles calculés
- Raccourci clavier (Alt+X)
- Surlignage visuel des éléments

## Utilisation

### Méthode 1: Console de développement

Copiez le code du fichier `xray.js` et collez-le dans la console de développement de votre navigateur.

### Méthode 2: Bookmarklet

Créez un nouveau favori dans votre navigateur avec l'URL suivante:
```javascript
javascript:(function(){/* Contenu du fichier xray.js */})();
