const { URL } = require('url');

class URLResolver {
  static removeScriptHrefs(links) {
    return links.filter(link => !link.match(/javascript:/gi));
  }

  static removeHomeHrefs(links) {
    return links.filter(link => link.match(/^\/$/));
  }

  static removeHashTagHrefs(links) {
    return links.filter(link => !link.match(/#/));
  }

  static removeRedundantHrefs(links) {
    return links.filter(link => !link.match(/\s+/));
  }

  static resolveURL(base, relative) {
    if (!relative) {
      
      /**
       * Resolve base url.
       * */

      if (!base.match(/^http:\/\/|^https:\/\//)) {
        return this.addHTTPS(base);
      }
      return base;
    }
    else {
      /**
       * Resolve relative url.
       * */

      if (relative.match(/^http:\/\/|^https:\/\//)) {
        return relative;
      }

      base = this.resolveURL(base);

      try {
        return new URL(base, relative).href;
      } catch (err) {
        return base;
      }
    }
  }

  static resolveURLs(base, relatives) {
    if (!relatives) {
      this.resolveURL(base);
    } else {
      return this.removeHashTagHrefs(
        this.removeHomeHrefs(
          this.removeRedundantHrefs(
            this.removeScriptHrefs(relatives)
          )
        )
      )
        .map(link => this.resolveURL(base, link));
    }
  }

  static addHTTPS(url) {
    return 'https://' + url;
  }
}

module.exports = URLResolver;