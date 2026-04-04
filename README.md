# Shopify Webhooks Backend

Backend construido con NestJS para recibir, persistir y procesar webhooks de Shopify de forma asincrona usando Prisma, PostgreSQL y BullMQ.

El proyecto esta pensado como una base clara y escalable para integraciones reales: recibe eventos, valida firma HMAC, guarda trazabilidad del webhook, encola el procesamiento y delega la logica por topic en handlers separados.

## Que resuelve

- Recepcion de webhooks de Shopify
- Persistencia de eventos entrantes en `ShopifyEvent`
- Procesamiento asincrono con BullMQ
- Idempotencia por `topic + webhookId`
- Sincronizacion de recursos de negocio en base de datos
- Logs claros para seguimiento del flujo

## Stack

- NestJS
- Prisma
- PostgreSQL
- BullMQ
- Redis
- Swagger
- Insomnia

## Eventos soportados

- `orders/create`
- `orders/paid`
- `orders/fulfilled`
- `customers/create`
- `products/update`

## Arquitectura

### Flujo general

1. Shopify envia el webhook a `/api/webhooks/shopify`
2. El controller valida HMAC
3. El evento se guarda en `ShopifyEvent`
4. Si el `topic + webhookId` ya existe, se ignora por idempotencia
5. Si es nuevo, se encola en BullMQ
6. El worker toma el job y lo delega al handler correspondiente
7. El handler usa el servicio de dominio adecuado (`OrdersService`, `CustomersService`, `ProductsService`)
8. El estado del evento se actualiza a `PROCESSED` o `FAILED`


### Decisiones de arquitectura

- El controller de webhooks solo recibe, valida y encola.
- El procesamiento por topic no usa un `switch` grande; usa handlers separados.
- La idempotencia ocurre al registrar el webhook, antes del procesamiento.
- Los servicios de dominio encapsulan la logica de negocio.
- `ShopifyEvent` sirve como traza del ciclo de vida del webhook.

## Modelos principales

- `ShopifyEvent`: registro del webhook recibido, su estado y errores
- `Order`: orden sincronizada desde Shopify
- `OrderItem`: items de la orden
- `Customer`: cliente sincronizado desde Shopify
- `Product`: producto sincronizado desde Shopify

## Variables de entorno

Usa un `.env` como este:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shopify_webhooks_db?schema=public"

SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
SHOPIFY_SKIP_HMAC_VALIDATION=true
```

### Nota sobre HMAC

En desarrollo local puedes usar:

```env
SHOPIFY_SKIP_HMAC_VALIDATION=true
```

Con eso, el backend acepta un valor dummy en `x-shopify-hmac-sha256`.

## Levantar el proyecto

### 1. Instalar dependencias

```bash
npm install
```

### 2. Levantar infraestructura

Necesitas:

- PostgreSQL
- Redis

Si estas usando Docker:

```bash
docker-compose up -d
```

### 3. Ejecutar migraciones

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Iniciar el backend

```bash
npm run start:dev
```

La API quedara disponible en:

- `http://localhost:3000/api`
- Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Probar webhooks

### Endpoint

```http
POST /api/webhooks/shopify
```

### Headers esperados

- `x-shopify-topic`
- `x-shopify-shop-domain`
- `x-shopify-webhook-id`
- `x-shopify-api-version`
- `x-shopify-hmac-sha256`

## Probar con Insomnia

Se incluye una coleccion lista para importar:

- [`docs/insomnia-shopify-webhooks.json`](/Users/martinhernandez/workana-portfolio/shopify-webhooks-backend-nest/docs/insomnia-shopify-webhooks.json)
- [`docs/insomnia-testing.md`](/Users/martinhernandez/workana-portfolio/shopify-webhooks-backend-nest/docs/insomnia-testing.md)

### Importacion

1. Abrir Insomnia
2. Elegir `Import`
3. Elegir `From Clipboard` o archivo
4. Importar `docs/insomnia-shopify-webhooks.json`

### Orden recomendada de prueba

1. `orders/create`
2. `orders/paid`
3. `orders/fulfilled`
4. `customers/create`
5. `products/update`
6. repetir un mismo request con el mismo `x-shopify-webhook-id` para validar idempotencia

### Regla importante para probar

- `x-shopify-webhook-id` identifica la entrega del webhook
- `body.id` identifica el recurso de Shopify

Ejemplo:

- si quieres reprocesar el mismo tipo de webhook, cambia `x-shopify-webhook-id`
- si quieres actualizar la misma orden, conserva `body.id`
- si quieres probar otra orden, cambia `body.id` y usa tambien otro `x-shopify-webhook-id`

## Idempotencia

El proyecto evita reprocesar el mismo webhook mas de una vez usando:

```text
topic + webhookId
```

Si llega dos veces el mismo webhook:

- la primera vez se registra y se encola
- la segunda vez se detecta como duplicado y se ignora

Esto evita procesamientos repetidos por reintentos de Shopify o pruebas manuales duplicadas.

## Estados del webhook

`ShopifyEvent` puede pasar por estos estados:

- `RECEIVED`
- `QUEUED`
- `PROCESSING`
- `PROCESSED`
- `FAILED`
- `REJECTED`

## Logs

El backend registra eventos clave del flujo:

- evento recibido
- evento encolado
- evento procesandose
- evento procesado
- evento fallido

Esto facilita depuracion local y da buena trazabilidad en una integracion real.

## Scripts utiles

```bash
npm run start:dev
npm run build
npm run test
npx prisma migrate dev
npx prisma generate
```

## Estado del proyecto

Este proyecto esta preparado como base de integracion Shopify orientada a portafolio y a crecimiento incremental. La arquitectura ya soporta agregar nuevos topics creando un handler nuevo y registrandolo en el router de webhooks.
