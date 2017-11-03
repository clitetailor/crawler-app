const cheerio = require('cheerio');
const request = require('request-promise');

class Spider {
  constructor() {
    this.bootstrapLinks = [];
    this.chunkSize = 10;
    this.queue = [];
    this.maxQueueSize = 1000;
    this.waitingTime = 1000;
  }

  run() {
    // Clone the bootstrap links to prevent side effects.
    this.queue = this.bootstrapLinks.slice();

    // Take a chunk of links to crawl.
    const chunk = this.queue.splice(0, this.chunkSize < this.queue.length ? this.chunkSize : this.queue);

    // No more links to crawl, we finish the work here!
    if (chunk.length === 0) {
      return;
    }

    // Crawl links concurrently in order to avoid non-thread safe.
    const crawlChunk = chunk.reduce((promise, nextLinkToCrawl) => {
      // Wait for previous link to be crawled.
      return promise.then(() => {
        return request(nextLinkToCrawl).then((document) => {
          const $ = cheerio.load(document);

          this.render($, document);
          this.renderHyperLinks($, document);
        });
      });
    }, Promise.resolve());

    crawlChunk.then(() => {
      setTimeout(() => {
        this.run();
      }, this.waitingTime);
    });
  }

  render() {

  }

  renderHyperLinks($) {
    let newLinks = $('a[href]').toArray();
    const unfilled = this.maxQueueSize - this.queue.length;

    // Limit max queue size.
    if (newLinks.length > this.queue.length) {
      newLinks = this.newLinks.slice(0, unfilled);
    }

    this.addToQueue(newLinks);
  }

  addToQueue(newLinks) {
    // Bread first search strategy.
    this.queue = this.queue.concat(newLinks);
  }
}

module.exports = Spider;