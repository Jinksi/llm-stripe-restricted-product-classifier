import fs from 'fs'
import minimist from 'minimist'

import { checkProductAgainstAllCriteria, ProductResults } from './agent'
import { models } from './models'
import { fetchStoreProducts } from './fetchProducts'

// npm start https://testsite.wpcomstaging.com

// The first argument is the base URL of the WC store
const args = minimist(process.argv.slice(2))
const baseUrl = args._[0]

const model = models.gpt4oMini

const products = await fetchStoreProducts({ baseUrl })

let allProductResults: Record<string, ProductResults> = {}

for (const [index, product] of products.entries()) {
  console.log(
    `Checking product ${product.name} (${index + 1} of ${products.length})`
  )
  const results = await checkProductAgainstAllCriteria(product, model)
  allProductResults[product.permalink] = results
}

fs.writeFileSync(
  'allProductResults.json',
  JSON.stringify(allProductResults, null, 2)
)
