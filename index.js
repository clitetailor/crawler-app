const program = require('commander');
const request = require('request-promise');
const cheerio = require('cheerio');

program
  .version('0.1.0')
  .usage('[options] <domain ...>')
  .parse(process.argv);

const domains = program.args;

function crawlChunk(links) {
  const requests = [];

  for (const link of links) {
    requests.push(request(link).then(document => {
      const query = cheerio.load(document);

      const foundLinks = query('a[href]')
        .toArray()
        .map(element => query(element).attr('href'));

      console.log(foundLinks);
    }));
  }
}

crawlChunk(domains);