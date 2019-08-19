const rp = require('request-promise');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');

const {JSDOM} = jsdom;

const EN_WIKI_ISO_URL = 'https://en.wikipedia.org/wiki/ISO_3166-1';

const EN_WIKI_CODES_TABLE_INDEX = 1;

const parseFlagWikiUrl = thumbLink => `https://${thumbLink.split('/').filter((s,i) => [2,3,4,6,7,8].includes(i)).join('/')}`;

const getCountryDataFromRow = r => {
    const cells = [...r.querySelectorAll('td')];
    return {
        name      : cells[0].childNodes[2].innerHTML,
        flag      : parseFlagWikiUrl(cells[0].childNodes[0].childNodes[0].getAttribute('src')),
        alpha2Code: cells[1].childNodes[0].childNodes[1].innerHTML,
        alpha3Code: cells[2].childNodes[1].innerHTML
    }
}

const saveCountriesFile = (countries = []) => new Promise((resolve, reject) => {
    fs.writeFile(path.join(__dirname, '../output/countries.json'), JSON.stringify(countries, null, '  '), err => {
        if (err) {
            reject(err);
        } else {
            resolve('Countries successfully saved in a countries.json file into the output folder.');
        }
    });
});

const scrapeEnWikiPage = (resolve, reject) => page => {
    console.log('Wiki page loaded');
    const {document: pageDom} = new JSDOM(page).window;
    const rawTables = pageDom.querySelectorAll('table.wikitable');
    const tables = [...rawTables];

    const countriesTable = tables[EN_WIKI_CODES_TABLE_INDEX];
    const rawRows = countriesTable.querySelectorAll('tbody tr');
    const countriesRows = [...rawRows].filter(r => r.querySelectorAll('td').length);
    const countries = countriesRows.map(getCountryDataFromRow);

    saveCountriesFile(countries)
        .then(msg => resolve(msg))
        .catch(err => reject(err));
}

const countriesScraper = () => new Promise((resolve, reject) => {
    console.log("Let's start");
    rp(EN_WIKI_ISO_URL)
        .then(scrapeEnWikiPage(resolve, reject))
        .catch(reject);
});

module.exports = countriesScraper;