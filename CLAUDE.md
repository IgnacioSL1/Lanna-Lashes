# Lanna Lashes — Claude Code Handoff

## What this project is
A full-stack platform for **Lanna Lashes** (lannalashes.com) with three parts:
1. **React Native mobile app** (iOS + Android) — `LannaLashesApp/`
2. **Node.js backend API** — `LannaLashesBackend/`
3. **Next.js web app** — `LannaLashesWeb/`

The platform has four sections: **Shop** (Shopify), **Academy** (custom courses), **Community** (social feed), and **Profile**. The shop tab connects to the existing Shopify store via Storefront API. Everything else (courses, community, auth) is custom-built.

---

## Project structure

```
LannaLashesApp/          ← React Native (Expo / bare workflow)
  src/
    screens/             ← All 14 screens (complete)
    components/          ← Shared UI components
    navigation/          ← Tab + stack navigators
    services/
      shopify.ts         ← Shopify Storefront API
      api.ts             ← Custom backend calls
    store/
      cartStore.ts       ← Zustand cart state
      authStore.ts       ← Zustand auth state
    theme/               ← Brand colors, fonts, spacing

LannaLashesBackend/      ← Node.js + Express + Prisma
  src/
    index.ts             ← Express server entry point
    routes/
      auth.ts            ← POST /api/auth/signup, /signin, GET /me
      courses.ts         ← GET /api/courses, /api/courses/:slug
      enrollments.ts     ← Enrollments + progress tracking
      community.ts       ← Posts, comments, likes
      payments.ts        ← Stripe PaymentIntent + Shopify orders
      webhooks.ts        ← Stripe webhook handler
      uploads.ts         ← S3 presigned URLs
    services/
      db.ts              ← Prisma client singleton
      hubspot.ts         ← HubSpot CRM sync
      logger.ts          ← Winston logger
    middleware/
      auth.ts            ← JWT verify middleware
  prisma/
    schema.prisma        ← Full DB schema (11 models)

LannaLashesWeb/          ← Next.js 14 (App Router)
  src/
    app/
      page.tsx           ← Homepage
      shop/page.tsx      ← Product grid
      academy/page.tsx   ← Course catalogue
      community/page.tsx ← Social feed
      layout.tsx         ← Root layout + Nav
      globals.css        ← Brand CSS variables + animations
    components/
      Nav.tsx            ← Top nav (desktop + mobile)
      CartProvider.tsx   ← Cart init + Zustand store
    services/
      shopify.ts         ← Shopify Storefront API (browser)
      api.ts             ← Backend API calls
    store/
      authStore.ts       ← Auth state (Zustand + localStorage)
```

---

## Brand

- **Colors:** Black `#000`, White `#FFF`, Dark `#343433`, Mid `#cbc8c1`, Light `#b1afac`, Off-white `#F5F4F2`
- **Fonts:** Inter Tight (headings/UI), Inter (body)
- **Logo:** Bold "LL" monogram + "LANNA LASHES" wordmark
- **Style:** Clean, minimal, black/white/greige — editorial luxury

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.73, TypeScript |
| Navigation | React Navigation v6 |
| State | Zustand + AsyncStorage (mobile) / localStorage (web) |
| Web | Next.js 14, App Router, CSS Modules |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Shop | Shopify Storefront API |
| Payments | Stripe (courses only — Shopify handles shop) |
| CRM | HubSpot (contact sync + events) |
| Video | Mux (course video hosting) |
| Storage | AWS S3 (community images) |
| Auth | JWT (30-day tokens) |

---

## Environment variables needed

### Backend (`LannaLashesBackend/.env`)
```
DATABASE_URL=postgresql://user:password@localhost:5432/lanna_lashes
JWT_SECRET=your-long-random-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SHOPIFY_STORE_DOMAIN=lannalashes.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
SHOPIFY_ADMIN_TOKEN=your_admin_token
HUBSPOT_ACCESS_TOKEN=your_hubspot_token
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=lanna-lashes-uploads
PORT=3000
NODE_ENV=development
```

### Web (`LannaLashesWeb/.env.local`)
```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=lannalashes.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Mobile (`LannaLashesApp/.env`)
```
SHOPIFY_STORE_DOMAIN=lannalashes.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
LANNA_API_URL=http://localhost:3000
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## What's complete

### Mobile app — 14 screens, all built
- `ShopScreen` — Shopify product grid, category filters, search, hero
- `ProductDetailScreen` — image gallery, variant selector, add to cart
- `CartScreen` — line items, quantity controls, Shopify WebView checkout
- `AcademyScreen` — course catalogue with level filters
- `CourseDetailScreen` — curriculum, instructor, progress bar
- `CoursePlayerScreen` — Mux video player, progress tracking, auto-advance
- `CourseCheckoutScreen` — Stripe PaymentSheet, Apple Pay, Google Pay
- `CommunityScreen` — social feed, infinite scroll, tag filters
- `PostDetailScreen` — comments thread, reply input
- `NewPostScreen` — create post, image picker, tag selection
- `ProfileScreen` — dashboard, enrolled courses, order history
- `EditProfileScreen` — name, avatar
- `OrdersScreen` — Shopify order history, tracking
- `AuthScreen` — sign in / sign up, social login hooks

