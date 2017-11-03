const Spider = require('./spider');
const program = require('commander');
const filenamify = require('filenamify');
const fs = require('fs');
const path = require('path');

program.version('0.1.0')
  .usage('[options] <domains>', 'Crawl a list of domains')  
  .option('-o --output', 'Specify the output directory')
  .option('-w --wait', 'The duration of waiting time between each chunks')
  .option('-n --number', 'The number of pages will be crawl');

class Natio extends Spider {
  constructor() {
    super();
    this.waitingTime = program.wait || 100;
    this.maxCounter = program.number || 5000;
    this.bootstrapLinks = program.args;
    this.directory = program.output || './output';
  }

  crawlerOnInit() {
    
  }

  render($, document, link) {
    // Maximum 5000 link.
    if (this.counter >= this.maxCounter) {
      this.stop = true;
    }

    const encodedLink = filenamify(link);

    const filename = path.resolve(this.directory, encodedLink);
    fs.writeFile(filename, document);
  }
}

module.exports = Natio;