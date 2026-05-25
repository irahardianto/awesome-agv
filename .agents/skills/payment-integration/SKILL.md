---
name: payment-integration
description: >-
  PCI DSS compliance, payment gateway integration, tokenization, webhook
  reliability, idempotency, fraud prevention, and subscription billing.
---

# Payment Integration Principles

Guidelines for building secure, compliant payment systems.

## When to Invoke
- Integrating payment gateways (Stripe, Adyen, etc.)
- PCI compliance requirements
- Subscription/billing system design
- Fraud prevention implementation

## Security (Non-Negotiable)

### PCI DSS Compliance
1. **Never store raw card data** — use tokenization via gateway.
2. **Never log payment credentials** — mask card numbers, CVV never stored.
3. **TLS everywhere** — all payment communication over HTTPS.
4. **Minimal data retention** — store only what's legally required.

### Tokenization Flow
```
User → Client-side SDK (Stripe.js/Elements) → Gateway tokenizes → Token to your server → Server charges via token
```
Your server never sees raw card data.

## Transaction Patterns

### Idempotency (Critical)
```
POST /api/payments
Idempotency-Key: unique-request-id-abc123

→ Gateway processes once, returns same result on retry
```
- Generate idempotency key client-side or server-side
- Store key → result mapping for deduplication
- Retry-safe — network failures don't cause double charges

### Authorization Flow
```
Authorize → Capture → Settle
         → Void (cancel before capture)
         → Refund (after capture)
```

## Webhook Handling

1. **Verify webhook signatures** — never trust unverified payloads.
2. **Idempotent processing** — webhooks may be delivered multiple times.
3. **Queue webhooks** — process asynchronously, acknowledge immediately (200 OK).
4. **Handle out-of-order delivery** — use event timestamps, not arrival order.

## Subscription Billing

### Lifecycle
```
Trial → Active → Past Due (dunning) → Cancelled/Expired
              → Upgraded/Downgraded (proration)
```

### Dunning Management
- Retry failed payments (exponential backoff: day 1, 3, 7, 14)
- Notify user before and after each retry
- Grace period before cancellation

## Fraud Prevention

1. **3D Secure (SCA)** for European payments (PSD2 requirement).
2. **Address Verification (AVS)** — match billing address.
3. **Velocity checks** — rate-limit transactions per user/IP.
4. **Risk scoring** — use gateway's built-in fraud tools.

## Testing

> For universal testing principles, see `.agents/rules/testing-strategy.md`. Below: language-specific patterns only.

1. **Sandbox/test mode** for all development — never test with real cards.
2. **Test card numbers** — cover success, decline, 3DS, and error scenarios.
3. **Webhook testing** — use gateway's webhook testing tools or local tunnels.

## Related
- Security Principles .agents/rules/security-principles.md
- API Design Principles @.agents/rules/api-design-principles.md
- Error Handling Principles .agents/rules/error-handling-principles.md
