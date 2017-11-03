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
    this.crawl();
  }

  crawlerOnInit() { }

  crawlerOnFinish() { }

  beforeSendingRequest() { }

  sendRequest(link) {
    return request(link);
  }

  crawl() {
    /**
     * Take a chunk of links to crawl.
     */
    const chunk = this.queue.splice(0, this.chunkSize < this.queue.length ? this.chunkSize : this.queue.length);


    /**
     * No more links to crawl, we finish the work here!
     */
    if (chunk.length === 0 || this.stop === true) {
      this.crawlerOnFinish();
      return;
    }


    /**
     * Crawl links concurrently in order to avoid non-thread safe.
     */
    const crawlChunk = chunk.reduce((promise, nextLinkToCrawl) =>
      promise.then(() => {
        this.beforeSendingRequest(nextLinkToCrawl);

        return this.sendRequest(nextLinkToCrawl).then((document) => {
          if (this.stop === true) {
            return false;
          }

          const $ = cheerio.load(document);

          this.render($, document, nextLinkToCrawl);
          this.renderHyperLinks($, document, nextLinkToCrawl);
          this.counter++;

        }).catch(err => this.handleError(err));
      })
        .catch(err => this.handleError(err)),
    Promise.resolve(true));


    /** Dispatch schedule. */

    crawlChunk.then(() => {
      setTimeout(() => {
        this.crawl();
      }, this.waitingTime);
    })
      .catch(err =>
        this.handleError(err));
  }

  render() { }

  renderHyperLinks($, document, currentLink) {
    let newLinks = $('a[href]')
      .toArray()
      .map(element => $(element).attr('href'));

    const unfilled = this.maxQueueSize - this.queue.length;

    /** Cut-down links to limit the queue size. */
    if (newLinks.length > unfilled) {
      newLinks = newLinks.slice(0, unfilled);
    }

    newLinks = newLinks
      .map(link => new URL(link, currentLink))
      .filter(link => {
        link.hash = undefined;
        
        if (link.href === currentLink.href) {
          return false;
        }
        return true;
      });

    return this.addToQueue(newLinks);
  }

  addToQueue(newLinks) {
    // Bread first search strategy.
    this.queue = this.queue.concat(newLinks);
  }

  handleError() { }
}

module.exports = Spider;