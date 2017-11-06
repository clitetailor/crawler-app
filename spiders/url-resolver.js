const { URL } = require('url');

class URLResolver {
  static filterURLs(urls) {
    return urls.filter(link => !link.match(/^\/$/))
      .filter(link => !link.match(/#/))
      .filter(link => !link.match(/^\s+$/))
      .filter(link => !link.match(/javascript:/gi));
  }
  
  static resolveURLs(base, urls) {
    if (!urls) {
      return this.resolveURL(base);
    } else {
      return this.filterURLs(urls)
        .map(url => this.resolveURL(base, url));
    }
  }

  static resolveURL(base, relative) {
    if (!relative) {
      /**
       * Resolve base url.
       * */

      if (base.match(/^\/\//)) {
        return `https:${base}`; // The same protocol, add https.
      }
      if (!base.match(/^http:\/\/|^https:\/\//)) {
        return `https://${base}`; // Missing protocol, add https.
      }
      return base;
    }
    else {
      /**
       * Resolve relative url.
       * */

      if (base.match(/^\/\//)) {
        return `https:${base}`; // The same protocol, add https.
      }
      if (relative.match(/^http:\/\/|^https:\/\//)) {
        return relative;
      }

      base = this.resolveURL(base);

      try {
        return new URL(relative, base).href;
      } catch (err) {
        return relative;
      }
    }
  }
}

module.exports = URLResolver;