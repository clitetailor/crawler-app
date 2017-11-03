
function crawlChunk(links, addLinks) {
  return links.reduce((prev, next) => prev.then(prevLinks => {
    addLinks(prevLinks);
    return crawlLink(next);
  }), Promise.resolve());
}

function crawlLink(link) {
  const hostname = url.parse(link).hostname;

  return request(link).then(document => {
    const $ = cheerio.load(document);

    const newLinks = $('a[href]')
      .toArray()
      .map(anchorElement => $(anchorElement).attr('href'));

    return resolveLinks(hostname, newLinks);
  });
}

function resolveLinks(hostname, newLinks) {
  return newLinks.map(link => url.resolve(hostname, newLinks));
}

module.exports = crawlChunk;