---
type: workflow guide
title: Kiosk Counter Usher Workflow
description: >-
  Step-by-step operator workflow for ushers operating the tablet kiosk at a
  church entrance: QR code scanning, POS token validation, two-button choice
  (Umat Paroki Bintaro vs Luar Paroki), haptic/audio feedback, offline queue
  behavior, sync status indicator, fullscreen mode, and recovery procedures.
tags:
  - kiosk
  - usher-workflow
  - offline-first
  - attendance
verified:
  - by: openwiki/0.5.1
    at: 2026-10-04T04:05:02.987Z
sources:
  - id: openwiki-source-3e66ab9d09de28631950db70
    resource: repo://app/routers/counter.py
  - id: openwiki-source-bfb20875c0af4bb96f6a2217
    resource: repo://frontend/src/pages/KioskPage.tsx
  - id: openwiki-source-514065a0c592c64e7606a063
    resource: repo://frontend/src/store/offlineQueueStore.ts
generated: { by: "openwiki/0.5.1", at: "2026-10-04T04:05:02.987Z" }
---

# Kiosk Counter Usher Workflow

## Overview

The kiosk counter is a tablet-based attendance recording station operated by
ushers (petugas) at church entrances. After scanning a QR code that carries a
POS token, the usher sees a fullscreen kiosk page with two large touch buttons:
"Umat Paroki Bintaro" and "Umat Luar Paroki". Each tap is recorded instantly
on the local device, queued for server sync, and acknowledged with haptic
(vibration), audio (two-tone chime), and visual (green check overlay) feedback.

## Actors

- **Petugas / Usher** -- operates the tablet at a physical door
- **Umat / Congregant** -- enters through the door, answers the usher's
  question

## Entrypoint

The usher navigates to the kiosk page by scanning a QR code that points to
`/pos/{token}`. The React SPA in `repo://frontend/src/App.tsx#L23-L25` detects
the path prefix and renders `KioskPage` with the extracted token:

```typescript
if (path.startsWith('/pos/')) {
  const token = path.replace('/pos/', '').trim();
  return <KioskPage token={token} />;
}
```

The QR code is scoped to a specific `EventPos` record. Each event has one
`EventPos` per physical door, each with a unique `token` (a UUID hex string).
Only `is_active = true` tokens are accepted.

## Step-by-step workflow

### 1. Startup: Token validation

When `KioskPage` mounts, it calls `GET /api/counter/validate/{token}`
(`repo://app/routers/counter.py#L16-L36`). This endpoint:

1. Queries `EventPos` by `token` and `is_active == True`. Returns 404 if
   invalid.
2. Queries the parent `EventSession`. Returns 404 if not found.
3. Returns `event_id`, `event_name`, `category`, `event_status`, `pos_id`,
   `building`, `pos_name`, `pos_code`, `start_time`.

**On success:** The kiosk header shows the event name, category badge,
building name, and POS name. The two touch buttons become interactive.

**On failure (404):** A rose/red error screen is displayed with the message
"Tautan Pos Tidak Aktif" and instructions to contact the Litbang / Sekretariat
Paroki for a new QR link. Source: `repo://frontend/src/pages/KioskPage.tsx#L142-L155`.

### 2. Normal tap operation

The usher asks each congregant entering the door:

> "Apakah Umat Paroki Bintaro?"

The congregant answers yes (Paroki Bintaro) or no (Luar Paroki). The usher
taps the corresponding button.

#### Sequence of a single tap

<!-- openwiki: mermaid parse failed and this diagram was converted to a text fence so it does not break rendering. Fix the diagram source and restore the mermaid fence. Parser error: Heuristic: an unescaped angle bracket inside a label breaks rendering; rephrase the label. -->
```text
sequenceDiagram
    participant Petugas as Petugas (Usher)
    participant Kiosk as KioskPage
    participant Store as offlineQueueStore
    participant LS as localStorage
    participant API as FastAPI Backend

    Note over Petugas,API: Tap Recording (always succeeds, < 5ms)
    Petugas->>Kiosk: touches choice button
    Kiosk->>Kiosk: isCooldown guard (500ms debounce)
    Kiosk->>Kiosk: set successFeedback overlay
    Kiosk->>Store: recordTap(posToken, choiceCode)
    Store->>Store: navigator.vibrate(35) + audio chime
    Store->>Store: crypto.randomUUID() -> tap id
    Store->>Store: increment posCounters (optimistic tally)
    Store->>LS: persist queue + counters
    Store-->>Kiosk: state updated
    Kiosk-->>Petugas: green overlay "Terima Kasih!" + checkmark

    Note over Petugas,API: Background Sync (fire-and-forget)
    Store->>API: POST /api/counter/{token}/sync (batch)
    alt Online + success
        API->>API: idempotency check by UUID
        API->>API: bulk_save_objects AttendanceLog
        API->>API: invalidate live stats cache
        API-->>Store: { synced_count, already_existed_count }
        Store->>LS: prune synced IDs from queue
    else Offline or failure
        Store->>Store: keep item in queue
        Note over Store: retried via heartbeat (6s) or reconnect
    end
```

