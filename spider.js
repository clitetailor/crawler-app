const request = require('request-promise');
const cheerio = require('cheerio');
const url = require('url');
const fs = require('fs');
const crawlChunk = require('./crawl-chunk');

class Spider {
  constructor(bootstrapLinks) {
    this.queue = bootstrapLinks.slice();
    this.queueSize = 1000;
    this.chunkSize = 100;
  }

  run() {
    crawlChunk(this.queue, links => this.addLinks(links))
      .then(() => this.onDone());
  }

  addLinks(links) {
    // Keep queue size <= 1000.
    const unfilled = this.queueSize - queue.length;
    const numberOfNextLinks = links.length < unfilled ? links.length : unfilled; // Prevent undefined items.

    const nextLinks = links.slice(0, numberOfNextLinks);

    // Append to file.
    nextLinks.forEach(link => fs.appendFile('links.txt.', link));

    this.queue = this.queue.concat(nextLinks);

    // Save queue status.
    fs.writeFile('./queue.txt', this.queue.join('\n'));
  }

  onDone() {
    setTimeout(() => {
      // Each time, crawl 100 links.
      const nextLinks = this.queue.splice(0, this.chunkSize);

      crawlChunk(nextLinks);
    }, 500);
  }
}

module.exports = Spider;