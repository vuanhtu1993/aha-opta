# ADR-0001: Revert Speak Your Mind Hub to Dynamic SSR and Eliminate Invalidation Boilerplate

## Status

accepted

**Domains**: 

## Context

Static ISR introduced multi-layer stale data (Client Router Cache + Full Route Cache SWR delay). Reverting to force-dynamic with cache: no-store restores instant read-your-own-writes consistency after quiz generation and aligns with the rest of /vocab routes.

## Decision

Revert Speak Your Mind Hub to Dynamic SSR and Eliminate Invalidation Boilerplate

## Consequences

The hub is dynamically rendered per request; TTFB is determined by Agent API latency (~150-200ms); all manual revalidation actions and tags are eliminated; zero stale data risk.

> Recorded by openlore decisions on 2026-10-08
> Decision ID: ad87d4c8


