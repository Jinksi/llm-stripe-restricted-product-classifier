/**
 * Criteria for Stripe's Restricted Businesses policy.
 *
 * @see https://stripe.com/au/legal/restricted-businesses#prohibited-businesses
 */
export type CriteriaKey =
  | 'illegal'
  | 'adult'
  | 'debt'
  | 'financial'
  | 'gambling'
  | 'government'
  | 'identity'
  | 'intellectual'
  | 'legal'
  | 'lending'
  | 'marijuana'
  | 'nutraceuticals'
  | 'non-fiat'
  | 'travel'
  | 'unfair'
  | 'weapons'

export interface Criteria {
  key: CriteriaKey
  label: string
  examples: string
}

export const criteria: Record<CriteriaKey, Criteria> = {
  illegal: {
    key: 'illegal',
    label: 'Any illegal products and services',
    examples: `
* Illegal drugs, substances designed to mimic illegal drugs, including kava
* Equipment and items intended to be used for making or using drugs
* Fake references or ID-providing services
* Telecommunications manipulation equipment, including jamming devices
* Businesses that engage in, encourage, promote, or celebrate unlawful violence or physical harm to persons or property
* Businesses that engage in, encourage, promote, or celebrate unlawful violence toward any group based on race, religion, disability, gender, sexual orientation, national origin, or any other immutable characteristic
* Any other products or services that are in violation of law in the jurisdictions where your business is located or to which your business is targeted
`,
  },
  adult: {
    key: 'adult',
    label: 'Adult content and services',
    examples: `
* Adult services, including prostitution, escorts, pay-per-view, sexual massages, fetish services, mail-order brides, and adult live-chat features
* Adult video stores
* Gentleman’s clubs, topless bars, and strip clubs
* All online dating services, including matchmakers
* Pornography and other mature-audience content (including literature, imagery, and other media) depicting nudity or explicit sexual acts
* Any artificial intelligence–generated content that meets the above criteria
`,
  },
  debt: {
    key: 'debt',
    label: 'Debt relief companies',
    examples: `
* Debt settlement, debt negotiation, and debt consolidation
`,
  },
  financial: {
    key: 'financial',
    label: 'The following financial products and services',
    examples: `
* ATMs 
* Cheque cashing
* Debt collection agencies
* Funded prop trading
* Money orders and traveller’s cheques 
* Payable-through accounts
* Peer-to-peer money transmission
* Selling bearer shares
* Shell banks
`,
  },
  gambling: {
    key: 'gambling',
    label: 'Gambling',
    examples: `
* Games of chance including gambling, internet gambling, casino games, sweepstakes and contests, and fantasy sports leagues with a monetary or material prize
* Games of skill including video game and mobile game tournaments or competitions, darts, card games, and board games with a monetary or material prize
* Payments of an entry or player fee that promise the entrant or player will win a prize of value
* Sports forecasting or odds-making with a monetary or material prize
* Lotteries
* Bidding fee auctions
`,
  },
  government: {
    key: 'government',
    label: 'Government services',
    examples: `
* Offering products and services by or on behalf of embassies and consulates
* Offering government services without authorisation or value-add 
* Offering government services with misleading claims
* Disbursement of government economic support, such as grants
`,
  },
  identity: {
    key: 'identity',
    label: 'Identity services',
    examples: `
* Identity theft protection, services including monitoring and recovery
`,
  },
  intellectual: {
    key: 'intellectual',
    label:
      'Products and services that infringe on intellectual property rights',
    examples: `
* Sales or distribution of music, movies, software, or any other licensed materials without appropriate authorisation
* Counterfeit goods
* Illegally imported or exported products
* Unauthorised sale of brand-name or designer products or services
* Any other products or services that directly infringe or facilitate infringement upon the trademark, patent, copyright, trade secrets, proprietary, or privacy rights of any third party
`,
  },
  legal: {
    key: 'legal',
    label: 'The following legal services',
    examples: `
* Bankruptcy lawyers
* Bail bonds
* Law firms collecting funds for purposes other than legal service fee payment
`,
  },
  lending: {
    key: 'lending',
    label: 'Lending and credit',
    examples: `
* Loan repayments with credit cards
* Credit monitoring, credit repair, and counselling services
`,
  },
  marijuana: {
    key: 'marijuana',
    label: 'Marijuana',
    examples: `
* Cannabis products 
* Cannabis dispensaries and related businesses
* CBD products with THC levels greater than the applicable local jurisdiction’s legal limit, including CBD edibles
* Hydroponic equipment and other cultivation or production equipment marketed for growing marijuana
* Courses and information on cultivating marijuana
`,
  },
  nutraceuticals: {
    key: 'nutraceuticals',
    label: 'Nutraceuticals and pseudo-pharmaceuticals',
    examples: `
* Pseudo-pharmaceuticals or nutraceuticals that are not safe or make harmful claims
`,
  },
  'non-fiat': {
    key: 'non-fiat',
    label: 'Non-fiat currency',
    examples: `
* Cryptocurrency mining and staking
* Initial coin offerings (ICOs)
* Secondary NFT sales
`,
  },
  travel: {
    key: 'travel',
    label: 'Travel',
    examples: `
* Commercial airlines and cruises
* Charter and private airlines
* Timeshare services
`,
  },
  unfair: {
    key: 'unfair',
    label: 'Unfair, deceptive, or abusive acts or practices',
    examples: `
* Pyramid schemes
* Multi-level marketing services offering commission or recruitment-based sales
* “Get rich quick” schemes, including investment opportunities or other services that promise high rewards to mislead consumers; schemes that claim to offer high rewards for very little effort or up-front work; and sites that promise fast and easy money
* Businesses that make outrageous claims, use deceptive testimonials, use high-pressure upselling, or use fake testimonials (with or without a written contract) 
* Businesses offering unrealistic incentives or rewards as an inducement to purchase products or services 
* No-value-added services, including the sale or resale of a service without added benefit to the buyer and resale of government offerings without authorisation or added value
* Sales of online traffic or engagement
* Negative option marketing, negative option membership clubs, and reduced price trials with unclear or hidden pricing 
* Telemarketing
* Predatory mortgage consulting 
* Predatory investment opportunities with no or low money down
`,
  },
  weapons: {
    key: 'weapons',
    label: 'Weapons, firearms, explosives, and dangerous materials',
    examples: `
* Guns, gunpowders, ammunitions, fireworks, and other explosives
* Weapon components such as firing pins, magazines, clips, and firearm conversion kits and any 3D-printed weapons
* Improperly marked replicas of modern firearms, including toys
* Pepper spray and stun guns
* Swords and katanas, unless they are meant as replicas or for the practice of martial arts
* Machetes
* Disguised knives and knives with opening mechanisms designed for quick deployment of a blade
* Pesticides requiring application by a certified professional 
* Research chemicals 
* Toxic, flammable, combustible, or radioactive materials
* Prohibited and restricted goods for postage, per the United States Postal Service
`,
  },
}
