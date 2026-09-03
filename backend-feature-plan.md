# Backend Feature Plan — Based on Reference Site Analysis

**Contents:**
- Part A — Architecture Layers Reference (what each folder/file type is for)
- Part B — Feature Analysis from Reference Site
- Part C — Feature → Module Mapping
- Part D — Suggested Build Order

---

# Part A — Architecture Layers Reference

## `server.js` — Entry point / process bootstrap

The file you run with `node server.js`. Its only job is to **start things up** — no business logic or routes here.

What belongs here:
- Load environment variables (`dotenv.config()`)
- Create the HTTP server (`http.createServer(app)`)
- Wire up anything needing the raw HTTP server, not just Express — like Socket.io
- Connect to the database
- Start listening on a port
- Handle startup failure (exit process if DB connection fails)

Your current `server.js` already does exactly this — DB connect, socket.io setup, `server.listen()`.

## `app.js` — Express app configuration

Where the Express app is assembled: middleware pipeline + route mounting. Exports the `app` object but never calls `.listen()` — that's `server.js`'s job. This separation lets you import `app` into test files without starting a real server.

What belongs here:
- Global middleware (CORS, body parsers, cookie parser, logging)
- Static file serving
- Mounting routers (`app.use("/api/v1", router)`)
- Global error handler (always last)

## `configs/` — Environment-dependent setup

Anything that reads `process.env` and sets up a connection/client goes here, not scattered across the app.

Typical files:
- `db.js` — database connection
- `logger.js` — winston/logging setup
- `env.js` — validates required env vars exist at boot (recommended addition — fail fast instead of crashing mid-request later)
- `cloudinary.js` / `s3.js` — third-party service clients
- `payment.js` — payment gateway client init
- `redis.js` — cache/session client

Rule of thumb: if it's a client/connection reused across the app, it's a config, not a util.

## `routes/` — URL → handler mapping only

A thin **map**: "this URL + method goes to this controller function." No logic, no DB calls, no validation logic inline.

```js
router.post("/products", validate(createProductSchema), authenticate(["admin"]), productController.createProduct);
```

Reads like a sentence: validate input → check auth → run controller. That's all a route file should express.

## `controllers/` — Request/response handling only

Narrow job: **read the request, call a service, shape the response.** No business logic (belongs in `services/`), no direct DB calls (belongs in `models`/`services`).

```js
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, data: product });
});
```

If you're writing `if/else` business rules or DB queries directly in a controller, that logic belongs one layer down in a service — otherwise it can't be reused (e.g. from a cron job) without copy-pasting.

## `services/` — Business logic (currently empty in your project — most important to fill in)

The actual "what does this app do" logic, independent of HTTP.

```js
// product.service.js
export const createProduct = async (data) => {
  const existing = await Product.findOne({ slug: data.slug });
  if (existing) throw new ApiError(409, "Product slug already exists");
  return Product.create(data);
};
```

Why separate from controllers: a service function doesn't know about `req`/`res` — so it can be called from a controller, a cron job, a script, or a test, without dragging Express along.

## `models/` — Database schema + data access

Mongoose schemas defining shape, validation at the DB level, schema-level methods/virtuals.

```js
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sellingPrice: { type: Number, required: true },
  mrp: Number,
  variants: [variantSchema],
});
productSchema.virtual("discountPercent").get(function () {
  return this.mrp ? Math.round(((this.mrp - this.sellingPrice) / this.mrp) * 100) : 0;
});
```

Keep query logic reused across services (e.g. "find active products") as static methods on the model, so services don't duplicate raw Mongo queries.

## `middlewares/` — Functions that run *before* the controller

Anything that intercepts a request to check, transform, or reject it before it reaches the controller.

- `authenticate.js` — verifies token, attaches `req.user`
- `authorize.js` — checks role/permission
- `validate.js` — runs Zod schema against body/query/params (already present)
- `asyncHandler.js` — wraps async controllers so thrown errors reach `next()` automatically (already present)
- `globalErrorHandler.js` — catches everything reaching `next(err)`, formats response (already present)
- `multer.js` — file upload handling
- `rateLimiter.js` — throttle requests per IP/user (not present yet — add before checkout/auth routes go live)

