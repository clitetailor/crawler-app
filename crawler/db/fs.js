const filenamify = require('filenamify')
const fs = require('fs-extra')
const path = require('path')
const yaml = require('js-yaml')

class FileStore {
  constructor(options = {}) {
    this.sites = options.sites || new Set()
    this.queue = options.queue || []

    this.siteDir = options.siteDir
    this.cacheFile = options.cacheFile
  }

  static init(options = {}) {
    const fileStore = new FileStore({})

    fileStore.setOutputDirectory(options.output || 'output')

    return fileStore
  }

  async load() {
    const cacheFile = this.cacheFile

    if (!(await fs.exists(cacheFile))) {
      return
    }

    const textData = await fs.readFile(cacheFile)
    const data = yaml.safeLoad(textData)

    if (data) {
      const sites = new Set(data.sites)
      const queue = data.queue

      this.sites = sites
      this.queue = queue
    }
  }

  async save() {
    const cacheFile = this.cacheFile
    const queue = this.queue
    const sites = Array.from(this.sites)

    await fs.ensureFile(cacheFile)

    return fs.writeFile(
      cacheFile,
      yaml.safeDump({
        queue,
        sites
      })
    )
  }

  setOutputDirectory(dir) {
    const cwd = process.cwd()

    this.siteDir = path.resolve(cwd, dir, 'sites')
    this.cacheFile = path.resolve(cwd, dir, 'cache.yaml')
  }

  async addUrl(siteUrl) {
    if (!this.sites.has(siteUrl)) {
      this.queue.push(siteUrl)
      this.sites.add(siteUrl)

      return true
    }

    return false
  }

  async addUrls(siteUrls) {
    for (const siteUrl of siteUrls) {
      this.addUrl(siteUrl)
    }
  }

  async shiftUrl() {
    return this.queue.shift()
  }

  async saveSiteContent(siteUrl, content) {
    const siteDir = this.siteDir

    const matchGroup = siteUrl.match(/^https?:\/\/(.+)/)
    const relativePath = matchGroup && matchGroup[1]

    if (relativePath) {
      const filenamified = filenamify(relativePath)

      const storePath = path.resolve(siteDir, filenamified)

      await fs.ensureFile(storePath)
      await fs.writeFile(storePath, content)
    }
  }

  async pendingSiteCount() {
    return this.queue.length
  }

  async resolvedSiteCount() {
    return this.sites.size
  }

  async totalSiteCount() {
    const pending = await this.pendingSiteCount()
    const resolved = await this.resolvedSiteCount()

    return pending + resolved
  }
}

module.exports = {
  FileStore
}
