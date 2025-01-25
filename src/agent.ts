import { z } from 'zod'
import { generateObject, LanguageModel } from 'ai'

import { type Criteria } from './criteria'

export interface WCProduct {
  id: number
  name: string
  slug: string
  permalink: string
  description: string
  short_description: string
}

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
  criteria: Criteria
  product: WCProduct
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
    criteria,
    product,
  }
}