*Caption: Complete sequence from usher tap through local recording, optimistic
counter update, and background sync attempt.*

### 3. Feedback the usher receives

| Feedback type | Mechanism | Duration / detail | Source |
|---|---|---|---|
| **Haptic** | `navigator.vibrate(35)` | 35ms vibration on supported devices | `repo://frontend/src/store/offlineQueueStore.ts#L74-L78` |
| **Audio** | Web Audio API, two sine oscillators | D5 (587Hz) then A5 (880Hz), ~180ms total | `repo://frontend/src/store/offlineQueueStore.ts#L6-L38` |
| **Visual ripple** | CSS `animate-ping` on touched card | 250ms animation | `repo://frontend/src/pages/KioskPage.tsx#L101` |
| **Center overlay** | Green checkmark + "Terima Kasih!" + choice label | 500ms visible, then auto-dismiss | `repo://frontend/src/pages/KioskPage.tsx#L102-L119` |
| **Footer tally** | Local count (Total / Bintaro / Luar) updates instantly | Updates on every tap, per-POS | `repo://frontend/src/pages/KioskPage.tsx#L307-L318` |

The audio and haptic feedback fire from within `recordTap` and are not
affected by network state. The visual overlay and tally update are React
state changes that happen synchronously.

### 4. Two-button choice cards

**Card 1: Umat Paroki Bintaro**

- Blue gradient background (`from-blue-600 to-blue-800`)
- Church icon (Lucide `Church`)
- Subtitle: "St. Matius Penginjil"
- On tap: turns bright blue (`bg-blue-500`), white border, ring glow

**Card 2: Umat Luar Paroki**

- Amber gradient background (`from-amber-600 to-amber-800`)
- Globe icon (Lucide `Globe`)
- Subtitle: "Tamu / Luar Bintaro"
- On tap: turns bright amber (`bg-amber-500`), white border, ring glow

Both buttons are disabled when the event status is `COMPLETED` (opacity 50%,
`cursor-not-allowed`). Source: `repo://frontend/src/pages/KioskPage.tsx#L250-L301`.

### 5. Sync status indicator

The header bar contains a combined network-and-sync status button
(`repo://frontend/src/pages/KioskPage.tsx#L186-L220`):

| State | Visual | Text label |
|---|---|---|
| **Online, empty queue** | Green badge (`bg-emerald-950/60`, `border-emerald-600/50`) | "Online" |
| **Pending items** | Amber pulsing badge (`bg-amber-950/60`, `animate-pulse`) | "{N} tersimpan lokal" |
| **Syncing in progress** | Spinning refresh icon | "Kirim {N}..." |
| **Offline** | Rose badge (`bg-rose-950/60`) | "Offline" |

Clicking the button manually triggers `syncQueue(token)` (disabled during
active sync).

### 6. Footer: quick tally and offline mode reassurance

The footer (`repo://frontend/src/pages/KioskPage.tsx#L306-L331`) shows:

- **Total Pos Ini** -- total taps at this door in the current session
- **Bintaro** -- blue-colored count of Paroki Bintaro taps
- **Luar** -- amber-colored count of Luar Paroki taps
- When offline, an amber message "Mode Offline Aktif" is displayed

These counters are sourced from `posCounters[posToken]` in the Zustand store,
which is persisted in `localStorage` and survives page reloads.

### 7. Fullscreen mode

The fullscreen button (expand icon) in the header calls
`document.documentElement.requestFullscreen()`. This is useful for dedicated
kiosk tablets where the browser chrome should be hidden. Source:
`repo://frontend/src/pages/KioskPage.tsx#L122-L130`.

### 8. Event-completed state

When the event status is `COMPLETED`:

- Both touch buttons are disabled with reduced opacity
- An "Event Selesai" chip appears next to the POS name in the header
- The `handleTouchChoice` function returns early if
  `posInfo.event_status === 'COMPLETED'`
- The sync endpoint also rejects new taps for completed events (returns
  `synced_count: 0`)

