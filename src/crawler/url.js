import url from 'url'

export function preprocessUrl(siteUrl, options = {}) {
  const parsedUrl = url.parse(siteUrl)

  if (!options.search) {
    parsedUrl.search = ''
  }

  if (!options.query) {
    parsedUrl.query = ''
  }

  if (!options.hash) {
    parsedUrl.hash = ''
  }

  return url.format(parsedUrl)
}

export function addHttps(siteUrl) {
  if (!siteUrl.match(/^https?:\/\//)) {
    return `https://${siteUrl}`
  }

  return siteUrl
}
