ALTER TABLE "ShopifyEvent"
ADD COLUMN "resourceId" TEXT,
ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "ShopifyEvent_idempotencyKey_key" ON "ShopifyEvent"("idempotencyKey");
CREATE INDEX "ShopifyEvent_resourceId_idx" ON "ShopifyEvent"("resourceId");

DROP INDEX IF EXISTS "ShopifyEvent_topic_webhookId_key";