Source: `repo://frontend/src/pages/KioskPage.tsx#L97`, `repo://app/routers/counter.py#L52-L58`.

## Offline behavior

### When the network is unavailable

1. The usher continues tapping normally -- every tap is recorded to the local
   Zustand queue and persisted to `localStorage`.
2. The footer shows "Mode Offline Aktif" in amber.
3. The header badge shows "Offline".
4. The background sync attempt fails silently; the tap item remains in the
   queue.

### When the network recovers

1. The `window` `online` event fires and immediately calls `syncQueue(token)`.
2. A 6-second heartbeat `setInterval` also retries sync when
   `navigator.onLine && pendingCount > 0 && !isSyncing`.
3. All queued items are sent as a batch to `POST /api/counter/{token}/sync`.
4. Successfully synced items are pruned from the queue by UUID.
5. The counters in `posCounters` remain unchanged (they are the optimistic
   total, not server-verified).

Source: `repo://frontend/src/pages/KioskPage.tsx#L69-L93`.

### Queue persistence

The Zustand store uses `zustand/middleware/persist` with storage key
`'paroki-kiosk-offline-queue'`. Only `queue` and `posCounters` are persisted;
transient state (`isSyncing`, `isOnline`, `lastSyncError`, `lastSyncSuccess`)
is not. This means:

- If the browser crashes, the queue and counters survive.
- If the page is reloaded, the kiosk re-validates the token (network call) but
  preserves pending items.

Source: `repo://frontend/src/store/offlineQueueStore.ts#L176-L182`.

## Error and edge case recovery

| Scenario | User-visible behavior | Recovery |
|---|---|---|
| **Token invalid (404)** | Rose error screen: "Tautan Pos Tidak Aktif" | Contact Litbang/Sekretariat for new QR code |
| **Event completed** | Buttons disabled, "Event Selesai" chip shown | No action possible; event is closed |
| **Double-tap (accidental)** | Second tap is ignored within 500ms cooldown | No action needed; guard is automatic |
| **Network down** | "Offline" badge + "Mode Offline Aktif" footer | Taps are queued locally; sync on reconnect |
| **Sync failure (4xx/5xx)** | Items remain in queue; heartbeat retries | Automatic retry every 6s |
| **Browser crash mid-tap** | Queue is in localStorage; state restored on reload | Kiosk re-validates token, resumes |
| **Concurrent sync** | `isSyncing` flag prevents duplicate requests | Second call returns early |

## Configuration knobs relevant to the usher experience

| Parameter | Default | Effect on workflow | Location |
|---|---|---|---|
| Cooldown debounce | 500ms | Prevents accidental double-taps | `repo://frontend/src/pages/KioskPage.tsx#L100` |
| Success overlay duration | 500ms + 250ms ripple | How long the green check stays visible | `repo://frontend/src/pages/KioskPage.tsx#L110-L119` |
| Sync heartbeat | 6000ms | How often offline items retry sync | `repo://frontend/src/pages/KioskPage.tsx#L82-L86` |
| Haptic vibration | 35ms | Tactile confirmation on supported devices | `repo://frontend/src/store/offlineQueueStore.ts#L76` |
| Audio chime | D5 (587Hz) + A5 (880Hz) | Auditory confirmation | `repo://frontend/src/store/offlineQueueStore.ts#L12-L34` |

## Focused tests

The integration test suite in `repo://tests/test_api.py` covers the server-side
counter workflow that the usher's kiosk depends on:

- **`test_create_event_and_counter_flow`** (`repo://tests/test_api.py#L91-L179`):
  Validates a POS token, submits two taps (PAROKI_BINTARO and LUAR_PAROKI),
  verifies `synced_count == 2`, tests idempotency by retrying the same batch
  (`synced_count == 0`, `already_existed_count == 2`), and verifies live stats
  aggregate correctly (total=2, PB=1, LP=1, 50/50 percentages). This test
  validates the exact contract the kiosk frontend relies on.

## Related pages

- [/openwiki/concepts/attendance-flow.md](/openwiki/concepts/attendance-flow.md) --
  end-to-end attendance flow including all four layers (kiosk, sync, cache,
  Videotron).
- [/openwiki/concepts/offline-sync.md](/openwiki/concepts/offline-sync.md) --
  deeper treatment of the offline queue design, idempotency, and retry
  strategy.
- [/openwiki/architecture/data-model.md](/openwiki/architecture/data-model.md) --
  detailed ORM model specification for `AttendanceLog`, `EventSession`,
  `EventPos`, `MasterPos`.
