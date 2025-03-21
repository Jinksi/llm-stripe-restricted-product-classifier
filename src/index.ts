import minimist from 'minimist'
import { text, spinner, log, note } from '@clack/prompts'
import color from 'picocolors'

import { checkProductAgainstAllCriteria, summariseSiteViolations } from './llm'
import { models } from './models'
import { fetchStoreProducts } from './fetchProducts'
import {
  getProductResults,
  getSiteProducts,
  getAllSiteViolations,
  upsertProduct,
  upsertProductResult,
  upsertSite,
  ViolationResult,
  getSiteViolationResults,
  updateSiteSummary,
} from './db'
import { createDatabase } from './db'
import type { CriteriaKey } from './criteria'

// To just fetch products, run `npm start https://testsite.wpcomstaging.com -- --fetch`
// To check a site, run `npm start https://testsite.wpcomstaging.com`
// To check a site and force all products to be checked again, run `npm start https://testsite.wpcomstaging.com -- --force`
// To show all violations, run `npm run show`

/**
 * Remove the final slash from a URL
 */
const formatUrl = (url: string) => {
  let formattedUrl = url.trim()

  // Remove the final slash from the URL
  formattedUrl = formattedUrl.endsWith('/')
    ? formattedUrl.slice(0, -1)
    : formattedUrl

  // If there is no http or https prefix, add https://
  formattedUrl = formattedUrl.startsWith('http')
    ? formattedUrl
    : `https://${formattedUrl}`

  // lowercase the URL
  formattedUrl = formattedUrl.toLowerCase()

  return formattedUrl
}

const db = createDatabase()
const s = spinner()

// The first argument is the base URL of the WC store
const args = minimist(process.argv.slice(2))
const showViolations = args.show

if (showViolations) {
  // Show all violations for a site stored in the database
  const allViolations = getAllSiteViolations(db)
  const byUrl = allViolations.reduce((acc, violation) => {
    acc[violation.url] = [...(acc[violation.url] || []), violation]
    return acc
  }, {} as Record<string, ViolationResult[]>)

  Object.entries(byUrl).forEach(([url, violations]) => {
    const title = `Site ${url}: ${violations.length} violations`
    const message = violations
      .map((violation) => {
        const confidence = Math.round(violation.confidence * 100)
        const confColor = confidence > 70 ? color.dim : color.yellow
        return `  ${violation.name}: ${color.bold(
          violation.criteria
        )} ${confColor(confidence)}%`
      })
      .join('\n')
    note(color.white(message), title)
  })

  process.exit(0)
}

const forceUpdate = args.force
const fetchOnly = args.fetch

const main = async (
  baseUrlArg: string,
  forceUpdate: boolean,
  fetchOnly: boolean
) => {
  log.info(`Checking products for ${baseUrlArg}`)
  fetchOnly && log.info('Fetching products only')
  forceUpdate && log.info('Forcing update')

  const model = models.gpt4oMini
  const baseUrl = formatUrl(baseUrlArg)

  const siteId = upsertSite(db, baseUrl)

  s.start('Fetching products')
  const products = await fetchStoreProducts({ baseUrl })
  s.stop(`Fetched ${products.length} products`)

  products.forEach((product) => {
    // TODO: ensure this updates the product if it already exists
    upsertProduct(db, product, siteId)
  })

  const siteProducts = getSiteProducts(db, siteId)

  if (fetchOnly) {
    log.success('Fetching products complete')
    process.exit(0)
  }

  const CHUNK_SIZE = 5 // Process 5 products at a time to avoid overwhelming the API
  const chunks = Array.from(
    { length: Math.ceil(siteProducts.length / CHUNK_SIZE) },
    (_, i) => siteProducts.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
  )

  let processedCount = 0
  for (const chunk of chunks) {
    s.start(
      `Processing ${processedCount + 1}-${Math.min(
        processedCount + chunk.length,
        siteProducts.length
      )} of ${siteProducts.length} products`
    )

    await Promise.all(
      chunk.map(async (product) => {
        if (!product.description && !product.name) {
          processedCount++
          return
        }

        const productDbResults = getProductResults(db, product.id)
        if (!forceUpdate && productDbResults.length > 0) {
          processedCount++
          return
        }

        const skipCriteria: CriteriaKey[] = [
          'adult',
          'debt',
          'financial',
          'government',
          'identity',
          'intellectual',
          'legal',
          'lending',
          'non-fiat',
          'nutraceuticals',
          'travel',
          'unfair',
          'weapons',
        ]

        const results = await checkProductAgainstAllCriteria(
          product,
          model,
          skipCriteria
        )

        const upsertedResults = Object.entries(results.results).map(
          ([criteriaKey, result]) => {
            const resultData = {
              ...result,
              criteria: criteriaKey,
            }
            return upsertProductResult(db, resultData, product.id)
          }
        )

        const violations = Object.entries(results.results)
          .filter(([criteriaKey, result]) => result.violates_criteria)
          .map(([criteriaKey, result]) => criteriaKey)

        if (violations.length > 0) {
          log.warn(
            `Product ${product.name} has ${
              violations.length
            } violations: ${violations.join(', ')}`
          )
        }

        processedCount++
      })
    )

    s.stop(`Completed ${processedCount} of ${siteProducts.length} products`)
  }

  const siteResultsInViolation = getSiteViolationResults(db, baseUrl).filter(
    (result) => result.violates_criteria === 'true'
  )
  if (siteResultsInViolation.length === 0) {
    log.info(`Site ${baseUrl} has no violations`)
    const summary = ''
    const violationStatus = false
    updateSiteSummary(db, baseUrl, summary, violationStatus)
  } else {
    const siteSummary = await summariseSiteViolations(
      baseUrl,
      model,
      // Only include results that violate a criteria
      siteResultsInViolation
    )
    log.warn(`Site ${baseUrl} has violations`)
    log.info(siteSummary.summary)
    updateSiteSummary(db, baseUrl, siteSummary.summary, siteSummary.violation)
  }

  log.success(`Completed checking products for ${baseUrl}`)
}

const url =
  args._[0] ??
  (await text({
    message: 'What url do you want to check?',
    placeholder: 'https://example.com',
    validate(value) {
      if (value.length === 0) return `Value is required!`
      const urlPattern =
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/
      if (!urlPattern.test(value)) return `Please enter a valid URL`
    },
  }))

// Fetch and check products
main(url, forceUpdate, fetchOnly)
