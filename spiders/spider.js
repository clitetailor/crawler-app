const cheerio = require('cheerio');
const request = require('request-promise');
const { URL } = require('url');

class Spider {
  constructor() {
    this.bootstrapLinks = [];
    this.chunkSize = 10;
    this.queue = [];
    this.maxQueueSize = 1000;
    this.waitingTime = 1000;
    this.stop = false;
    this.counter = 0;
  }

  run() {
    // Clone the bootstrap links to prevent side effects.
    this.queue = this.bootstrapLinks
      .slice()
      .map(link => {
        if (
          link && link.match && link.match(/^http/i)
        ) {
          return link;
        } else {
          return 'https://' + link;
        }
      });
    
    this.crawlerOnInit();
  }

  crawlerOnInit() { }

  crawlerOnFinish() { }

  crawl() {
    // Take a chunk of links to crawl.
    const chunk = this.queue.splice(0, this.chunkSize < this.queue.length ? this.chunkSize : this.queue);

    // No more links to crawl, we finish the work here!
    if (chunk.length === 0 || this.stop === true) {
      this.crawlerOnFinish();
      return;
    }

    // Crawl links concurrently in order to avoid non-thread safe.
    const crawlChunk = chunk.reduce((promise, nextLinkToCrawl) =>
      promise.then(() =>
        request(nextLinkToCrawl).then((document) => {
          if (this.stop === true) {
            return false;
          }

          const $ = cheerio.load(document);

          this.render($, document, nextLinkToCrawl);
          this.renderHyperLinks($, document, nextLinkToCrawl);
          this.counter++;

        }).catch(err => {
          this.handleError(err);
        })
      ), Promise.resolve(true));

    // Dispatch schedule.
    crawlChunk.then(() => {
      setTimeout(() => {
        this.crawl();
      }, this.waitingTime);
    });
  }

  render() {

  }

  renderHyperLinks($, document, currentLink) {
    let newLinks = $('a[href]').toArray();
    const unfilled = this.maxQueueSize - this.queue.length;

    // Limit max queue size.
    if (newLinks.length > this.queue.length) {
      newLinks = this.newLinks.slice(0, unfilled);
    }

    newLinks = newLinks.map(link => new URL(link, currentLink).href);

    this.addToQueue(newLinks);
  }

  addToQueue(newLinks) {
    // Bread first search strategy.
    this.queue = this.queue.concat(newLinks);
  }

  handleError() { }
}

module.exports = Spider;