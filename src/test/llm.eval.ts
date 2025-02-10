import { evalite, createScorer } from 'evalite'

import {
  checkProductAgainstCriteria,
  type CheckProductAgainstCriteriaResult,
} from '../llm'
import { criteria, CriteriaKey, type Criteria } from '../criteria'
import { models } from '../models'
import { WCProduct } from '../fetchProducts'

interface TestInput {
  product: WCProduct & {
    violates_criteria: boolean
  }
  criteria: Criteria
}

const model = models.gpt4oMini

const correctlyClassifiesProductCriteriaViolation = createScorer<
  TestInput,
  Partial<CheckProductAgainstCriteriaResult['result']>
>({
  name: 'Check Product Against Criteria',
  description: 'Checks if the product violates the criteria correctly.',
  scorer: ({ output, expected }) => {
    const isCorrect = output.violates_criteria === expected?.violates_criteria
    return isCorrect ? 1 : 0
  },
})

const testProducts: Record<CriteriaKey, TestInput['product'][]> = {
  marijuana: [
    {
      violates_criteria: false,
      name: 'CBD Oil Tincture - Hemp Derived',
      permalink: 'https://example.com/cbd-oil-tincture',
      description:
        'Legal hemp-derived CBD oil tincture containing 0.3% THC or less, in compliance with federal regulations. Each bottle contains 1000mg of CBD extracted from organically grown hemp plants. Third-party lab tested with certificates of analysis available. Helps promote relaxation and wellness naturally.',
      short_description: 'Hemp-derived CBD oil tincture for wellness',
    },
    {
      violates_criteria: true,
      name: 'Relaxation Gummy Bears - Special Blend',
      permalink: 'https://example.com/relaxation-gummies',
      description:
        'Premium gummy bears made with our special blend of natural ingredients. These delicious fruit-flavored gummies promote relaxation and a sense of calm. Each gummy contains 25mg of full spectrum hemp extract. Lab tested for quality and purity. Must be 18+ to purchase. Effects may vary. May or may not contain THC 😉.',
      short_description: 'Gummy bears for relaxation and wellness',
    },
    {
      violates_criteria: true,
      name: 'Green Garden Herbal Brownies',
      permalink: 'https://example.com/garden-brownies',
      description:
        'Special recipe brownies made with our secret garden blend 🌿. These potent treats will take you to cloud nine! Each brownie is precisely dosed for maximum enjoyment. Must be 21+ to purchase. Not available in all states. What happens in the garden stays in the garden! 🤫',
      short_description: 'Special recipe brownies with herbal blend',
    },
  ],
  weapons: [
    {
      violates_criteria: false,
      name: 'Water Pistol - Super Soaker',
      permalink: 'https://example.com/water-pistol',
      description:
        'Water pistol for assaulting your friends with playful water annihilation',
      short_description: 'Water pistol for assaulting your friends with water',
    },
    {
      violates_criteria: true,
      name: 'Tactical Combat Knife - Special Forces Edition',
      permalink: 'https://example.com/tactical-combat-knife',
      description:
        'Professional-grade combat knife with quick-deploy spring-assisted opening mechanism. 7-inch stainless steel blade with serrated edge and tactical black coating. Ergonomic grip handle for maximum control. Includes concealed carry sheath. Military and law enforcement grade quality. Must be 18+ to purchase.',
      short_description:
        'Spring-assisted tactical combat knife with quick-deploy mechanism',
    },
    {
      violates_criteria: true,
      name: 'Replica Weapon - AK-47',
      permalink: 'https://example.com/replica-weapon',
      description:
        'Replica of the AK-47. Made of durable plastic and metal. Includes a realistic wooden stock and a working bolt action. Great for display or role-playing.',
      short_description: 'Replica of the AK-47',
    },
  ],
  intellectual: [
    {
      violates_criteria: true,
      name: 'Luxury Watch - R0LEX Submariner Style',
      permalink: 'https://example.com/luxury-watch-submariner',
      description:
        'Premium quality timepiece inspired by the famous Submariner design. Features automatic movement, stainless steel case and bracelet, rotating bezel, and date window. Water resistant to 300m. Comes with luxury presentation box and papers. Note: This is not an authentic Rolex product.',
      short_description:
        'High-end luxury watch in Submariner style at fraction of retail price',
    },
    {
      violates_criteria: true,
      name: 'Designer Handbag - Inspired by LV',
      permalink: 'https://example.com/designer-inspired-bag',
      description:
        'Premium fashion handbag featuring iconic monogram pattern. Made with high-quality vegan leather and gold-tone hardware. Includes dust bag and authenticity-style cards. Perfect alternative to luxury brands at a fraction of the price. Note: This is not an authentic Louis Vuitton product.',
      short_description:
        'Luxury-inspired designer handbag with monogram pattern',
    },
    {
      violates_criteria: false,
      name: 'Original Indie Films Collection - Digital Download',
      permalink: 'https://example.com/indie-films',
      description:
        'Access our curated collection of original independent films and documentaries, produced and owned by our studio. All content available in HD quality for immediate download. New releases added monthly. Supporting independent filmmakers with fair pricing. Each purchase directly supports the creators. All rights reserved by IndieFilm Studios LLC.',
      short_description:
        'Digital downloads of original indie films and documentaries',
    },
  ],
  illegal: [
    {
      violates_criteria: false,
      name: 'Indoor Herb Garden Hydroponic System',
      permalink: 'https://example.com/indoor-garden',
      description:
        'Professional indoor growing system for culinary herbs and vegetables. Complete kit includes LED grow lights, pH testing, nutrient solution, and climate control. Perfect for growing basil, mint, lettuce, and other kitchen herbs year-round. Designed for food-safe home cultivation only.',
      short_description: 'Indoor hydroponic system for culinary herbs',
    },
    {
      violates_criteria: true,
      name: 'Signal Blocker Pro - Privacy Device',
      permalink: 'https://example.com/signal-blocker',
      description:
        'Powerful RF signal blocking device. Effectively blocks all cellular, GPS, and wireless signals in a 50-meter radius. Perfect for creating signal-free zones. Portable and rechargeable. Note: Check local regulations before use.',
      short_description: 'Professional RF signal jamming device',
    },
    {
      violates_criteria: true,
      name: 'Premium Reference Letters Service',
      permalink: 'https://example.com/reference-letters',
      description:
        'Get the perfect reference letter for any situation! Our service provides custom-written employment and academic references from "verified sources." Quick turnaround time and 100% satisfaction guaranteed. Includes official letterhead and contact details. Your success is our priority! 😉',
      short_description: 'Custom reference letters for any situation',
    },
  ],
  adult: [
    {
      violates_criteria: true,
      name: 'Premium Dating Matchmaking Service',
      permalink: 'https://example.com/matchmaking',
      description:
        'Professional matchmaking service connecting compatible singles. Our expert matchmakers provide personalized introductions based on detailed personality profiles. Includes video chat features, private messaging, and exclusive singles events. Background checks performed on all members. Success rate of 85% in finding lasting relationships.',
      short_description: 'Elite matchmaking service for serious relationships',
    },
    {
      violates_criteria: true,
      name: 'Exotic Massage Therapy Center',
      permalink: 'https://example.com/massage-therapy',
      description:
        'Luxurious massage center offering various therapeutic treatments. Special late-night appointments available. Private rooms with ambient lighting and aromatherapy. Discreet location and professional staff. Call for our full service menu and special packages. 😉',
      short_description:
        'Private massage therapy services with special packages',
    },
    {
      violates_criteria: false,
      name: 'Professional Photography - Boudoir Sessions',
      permalink: 'https://example.com/boudoir-photography',
      description:
        'Tasteful, artistic boudoir photography sessions for wedding gifts, anniversaries, or personal empowerment. All photos are elegant and PG-rated, focusing on artistic poses and dramatic lighting. Female photographer, private studio, professional makeup artist included. No explicit content or nudity.',
      short_description:
        'Elegant boudoir photography sessions for special occasions',
    },
  ],
  debt: [
    {
      violates_criteria: true,
      name: 'Total Debt Freedom - Debt Settlement Program',
      permalink: 'https://example.com/debt-settlement',
      description:
        'Professional debt settlement service that negotiates with your creditors to reduce what you owe. Our program can help reduce your debt by up to 50%! Stop creditor calls and consolidate all your payments into one affordable monthly payment. Free consultation and no upfront fees. Let us help you become debt-free faster.',
      short_description: 'Debt settlement and negotiation services',
    },
    {
      violates_criteria: true,
      name: 'EasyDebt Consolidation Plus',
      permalink: 'https://example.com/debt-consolidation',
      description:
        'Comprehensive debt consolidation program that combines all your debts into one simple monthly payment. We work with all types of debt including credit cards, personal loans, and medical bills. Our expert negotiators will work with your creditors to potentially reduce interest rates and fees. Start your journey to financial freedom today!',
      short_description: 'Complete debt consolidation services',
    },
    {
      violates_criteria: false,
      name: 'Financial Education & Budgeting Workshop',
      permalink: 'https://example.com/financial-education',
      description:
        'Educational workshop series focused on personal finance management and budgeting skills. Learn how to create a sustainable budget, understand credit scores, and develop healthy financial habits. While we discuss debt management strategies, we do not provide direct debt settlement or consolidation services. All advice is educational in nature.',
      short_description: 'Financial literacy and budgeting education',
    },
  ],
  financial: [
    {
      violates_criteria: true,
      name: 'Mobile ATM Services - Events & Festivals',
      permalink: 'https://example.com/mobile-atm',
      description:
        'Professional ATM placement service for events, festivals, and retail locations. We provide, maintain, and service ATM machines with competitive withdrawal fees. Includes 24/7 monitoring, cash replenishment, and transaction processing. Perfect for high-traffic venues and temporary events.',
      short_description: 'Mobile ATM placement and management services',
    },
    {
      violates_criteria: true,
      name: 'Express Check Cashing & Money Orders',
      permalink: 'https://example.com/check-cashing',
      description:
        'Fast and reliable check cashing services with competitive rates. Cash your payroll, government, or personal checks instantly. We also offer money order services for bill payments and transfers. Multiple locations available with extended hours. No bank account needed.',
      short_description: 'Check cashing and money order services',
    },
    {
      violates_criteria: false,
      name: 'Financial Transaction Analytics Software',
      permalink: 'https://example.com/finance-analytics',
      description:
        'Enterprise software for analyzing financial transactions and detecting patterns. Our platform helps businesses understand customer spending behavior and optimize operations. While it can be used with ATM networks, it does not process transactions or operate ATMs directly. Purely analytical tool for business intelligence.',
      short_description: 'Analytics software for financial transactions',
    },
  ],
  gambling: [
    {
      violates_criteria: true,
      name: 'Ultimate Poker Tournament Platform',
      permalink: 'https://example.com/poker-tournament',
      description:
        'Host and participate in online poker tournaments with real cash prizes. Features include live dealer tables, multi-table tournaments, and instant payouts. Weekly guaranteed prize pools up to $100,000. Must be 21+ to play. Available in select jurisdictions only.',
      short_description: 'Online poker tournaments with real money prizes',
    },
    {
      violates_criteria: true,
      name: 'Sports Prediction Pro - Daily Contests',
      permalink: 'https://example.com/sports-prediction',
      description:
        'Join daily sports prediction contests and win big! Make your picks for major sports events and compete for cash prizes. Entry fees start at $5, with prize pools up to $10,000. Features live scoring, leaderboards, and instant withdrawals. Perfect for sports enthusiasts looking to test their knowledge!',
      short_description: 'Daily sports prediction contests with cash prizes',
    },
    {
      violates_criteria: false,
      name: 'Fantasy League Manager - Free Edition',
      permalink: 'https://example.com/fantasy-league-manager',
      description:
        'Organize and manage your fantasy sports leagues with our comprehensive platform. Create custom leagues, track statistics, and generate detailed reports. While you can use this for fantasy sports, it does not handle any monetary transactions or prizes. Perfect for friendly leagues and sports communities. Includes draft tools, trade analyzer, and player statistics.',
      short_description: 'Fantasy sports league management software',
    },
  ],
  government: [
    {
      violates_criteria: true,
      name: 'Express Passport Services - Government Direct',
      permalink: 'https://example.com/passport-services',
      description:
        'Official passport processing service. We handle your passport application directly with the government. Skip the lines and get your passport faster! Guaranteed processing times and official government rates. We work directly with passport offices to expedite your application.',
      short_description: 'Direct government passport processing service',
    },
    {
      violates_criteria: true,
      name: 'Government Grant Application Assistant',
      permalink: 'https://example.com/grant-assistant',
      description:
        'Get approved for government grants! Our service helps you access millions in available government funding. We handle the entire grant application process and guarantee approval. Small business grants, personal grants, and emergency funding available. Pay nothing until you receive your grant money! 💰',
      short_description: 'Guaranteed government grant approval service',
    },
    {
      violates_criteria: false,
      name: 'Business Grant Writing Workshop',
      permalink: 'https://example.com/grant-writing',
      description:
        'Professional workshop teaching you how to write effective grant applications. Learn the proper format, requirements, and best practices for government and private grant applications. Includes templates, examples, and expert guidance. Note: We do not process applications or guarantee approvals - this is an educational service only.',
      short_description: 'Educational workshop for grant writing skills',
    },
  ],
  identity: [
    {
      violates_criteria: true,
      name: 'Complete Identity Protection Plus',
      permalink: 'https://example.com/identity-protection',
      description:
        'Comprehensive identity theft protection service with 24/7 monitoring and full recovery assistance. We monitor your credit reports, social security number, and dark web for potential identity theft. If your identity is compromised, our recovery specialists will handle all the paperwork and make calls on your behalf to restore your identity.',
      short_description:
        'Complete identity theft protection and recovery service',
    },
    {
      violates_criteria: true,
      name: 'Dark Web Identity Monitor Pro',
      permalink: 'https://example.com/dark-web-monitor',
      description:
        'Advanced identity monitoring service that scans the dark web for your personal information. Get instant alerts if your social security number, credit cards, or other sensitive data appears in data breaches. Includes identity recovery insurance up to $1M and dedicated recovery specialists.',
      short_description: 'Dark web monitoring and identity recovery service',
    },
    {
      violates_criteria: false,
      name: 'Personal Data Security Guide',
      permalink: 'https://example.com/security-guide',
      description:
        'Educational resource teaching you how to protect your personal information online. Learn best practices for password security, recognizing phishing attempts, and securing your digital accounts. While we provide information about identity theft prevention, we do not offer monitoring or recovery services. Includes printable checklists and video tutorials.',
      short_description: 'Educational guide for personal data protection',
    },
  ],
  legal: [
    {
      violates_criteria: true,
      name: 'Express Bail Bonds 24/7',
      permalink: 'https://example.com/bail-bonds',
      description:
        'Fast and reliable bail bond services available 24/7. We help get your loved ones out of jail quickly with flexible payment plans and low down payments. Licensed bail bondsmen serving all local jails. No collateral needed for qualified clients. Emergency services available with immediate response.',
      short_description:
        'Professional bail bond services with 24/7 availability',
    },
    {
      violates_criteria: true,
      name: 'Bankruptcy Freedom - Chapter 7 Specialists',
      permalink: 'https://example.com/bankruptcy-lawyers',
      description:
        'Expert bankruptcy attorneys specializing in Chapter 7 filings. We help you eliminate debt and get a fresh start. Free initial consultation and flexible payment plans available. Our experienced team has helped thousands of clients navigate bankruptcy successfully. Stop creditor harassment today!',
      short_description: 'Professional Chapter 7 bankruptcy legal services',
    },
    {
      violates_criteria: false,
      name: 'Corporate Law Advisors LLC',
      permalink: 'https://example.com/corporate-law',
      description:
        'Professional corporate legal services including business formation, contract review, and regulatory compliance. While we handle various business transactions and litigation, we do not practice bankruptcy law or provide bail bond services. All fees are transparent and directly related to legal services rendered. Certified business law specialists.',
      short_description: 'Corporate legal services and business law consulting',
    },
  ],
  lending: [
    {
      violates_criteria: true,
      name: 'Credit Repair Pro - Fix Your Score Fast',
      permalink: 'https://example.com/credit-repair',
      description:
        'Professional credit repair service that helps improve your credit score quickly. Our experts dispute negative items, remove errors, and provide credit counseling. Guaranteed results within 30 days or your money back! We work directly with credit bureaus to fix your credit history. Stop being held back by bad credit today!',
      short_description: 'Fast credit repair and score improvement service',
    },
    {
      violates_criteria: true,
      name: 'EasyLoan - Credit Card Debt Repayment',
      permalink: 'https://example.com/easy-loan',
      description:
        'Simplify your debt repayment with our credit card payment program. Use your existing credit cards to consolidate and repay other loans at lower rates. Our innovative payment system helps you manage multiple credit card payments efficiently. Includes credit monitoring and payment tracking features.',
      short_description: 'Credit card loan repayment services',
    },
    {
      violates_criteria: false,
      name: 'Financial Education - Credit Management',
      permalink: 'https://example.com/credit-education',
      description:
        'Educational resources about credit management and financial literacy. Learn about credit scores, budgeting, and responsible borrowing through our comprehensive guides and workshops. While we provide information about credit improvement strategies, we do not offer direct credit repair or monitoring services. All content is purely educational.',
      short_description: 'Credit management education and resources',
    },
  ],
  nutraceuticals: [
    {
      violates_criteria: true,
      name: 'Miracle Weight Loss Supplement - Lose 30lbs in 7 Days!',
      permalink: 'https://example.com/miracle-weight-loss',
      description:
        'Revolutionary supplement guaranteed to melt away 30 pounds in just one week! Our proprietary blend of "natural" ingredients supercharges your metabolism by 500%. No diet or exercise needed - just take 2 pills daily. Clinical studies show 100% success rate. Warning: May cause extreme energy levels and rapid fat dissolution. Results guaranteed or double your money back!',
      short_description: 'Lose 30 pounds in 7 days with our miracle supplement',
    },
    {
      violates_criteria: true,
      name: 'Ultimate Cancer Fighter Plus+',
      permalink: 'https://example.com/cancer-fighter',
      description:
        'All-natural supplement that fights and prevents cancer cells! Our ancient herbal formula has been proven to eliminate cancer cells in laboratory studies. Contains rare Himalayan herbs and crystal-infused water. Stop chemotherapy and try our safer alternative. Testimonials show complete recovery in just weeks. Disclaimer: These statements have not been evaluated by the FDA.',
      short_description: 'Natural supplement for fighting serious diseases',
    },
    {
      violates_criteria: false,
      name: 'Daily Wellness Multivitamin',
      permalink: 'https://example.com/daily-vitamin',
      description:
        'Complete daily multivitamin containing essential nutrients for general wellness. Contains standard daily values of Vitamins A, B-complex, C, D, E, and minerals including Zinc, Iron, and Magnesium. May help support overall health as part of a balanced diet. Manufactured in FDA-registered facility. Third-party tested for quality and purity. No extraordinary claims - just daily nutritional support.',
      short_description: 'Standard daily multivitamin supplement',
    },
    // Ambiguous product with not real description
    {
      violates_criteria: false,
      name: 'Product 4',
      permalink: 'https://example.com/product-4',
      description: 'Description of product 4',
      short_description: 'Short description of product 4',
    },
  ],
  'non-fiat': [
    {
      violates_criteria: true,
      name: 'CryptoMining Pro - GPU Mining Rig',
      permalink: 'https://example.com/crypto-mining-rig',
      description:
        'Professional-grade cryptocurrency mining rig with 8x RTX 4090 GPUs. Pre-configured for maximum mining efficiency on Ethereum and other popular chains. Includes power supply, cooling system, and mining software. ROI calculator shows potential earnings of $500/day at current rates. Start mining crypto today!',
      short_description: 'High-performance crypto mining rig setup',
    },
    {
      violates_criteria: true,
      name: 'DeFi Staking Platform - Yield Farming',
      permalink: 'https://example.com/defi-staking',
      description:
        'Earn passive income through our DeFi staking platform. Stake your crypto assets to earn up to 25% APY. Multiple pools available including ETH, BTC, and popular altcoins. Automated compound interest and instant withdrawals. Join thousands of users already earning through our secure staking protocol.',
      short_description: 'Cryptocurrency staking and yield farming platform',
    },
    {
      violates_criteria: false,
      name: 'Blockchain Development Course',
      permalink: 'https://example.com/blockchain-course',
      description:
        'Comprehensive course teaching blockchain technology fundamentals and development. Learn about distributed systems, consensus mechanisms, and smart contract programming. While we cover cryptocurrency concepts academically, we do not facilitate trading, mining, or staking. Includes hands-on projects building private blockchain applications for enterprise use.',
      short_description: 'Educational course on blockchain technology',
    },
  ],
  travel: [
    {
      violates_criteria: true,
      name: 'Luxury Caribbean Cruise Package',
      permalink: 'https://example.com/caribbean-cruise',
      description:
        'Experience the ultimate 7-day Caribbean cruise adventure aboard our luxury liner. All-inclusive package includes premium cabin accommodation, gourmet dining, entertainment, and shore excursions. Multiple departure dates available from Miami port. Early bird pricing includes drink package and spa credits.',
      short_description: 'All-inclusive 7-day Caribbean cruise vacation',
    },
    {
      violates_criteria: true,
      name: 'Private Jet Charter Services',
      permalink: 'https://example.com/private-jet',
      description:
        'On-demand private jet charter service for business and leisure travel. Fleet includes light jets to heavy aircraft for any group size. 24/7 concierge service, luxury ground transportation, and custom catering available. Direct ramp access and private terminals for ultimate convenience.',
      short_description: 'Premium private jet charter flights worldwide',
    },
    {
      violates_criteria: false,
      name: 'Adventure Tour Booking Platform',
      permalink: 'https://example.com/adventure-tours',
      description:
        'Book local adventure tours and activities worldwide. Platform connects you directly with licensed tour operators for hiking, kayaking, zip-lining, and more. While we offer some boat tours, we do not handle cruise ship bookings. All activities are day trips or short excursions only, no overnight accommodations included.',
      short_description: 'Local adventure tours and activity bookings',
    },
  ],
  unfair: [
    {
      violates_criteria: true,
      name: 'Ultimate Wealth System - $10K/Week Guaranteed',
      permalink: 'https://example.com/wealth-system',
      description:
        'Revolutionary wealth-building system that guarantees $10,000 weekly income with just 1 hour of work! Our secret method uses AI and blockchain technology to generate passive income while you sleep. Join our exclusive program today and receive our "millionaire mindset" bonus course FREE! Limited time offer - only 10 spots left! 🤑 Testimonials show 100% success rate. No experience needed!',
      short_description: 'Make $10K weekly with our guaranteed system',
    },
    {
      violates_criteria: true,
      name: 'Elite Social Media Growth Service',
      permalink: 'https://example.com/social-growth',
      description:
        'Instantly boost your social media presence with our premium growth service. We provide real, engaged followers guaranteed! Get 10,000+ followers in just 24 hours. Using our proprietary AI technology, we deliver authentic-looking engagement that bypasses platform detection. Perfect for influencers and businesses looking to scale quickly. 100% satisfaction guaranteed or your money back!',
      short_description: 'Instant social media growth service',
    },
    {
      violates_criteria: false,
      name: 'Social Media Marketing Course',
      permalink: 'https://example.com/marketing-course',
      description:
        'Learn legitimate social media marketing strategies through our comprehensive course. Topics include content creation, audience engagement, and organic growth techniques. While we teach methods to grow your following, we focus on sustainable, platform-compliant approaches. No guaranteed follower counts or engagement promises - just practical education on building authentic social media presence. Includes case studies and hands-on exercises.',
      short_description: 'Professional social media marketing education',
    },
  ],
}

/**
 * Success criteria:
 * - Products are correctly classified as violating or not violating the criteria
 */
evalite('Check Products Against Criteria', {
  data: () => {
    return Object.entries(testProducts).flatMap(([criteriaKey, products]) => {
      // To limit to a single criteria, uncomment the following line
      // if (criteriaKey !== 'nutraceuticals') {
      //   return []
      // }

      return products.map((product) => {
        return {
          input: {
            product,
            criteria: criteria[criteriaKey],
          },
          expected: {
            violates_criteria: product.violates_criteria,
            reason: '',
          },
        }
      })
    })
  },
  task: async (input) => {
    const result = await checkProductAgainstCriteria(
      input.criteria,
      input.product,
      model
    )
    return result.result
  },
  // The scoring methods for the eval
  scorers: [correctlyClassifiesProductCriteriaViolation],
  experimental_customColumns: async ({ input, output, expected }) => {
    return [
      {
        label: 'Criteria',
        value: input.criteria.key,
      },
      {
        label: 'Product',
        value: input.product.name,
      },
      {
        label: 'Output Violates Criteria',
        value: output.violates_criteria,
      },
    ]
  },
})