## `utils/` — Small, stateless, reusable helper functions

Pure functions with no side effects tied to business rules — token signing, formatting, calculations. If a function needs the database or Express, it doesn't belong here.

Existing: `generateAccessToken.js`, `generateRefreshToken.js`. Worth adding: `apiError.js` (custom error class with `statusCode`), `apiResponse.js` (consistent response shape), `slugify.js`, `calculateDiscount.js`.

## `validations/` — Input schemas (currently empty in your project)

Zod schemas defining exactly what a valid request body/query/params looks like, consumed by `validate.middleware.js`.

```js
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    sellingPrice: z.number().positive(),
  }),
});
```

One file per module (`product.validation.js`, `order.validation.js`), not one giant file — keeps it navigable as the app grows.

## Other layers worth knowing about (not in your project yet)

| Layer | Purpose |
|---|---|
| `jobs/` | Scheduled/background tasks — cron jobs, queue workers (cart-abandonment, order timeouts) |
| `constants/` | Fixed enums/config values — order statuses, role names, error codes — avoids hardcoded magic strings across files |
| `dto/` (optional) | Data-shaping functions that strip sensitive fields before sending a model out as a response (e.g. never send `password` even if `.select()` was missed somewhere) |
| `docs/` or `swagger/` | API documentation — OpenAPI/Swagger spec, useful once the frontend team isn't just you |
| `seeds/` | Scripts to populate the DB with sample/starter data for local dev |
| `tests/` | Unit tests (services, utils — no DB/HTTP needed) and integration tests (hit routes with supertest against a test DB) |

## Request flow through all layers

```
Client request
  → routes/          (matches URL to handler chain)
  → middlewares/      (validate → authenticate → authorize)
  → controllers/      (parse req, call service, send res)
  → services/         (business logic)
  → models/           (DB read/write)
  ← back up through controller → response
  (any thrown error at any layer → globalErrorHandler)
```

Each layer should only know about the layer directly below it — never skip layers or reach sideways.

---

# Part B — Feature Analysis from Reference Site

**Reference site analyzed:** ullasincense.co.in (Shopify e-commerce, incense/pooja products)
**Target repo:** HK-backend (Express + MongoDB)
**Goal:** Map every customer-facing feature seen on the reference site to concrete backend modules, files, and functionality to build.

---

## 1. Features Observed on the Reference Site

| Area | What they have |
|---|---|
| Navigation | Multi-level category menu (Category → Sub-category), "Shop by Brand", "Shop by Fragrance" (attribute-based browsing) |
| Product listing | Grid with hover-swap image, price + strikethrough MRP, "Out of Stock" state, "Save ₹X" badge, "Export Quality" tag |
| Product variants | Size/quantity/pack options (e.g. "1L", "Pack of 3", "33 Cups") selectable from one product page |
| Wishlist | Add/remove wishlist icon on every card, dedicated wishlist page |
| Compare | "Compare" option on product quick-view |
| Cart | Mini-cart with item count + running total, free-shipping progress bar ("Shop for ₹499 and get free shipping") |
| Coupons | Sitewide banner code (`ullas10` = 10% off first order) |
| Combo / bundle products | "Combo Offers" — multiple SKUs sold as one bundled product with its own price |
| Reviews & ratings | Review count per product, testimonials section with photos |
| Search | Search bar + "Trending Search" suggested terms |
| Account | Login/Register, presumably order history/profile behind it |
| Wholesale/B2B | Separate "Wholesale Enquiry" contact number — a distinct B2B lead flow, not regular checkout |
| Content/Blog | Blog section, "About Us" page, podcast/video embeds |
| Policies | Privacy Policy, Cancellation Policy, T&C, Shipping Policy, FAQ — all as static content pages |
| Marketing | New Arrivals, Best Deals/Best Sellers, "Shop by Category" tiles, banners, brand logos row |
| Contact | WhatsApp click-to-chat, phone, email |
| Trust signals | Certifications (ISO), "Trusted by 1M+ homes" — static content, not functional backend but often CMS-driven |

---

# Part C — Feature → Backend Module Mapping

### 2.1 Product Catalog (extends existing `product` module)

