class StructureExtractor {
  constructor() {

  }

  static extractDocument($) {

  }

  static extractContent($) {
    
  }

  static extractTitle($) {
    const pageTitle = $('title').text();

    const contentTitles = [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6'
    ]
      .map(selector =>
        $(selector).toArray())
      .reduce((prev, next) =>
        prev.concat(next), []);
  }
}

module.exports = StructureExtractor;