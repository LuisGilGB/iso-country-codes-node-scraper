const rp = require('request-promise');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');

const {JSDOM} = jsdom;

const EN_WIKI_ISO_URL = 'https://en.wikipedia.org/wiki/ISO_3166-1';
const ES_WIKI_ISO_URL = 'https://es.wikipedia.org/wiki/ISO_3166-1';

const EN_WIKI_CODES_TABLE_INDEX = 1;

const parseFlagWikiUrl = thumbLink => `https://${thumbLink.split('/').filter((s,i) => [2,3,4,6,7,8].includes(i)).join('/')}`;

const getCountryDataFromEnWikiRow = r => {
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

const getCodeFromEsWikiRow = r => {
    const cells = [...r.querySelectorAll('td')];
    if (!(cells && cells.length)) {
        return false;
    }
    return cells[2].innerHTML;
}

const getEsNameFromRow = r => {
    const cell = r.querySelector('td');
    if (!cell) {
        return false;
    }
    return (cell.childNodes[0].childNodes[0] && cell.childNodes[0].childNodes[0].innerHTML) ||
            cell.childNodes[0].innerHTML;
}

const scrapeEsWikiPage = page => new Promise((resolve, reject) => {
    console.log('Spanish Wiki page loaded');
    const {document: pageDom} = new JSDOM(page).window;
    const rawTables = pageDom.querySelectorAll('table.wikitable');
    const tables = [...rawTables];

    const countriesTable = tables[EN_WIKI_CODES_TABLE_INDEX];
    const rawRows = countriesTable.querySelectorAll('tbody tr');
    const countriesRows = [...rawRows].filter(r => r.querySelectorAll('td').length);
    const spanishNamesMap = countriesRows.reduce((obj0, r) => ({...obj0, [getCodeFromEsWikiRow(r)]: getEsNameFromRow(r)}));
    resolve(spanishNamesMap);
});

const scrapeEnWikiPage = (resolve, reject) => page => {
    console.log('Wiki page loaded');
    const {document: pageDom} = new JSDOM(page).window;
    const rawTables = pageDom.querySelectorAll('table.wikitable');
    const tables = [...rawTables];

    const countriesTable = tables[EN_WIKI_CODES_TABLE_INDEX];
    const rawRows = countriesTable.querySelectorAll('tbody tr');
    const countriesRows = [...rawRows].filter(r => r.querySelectorAll('td').length);
    const countries = countriesRows.map(getCountryDataFromEnWikiRow);

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

const countriesScraper = () => new Promise((resolve, reject) => {
    console.log("Let's start");
    rp(EN_WIKI_ISO_URL)
        .then(scrapeEnWikiPage(resolve, reject))
        .catch(reject);
});

module.exports = countriesScraper;