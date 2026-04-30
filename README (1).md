# Lanna Lashes — Backend API

Node.js + Express + PostgreSQL backend powering the Lanna Lashes app's education and community features.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 + TypeScript |
| Framework | Express 4 |
| Database | PostgreSQL + Prisma ORM |
| Payments | Stripe (course purchases) |
| CRM | HubSpot (contact sync + events) |
| File storage | AWS S3 (community images) |
| Video | Mux (course video hosting) |
| Auth | JWT (30-day tokens) |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Fill in all values in .env

# 3. Set up the database
npx prisma migrate dev --name init
npx prisma generate

# 4. (Optional) Seed with sample data
npm run db:seed

# 5. Start development server
npm run dev
# API running at http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account |
| POST | `/api/auth/signin` | — | Sign in, get JWT |
| GET | `/api/auth/me` | ✓ | Get current user |
| PUT | `/api/auth/profile` | ✓ | Update name/avatar |

### Courses
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/courses` | optional | List published courses |
| GET | `/api/courses/:slug` | optional | Single course + curriculum |

Query params for GET `/api/courses`: `level=beginner|intermediate|advanced`, `category=string`

### Enrollments
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/enrollments` | ✓ | My enrollments |
| GET | `/api/enrollments/:courseId` | ✓ | Single enrollment |
| POST | `/api/enrollments` | ✓ | Create enrollment (post-payment) |

### Progress
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/progress` | ✓ | Update lesson progress (seconds watched) |
| POST | `/api/progress/complete` | ✓ | Mark lesson complete |

### Community
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/community/stats` | — | Member count, posts today, live count |
| GET | `/api/community/posts` | optional | Paginated post feed |
| POST | `/api/community/posts` | ✓ | Create post |
| POST | `/api/community/posts/:id/like` | ✓ | Toggle like |
| GET | `/api/community/posts/:id/comments` | optional | Get comments |
| POST | `/api/community/posts/:id/comments` | ✓ | Add comment |

Query params for GET `/api/community/posts`: `tag=question|inspo|my_work|tip|general`, `cursor=string`

### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-intent` | ✓ | Create Stripe PaymentIntent for course |

### Shopify
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/shopify/orders` | ✓ | User's Shopify order history |

### Uploads
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/uploads/presign` | ✓ | Get S3 presigned URL for image upload |

### Webhooks
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/webhooks/stripe` | Stripe sig | Handle payment_intent.succeeded |

---

## Stripe Setup

1. Create account at stripe.com
2. Get your **Secret Key** and **Publishable Key** from the Dashboard
3. Set up a webhook endpoint pointing to `https://api.lannalashes.com/webhooks/stripe`
4. Enable event: `payment_intent.succeeded`
5. Copy the **Webhook Signing Secret** to `STRIPE_WEBHOOK_SECRET` in `.env`

### Test the payment flow locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/webhooks/stripe
```

---

## HubSpot Setup

1. In HubSpot: Settings → Integrations → Private Apps → Create
2. Scopes needed: `crm.objects.contacts.write`, `crm.objects.contacts.read`, `timeline`
3. Copy the access token to `HUBSPOT_ACCESS_TOKEN`

### Timeline Events (for automation triggers)
Create custom timeline event templates in HubSpot:
1. Settings → Objects → Timeline events → Create event type
2. Create: `course_purchased` and `course_completed`
3. Copy the template IDs to `.env`

These events trigger HubSpot workflows — e.g.:
- `course_purchased` → send welcome email sequence
- `course_completed` → send certificate + upsell next course

---

## Mux Video Setup

1. Sign up at mux.com
2. Create an environment
3. Upload course videos via the Mux dashboard or API
4. Copy playback URLs into the `Lesson.videoUrl` field in the database
5. Set `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` in `.env` for signed URLs

---

## Database

```bash
# View and edit data with Prisma Studio
npm run db:studio

# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name

# Reset database (dev only)
npx prisma migrate reset
```

### Key relationships
- `User` → many `Enrollment` (one per course)
- `Course` → many `Module` → many `Lesson`
- `Enrollment` tracks `progressPercent` and `completedAt`
- `LessonProgress` stores per-lesson `progressSeconds` and `completedAt`
- `Post` → many `Comment`, `PostLike`

---

## Deployment

### Railway (recommended for simplicity)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway add postgresql
```

### Environment variables on Railway
Set all values from `.env.example` in your Railway project dashboard.

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
CMD ["node", "dist/index.js"]
```

---

## Project Structure

```
src/
├── index.ts                  ← Express app + middleware setup
├── routes/
│   ├── auth.ts               ← Signup, signin, profile
│   ├── courses.ts            ← Course listing + detail
│   ├── enrollments.ts        ← Enrollment management + progress
│   ├── progress.ts           ← Lesson progress tracking
│   ├── community.ts          ← Posts, comments, likes
│   ├── payments.ts           ← Stripe PaymentIntent creation
│   ├── shopify.ts            ← Shopify order history proxy
│   ├── uploads.ts            ← S3 presigned URLs
│   └── webhooks.ts           ← Stripe webhook handler
├── middleware/
│   └── auth.ts               ← JWT verification middleware
└── services/
    ├── db.ts                 ← Prisma client singleton
    ├── hubspot.ts            ← HubSpot CRM sync
    └── logger.ts             ← Winston logger
prisma/
└── schema.prisma             ← Database schema
```
