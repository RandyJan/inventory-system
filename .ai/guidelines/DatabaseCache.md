---
description: 'Guidelines for database caching strategy'
applyTo: '**/*.php'
---

# Database Cache Guidelines

## Caching Strategy

- **Prefer caching** data that is read often but changes rarely, such as settings, permissions, lookup tables, categories, and static reference data.
- **Avoid caching** highly volatile data, real-time metrics, rapidly changing counters, and request-specific results unless there is a clear performance reason and a safe invalidation strategy.
- **Keep cache usage intentional**. Add caching only when it improves performance or reduces repeated queries in a meaningful way.

## Laravel Implementation

- **Use `Cache::remember()` first** for most cases so retrieval and storage stay in one place.
- **Use `Cache::rememberForever()` sparingly** and only for data that is effectively static or has reliable invalidation.
- **Use predictable, scoped cache keys** such as `user:1:permissions`, `settings:global`, or `psgc:regions`.
- **Use explicit TTLs** with `now()->addMinutes()`, `now()->addHours()`, or `now()->addDay()` instead of vague or inconsistent expiration values.
- **Keep caching close to the data access layer** such as services, actions, or dedicated query logic, not scattered across controllers.

## Cache Invalidation

- **Invalidate on writes**. Clear affected cache keys when related models are created, updated, deleted, restored, or force deleted.
- **Use model events or observers** for invalidation when the logic is tied to model lifecycle changes.
- **Prefer targeted invalidation** over clearing unrelated keys.
- **If invalidation is complex**, centralize it in observers or dedicated services so the behavior stays maintainable.

## Practical Rules

- Do not cache a query if the invalidation story is unclear.
- Do not cache everything by default; cache the expensive or repeated reads that benefit from it.
- Keep cache keys stable and easy to search for.
- When caching collections or settings, keep the key naming consistent across the application.

## Example

```php
// Bad: query runs every time
$settings = Setting::all();

// Good: cache the result for 24 hours
$settings = Cache::remember('settings:all', now()->addDay(), function () {
    return Setting::all();
});
```
