# Files

- [Attendance Counting Flow](attendance-flow.md) - End-to-end flow of a congregant tap from the physical kiosk device, through optimistic local state, offline queue, batch HTTP sync, TTL cache invalidation, live stats aggregation, to the Videotron display. Traces all four SQLAlchemy models and both Zustand stores.
- [Offline-First Sync Design](offline-sync.md) - Design of the offline-first batch synchronization system for kiosk attendance taps: client-generated idempotent UUIDs, local persistence via Zustand persist middleware, background auto-sync on connectivity recovery with a 6-second retry interval, cooldown debouncing, and server-side cache invalidation after successful sync.