### Backend — fully built
- All 9 route files complete
- Prisma schema with 11 models
- HubSpot sync service
- Stripe webhook handler
- JWT auth middleware
- S3 upload service

### Web app — core pages built
- Homepage (hero, bestsellers, academy banner, community teaser)
- Shop page (product grid, filters, search, add to cart)
- Academy page (course grid, filters)
- Community page (feed, post creation, likes, pagination)
- Nav (desktop + mobile responsive)

---

## What still needs to be built / done

### Web app — remaining pages
- [ ] `/shop/[handle]` — Product detail page (image gallery, variant picker, add to cart)
- [ ] `/cart` — Cart page (line items, Shopify checkout redirect)
- [ ] `/academy/[slug]` — Course detail page (curriculum, enroll CTA)
- [ ] `/academy/[slug]/learn` — Course video player (Mux embed)
- [ ] `/auth` — Sign in / sign up page
- [ ] `/profile` — User profile, orders, enrolled courses

### Mobile app
- [ ] Add Inter Tight + Inter font files to `ios/` and `android/assets/fonts/`
- [ ] Configure Stripe with `StripeProvider` in App root
- [ ] Set up push notifications (OneSignal or FCM)
- [ ] Test on iOS simulator and Android emulator
- [ ] Submit to App Store + Google Play

### Backend
- [ ] Run `npx prisma migrate dev` to create database tables
- [ ] Seed initial course data (`npm run db:seed` — needs seed file)
- [ ] Set up Stripe webhook endpoint in Stripe dashboard
- [ ] Create HubSpot timeline event templates
- [ ] Set up Mux account and upload course videos

### DevOps
- [ ] Deploy backend to Railway or Render
- [ ] Deploy web to Vercel
- [ ] Set up custom domain `app.lannalashes.com` for web
- [ ] Configure production environment variables

---

## How to start each part

### Start the backend
```bash
cd LannaLashesBackend
npm install
cp .env.example .env
# Fill in .env values
npx prisma generate
npx prisma migrate dev --name init
npm run dev
# API running at http://localhost:3000
```

### Start the web app
```bash
cd LannaLashesWeb
npm install
cp .env.local.example .env.local
# Fill in .env.local values
npm run dev
# Web running at http://localhost:3001
```

### Start the mobile app
```bash
cd LannaLashesApp
npm install
cd ios && pod install && cd ..
npm run ios     # iOS simulator
npm run android # Android emulator
```

---

## Key decisions made in this project

1. **Shopify stays as-is** — the shop tab uses Shopify Storefront API, no migration needed. Shopify handles all product/inventory/payment for physical goods.
2. **Stripe for courses** — course purchases use Stripe directly, not Shopify. ~97% revenue kept vs 5–10% on Teachable/Kajabi.
3. **HubSpot for marketing only** — HubSpot handles email campaigns, CRM contacts, and automation triggers. In-app features (enrolment, progress, community) are custom.
4. **Mux for video** — DRM-protected adaptive streaming. Videos are stored in Mux, playback URLs go in the `Lesson.videoUrl` DB field.
5. **One account, all platforms** — same JWT token works on mobile and web. Users sign up once, access everything.
6. **`app.lannalashes.com`** for web — keeps main Shopify store at `lannalashes.com` untouched.

---

## Common commands

```bash
# Backend
npm run dev          # start dev server
npm run db:studio    # open Prisma Studio (visual DB editor)
npx prisma migrate dev --name <name>  # create migration after schema change

# Web
npm run dev          # start Next.js dev server
npm run build        # production build
vercel               # deploy to Vercel

# Mobile
npm run ios          # run on iOS simulator
npm run android      # run on Android
```

---

## Questions to ask the client (Lanna)

These things weren't confirmed and need answers before going live:

1. What is your **Shopify Storefront API token**? (Go to Shopify admin → Settings → Apps → Develop apps)
2. Do you have a **Stripe account**? If not, create one at stripe.com
3. Do you have **Mux** set up for course videos? If not, sign up at mux.com
4. What is your **HubSpot access token**? (Settings → Integrations → Private Apps)
5. Where should the backend be hosted — **Railway** (simplest) or **AWS**?
6. What courses do you want in the app at launch? (Need titles, descriptions, prices, and video files)
7. Do you want **Apple Sign In** and **Google Sign In** on mobile? (Requires extra setup)
8. What is the **App Store name** for the app? ("Lanna Lashes" — check availability)
