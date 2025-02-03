An LLM-based system for determining whether a WooCommerce site's products violate Stripe's [Prohibited Businesses](https://stripe.com/au/legal/restricted-businesses#prohibited-businesses) policy.

It fetches merchant product data via the [WC Store API](https://developer.woocommerce.com/2022/03/25/store-api-is-now-considered-stable/) and checks it against Stripe's Restricted Businesses criteria.

`gpt-4o-mini` is used in a parallelised binary classification workflow, where each product is individually checked against restricted business categories through separate LLM calls. For each criterion, the system returns:

- `violates_criteria`: `true/false`
- `reason`: A reason for classification

Using parallel calls improves accuracy and reduces confusion for the LLM by ensuring each product is evaluated against a single restricted business criterion at a time. This structured approach prevents overlap between categories and allows for more precise classification results.

I'm using the [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction) for this prototype, which allowed me to easily swap models, including local models such as Qwen 2.5 Instruct, Llama 3.2 and a distilled Deepseek R1. Using `gpt-4o-mini` is preferable because it is cheap (I've used 0.26 USD in testing) and can be called in parallel, whereas my local models can only process requests serially.

Results are stored in a local SQLite database (`./db/db.sqlite`).

1. Add `OPENAI_API_KEY` to `.env` (see `.env.example`).
2. `npm install`
3. Run `npm run eval` to run model evaluation on test data.
4. Run `npm run eval:dev` to run model evaluation in watch mode.
5. Run `npm start example.com` to check a site's products against the criteria.
6. Run `npm run show` to see all detected violations.
