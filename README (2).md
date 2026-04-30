# Lanna Lashes Web App

Next.js 14 web application — same shop, academy, and community features as the mobile app, accessible from any browser.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | CSS Modules + custom properties |
| State | Zustand |
| Shop | Shopify Storefront API |
| Payments | Stripe.js |
| Backend | Shared Lanna Lashes API |

---

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Fill in your credentials
npm run dev
# → http://localhost:3001
```

---

## Environment Variables

Create `.env.local`:

```bash
# Shopify (public — safe to expose)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=lannalashes.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token

# Backend API
NEXT_PUBLIC_API_URL=https://api.lannalashes.com

# Stripe (public key only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — hero, bestsellers, academy preview, community |
| `/shop` | Product grid with category filters and search |
| `/shop/[handle]` | Product detail — gallery, variants, add to cart |
| `/cart` | Cart with quantity controls, Shopify checkout |
| `/academy` | Course catalogue with level filters |
| `/academy/[slug]` | Course detail — curriculum, instructor, enroll |
| `/academy/[slug]/learn` | Video player with curriculum sidebar |
| `/community` | Social feed with post creation |
| `/community/[id]` | Post detail with comments |
| `/auth` | Sign in / Sign up |
| `/profile` | User dashboard — courses, orders, settings |

---

## Architecture

The web app shares the **same backend API** and **same Shopify store** as the mobile app. Users who purchase on web can access their courses on mobile, and vice versa — one account, all platforms.

```
Browser
  ↓
Next.js (this repo) — vercel.com
  ↓ Shopify Storefront API (shop)
  ↓ Lanna API (courses, community, auth)
  ↓ Stripe.js (course payments)
```

---

## Deployment

### Vercel (recommended — one command)

```bash
npm i -g vercel
vercel
# Follow prompts — add env vars in Vercel dashboard
```

### Custom domain

In Vercel: Project → Domains → Add `app.lannalashes.com`

The web app works best served from a subdomain like `app.lannalashes.com`, keeping `lannalashes.com` as your main Shopify storefront.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          ← Root layout + Nav + CartProvider
│   ├── globals.css         ← Brand tokens, fonts, animations
│   ├── page.tsx            ← Homepage
│   ├── shop/
│   │   └── page.tsx        ← Product grid
│   ├── academy/
│   │   └── page.tsx        ← Course catalogue
│   └── community/
│       └── page.tsx        ← Social feed
├── components/
│   ├── Nav.tsx             ← Top navigation (desktop + mobile)
│   └── CartProvider.tsx    ← Cart initialisation + Zustand
├── services/
│   ├── shopify.ts          ← Shopify Storefront API
│   └── api.ts              ← Lanna backend API
└── store/
    ├── authStore.ts        ← Auth state (Zustand + localStorage)
    └── (cartStore in CartProvider.tsx)
```
