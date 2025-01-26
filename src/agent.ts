import { z } from 'zod'
import { generateObject, LanguageModel } from 'ai'

import { criteria, type CriteriaKey, type Criteria } from './criteria'
import { type WCProduct } from './fetchProducts'

const schema = z.object({
  violates_criteria: z
    .boolean()
    .describe('Whether the product violates the criteria'),
  reason: z
    .string()
    .describe(
      'The reason why the product violates the criteria or why it does not'
    ),
})

export interface CheckProductAgainstCriteriaResult {
  result: z.infer<typeof schema>
  criteriaKey: CriteriaKey
  product: Pick<
    WCProduct,
    'name' | 'description' | 'short_description' | 'permalink'
  >
  modelId: string
  timestamp: string
}

export const checkProductAgainstCriteria = async (
  criteria: Criteria,
  product: WCProduct,
  model: LanguageModel
): Promise<CheckProductAgainstCriteriaResult> => {
  const { object, response } = await generateObject({
    model,
    schema,
    messages: [
      {
        role: 'system',
        content:
          'You are checking to see if a product is compliant with the criteria of a merchant. ' +
          'You will be given a product and a specific criteria. ' +
          'You will need to check the product against the criteria and return a boolean value. ' +
          'You will also need to provide a reason for your answer. ' +
          'The criteria is: ' +
          criteria.label +
          'The examples of products in violation of this criteria are: ' +
          criteria.examples,
      },
      {
        role: 'user',
        content: JSON.stringify({
          product: {
            name: product.name,
            description: product.description,
            short_description: product.short_description,
          },
        }),
      },
    ],
    maxRetries: 0, // skip default network retries, since this is local
  })

  return {
    modelId: response.modelId,
    timestamp: response.timestamp.toISOString(),
    result: object,
    criteriaKey: criteria.key,
    product: {
      name: product.name,
      description: product.description,
      short_description: product.short_description,
      permalink: product.permalink,
    },
  }
}

/**
 * @example
 * {
 *   product: {
 *     name: 'Product Name',
 *     description: 'Product Description',
 *     short_description: 'Product Short Description',
 *     permalink: 'https://example.com/product'
 *   },
 *   results: {
 *     'criteria-key': { violates_criteria: true, reason: 'Reason for violation' }
 *   }
 * }
 */
export interface ProductResults {
  product: CheckProductAgainstCriteriaResult['product']
  results: Record<
    CriteriaKey,
    {
      violates_criteria: boolean
      reason: string
      model_id: string
    }
  >
}

export const checkProductAgainstAllCriteria = async (
  product: WCProduct,
  model: LanguageModel
): Promise<ProductResults> => {
  const allCriteria = Object.values(criteria)
  const results = await Promise.all(
    allCriteria.map((criteria) =>
      checkProductAgainstCriteria(criteria, product, model)
    )
  )

  const productResults: ProductResults = {
    product: results[0].product,
    results: results.reduce<ProductResults['results']>((acc, result) => {
      acc[result.criteriaKey] = {
        ...result.result,
        model_id: result.modelId,
      }
      return acc
    }, {} as ProductResults['results']),
  }

  return productResults
}
