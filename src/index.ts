import { checkProductAgainstCriteria } from './agent'
import { criteria } from './criteria'
import { models } from './models'

// ❯ npx tsx --env-file=.env src/index.ts

const model = models.gpt4oMini
const product = {
  id: 510,
  name: 'Super Mario Bros. Pixel Art NFT Collection',
  slug: 'super-mario-nft',
  permalink: 'https://example.com/super-mario-nft',
  description:
    'Exclusive NFT collection featuring iconic 8-bit pixel art from Super Mario Brothers. Each piece captures classic moments from the beloved video game series, including Mario, Luigi, Goombas, and more. Each NFT is uniquely tokenized on the blockchain with proof of ownership. Note: This is fan art and not officially licensed Nintendo content.',
  short_description:
    'Collectible NFT artwork featuring classic Super Mario Bros. pixel art. May contain nudity.',
}

// When running locally, prefer sync execution (e.g. for const of)
await Promise.all(
  Object.entries(criteria).map(async ([criterionId, criterion]) => {
    const result = await checkProductAgainstCriteria(criterion, product, model)
    console.log(
      criterionId,
      result.result.violates_criteria,
      result.result.reason
    )
    console.log('---')
    return { criterionId, result }
  })
)
