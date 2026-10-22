# Fútbol Emotion · EDS Commerce Storefront + AEM Sites (json2html / BYOM)

Demo de Adobe Solutions Consulting: la landing de [futbolemotion.com](https://www.futbolemotion.com) migrada a un **Storefront de Adobe Commerce sobre Edge Delivery Services**, con el layout y el contenido editorial servidos desde **AEM Sites** (simulado con un mock) y renderizados **siempre en servidor** mediante **json2html**. Los productos los pintan los **drop-ins de Commerce** dentro de placeholders que coloca el editor en **Universal Editor**.

> Demo, no producción: `robots: noindex, nofollow`. Nada publicado en `.aem.live`.

## URLs

| Qué | URL | Fuente |
|---|---|---|
| Home (landing migrada) | https://main--edsstorefront--jorgerzt.aem.page/ | DA `jorgerzt/edsstorefront/index` |
| Página desde AEM + Commerce | https://main--edsstorefront--jorgerzt.aem.page/example-from-aem-and-commerce | json2html ← mock AEM `.model.json` |
| Ofertas (desde la API) | https://main--edsstorefront--jorgerzt.aem.page/ofertas | json2html ← mock `ofertas.model.json` |
| Lifestyle (desde la API) | https://main--edsstorefront--jorgerzt.aem.page/lifestyle | json2html ← mock `lifestyle.model.json` |
| Contenido DA | https://da.live/#/jorgerzt/edsstorefront | — |
| Backup contenido original del boilerplate | `da.live/#/jorgerzt/edsstorefront/backup-boilerplate` | `index`, `nav`, `footer` |

## Arquitectura

```
Universal Editor ──► AEM Sites (layout + contenido)
                         │  .model.json  (mock: my-custom-api)
                         ▼
             json2html (BYOM, servidor) + templates/aem-page.html
                         │  HTML semántico EDS (secciones + bloques)
                         ▼
   Content source overlay (admin.hlx.page)  ──► EDS preview/live (CDN)
                         │
                         ▼
   Navegador: decora bloques; product-carousel → Catalog Service + cart drop-in
```

- **Overlay**: el content source del sitio es DA, con overlay `markup` a `https://json2html.adobeaem.workers.dev/jorgerzt/edsstorefront/main`. Las rutas configuradas en json2html salen de AEM; el resto (404 en json2html) cae a DA.
- **json2html** (`POST https://json2html.adobeaem.workers.dev/config/jorgerzt/edsstorefront/main`): entrada comodín `/` (cualquier página) → endpoint `…/api/edsstorefront/aem/content/edsstorefront/es/{{id}}.model.json`, plantilla `/templates/aem-page.html`.
- **Nueva página = nuevo mock**: crear `edsstorefront/aem/content/edsstorefront/es/<slug>.model.json` en la API y previsualizar `/<slug>`. Si la API devuelve 404, json2html devuelve 404 y EDS sirve la página de DA (home, nav, footer, cart, checkout…). Ejemplo: `/test`.
- **Cero llamadas al mock/AEM desde el cliente**: el HTML llega ya montado. El navegador solo llama a Commerce (Catalog Service / carrito).

## Qué contiene el repo

| Ruta | Descripción |
|---|---|
| `styles/`, `fonts/` (Figtree), `icons/` | Look & feel FE mapeado sobre los tokens de los drop-ins (negro `#0f0f0f`, rojo `#ff3b30`, botones píldora, ancho 1440px) |
| `blocks/header/` | Header de Commerce re-skineado: topbar (4ª sección del nav), buscador visible con resultados en vivo, Tiendas, Cuenta (auth drop-in), wishlist, Cesta (mini-cart) |
| `blocks/footer/` | Footer FE (secciones, apps, tarjeta de socio) |
| `blocks/cards`, `carousel`, `columns` | Variantes FE (`products`, `players`, `recommender`, `ratings`, `seo`, `hero`, `banners`) con `moveInstrumentation` para UE |
| `blocks/product-carousel/` | **Placeholder de Commerce**: lee `skus` / `category` / `phrase` / `page-size`, consulta Catalog Service `productSearch` y pinta tarjetas con “Añadir a la cesta” (`cartApi.addProductsToCart`) |
| `templates/aem-page.html` | Plantilla Mustache de json2html: cada elemento de `sections[]` es un tipo de sección (`intro`, `cromos`, `carousel`, `productList`, `banners`, `players`, `recommender`, `categories`, `blog`, `ratings`, `seo`); `productList` → bloque `product-carousel` |
| `blocks/*/_*.json`, `models/_*.json` → `component-*.json` | Modelos de Universal Editor con plugins `da` **y** `xwalk` (AEM). Regenerar con `npm run build:json` |

## Universal Editor

- Con **xwalk** (AEM Sites como fuente) el editor coloca secciones (estilos: Ancho completo, Centrado, Productos, Recomendador, Valoraciones, SEO) y bloques (cards, carousel, columns, `product-carousel`…).
- El bloque **Product Carousel** (grupo *Product*) se configura con SKUs, categoría, búsqueda y nº de productos: el editor decide *qué* productos y *dónde*; el drop-in los pinta con precio y stock reales.
- Los bloques de Commerce (`commerce-cart`, `product-details`, …) siguen disponibles en el filtro de sección.

## Cómo probarlo

1. Abrir la home y `/example-from-aem-and-commerce` (URLs arriba).
2. En DevTools → Network: no hay llamadas a `workers.dev`; sí a Catalog Service.
3. Pulsar **Añadir a la cesta** en una tarjeta → el contador del mini-cart sube.
4. Cambiar el contenido: editar el mock (`edsstorefront/aem/content/edsstorefront/es/example-from-aem-and-commerce.model.json` en my-custom-api) y re-previsualizar:
   ```bash
   curl -X POST -H "Authorization: Bearer $IMS_TOKEN" \
     https://admin.hlx.page/preview/jorgerzt/edsstorefront/main/example-from-aem-and-commerce
   ```
5. Local: `npm install && npm run install:dropins` (ver nota de `ignore-scripts` abajo) y `aem up`.

## Notas y límites

- Catálogo Commerce de demo (`config.json` → aemshop.net, merchandising Adobe): los productos no son de Fútbol Emotion.
- Textos de los drop-ins aún en inglés y precios en $ (placeholders y configuración de tienda, no estilos).
- La wishlist no existe en futbolemotion.com; se mantiene de Commerce.
- Para pasar a AEM real: sustituir el endpoint del mock por `https://<publish>/content/<site>/{{id}}.model.json` en la config de json2html.

---

## Boilerplate original (Adobe Commerce)
### Documentation

Before using the boilerplate, we recommend you to go through the documentation on <https://experienceleague.adobe.com/developer/commerce/storefront/> and more specifically:

1. [Storefront Developer Tutorial](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/)
1. [AEM Docs](https://www.aem.live/docs/)
1. [AEM Developer Tutorial](https://www.aem.live/developer/tutorial)
1. [The Anatomy of an AEM Project](https://www.aem.live/developer/anatomy-of-a-project)
1. [Web Performance](https://www.aem.live/developer/keeping-it-100)
1. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

### Getting Started

Use the [Site Creator Tool](https://da.live/app/adobe-commerce/storefront-tools/tools/site-creator/site-creator) to quickly spin up your own copy of code and content.

Alternatively, you can follow our [Guide](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/) for a more detailed walkthrough.

### Installation

Run `npm install` to install dependencies.

This repo's `.npmrc` sets `ignore-scripts=true`, which disables npm lifecycle scripts (`preinstall`/`install`/`postinstall`) for every package. This is a defense against npm supply-chain attacks that hide malicious code inside those scripts. One consequence is that `npm install` alone will **not** copy the drop-in assets into `scripts/__dropins__` or apply the GraphQL overrides defined in `build.mjs`.

After every `npm install` — initial setup, or any time a `@dropins/*` or `@adobe/*` dependency changes — run:

```bash
npm run install:dropins
```

This copies the built assets from `node_modules/@dropins` and the relevant `@adobe/*` packages into `scripts/__dropins__`, and applies the GraphQL fragment/operation overrides in `build.mjs`. Edge Delivery Services serves the copied files directly, so this step must complete before `npm start` will reflect the correct drop-in behavior.

### Staying Up to Date

Once you fork or clone this repo, the code is yours — you are not subscribed to updates.

### What a suite release is (and is not)

A suite release — for example "[b2c-march-2026](https://github.com/hlxsites/aem-boilerplate-commerce/tree/b2c-march-2026)" — is a tagged snapshot of this boilerplate at a point in time when a specific combination of drop-in package versions and boilerplate code was tested together and verified to work. That tag is useful as a **starting point** for developers who are setting up a new project. You can find the release notes for each suite release in the [releases](https://experienceleague.adobe.com/developer/commerce/storefront/releases/) page.

If you have already forked or cloned this repo, a new suite release is not an upgrade you need to apply. There is no mechanism that pushes boilerplate code changes into your fork, and nothing will break in your project because a new release tag was created upstream. Treat suite releases the same way you would treat a new major version of a project template: relevant only if you are starting fresh.

### Updating your drop-in dependencies

The only things you need to actively track after forking are your **npm dependencies** — specifically the `@dropins/*` and `@adobe/*` packages (including `@adobe/magento-storefront-event-collector` and `@adobe/magento-storefront-events-sdk`) listed in your `package.json`. Before applying any update, check the release notes for breaking changes and ensure you run `npm run install:dropins` so that the dependencies in your `scripts/__dropins__` directory are updated to the latest build.

These packages follow semantic versioning. Minor and patch releases are non-breaking by contract, so routine updates should be safe to apply.

To see which packages have newer versions available:

```bash
npm outdated
```

To install a specific version:

```bash
npm install @dropins/storefront-cart@2.0.0  # updates the package in node_modules/
npm run install:dropins                     # copies scripts from node_modules into scripts/__dropins__/
```

To update a drop-in to its latest stable release:

```bash
npm install @dropins/storefront-cart@latest
npm run install:dropins
```

Always run `npm run install:dropins` after any drop-in update — it copies the built assets from `node_modules` into `scripts/__dropins__`, which is what Edge Delivery Services serves. Since this repo disables npm lifecycle scripts (see [Installation](#installation)), this step is never run automatically and must always be done manually.

### Automated dependency PRs

This repo includes a GitHub Actions workflow (`.github/workflows/update-dependencies.yaml`) that runs every Monday and opens a pull request when newer stable versions of `@adobe/*` or `@dropins/*` packages are available within the ranges declared in your `package.json` ([semver](https://semver.org/)). The PR includes updated `package.json`, `package-lock.json`, and regenerated dropin assets under `scripts/__dropins__/`. Pre-release packages are held without changes and surfaced in the workflow output. This works similarly to Dependabot or Renovate; once you fork the repo, the workflow runs in your fork so you can review and merge updates at your own pace.

#### Enabling it on your fork/clone

Whether this works out of the box depends on your organization's (or personal account's) default policy for the **"Allow GitHub Actions to create and approve pull requests"** setting — some orgs disable it by default for new repositories. If it's off, the workflow will run "successfully" (it updates `package.json` locally) but silently fail to open the PR, with no obvious error in the run logs. If your fork doesn't get a PR after the workflow runs, check and enable this setting:

1. In your fork/clone, go to **Settings → Actions → General**.
2. Scroll to **Workflow permissions**.
3. Ensure **Read and write permissions** is selected.
4. Check **Allow GitHub Actions to create and approve pull requests**.
5. Click **Save**.

Then verify it works by triggering it manually: go to the **Actions** tab, select **Update Dependencies** in the sidebar, and click **Run workflow**. Confirm a pull request is opened once the run completes (if there are no updates available, no PR will be created — bump a version range in `package.json` to force a test run if needed).

If your GitHub organization disallows the "Allow GitHub Actions to create and approve pull requests" setting at the org level and won't allow individual repos to override it, use a personal access token (PAT) or GitHub App token instead of the default `GITHUB_TOKEN`, which bypasses that restriction:

1. Create a fine-grained PAT (or a GitHub App installation token) with **Contents: Read and write** and **Pull requests: Read and write** permissions scoped to your repo.
2. Store it as a repository secret (e.g. `DEPENDENCY_UPDATE_PAT`) under **Settings → Secrets and variables → Actions**.
3. Update the `token:` input on the `peter-evans/create-pull-request` step in `update-dependencies.yaml` to reference that secret instead of `${{ secrets.GITHUB_TOKEN }}`.

### Pulling boilerplate code changes into your fork (optional)

If you want to incorporate code changes made to this upstream boilerplate after you forked — for example, a new block or a bug fix in `scripts/` — you can do so by adding this repo as a git remote and merging selectively. This is entirely optional. Upstream changes may conflict with modifications you have made to your fork, so expect to resolve conflicts manually. There is no guarantee of a clean merge, and nothing in your project depends on staying in sync with the upstream boilerplate code.

### Changelog

Major changes to this boilerplate are described and documented as part of pull requests and tracked via the `changelog` tag. This log documents changes to the canonical starting point — not upgrades that forked implementations must apply. Review it if you are considering pulling specific upstream changes into your fork:

<https://github.com/hlxsites/aem-boilerplate-commerce/issues?q=label%3Achangelog+is%3Aclosed>
