# Lanna Lashes App

React Native app for iOS & Android — Shop (Shopify), Academy (custom), Community (custom).

---

## Stack

| Layer | Technology |
|---|---|
| App | React Native 0.73 (TypeScript) |
| Navigation | React Navigation v6 |
| State | Zustand + AsyncStorage |
| Shop | Shopify Storefront API |
| Payments (courses) | Stripe React Native |
| Video | Mux / react-native-video |
| Push notifications | OneSignal / FCM |
| Backend | Node.js API (separate repo) |

---

## Setup

### 1. Install dependencies
```bash
npm install
cd ios && pod install && cd ..
```

### 2. Environment variables
Create a `.env` file in the project root:
```
SHOPIFY_STORE_DOMAIN=lannalashes.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=your_public_storefront_token
LANNA_API_URL=https://api.lannalashes.com
STRIPE_PUBLISHABLE_KEY=pk_live_...
MUX_ENV_KEY=your_mux_env_key
```

### 3. Shopify Storefront API token
1. Go to your Shopify admin → Settings → Apps → Develop apps
2. Create a new app called "Lanna Lashes Mobile App"
3. Under Storefront API, enable: `unauthenticated_read_product_listings`, `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`
4. Copy the Storefront API access token to `.env`

### 4. Fonts
Add Inter Tight and Inter fonts to:
- `ios/LannaLashesApp/Info.plist` (UIAppFonts)
- `android/app/src/main/assets/fonts/`

Font files needed:
- `InterTight-Regular.ttf`
- `InterTight-Medium.ttf`
- `InterTight-SemiBold.ttf`
- `InterTight-Bold.ttf`
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`

Download from: https://fonts.google.com/specimen/Inter+Tight

### 5. Run
```bash
# iOS
npm run ios

# Android
npm run android
```

---

## Project Structure

```
src/
├── screens/
│   ├── ShopScreen.tsx          ← Shopify product grid
│   ├── AcademyScreen.tsx       ← Course catalogue
│   ├── CommunityScreen.tsx     ← Social feed
│   ├── ProfileScreen.tsx       ← User dashboard
│   ├── ProductDetailScreen.tsx ← Single product + add to cart
│   ├── CartScreen.tsx          ← Cart + Shopify checkout redirect
│   ├── CourseDetailScreen.tsx  ← Course overview + curriculum
│   ├── CoursePlayerScreen.tsx  ← Video player + progress tracking
│   ├── CourseCheckoutScreen.tsx← Stripe payment for courses
│   ├── PostDetailScreen.tsx    ← Post + comments
│   ├── NewPostScreen.tsx       ← Create post
│   └── AuthScreen.tsx          ← Sign in / sign up
├── components/
│   └── index.tsx               ← ProductCard, CourseCard, PostCard, etc.
├── navigation/
│   └── index.tsx               ← Tab + stack navigators
├── services/
│   ├── shopify.ts              ← Shopify Storefront API
│   └── api.ts                  ← Custom backend (courses, community, auth)
├── store/
│   ├── cartStore.ts            ← Zustand cart state
│   └── authStore.ts            ← Zustand auth state
└── theme/
    └── index.ts                ← Colors, typography, spacing
```

---

## Key Integration Points

### Shopify → App
The Shop tab connects directly to `lannalashes.myshopify.com` via the Storefront API.
- Products, inventory, and pricing are always live from Shopify
- Cart is created client-side and synced to Shopify
- Checkout opens Shopify's hosted checkout via `WebView` (handles payments, shipping, taxes)
- No Shopify data is stored in the custom backend

### Custom Backend → HubSpot
The backend fires HubSpot webhooks automatically on:
- User signup → creates HubSpot contact
- Course purchase → triggers onboarding email sequence  
- Course completion → triggers upsell sequence
- App signup via Shopify purchase → links CRM contact to Shopify customer

### Stripe (Courses only)
Course purchases use Stripe directly — Shopify handles shop payments.
`CourseCheckoutScreen` collects payment via `@stripe/stripe-react-native`.

---

## Next Steps to Build

These screens are defined in navigation but not yet implemented — next batch:

1. `ProductDetailScreen` — image gallery, variant selector, add to cart
2. `CartScreen` — line items, quantity controls, WebView checkout
3. `CourseDetailScreen` — curriculum, instructor, reviews
4. `CoursePlayerScreen` — Mux video player, progress tracking
5. `CourseCheckoutScreen` — Stripe payment sheet
6. `AuthScreen` — email/password + social login
7. `PostDetailScreen` — comments thread
8. `NewPostScreen` — rich text + image upload
