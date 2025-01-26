import { evalite, createScorer } from 'evalite'

import {
  checkProductAgainstCriteria,
  type CheckProductAgainstCriteriaResult,
} from '../agent'
import { criteria, type Criteria } from '../criteria'
import { models } from '../models'
import { WCProduct } from '../fetchProducts'
interface TestInput {
  product: WCProduct
  criteria: Criteria
}

const model = models.gpt4oMini

const correctlyClassifiesProductCriteriaViolation = createScorer<
  TestInput,
  Pick<CheckProductAgainstCriteriaResult, 'result'>
>({
  name: 'Check Product Against Criteria',
  description: 'Checks if the product violates the criteria correctly.',
  scorer: ({ output, expected }) => {
    const isCorrect =
      output.result.violates_criteria === expected?.result.violates_criteria
    return isCorrect ? 1 : 0
  },
})

const testProducts = {
  relaxationGummies: {
    id: 5,
    name: 'Relaxation Gummy Bears - Special Blend',
    slug: 'relaxation-gummies',
    permalink: 'https://example.com/relaxation-gummies',
    description:
      'Premium gummy bears made with our special blend of natural ingredients. These delicious fruit-flavored gummies promote relaxation and a sense of calm. Each gummy contains 25mg of full spectrum hemp extract. Lab tested for quality and purity. Must be 18+ to purchase. Effects may vary. May or may not contain THC 😉.',
    short_description: 'Gummy bears for relaxation and wellness',
  },
  waterPistol: {
    id: 509,
    name: 'Water Pistol - Super Soaker',
    slug: 'water-pistol',
    permalink: 'https://example.com/water-pistol',
    description:
      'Water pistol for assaulting your friends with playful water annhiliation',
    short_description: 'Water pistol for assaulting your friends with water',
  },
  tacticalCombatKnife: {
    id: 509,
    name: 'Tactical Combat Knife - Special Forces Edition',
    slug: 'tactical-combat-knife',
    permalink: 'https://example.com/tactical-combat-knife',
    description:
      'Professional-grade combat knife with quick-deploy spring-assisted opening mechanism. 7-inch stainless steel blade with serrated edge and tactical black coating. Ergonomic grip handle for maximum control. Includes concealed carry sheath. Military and law enforcement grade quality. Must be 18+ to purchase.',
    short_description:
      'Spring-assisted tactical combat knife with quick-deploy mechanism',
  },
  toyReplicaWeapon: {
    id: 509,
    name: 'Replica Weapon - AK-47',
    slug: 'replica-weapon',
    permalink: 'https://example.com/replica-weapon',
    description:
      'Replica of the AK-47. Made of durable plastic and metal. Includes a realistic wooden stock and a working bolt action. Great for display or role-playing.',
    short_description: 'Replica of the AK-47',
  },
  fakeRolex: {
    id: 510,
    name: 'Luxury Watch - R0LEX Submariner Style',
    slug: 'luxury-watch-submariner',
    permalink: 'https://example.com/luxury-watch-submariner',
    description:
      'Premium quality timepiece inspired by the famous Submariner design. Features automatic movement, stainless steel case and bracelet, rotating bezel, and date window. Water resistant to 300m. Comes with luxury presentation box and papers. Note: This is not an authentic Rolex product.',
    short_description:
      'High-end luxury watch in Submariner style at fraction of retail price',
  },
}

evalite('Check Products Against Criteria', {
  data: () => {
    return [
      {
        input: {
          product: testProducts.relaxationGummies,
          criteria: criteria['marijuana'],
        },
        expected: {
          criteria: criteria['marijuana'],
          result: {
            violates_criteria: true,
            reason: 'Contains THC',
          },
        },
      },
      {
        input: {
          product: testProducts.tacticalCombatKnife,
          criteria: criteria['weapons'],
        },
        expected: {
          criteria: criteria['weapons'],
          result: {
            violates_criteria: true,
            reason: 'Contains weapons',
          },
        },
      },
      {
        input: {
          product: testProducts.tacticalCombatKnife,
          criteria: criteria['marijuana'],
        },
        expected: {
          criteria: criteria['marijuana'],
          result: {
            violates_criteria: false,
            reason: 'Does not contain THC',
          },
        },
      },
      {
        input: {
          product: testProducts.waterPistol,
          criteria: criteria['weapons'],
        },
        expected: {
          criteria: criteria['weapons'],
          result: {
            violates_criteria: false,
            reason: 'Does not contain weapons',
          },
        },
      },
      {
        input: {
          product: testProducts.toyReplicaWeapon,
          criteria: criteria['weapons'],
        },
        expected: {
          criteria: criteria['weapons'],
          result: {
            violates_criteria: true,
            reason: 'Contains a replica of a weapon',
          },
        },
      },
      {
        input: {
          product: testProducts.fakeRolex,
          criteria: criteria['intellectual'],
        },
        expected: {
          criteria: criteria['intellectual'],
          result: {
            violates_criteria: true,
            reason: 'Infringes on intellectual property rights',
          },
        },
      },
    ]
  },
  task: async (input) => {
    return checkProductAgainstCriteria(input.criteria, input.product, model)
  },
  // The scoring methods for the eval
  scorers: [correctlyClassifiesProductCriteriaViolation],
  experimental_customColumns: async ({ input, output, expected }) => {
    return [
      {
        label: 'Product',
        value: input.product.name,
      },
      {
        label: 'Criteria',
        value: input.criteria.label,
      },
      {
        label: 'Output Violates Criteria',
        value: output.result.violates_criteria,
      },
      {
        label: 'Output Reason',
        value: output.result.reason,
      },
    ]
  },
})