```
src/modules/product/
├── product.model.js         # add: variants[], tags[], badges[] (e.g. "Export Quality"), mrp vs sellingPrice, brand ref, fragrance ref
├── product.service.js       # getProductsByFilter(), getBySlug(), getRelated()
├── product.controller.js
├── product.routes.js
└── product.validation.js
```
**New functionality to add:**
- `variants`: array of `{ label: "1L" / "Pack of 3", sku, price, stock }` — one product, multiple purchasable options (matches "Nirantara Oil 1L / 1L Pack of 3 / 4L" pattern)
- `mrp` (strikethrough) vs `sellingPrice` (shown price) fields, plus a computed `discountPercent`
- `badges: ["Export Quality", "New Arrival", "Best Seller"]` — simple tag array, filterable
- `stockStatus` derived from inventory (`in_stock`, `out_of_stock`) rather than stored redundantly

### 2.2 Brand & Fragrance (attribute-based browsing)

```
src/modules/brand/
├── brand.model.js            # name, logo, slug, description
├── brand.service.js
├── brand.controller.js
└── brand.routes.js

src/modules/attribute/
├── attribute.model.js        # type: "fragrance" | "material" | ..., value: "Rose", icon
├── attribute.service.js
├── attribute.controller.js
└── attribute.routes.js
```
**Why separate from category:** the reference site browses products two independent ways — by Category (Agarbatti/Dhoop/Oil) *and* by Fragrance (Rose/Sandalwood/Musk) *and* by Brand (Nirantara/Ayka/Organico). If fragrance is jammed into the category tree, filtering breaks. Keep them as independent, many-to-one fields on `product`.

### 2.3 Category (extends existing `category` module)

```
src/modules/category/
├── category.model.js   # add: parentId (nested categories), image, displayOrder
├── category.service.js # getTree() — builds nested menu from parentId
```

### 2.4 Wishlist

```
src/modules/wishlist/
├── wishlist.model.js       # userId, productId[], addedAt per item
├── wishlist.service.js     # addItem, removeItem, getWishlist, isWishlisted(productId, userId)
├── wishlist.controller.js
└── wishlist.routes.js
```
Endpoints: `POST /wishlist/:productId`, `DELETE /wishlist/:productId`, `GET /wishlist`

### 2.5 Compare

```
src/modules/compare/
├── compare.service.js   # stateless — takes productIds[], returns products with attributes aligned for comparison table
└── compare.controller.js
```
This one doesn't need its own persistent model — it's usually just `GET /compare?ids=id1,id2,id3` returning normalized attribute rows. Keep it lightweight.

### 2.6 Cart (extends existing `cart` module)

```
src/modules/cart/
├── cart.model.js        # userId | guestSessionId, items[{ productId, variantSku, qty, priceAtAdd }]
├── cart.service.js       # addItem, updateQty, removeItem, mergeGuestCartOnLogin, getFreeShippingProgress()
├── cart.controller.js
└── cart.routes.js
```
**New functionality:**
- `getFreeShippingProgress(cart)` → returns `{ remainingAmount, qualifies }` for the "shop for ₹499 more" banner
- Guest cart via session/device ID (matches `REDIS_URL` already in your `.env.example` — good candidate for guest cart storage)
- `mergeGuestCartOnLogin(guestCart, userId)` — runs once on login

### 2.7 Coupon / Discount

```
src/modules/coupon/
├── coupon.model.js        # code, type: "percent"|"flat", value, minOrderValue, maxUses, usesPerUser, expiresAt, firstOrderOnly
├── coupon.service.js       # validateCoupon(cart, code, user), applyCoupon()
├── coupon.controller.js
└── coupon.routes.js
```
**New functionality:** `firstOrderOnly: true` flag directly supports the "ullas10 — 10% off first order" pattern seen on the banner.

### 2.8 Combo / Bundle Products

