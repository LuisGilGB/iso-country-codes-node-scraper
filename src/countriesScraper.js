const rp = require('request-promise');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');

const {JSDOM} = jsdom;

const EN_WIKI_ISO_URL = 'https://en.wikipedia.org/wiki/ISO_3166-1';
const ES_WIKI_ISO_URL = 'https://es.wikipedia.org/wiki/ISO_3166-1';

const EN_WIKI_CODES_TABLE_INDEX = 1;
const ES_WIKI_CODES_TABLE_INDEX = 1;

const FLAG_PATH_RELEVANT_SEGMENTS_INDEXES = [2,3,4,6,7,8];

const EN_FLAG_AND_NAME_CELL_INDEX = 0;
const EN_FLAG_SUBINDEX = 0;
const EN_NAME_SUBINDEX = 2;
const EN_NAME_SUBSUBINDEX = 0;
const EN_ALPHA2_CELL_INDEX = 1;
const EN_ALPHA2_CELL_SUBINDEX = 0;
const EN_ALPHA2_CELL_SUBSUBINDEX = 1;
const EN_ALPHA3_CELL_INDEX = 2;
const EN_ALPHA3_CELL_SUBINDEX = 1;
const EN_NUMCODE_CELL_INDEX = 3;
const EN_NUMCODE_CELL_SUBINDEX = 1;

const ES_WIKI_NAME_CELL_INDEX = 0;
const ES_WIKI_NAME_CELL_SUBINDEX = 0;
const ES_WIKI_ALPHA2_CELL_INDEX = 2;

// From the thumb url, returns the source flag pic url at English Wikipedia.
const parseFlagWikiUrl = thumbLink => `https://${thumbLink.split('/').filter((s,i) => FLAG_PATH_RELEVANT_SEGMENTS_INDEXES.includes(i)).join('/')}`;

// Check the cells in a row to get the country data (name, flag url and alpha2, alpha3 and numeric codes).
const getCountryDataFromEnWikiRow = r => {
    const cells = [...r.querySelectorAll('td')];
    return {
        name      : (cells[EN_FLAG_AND_NAME_CELL_INDEX].childNodes[EN_NAME_SUBINDEX].childNodes[EN_NAME_SUBSUBINDEX] && cells[EN_FLAG_AND_NAME_CELL_INDEX].childNodes[EN_NAME_SUBINDEX].childNodes[EN_NAME_SUBSUBINDEX].innerHTML) || cells[EN_FLAG_AND_NAME_CELL_INDEX].childNodes[EN_NAME_SUBINDEX].innerHTML,
        flag      : parseFlagWikiUrl(cells[EN_FLAG_AND_NAME_CELL_INDEX].childNodes[EN_FLAG_SUBINDEX].childNodes[0].getAttribute('src')),
        alpha2Code: cells[EN_ALPHA2_CELL_INDEX].childNodes[EN_ALPHA2_CELL_SUBINDEX].childNodes[EN_ALPHA2_CELL_SUBSUBINDEX].innerHTML,
        alpha3Code: cells[EN_ALPHA3_CELL_INDEX].childNodes[EN_ALPHA3_CELL_SUBINDEX].innerHTML,
        numCode   : cells[EN_NUMCODE_CELL_INDEX].childNodes[EN_NUMCODE_CELL_SUBINDEX].innerHTML
    }
}

// Save a countries array into a country.json file into the output folder.
const saveCountriesFile = (countries = []) => new Promise((resolve, reject) => {
    fs.writeFile(path.join(__dirname, '../output/countries.json'), JSON.stringify(countries, null, '  '), err => {
        if (err) {
            reject(err);
        } else {
            resolve('Countries successfully saved in a countries.json file into the output folder.');
        }
    });
});

// Get the country alpha2 code from a row if it's a valid country row.
const getCodeFromEsWikiRow = r => {
    const cells = [...r.querySelectorAll('td')];
    if (!(cells && cells.length)) {
        return false;
    }
    return cells[ES_WIKI_ALPHA2_CELL_INDEX].innerHTML;
}

// Get the country name in Spanish from a row if it's a valid country row.
const getEsNameFromRow = r => {
    const cell = r.querySelector('td');
    if (!cell) {
        return false;
    }
    return (cell.childNodes[ES_WIKI_NAME_CELL_INDEX].childNodes[ES_WIKI_NAME_CELL_SUBINDEX] && cell.childNodes[ES_WIKI_NAME_CELL_INDEX].childNodes[ES_WIKI_NAME_CELL_SUBINDEX].innerHTML) ||
            cell.childNodes[ES_WIKI_NAME_CELL_INDEX].innerHTML;
}

// Returns a map that associates country code and its name in Spanish from the ISO 3166-1 Spanish
// Wikipedia entry.
const scrapeEsWikiPage = page => new Promise((resolve, reject) => {
    console.log('Spanish Wiki page loaded');
    const {document: pageDom} = new JSDOM(page).window;
    const rawTables = pageDom.querySelectorAll('table.wikitable');
    const tables = [...rawTables];

    const countriesTable = tables[ES_WIKI_CODES_TABLE_INDEX];
    const rawRows = countriesTable.querySelectorAll('tbody tr');
    const countriesRows = [...rawRows].filter(r => r.querySelectorAll('td').length);
    const spanishNamesMap = countriesRows.reduce((obj0, r) => ({...obj0, [getCodeFromEsWikiRow(r)]: getEsNameFromRow(r)}), {});
    resolve(spanishNamesMap);
});

// Returns a countries array with name, flag and codes data extracted from the ISO 3166-1 English
// Wikipedia entry.
const scrapeEnWikiPage = (resolve, reject) => page => {
    console.log('Wiki page loaded');
    const {document: pageDom} = new JSDOM(page).window;
    const rawTables = pageDom.querySelectorAll('table.wikitable');
    const tables = [...rawTables];

    const countriesTable = tables[EN_WIKI_CODES_TABLE_INDEX];
    const rawRows = countriesTable.querySelectorAll('tbody tr');
    const countriesRows = [...rawRows].filter(r => r.querySelectorAll('td').length);
    const countries = countriesRows.map(getCountryDataFromEnWikiRow);

    // We want the names in Spanish too, so we take them from the Spanish Wikipedia.
    rp(ES_WIKI_ISO_URL)
        .then(page => {
            scrapeEsWikiPage(page)
                .then((spanishNamesMap) => {
                    const extendedCountries = countries.map(c => ({
                        ...c,
                        esName: spanishNamesMap[c.alpha2Code]
                    }));
                    saveCountriesFile(extendedCountries)
                        .then(msg => resolve(msg))
                        .catch(err => reject(err));
                })
                .catch(err => reject(err));
        })
        .catch(err => reject(err));

}

// Run the scraping routine staring with the request of the Wikipedia entry for ISO 3166-1 standard.
const countriesScraper = () => new Promise((resolve, reject) => {
    console.log("Let's start");
    rp(EN_WIKI_ISO_URL)
        .then(scrapeEnWikiPage(resolve, reject))
        .catch(reject);
});

module.exports = countriesScraper;