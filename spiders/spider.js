const cheerio = require('cheerio');
const request = require('request-promise');

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
      .map(link => this.resolveURL(link));
    
    this.crawlerOnInit();
    this.crawl();
  }

  crawlerOnInit() { }

  crawlerOnFinish() { }

  beforeSendingRequest() { }

  sendRequest(link) {
    this.beforeSendingRequest(link);
    return request(link);
  }

  crawl() {
    /**
     * Take a chunk of links to crawl.
     */

    const chunk = this.getChunk();

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
    
    this.crawlChunk(
      chunk,
      (document, link) => this.handleRequest(document, link),
      (err) => this.handleError(err),
      () => this.dispatchNext()
    );
  }

  dispatchNext() {
    setTimeout(
      () => this.crawl(),
      this.waitingTime
    );
  }

  getChunk() {
    return this.queue.splice(
      0,
      this.chunkSize < this.queue.length
        ? this.chunkSize
        : this.queue.length
    );
  }

  crawlChunk(chunk, handleRequest, handleError, done) {
    const requests = chunk.map(
      link =>
        this.sendRequest(link)
          .then(page => handleRequest(page, link))
          .catch(err => handleError(err))
    );
    
    return Promise.all(requests)
      .then(done)
      .catch(err => handleError(err));
  }

  handleRequest(page, link) {
    if (page) {
      const $ = cheerio.load(page);

      this.render($, page, link);
      this.renderHyperLinks($, page, link);
    }
  }

  addToQueue(links) {
    // Bread first search strategy.
    this.queue = this.queue.concat(links);
  }

  render() { }

  renderHyperLinks($, document, currentLink) {
    let newLinks = $('a[href]')
      .toArray()
      .map(element => $(element).attr('href'));

    const unfilled = this.maxQueueSize - this.queue.length;

    this.crawlerOnRenderHrefs(newLinks, currentLink);
    /**
     * Cut-down links to limit the queue size.
     * */

    if (newLinks.length > unfilled) {
      newLinks = newLinks.slice(0, unfilled); 
    }

    newLinks = this.resolveURLs(currentLink, newLinks);

    this.addToQueue(newLinks);
  }

  crawlerOnRenderHrefs() { }

  resolveURLs() {
    return [];
  }

  resolveURL() {
    return '';
  }

  handleError() { }
}

module.exports = Spider;