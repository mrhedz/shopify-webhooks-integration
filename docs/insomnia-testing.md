# Insomnia testing

## Importar la coleccion

1. Abrir Insomnia.
2. Ir a `Create` o `Import`.
3. Elegir `From Clipboard`.
4. Pegar el contenido de `docs/insomnia-shopify-webhooks.json`.

## Variables

- `base_url`: por defecto `http://localhost:3000`
- `webhook_url`: `{{ _.base_url }}/api/webhooks/shopify`
- `shop_domain`: dominio de la tienda
- `api_version`: version del webhook
- `dummy_hmac`: cualquier valor mientras `SHOPIFY_SKIP_HMAC_VALIDATION=true`

## Orden recomendado de prueba

1. Ejecutar `orders/create`
2. Ejecutar `orders/paid`
3. Ejecutar `orders/fulfilled`
4. Ejecutar `customers/create`
5. Ejecutar `products/update`
6. Ejecutar `orders/create duplicate` para validar idempotencia

## Que deberias ver

- La respuesta del endpoint debe ser `200 OK`
- En la primera ejecucion de cada request:
  - `ok: true`
  - mensaje de webhook recibido y encolado
- En `orders/create duplicate`:
  - `ok: true`
  - `duplicate: true`
  - mensaje indicando que ya habia sido recibido

## Si quieres reprocesar un webhook

Cambia el header `x-shopify-webhook-id` por un valor nuevo. Si dejas el mismo `topic + webhookId`, el backend lo ignorara por idempotencia.

## HMAC real

Si pones `SHOPIFY_SKIP_HMAC_VALIDATION=false`, entonces `x-shopify-hmac-sha256` ya no puede ser dummy. En ese caso hay que firmar el `raw body` con `SHOPIFY_WEBHOOK_SECRET`.
