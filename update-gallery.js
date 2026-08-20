const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const galleryHtmlPath = path.join(__dirname, 'gallery.html');

// List of system asset files to exclude from the gallery
const excludedFiles = [
  'logo.png',
  'commission-guidelines.jpg',
  'commission-guidelines.png',
  'evilfurrybird-hero.png',
  'cozy-art-desk.png',
  'rendered-sample.png',
  'flatcolor-sample.png',
  'lineart-sample.png',
  'sketch-sample.png',
  'icon-sample.png',
  'half-body-sample.png',
  'full-body-sample.png'
];

// 1. Read files in assets/
fs.readdir(assetsDir, (err, files) => {
  if (err) {
    console.error('Error reading assets directory:', err);
    process.exit(1);
  }

  // 2. Filter for image files and exclude system assets
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const galleryImages = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext) && !excludedFiles.includes(file);
  });

  console.log(`Found ${galleryImages.length} gallery images in assets/`);

  // 3. Generate HTML for each card
  const cardsHtml = galleryImages.map(file => {
    // Extract base name, remove 'gallery-' prefix if present
    let baseName = path.basename(file, path.extname(file));
    if (baseName.toLowerCase().startsWith('gallery-')) {
      baseName = baseName.substring(8);
    }
    
    // Convert hyphens and underscores to spaces
    const words = baseName.replace(/[-_]/g, ' ').split(' ').filter(w => w.length > 0);
    
    // Capitalize first letter of the first word, lowercase the rest (sentence case)
    let altName = words.map((w, idx) => {
      if (idx === 0) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }
      return w.toLowerCase();
    }).join(' ');

    const altText = `${altName} artwork`;

    return `        <article class="art-card"><img src="assets/${file}" alt="${altText}" class="art-card-img"></article>`;
  }).join('\n');

  // 4. Read gallery.html
  fs.readFile(galleryHtmlPath, 'utf8', (err, html) => {
    if (err) {
      console.error('Error reading gallery.html:', err);
      process.exit(1);
    }

    // 5. Replace grid contents using regex
    const regex = /(<section class="gallery-grid"[^>]*>)([\s\S]*?)(<\/section>)/;
    
    if (!regex.test(html)) {
      console.error('Could not find <section class="gallery-grid"> in gallery.html');
      process.exit(1);
    }

    const updatedHtml = html.replace(regex, `$1\n${cardsHtml}\n      $3`);

    // 6. Write updated HTML back
    fs.writeFile(galleryHtmlPath, updatedHtml, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to gallery.html:', err);
        process.exit(1);
      }
      console.log('Successfully updated gallery.html with all assets!');
    });
  });
});
