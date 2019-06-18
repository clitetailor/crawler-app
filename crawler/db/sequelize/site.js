import Sequelize from 'sequelize'

export function createSiteModel({ sequelize }) {
  class Site extends Sequelize.Model {}
  Site.init(
    {
      id: {
        primaryKey: true,
        allowNull: false,
        unique: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      url: { allowNull: false, type: Sequelize.TEXT },
      content: Sequelize.TEXT,
      pending: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    },
    { sequelize, tableName: 'site' }
  )

  return { Site }
}

export async function hasSiteTable({ sequelize }) {
  const result = await sequelize.query(`
    SELECT EXISTS (
      SELECT  1
      FROM    information_schema.tables
      WHERE   table_name = 'site'
    )
  `)

  return result[0][0].exists
}

export function createSiteTable({ queryInterface }) {
  return queryInterface.createTable('site', {
    id: {
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
      type: Sequelize.INTEGER
    },
    url: { allowNull: false, type: Sequelize.TEXT },
    content: Sequelize.TEXT,
    pending: {
      allowNull: false,
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      field: 'created_at'
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
      field: 'updated_at'
    }
  })
}

export async function hasSite(db, args) {
  const { Site } = db
  const { url } = args

  const site = await Site.findOne({
    where: {
      url
    }
  })

  return !!site
}

export async function createSite(db, args) {
  const { Site } = db
  const { url } = args

  await Site.create({
    url,
    pending: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

export async function shiftPendingSite(db) {
  const { Site } = db

  const [site] = await Site.findAll({
    where: {
      pending: true
    },
    limit: 1,
    order: [['createdAt', 'ASC']]
  })

  const {
    id,
    url,
    content,
    pending,
    createdAt,
    updatedAt
  } = site

  site.update({
    pending: false
  })

  return {
    id,
    url,
    content,
    pending,
    createdAt,
    updatedAt
  }
}

export async function updateSiteContent(db, args) {
  const { Site } = db
  const { url, content } = args

  await Site.update(
    {
      content
    },
    {
      where: {
        url
      }
    }
  )
}

export async function pendingSiteCount(db) {
  const { Site } = db

  return Site.count({
    where: {
      pending: true
    }
  })
}

export async function resolvedSiteCount(db) {
  const { Site } = db

  return Site.count({
    where: {
      pending: false
    }
  })
}

export async function totalSiteCount(db) {
  const { Site } = db

  return Site.count()
}