```
src/modules/product/product.model.js   # extend with:
    isBundle: Boolean,
    bundleItems: [{ productId, variantSku, qty }]   # what the combo contains
```
No new module needed — a bundle is a `product` document flagged `isBundle: true`, referencing its component products for stock-deduction purposes at checkout (deduct from each component's inventory, not a separate bundle stock count, unless you want bundle-specific stock caps).

### 2.9 Review & Rating (already planned earlier — confirmed needed)

```
src/modules/review/
├── review.model.js        # productId, userId, rating(1-5), comment, images[], isVerifiedBuyer, status(pending/approved)
├── review.service.js       # createReview, getProductReviews, getAverageRating(productId)
├── review.controller.js
└── review.routes.js
```
**Note:** `isVerifiedBuyer` should be set by checking the user has a delivered order containing that product — don't take it on trust from the client.

### 2.10 Search

```
src/modules/search/
├── search.service.js      # searchProducts(query) — Mongo text index for now
└── search.controller.js
```
**New functionality:**
- Add a MongoDB text index on `product.name`, `product.tags`, `product.brand`
- `GET /search/trending` — returns a small curated/most-searched terms list (can start as a hardcoded array in a `trendingSearches` collection, editable by admin)

### 2.11 Wholesale / B2B Enquiry

```
src/modules/enquiry/
├── enquiry.model.js       # name, phone, email, company, message, type: "wholesale", status
├── enquiry.service.js
├── enquiry.controller.js
└── enquiry.routes.js
```
This is a **separate flow from checkout** — no cart/order/payment involved, just a lead form that notifies your sales/admin team (via `notification` module). Keep it fully separate from `order` so it doesn't get entangled with order-status logic.

### 2.12 CMS / Static Content (Blog, About, Policies, FAQ)

```
src/modules/cms/
├── page.model.js          # slug, title, content(HTML/markdown), seoTitle, seoDescription
├── blog.model.js           # title, slug, content, coverImage, publishedAt, author
├── cms.service.js
├── cms.controller.js
└── cms.routes.js
```
Rather than hardcoding "Privacy Policy" / "FAQ" text in the frontend, store them as `page` documents editable from an admin panel — this is how the reference site's Privacy/Shipping/Cancellation/T&C/FAQ pages are almost certainly managed (Shopify's built-in CMS pages).

### 2.13 Homepage / Marketing Sections

```
src/modules/marketing/
├── banner.model.js         # image, link, position("hero"|"category-strip"), displayOrder, activeFrom/activeTo
├── section.model.js         # e.g. "New Arrivals", "Best Deals" — type + rule (manual productIds[] OR auto query like "top 10 by sales")
├── marketing.service.js
└── marketing.controller.js
```
**Why:** "New Arrivals," "Best Deals," "Shop by Category" tiles, and banners all change frequently and shouldn't require a code deploy each time. A `section` with a `rule` field lets admin choose "manual list" or "auto: last 30 days" without engineering involvement each time.

### 2.14 Notification (already planned — now with concrete triggers)

```
src/modules/notification/
├── notification.service.js   # sendOrderConfirmation, sendWholesaleEnquiryAlert, sendReviewApprovedEmail, sendLowStockAlert(admin)
```

### 2.15 Contact

```
src/modules/contact/
├── contact.model.js        # name, email, message, status
├── contact.controller.js
└── contact.routes.js
```
Simple contact-form submissions, distinct from `enquiry` (wholesale) since they likely route to different teams.

---

# Part D — Suggested Build Order (Phased)

| Phase | Modules | Why this order |
|---|---|---|
| **Phase 1 — Core shopping** | `category`, `brand`, `attribute`, `product` (with variants/badges), `cart`, `wishlist` | Nothing else works without browsing + cart |
| **Phase 2 — Checkout** | `coupon`, `order`, `payment`, `inventory` stock-decrement | Revenue-critical path |
| **Phase 3 — Trust & retention** | `review`, `notification` (order emails/SMS) | Needed before public launch for credibility |
| **Phase 4 — Discovery** | `search`, `compare`, `marketing` (banners/sections) | Improves conversion, not launch-blocking |
| **Phase 5 — Content & growth** | `cms` (blog/pages/FAQ), `enquiry` (wholesale), `contact` | Can launch with static frontend pages initially, backend-ize later |

---

## Closing Note

All of the above still slot into the `src/modules/<name>/` pattern discussed earlier (routes/controller/service/validation/model per module), mounted centrally in `src/routes/index.routes.js`. Nothing here changes that shape — it just tells you *which* modules to actually build and *what* goes inside each one, based on what a live store in your exact category (pooja/incense) actually ships with.
