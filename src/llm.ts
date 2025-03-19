import { z } from 'zod'
import { generateObject, LanguageModel } from 'ai'

import { criteria, type CriteriaKey, type Criteria } from './criteria'
import { type WCProduct } from './fetchProducts'
import { ViolationResult } from './db'

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
  confidence: number
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
  const { object, response, logprobs } = await generateObject({
    model,
    schema,
    temperature: 0, // Greedy sampling, only use the most likely token
    messages: [
      {
        role: 'system',
        content:
          'You are checking to see if a product is compliant with the criteria of a merchant. ' +
          'You will be given a product and a specific criteria. ' +
          'You will need to check the product against the criteria and return a boolean value. ' +
          'You will also need to provide a reason for your answer. ' +
          'If there is not enough information to make a determination, you should return false. ' +
          'The criteria is: ' +
          `<criteria>${criteria.label}</criteria>` +
          'The examples of products in violation of this criteria are: ' +
          `<examples>${criteria.examples}</examples>`,
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

  // Find the logprob for the "true" or "false" value token.
  const trueOrFalseLogprob = logprobs?.find(
    (item) => item.token === String(object.violates_criteria)
  )

  // Calculate the confidence as the exponential of the logprob to get the probability.
  const confidence = trueOrFalseLogprob
    ? Math.exp(trueOrFalseLogprob.logprob)
    : 0

  return {
    modelId: response.modelId,
    timestamp: response.timestamp.toISOString(),
    result: object,
    criteriaKey: criteria.key,
    confidence,
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
      confidence: number
      model_id: string
    }
  >
}

/**
 * Check a product against all criteria except the ones specified in `criteriaKeysToOmit`.
 */
export const checkProductAgainstAllCriteria = async (
  product: WCProduct,
  model: LanguageModel,
  criteriaKeysToOmit: CriteriaKey[] = []
): Promise<ProductResults> => {
  const allCriteria = Object.values(criteria).filter(
    (criteria) => !criteriaKeysToOmit.includes(criteria.key)
  )
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
        confidence: result.confidence,
      }
      return acc
    }, {} as ProductResults['results']),
  }

  return productResults
}

/**
 * Gets a list of violations for a site and summarises the site's compliance using an LLM.
 */
export const summariseSiteViolations = async (
  siteUrl: string,
  model: LanguageModel,
  violationResults: ViolationResult[]
): Promise<{
  /** The URL of the site */
  siteUrl: string
  /** A summary of the site's compliance */
  summary: string
  /** Whether the site has any violations */
  violation: boolean
}> => {
  const { object } = await generateObject({
    model,
    schema: z.object({
      summary: z.string().describe("A summary of the site's compliance"),
      violation: z
        .boolean()
        .describe(
          'Whether the site has any violations. True if there are any violations, false otherwise.'
        ),
    }),
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant that summarises the violations of a merchant. ' +
          'You will be given a list of violations and a reason for each violation. ' +
          'You will need to summarise the violations and provide a reason for the violations. ' +
          'If no violations are found, you should return false with an empty summary. ',
      },
      {
        role: 'user',
        content:
          violationResults.length > 0
            ? `<violation-results>${violationResults
                .map(
                  (v) =>
                    `${v.criteria} ${
                      v.violates_criteria ? 'violates' : 'does not violate'
                    } : ${v.reason}`
                )
                .join('\n')}</violation-results>`
            : 'This site has no violations.',
      },
    ],
  })

  return {
    siteUrl,
    summary: object.summary,
    violation: object.violation,
  }
}
