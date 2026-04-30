// Re-export from the shared Shopify service
// Same API as the React Native app — just runs in the browser

const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const TOKEN        = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;
const API_URL      = `https://${STORE_DOMAIN}/api/2024-01/graphql.json`;

async function shopifyFetch<T>(query: string, variables?: object): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export interface ShopifyProduct {
  id: string; title: string; description: string; handle: string; tags: string[];
  priceRange: { minVariantPrice: { amount: string; currencyCode: string }; maxVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: { node: { url: string; altText: string } }[] };
  variants: { edges: { node: ShopifyVariant }[] };
  collections: { edges: { node: { title: string; handle: string } }[] };
}

export interface ShopifyVariant {
  id: string; title: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  availableForSale: boolean; quantityAvailable: number;
  selectedOptions: { name: string; value: string }[];
  image: { url: string; altText: string } | null;
}

export interface ShopifyCart {
  id: string; checkoutUrl: string; totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string }; totalAmount: { amount: string; currencyCode: string } };
  lines: { edges: { node: CartLine }[] };
}

export interface CartLine {
  id: string; quantity: number;
  cost: { totalAmount: { amount: string; currencyCode: string } };
  merchandise: {
    id: string; title: string;
    price: { amount: string; currencyCode: string };
    product: { title: string; images: { edges: { node: { url: string } }[] } };
  };
}

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id title description handle tags
    priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
    compareAtPriceRange { minVariantPrice { amount currencyCode } }
    images(first: 5) { edges { node { url altText } } }
    variants(first: 10) { edges { node { id title availableForSale quantityAvailable price { amount currencyCode } compareAtPrice { amount currencyCode } selectedOptions { name value } image { url altText } } } }
    collections(first: 3) { edges { node { title handle } } }
  }
`;

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id checkoutUrl totalQuantity
    cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
    lines(first: 50) { edges { node { id quantity cost { totalAmount { amount currencyCode } } merchandise { ... on ProductVariant { id title price { amount currencyCode } product { title images(first: 1) { edges { node { url } } } } } } } } }
  }
`;

export async function getProducts(first = 20, collectionHandle?: string) {
  if (collectionHandle) {
    const data = await shopifyFetch<any>(`${PRODUCT_FRAGMENT} query($handle:String!,$first:Int!){collection(handle:$handle){products(first:$first){edges{node{...ProductFields}}}}}`, { handle: collectionHandle, first });
    return (data.collection?.products.edges.map((e: any) => e.node) ?? []) as ShopifyProduct[];
  }
  const data = await shopifyFetch<any>(`${PRODUCT_FRAGMENT} query($first:Int!){products(first:$first,sortKey:BEST_SELLING){edges{node{...ProductFields}}}}`, { first });
  return data.products.edges.map((e: any) => e.node) as ShopifyProduct[];
}

export async function getProduct(handle: string) {
  const data = await shopifyFetch<any>(`${PRODUCT_FRAGMENT} query($handle:String!){product(handle:$handle){...ProductFields}}`, { handle });
  return data.product as ShopifyProduct;
}

export async function createCart(): Promise<ShopifyCart> {
  const data = await shopifyFetch<any>(`${CART_FRAGMENT} mutation{cartCreate{cart{...CartFields}}}`);
  return data.cartCreate.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity = 1) {
  const data = await shopifyFetch<any>(`${CART_FRAGMENT} mutation($cartId:ID!,$lines:[CartLineInput!]!){cartLinesAdd(cartId:$cartId,lines:$lines){cart{...CartFields}}}`, { cartId, lines: [{ merchandiseId: variantId, quantity }] });
  return data.cartLinesAdd.cart as ShopifyCart;
}

export async function removeFromCart(cartId: string, lineId: string) {
  const data = await shopifyFetch<any>(`${CART_FRAGMENT} mutation($cartId:ID!,$lineIds:[ID!]!){cartLinesRemove(cartId:$cartId,lineIds:$lineIds){cart{...CartFields}}}`, { cartId, lineIds: [lineId] });
  return data.cartLinesRemove.cart as ShopifyCart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await shopifyFetch<any>(`${CART_FRAGMENT} mutation($cartId:ID!,$lines:[CartLineUpdateInput!]!){cartLinesUpdate(cartId:$cartId,lines:$lines){cart{...CartFields}}}`, { cartId, lines: [{ id: lineId, quantity }] });
  return data.cartLinesUpdate.cart as ShopifyCart;
}

export async function getCart(cartId: string) {
  const data = await shopifyFetch<any>(`${CART_FRAGMENT} query($cartId:ID!){cart(id:$cartId){...CartFields}}`, { cartId });
  return data.cart as ShopifyCart;
}

export function formatPrice(amount: string, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0 }).format(parseFloat(amount));
}

export function getProductBadge(product: ShopifyProduct): string | null {
  if (product.tags.includes('new'))  return 'New';
  if (product.tags.includes('sale')) return 'Sale';
  if (product.tags.includes('hot'))  return 'Hot';
  const min = parseFloat(product.priceRange.minVariantPrice.amount);
  const cmp = parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
  if (cmp > min) return 'Sale';
  return null;
}
