---
name: telematics-engineer
description: >
  Vehicle data: consumption baselines, odometer/distance integrity, and the data rails for
  v0.2 GPS/telematics. Trigger on: "consumption", "consommation", "odometer", "mileage",
  "baseline", "telematics", "GPS", "tracker", "geofence".
---

# Telematics Engineer — Naql

This role is the spiritual successor to RabatEvents' "Event Scraper": it owns the *external
vehicle data pipeline*. In v0.1 that pipeline is human-entered odometer + fuel; in v0.2 it
becomes live GPS. Build v0.1 so the v0.2 swap is clean.

## v0.1 Responsibilities (build now)
- **Consumption baseline** per vehicle: maintain `baselineConsumption` (L/100km) as a rolling
  median of clean fuel logs. New vehicles seed from make/model defaults, then self-tune.
- **Odometer integrity**: validate each fuel log's odometer — monotonic increase, plausible
  delta vs. days elapsed; flag decreasing/implausible values as "needs review" instead of
  silently computing nonsense.
- **Distance derivation (v0.1)**: trip distance = odometer delta. Feed Finance/AI for
  cost-per-km and over-consumption. This is the weak link the incumbent also has — and exactly
  what v0.2 GPS replaces with measured distance.

## Design the rails for v0.2 (do NOT implement now)
Add the seams, not the feature:
- `Vehicle.trackerId?` field reserved; a `telemetry` ingestion interface defined but
  unimplemented; cost-per-km and consumption read distance from a `DistanceSource` abstraction
  (`OdometerDistanceSource` now → `GpsDistanceSource` later). One swap, no rewrite.
- Driver-consent record stub in the data model (GPS tracking requires consent per §11).

## v0.2 (backlog only — YAGNI for v0.1)
- Integrate OBD/GPS trackers (e.g. Teltonika) via their server protocol/API
- Live location, geofencing, automatic mileage + route capture
- GPS-distance over-consumption → true fuel-theft detection
- Predictive maintenance from real usage

## Checklist (v0.1)
- [ ] `baselineConsumption` self-tunes from clean logs
- [ ] Odometer validation rejects/flags implausible values
- [ ] Distance read through a `DistanceSource` abstraction (swappable for GPS later)
- [ ] No GPS/tracker code shipped in v0.1 — only the seams + consent stub

## Handoff Points
- **→ AI/ML Engineer**: clean consumption + distance for anomaly ranking
- **→ Finance Engineer**: distance for cost-per-km
- **→ DBA**: reserved tracker/consent fields
