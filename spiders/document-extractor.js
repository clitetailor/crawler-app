class Document {
  constructor(title, content) {
    this.title = title;
    this.content = content;
  }
}

class DocumentExtractor {
  static extractDocument($) {
    return new Document(
      this.extractTitle($),
      this.extractContent($)
    );
  }

  static extractContent($) {
    return $('p').toArray()
      .map(p => $(p).text())
      .map(p => p.split(/\s+/gi).join(' '))      
      .join('\n');
  }

  static extractTitle($) {
    return $('h1').first()
      .text()
      .split(/\s+/gi)
      .join(' ')
      .trim();
  }

  static extractURLs($) {
    return $('a[href]').toArray()
      .map(anchor => $(anchor).attr('href'));
  }
}

module.exports = DocumentExtractor;