# iso-country-codes-node-scraper
Scraper made with NodeJS for ISO country codes list.

Use: Go to module directory and run "npm start".
Running "node index.js" is valid too.

This NodeJS aplication scrapes the Englis Wikipedia entry for ISO 3166-1 countries identification standard to get both alpha2 and alpha3 country codes, plus the name, the numeric code and the flag url. In addition, the same entry for the Spanish Wikipedia is scraped too to get the Spanish names for countries too. The scraping result is saved as a JSON file called countries.json in an output folder into the oject directory.
The 1.0.0 version of this application was made for the Wikipedia page responses at 18/08/2019. Remember that these pages may change and that would lead this application to fail, so the code should be updated for the new DOM structure or whatever to successfully work (Wikipedia is not quite a semantic webpage).
An example output file is provided from 19/08/2019 in order to have a reference about how the application output should look like (this can serve as a source of a valid countries data JSON file, if that's what you're looking for).
