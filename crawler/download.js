import axios from 'axios'

export async function downloadSite(siteUrl) {
  const payload = await axios({
    method: 'GET',
    url: encodeURI(siteUrl),
    headers: {
      'Content-Type': 'application/html'
    }
  })

  return payload.data
}
