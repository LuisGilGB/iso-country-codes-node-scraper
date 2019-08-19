const fs = require('fs');

const outputDir = './output';

// We check if output directory exists. If it doesn't, we create it.
if (fs.existsSync(outputDir)) {
    console.log("Output dir already exists, so no need to create it.");
} else {
    console.log("Output directoty doesn't exist, so we create it now.");
    fs.mkdirSync(outputDir);
    console.log("Output directoty successfully created.");
}

// Import scraper code.
const countriesScraper = require('./src/countriesScraper.js');

// Run the scraper.
countriesScraper()
    .then((msg) => {
        console.log(msg);
        console.log('Done')
    })
    .catch((err) => console.log(err));