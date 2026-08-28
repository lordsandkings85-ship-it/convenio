const sharp = require('sharp');
const fs = require('fs');

sharp('public/franchise_owner_cta.png')
  .webp({ quality: 80 })
  .toFile('public/franchise_owner_cta.webp')
  .then(info => {
    console.log('Successfully converted image:', info);
  })
  .catch(err => {
    console.error('Error converting image:', err);
  });
