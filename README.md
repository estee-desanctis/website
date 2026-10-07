# Portfolio EcoDesign

Site statique, accessible et léger. Le contenu s'édite dans `data/`, les pages HTML sont **générées**.

## Mettre à jour le contenu
1. Modifier `data/content.fr.js` et/ou `data/content.en.js` (textes, projets, articles, témoignages).
2. Régénérer les pages : `node build.mjs` (Node 18 ou plus, aucune dépendance à installer).
3. Publier : envoyer **tous** les fichiers modifiés (les `.html` générés inclus) sur GitHub.

## Organisation
- FR à la racine (`index.html`, `portfolio.html`, `contributions.html`, `projets/`, `articles/`), EN dans `en/`.
- `portfolio-projet.html` et `contribution.html` : anciennes adresses (`?id=…`), qui redirigent vers les nouvelles pages.
- `css/style.css` (styles), `js/site.js` (menu mobile + formulaire, facultatifs), `fonts/` (Roboto auto-hébergée).
- `src/icons.json` : icônes SVG utilisées par `build.mjs`.
- `data/declaration.json` : texte de la déclaration d'accessibilité (FR et EN). À mettre à jour après un audit complet.

## Règles à garder
- Pas de GIF animé : le convertir en vidéo (`ffmpeg -i a.gif -movflags +faststart -pix_fmt yuv420p -an a.mp4`, plus `.webm` et `-poster.webp`). Le générateur affiche alors une vidéo avec commandes, sans lecture automatique.
- Chaque image du contenu a un `alt` utile (ou rien si elle est purement décorative).
- Après une modification : relancer `node build.mjs`, puis tester au clavier (Tab, Entrée, Échap) et à 200 % de zoom.
