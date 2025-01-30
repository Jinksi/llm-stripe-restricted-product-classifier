import minimist from 'minimist'

import { checkProductAgainstAllCriteria } from './llm'
import { models } from './models'
import { fetchStoreProducts } from './fetchProducts'
import {
  getProductResults,
  getSiteProducts,
  getAllSiteViolations,
  upsertProduct,
  upsertProductResult,
  upsertSite,
} from './db'
import { createDatabase } from './db'

// To just fetch products, run `npm start https://testsite.wpcomstaging.com -- --fetch`
// To check a site, run `npm start https://testsite.wpcomstaging.com`
// To check a site and force all products to be checked again, run `npm start https://testsite.wpcomstaging.com -- --force`
// To show all violations, run `npm run show`

/**
 * Remove the final slash from a URL
 */
const formatUrl = (url: string) => {
  let formattedUrl = url

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

// The first argument is the base URL of the WC store
const args = minimist(process.argv.slice(2))
const showViolations = args.show
const forceUpdate = args.force
const fetchOnly = args.fetch

const db = createDatabase()

const main = async (
  baseUrlArg: string,
  forceUpdate: boolean,
  fetchOnly: boolean
) => {
  const model = models.gpt4oMini
  const baseUrl = formatUrl(baseUrlArg)

  const siteId = upsertSite(db, baseUrl)

  const products = await fetchStoreProducts({ baseUrl })
  console.log(`Fetched ${products.length} products`)
  products.forEach((product) => {
    // TODO: ensure this updates the product if it already exists
    upsertProduct(db, product, siteId)
  })

  const siteProducts = getSiteProducts(db, siteId)
  console.log(siteProducts.map((p) => p.name))

  if (fetchOnly) {
    console.log('Done')
    process.exit(0)
  }

  for (const [index, product] of siteProducts.entries()) {
    if (!product.description) {
      console.log(
        `${index + 1}/${products.length} - Skipping product ${
          product.name
        } because it has no description`
      )
      continue
    }

    const productDbResults = getProductResults(db, product.id)
    if (!forceUpdate && productDbResults.length > 0) {
      console.log(
        `${index + 1}/${products.length} - Skipping product ${product.name}`
      )
      continue
    } else {
      console.log(
        `${index + 1}/${products.length} - Checking product ${product.name}`
      )
    }

    const results = await checkProductAgainstAllCriteria(product, model)
    const upsertedResults = Object.entries(results.results).map(
      ([criteriaKey, result]) => {
        const resultData = {
          ...result,
          criteria: criteriaKey,
        }
        return upsertProductResult(db, resultData, product.id)
      }
    )

    console.log(
      `Saved ${upsertedResults.length} results for product ${product.name}`
    )
  }
  console.log('Done')
}

if (showViolations) {
  // Show all violations for a site stored in the database
  const allViolations = getAllSiteViolations(db)
  console.log(allViolations)
  process.exit(0)
} else {
  // Fetch and check products
  main(args._[0], forceUpdate, fetchOnly)
}
