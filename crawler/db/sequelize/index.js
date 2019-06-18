const Sequelize = require('sequelize')
const {
  createSiteModel,
  hasSiteTable,
  createSiteTable,
  hasSite,
  createSite,
  updateSiteContent,
  shiftPendingSite,
  pendingSiteCount,
  resolvedSiteCount,
  totalSiteCount
} = require('./site')

class SequelizeStore {
  constructor(options = {}) {
    this.db = options.db
  }

  static init(options = {}) {
    const sequelize = new Sequelize(
      options.database,
      options.username,
      options.password,
      {
        timestamps: false,
        dialect: options.dialect,
        logging: false,
        ...(options.host ? { host: options.host } : {}),
        ...(options.port ? { port: options.port } : {}),
        define: {
          underscored: true,
          freezeTableName: true
        }
      }
    )

    const queryInterface = sequelize.getQueryInterface()

    const models = [createSiteModel]
      .map(fn => fn({ sequelize }))
      .reduce((all, next) => ({ ...all, ...next }), {})

    const seqStore = new SequelizeStore({
      db: {
        sequelize,
        queryInterface,
        ...models
      }
    })

    return seqStore
  }

  async load() {
    await this.db.sequelize.authenticate()

    const siteTableExists = await hasSiteTable(this.db)

    if (!siteTableExists) {
      await createSiteTable(this.db)
    }
  }

  async save() {}

  async addUrl(siteUrl) {
    if (!(await hasSite(this.db, { url: siteUrl }))) {
      await createSite(this.db, {
        url: siteUrl
      })
    }
  }

  async addUrls(siteUrls) {
    for (const siteUrl of siteUrls) {
      await this.addUrl(siteUrl)
    }
  }

  async shiftUrl() {
    const site = await shiftPendingSite(this.db)

    return site.url
  }

  async saveSiteContent(siteUrl, content) {
    return updateSiteContent(this.db, {
      url: siteUrl,
      content
    })
  }

  async pendingSiteCount() {
    return pendingSiteCount(this.db)
  }

  async resolvedSiteCount() {
    return resolvedSiteCount(this.db)
  }

  async totalSiteCount() {
    return totalSiteCount(this.db)
  }
}

module.exports = {
  SequelizeStore
}
