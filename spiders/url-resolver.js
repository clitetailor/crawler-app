const { URL } = require('url');

class URLResolver {
  static filterHrefs(urls) {
    return urls.filter(link => !link.match(/^\/$/))
      .filter(link => !link.match(/#/))
      .filter(link => !link.match(/^\s+$/))
      .filter(link => !link.match(/javascript:/gi));
  }
  
  static resolveURL(relative, base) {
    if (!base) {
      /**
       * Resolve base url.
       * */

      if (relative.match(/^\/\//)) {
        return `https:${relative}`; // The same protocol, add https.
      }
      if (!relative.match(/^http:\/\/|^https:\/\//)) {
        return `https://${relative}`; // Missing protocol, add https.
      }
      return relative;
    } else {
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