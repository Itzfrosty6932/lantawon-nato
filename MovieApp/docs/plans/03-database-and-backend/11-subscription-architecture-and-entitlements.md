# 51. SUBSCRIPTION ARCHITECTURE

Do NOT store only:

subscription_tier = Premium

Use proper subscription entities.

## subscription_plans

- id
- code
- name
- description
- monthly_price
- yearly_price
- currency
- active

## subscription_features

- plan_id
- feature_code
- feature_value

## subscriptions

- id
- user_id
- plan_id
- provider
- external_subscription_id
- status
- current_period_start
- current_period_end
- cancel_at_period_end
- created_at
- updated_at

Statuses:

- trialing
- active
- past_due
- canceled
- incomplete
- expired

---

# 52. ENTITLEMENT ENGINE

Create a unified service:

checkEntitlement(user, resource)

Possible results:

- allowed
- requires_login
- requires_subscription
- unavailable_region
- unavailable_source
- unavailable_time
- unavailable_content

Do NOT put subscription logic directly inside every React component.

Centralize entitlement checks.

---
