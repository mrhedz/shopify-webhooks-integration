-- CreateEnum
CREATE TYPE "ShopifyEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'REJECTED');

-- CreateTable
CREATE TABLE "ShopifyEvent" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "webhookId" TEXT,
    "apiVersion" TEXT,
    "payload" JSONB NOT NULL,
    "hmacValid" BOOLEAN NOT NULL,
    "status" "ShopifyEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopifyEvent_topic_idx" ON "ShopifyEvent"("topic");

-- CreateIndex
CREATE INDEX "ShopifyEvent_shopDomain_idx" ON "ShopifyEvent"("shopDomain");

-- CreateIndex
CREATE INDEX "ShopifyEvent_status_idx" ON "ShopifyEvent"("status");
