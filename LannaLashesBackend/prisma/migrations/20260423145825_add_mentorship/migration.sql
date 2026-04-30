-- CreateEnum
CREATE TYPE "MentorshipPlan" AS ENUM ('monthly', 'biannual', 'annual');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'canceled', 'trialing');

-- CreateTable
CREATE TABLE "MentorshipSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "MentorshipPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipCall" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "meetUrl" TEXT,
    "recordingUrl" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipSubscription_userId_key" ON "MentorshipSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipSubscription_stripeSubscriptionId_key" ON "MentorshipSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "MentorshipSubscription_userId_idx" ON "MentorshipSubscription"("userId");

-- CreateIndex
CREATE INDEX "MentorshipSubscription_status_idx" ON "MentorshipSubscription"("status");

-- CreateIndex
CREATE INDEX "MentorshipVideo_published_publishedAt_idx" ON "MentorshipVideo"("published", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "MentorshipCall_scheduledAt_idx" ON "MentorshipCall"("scheduledAt");

-- AddForeignKey
ALTER TABLE "MentorshipSubscription" ADD CONSTRAINT "MentorshipSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
