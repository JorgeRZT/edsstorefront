// Placeholder block for Commerce products inside pages composed in AEM Sites.
// AEM (or the json2html template) only decides WHERE products go and WHICH ones (SKUs or category);
// prices, stock, images and add-to-cart come live from Adobe Commerce through the drop-ins.
import { Button, Icon, provider as UI } from '@dropins/tools/components.js';
import * as cartApi from '@dropins/storefront-cart/api.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { CS_FETCH_GRAPHQL, fetchPlaceholders, getProductLink } from '../../scripts/commerce.js';
import '../../scripts/initializers/cart.js';

const QUERY = `query ProductCarousel($phrase: String!, $filter: [SearchClauseInput!], $size: Int) {
  productSearch(phrase: $phrase, filter: $filter, page_size: $size) {
    items {
      productView {
        __typename sku name urlKey inStock
        images(roles: ["thumbnail"]) { url label }
        ... on SimpleProductView { price { final { amount { value currency } } } }
        ... on ComplexProductView { priceRange { minimum { final { amount { value currency } } } } }
      }
    }
  }
}`;

const list = (value) => (Array.isArray(value) ? value : String(value || '').split(','))
  .map((s) => s.trim()).filter(Boolean);

function formatPrice(product) {
  const amount = product.price?.final?.amount || product.priceRange?.minimum?.final?.amount;
  if (!amount?.value) return '';
  return new Intl.NumberFormat(document.documentElement.lang || 'es-ES', {
    style: 'currency', currency: amount.currency || 'EUR',
  }).format(amount.value);
}

function renderCard(product, labels) {
  const href = getProductLink(product.urlKey, product.sku);
  const image = product.images?.[0];
  const li = document.createElement('li');
  li.className = 'product-carousel-item';
  li.innerHTML = `
    <a class="product-carousel-image" href="${href}">
      ${image ? `<img src="${image.url.replace(/^http:/, 'https:')}?width=400" alt="${image.label || product.name}" loading="lazy" width="400" height="400">` : ''}
    </a>
    <div class="product-carousel-body">
      <h3><a href="${href}">${product.name}</a></h3>
      <p class="product-carousel-price">${formatPrice(product)}</p>
      <div class="product-carousel-actions"></div>
    </div>`;
  const complex = product.__typename === 'ComplexProductView';
  UI.render(Button, {
    children: complex ? (labels.Global?.ViewProduct || 'Ver producto') : (labels.Global?.AddProductToCart || 'Añadir a la cesta'),
    icon: Icon({ source: 'Cart' }),
    variant: 'primary',
    disabled: !complex && !product.inStock,
    ...(complex ? { href } : { onClick: () => cartApi.addProductsToCart([{ sku: product.sku, quantity: 1 }]) }),
  })(li.querySelector('.product-carousel-actions'));
  return li;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const skus = list(config.skus);
  const size = parseInt(config['page-size'] || config.pagesize, 10) || skus.length || 8;
  const filter = [{ attribute: 'visibility', in: ['Search', 'Catalog, Search'] }];
  if (skus.length) filter.push({ attribute: 'sku', in: skus });
  else if (config.category) filter.push({ attribute: 'categoryPath', eq: config.category });

  block.textContent = '';
  const track = document.createElement('ul');
  track.className = 'product-carousel-track';
  block.append(track);

  try {
    const [labels, { data, errors }] = await Promise.all([
      fetchPlaceholders(),
      CS_FETCH_GRAPHQL.fetchGraphQl(QUERY, {
        method: 'GET', variables: { phrase: config.phrase || '', filter, size },
      }),
    ]);
    if (errors?.length) throw new Error(errors[0].message);
    let products = data.productSearch.items.map((i) => i.productView);
    // keep the order chosen by the author in AEM
    if (skus.length) products = skus.map((s) => products.find((p) => p.sku === s)).filter(Boolean);
    products.forEach((p) => track.append(renderCard(p, labels)));
    block.classList.toggle('product-carousel-empty', !products.length);
  } catch (e) {
    console.error('product-carousel: cannot load products', e);
    block.classList.add('product-carousel-empty');
  }
}
