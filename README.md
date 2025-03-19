An LLM-based system for determining whether a WooCommerce site's products violate Stripe's [Prohibited Businesses](https://stripe.com/au/legal/restricted-businesses#prohibited-businesses) policy.

It fetches merchant product data via the [WC Store API](https://developer.woocommerce.com/2022/03/25/store-api-is-now-considered-stable/) and checks it against Stripe's Restricted Businesses criteria.

`gpt-4o-mini` is used in a parallelised binary classification workflow, where each product is individually checked against restricted business categories through separate LLM calls. For each criterion, the system returns:

- `violates_criteria`: `true/false`
- `reason`: A reason for classification

Using parallel calls improves accuracy and reduces confusion for the LLM by ensuring each product is evaluated against a single restricted business criterion at a time. This structured approach prevents overlap between categories and allows for more precise classification results.

I'm using the [Vercel AI SDK](https://sdk.vercel.ai/docs/introduction) for this prototype, which allowed me to easily swap models, including local models such as Qwen 2.5 Instruct, Llama 3.2 and a distilled Deepseek R1. Using `gpt-4o-mini` is preferable because it is cheap (I've used 0.26 USD in testing) and can be called in parallel, whereas my local models can only process requests serially.

Results are stored in a local SQLite database (`./db/db.sqlite`).

## Setup and usage

1. Add `OPENAI_API_KEY` to `.env` (see `.env.example`).
2. `npm install`
3. Run `npm run eval` to run model evaluation on test data.
4. Run `npm run eval:dev` to run model evaluation in watch mode.
5. Run `npm start example.com` to check a site's products against the criteria.
6. Run `npm run check-csv-accounts ./csv/accounts.csv` to check a list of sites from a CSV file. Each CSV must have a column called `url` for the site URL.
7. Run `npm run show` to see all detected violations.
8. Run `npm run export` to export a CSV file of all products with their violations and reasoning. Also exports a CSV of all sites with violation status and summary.

## Using LLM agents to query the SQLite database using Model Context Protocol

Using [Model Context Protocol](https://modelcontextprotocol.io) (MCP), you can ask LLMs to query the database containing product violation classification results using natural language.

It can also be a quick way to create an SQL query for later use – I used MCP to create the SQL query in `./bin/export_products.sh`.

Note: [`uv`](https://docs.astral.sh/uv/getting-started/installation/) and `npm/npx` are required to be installed.

### [Cursor](https://docs.cursor.com/advanced/model-context-protocol#using-mcp-tools-in-composer)

- Clone the [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) repo to your computer
- Navigate to Cursor Settings → Features → MCP Servers
- Add a new MCP server
  - Name: `sqlite-product-violations`
  - Type: `command`
  - Command: `uv --directory /PATH_TO/mcp-servers/src/sqlite run mcp-server-sqlite --db-path /PATH/TO/stripe-restricted-product-classifier/db/db.sqlite`
- Click refresh and ensure the tools load correctly
- In a new Composer chat, with `agent` selected, ask questions about your database.
- Cursor will ask to confirm each tool use command

**Example conversation using Cursor and Claude 3.5 Sonnet:**

```
Input: Please show me a list of all the sites with a product violation

Output:
I'll create a query that joins the `sites`, `products`, and `results` tables to show sites that have products with violations. I'll get sites where `violates_criteria` indicates a violation.

Ran tool

Let me get more detailed information about the specific products and their violations:

Ran tool

Based on the database query results, here's what I found:

1. There is one site with product violations: `https://example.se`
2. This site has 3 products that violate the criteria
3. All violations are categorized as "illegal"
4. The violating products are all different varieties of ZZZ:
   - Example Product 1
   - Example Product 2
   - Example Product 3

All products were flagged because ZZ is considered a controlled substance in many jurisdictions. The evaluation model consistently identified these products as potentially illegal substances, noting their psychoactive properties and potential for abuse, despite some product descriptions suggesting they are for non-consumable use.

Would you like any additional information about specific products or their violation details?
```

### [Goose CLI](https://block.github.io/goose/docs/)

- Clone the [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) repo to your computer
- Edit `~/.config/goose/config.yaml` and add the following under `extensions`, updating paths:

  ```yaml
  sqlite-product-violations:
    args:
      - --directory
      - /PATH/TO/mcp-servers/src/sqlite
      - run
      - mcp-server-sqlite
      - --db-path
      - /PATH/TO/stripe-restricted-product-classifier/db/db.sqlite
    cmd: uv
    enabled: true
    envs: {}
    name: sqlite-product-violations
    type: stdio
  ```

  - This can also be achieved by running `goose configure → Add Extension → Command-line Extension`

- Now ask questions about the database. Goose will run a few SQL queries using the MCP SQLITE tools.

**Example conversation using Goose and GPT-4o:**

```
Input: Show me the sites with violations, and a reason for the violation.

... goose runs list_tables, describe_table, read_query ...

Output:
Here are the sites with violations and the reasons for those violations:

1. **Site:** [example](https://www.example.se)
   - **Reason:** Several products related to "ZZZ" are listed. ZZZ is often associated with illegal substances and is considered a controlled substance in many jurisdictions. Consequently, its sale can violate criteria related to illegal products and services.
```
