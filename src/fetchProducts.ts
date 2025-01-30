export type WCProduct = {
  /** Product name */
  name: string
  /** URL of the product */
  permalink: string
  /** Short description of the product, HTML */
  short_description?: string
  /** Description of the product, HTML */
  description: string
}

const productsEndpoints = '/wp-json/wc/store/v1/products'

const stripHTML = (html: string) => {
  return html.replace(/<[^>]*>?/gm, '')
}

export const processProduct = (product: WCProduct) => {
  return {
    ...product,
    short_description: stripHTML(product?.short_description || ''),
    description: stripHTML(product.description),
  }
}

/**
 * Fetch products from the WC store API and return them as an array of processed products
 *
 * @param baseUrl The base URL of the WC store, e.g. https://testsite.wpcomstaging.com
 * @returns WCProduct[] An array of processed products
 *
 * @example
 * ```ts
 * const products: WCProduct[] = await fetchStoreProducts({ baseUrl: 'https://testsite.wpcomstaging.com' })
 * ```
 */
export const fetchStoreProducts = async ({ baseUrl }: { baseUrl: string }) => {
  const response = await fetch(`${baseUrl}${productsEndpoints}?per_page=${25}`)
  const products = (await response.json()) as WCProduct[]
  return products.map(processProduct)
}
