import type * as BetterSqlite3 from 'better-sqlite3'
import Database from 'better-sqlite3'

export type SQLiteDatabase = BetterSqlite3.Database
const dbLocation = './db/db.sqlite'

export const createDatabase = (): BetterSqlite3.Database => {
  const db: BetterSqlite3.Database = new Database(dbLocation)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      violation_status TEXT DEFAULT NULL,
      violation_summary TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      short_description TEXT,
      permalink TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      criteria TEXT NOT NULL,
      violates_criteria TEXT NOT NULL,
      reason TEXT NOT NULL,
      confidence REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      model_id TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `)

  return db
}

type Site = {
  id: number | bigint
  url: string
  violation_status?: string
  violation_summary?: string
}

type Product = {
  id: number
  site_id: number | bigint
  name: string
  description: string
  short_description?: string
  permalink: string
}

type Result = {
  id: number
  product_id: number | bigint
  criteria: string
  violates_criteria: boolean
  reason: string
  confidence?: number
  model_id: string
}

/**
 * Get a single site
 */
export const getSite = (db: SQLiteDatabase, url: string) => {
  return db
    .prepare<{ url: string }, Site>('SELECT * FROM sites WHERE url = @url')
    .get({ url })
}

export interface ViolationResult {
  url: string
  permalink: string
  name: string
  description: string
  criteria: string
  violates_criteria: string
  reason: string
  confidence: number
}

/**
 * Get all sites that have violations
 */
export const getAllSiteViolations = (db: SQLiteDatabase) => {
  return db
    .prepare<{}, ViolationResult>(
      `SELECT s.url, p.permalink, p.name, p.description, r.confidence, r.criteria, r.violates_criteria, r.reason
      FROM results as r
      JOIN products as p ON p.id = r.product_id
      JOIN sites as s ON s.id = p.site_id
      WHERE r.violates_criteria = 'true'`
    )
    .all({})
}

/**
 * Get all violations for a site
 */
export const getSiteViolationResults = (
  db: SQLiteDatabase,
  siteUrl: string
) => {
  return db
    .prepare<{}, ViolationResult>(
      `SELECT s.url, p.permalink, p.name, p.description, r.confidence, r.criteria, r.violates_criteria, r.reason
      FROM results as r
      JOIN products as p ON p.id = r.product_id
      JOIN sites as s ON s.id = p.site_id
      WHERE s.url = @siteUrl`
    )
    .all({ siteUrl })
}

/**
 * Upsert a site
 */
export const upsertSite = (db: SQLiteDatabase, url: string) => {
  const existingSite = getSite(db, url)
  if (existingSite) {
    return existingSite.id
  }

  return db.prepare(`INSERT INTO sites (url) VALUES (@url)`).run({ url })
    .lastInsertRowid
}

/**
 * Update a site's summary
 */
export const updateSiteSummary = (
  db: SQLiteDatabase,
  url: string,
  violationSummary: string,
  violationStatus: boolean
) => {
  const existingSite = getSite(db, url)
  if (!existingSite) {
    throw new Error(`Site ${url} not found`)
  }

  return db
    .prepare(
      `UPDATE sites SET violation_summary = @violationSummary, violation_status = @violationStatus WHERE url = @url`
    )
    .run({
      url,
      violationSummary,
      violationStatus: violationStatus ? 'true' : 'false',
    })
}

/**
 * Get a single product
 */
export const getProduct = (
  db: SQLiteDatabase,
  permalink: string,
  siteId: number | bigint
) => {
  return db
    .prepare<{ permalink: string; site_id: number | bigint }, Product>(
      `SELECT * FROM products WHERE permalink = @permalink AND site_id = @site_id`
    )
    .get({ permalink, site_id: siteId })
}

/**
 * Upsert a product
 */
export const upsertProduct = (
  db: SQLiteDatabase,
  productData: Omit<Product, 'id' | 'site_id'>,
  siteId: number | bigint
) => {
  const existingProduct = getProduct(db, productData.permalink, siteId)
  if (existingProduct) {
    return existingProduct.id
  }

  return db
    .prepare(
      `INSERT INTO products (site_id, name, description, short_description, permalink)
      VALUES (@site_id, @name, @description, @short_description, @permalink)`
    )
    .run({ ...productData, site_id: siteId }).lastInsertRowid
}

/**
 * Get all products for a site
 */
export const getSiteProducts = (
  db: SQLiteDatabase,
  siteId: number | bigint
) => {
  return db
    .prepare<{ site_id: number | bigint }, Product>(
      `SELECT * FROM products WHERE site_id = @site_id`
    )
    .all({ site_id: siteId })
}

/**
 * Get a product single criteria result
 */
export const getProductResult = (
  db: SQLiteDatabase,
  productId: number | bigint,
  criteria: string,
  modelId: string
) => {
  return db
    .prepare<
      { product_id: number | bigint; criteria: string; model_id: string },
      Result
    >(
      `SELECT * FROM results WHERE product_id = @product_id AND criteria = @criteria AND model_id = @model_id`
    )
    .get({ product_id: productId, criteria, model_id: modelId })
}

/**
 * Get all criteria results for a product
 */
export const getProductResults = (
  db: SQLiteDatabase,
  productId: number | bigint
) => {
  return db
    .prepare<{ product_id: number | bigint }, Result>(
      `SELECT * FROM results WHERE product_id = @product_id`
    )
    .all({ product_id: productId })
}

/**
 * Upsert a product criteria result
 */
export const upsertProductResult = (
  db: SQLiteDatabase,
  result: Omit<Result, 'id' | 'product_id'>,
  productId: number | bigint
) => {
  const existingResult = getProductResult(
    db,
    productId,
    result.criteria,
    result.model_id
  )

  const { criteria, violates_criteria, reason, confidence, model_id } = result

  if (existingResult) {
    return db
      .prepare(
        `UPDATE results
        SET violates_criteria = @violates_criteria,
            reason = @reason,
            confidence = @confidence
        WHERE product_id = @product_id
        AND criteria = @criteria
        AND model_id = @model_id`
      )
      .run({
        product_id: productId,
        criteria,
        violates_criteria: violates_criteria ? 'true' : 'false',
        reason,
        confidence,
        model_id,
      }).lastInsertRowid
  }

  return db
    .prepare(
      `INSERT INTO results (product_id, criteria, violates_criteria, reason, confidence, model_id)
      VALUES (@product_id, @criteria, @violates_criteria, @reason, @confidence, @model_id)`
    )
    .run({
      product_id: productId,
      criteria,
      violates_criteria: violates_criteria ? 'true' : 'false',
      reason,
      confidence,
      model_id,
    }).lastInsertRowid
}
