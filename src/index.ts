import minimist from 'minimist'

import { checkProductAgainstAllCriteria } from './agent'
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

// To check a site, run `npm start https://testsite.wpcomstaging.com`
// To show all violations, run `npm run show`

// The first argument is the base URL of the WC store
const args = minimist(process.argv.slice(2))
const baseUrl = args._[0]
const showViolations = args.show
const model = models.gpt4oMini

const db = createDatabase()

if (showViolations) {
  const allViolations = getAllSiteViolations(db)
  console.log(allViolations)
  process.exit(0)
}

const siteId = upsertSite(db, baseUrl)

const products = await fetchStoreProducts({ baseUrl })
products.forEach((product) => {
  upsertProduct(db, product, siteId)
})

const siteProducts = getSiteProducts(db, siteId)
console.log(siteProducts.map((p) => p.name))

for (const [index, product] of siteProducts.entries()) {
  if (!product.description) {
    continue
  }

  const productDbResults = getProductResults(db, product.id)
  if (productDbResults.length > 0) {
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
