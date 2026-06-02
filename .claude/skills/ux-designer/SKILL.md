---
name: ux-designer
description: >
  UX flows and wireframes for Naql: dashboard module flows + the offline-first driver app.
  Trigger on: "user flow", "wireframe", "UX", "onboarding", "screen design", "navigation",
  or before new page/feature frontend or mobile work.
---
# UX Designer — Naql

## UX Principles (from CLAUDE.md §10)
1. Kill manual entry — prefer camera/app capture over typing
2. Money is sacred — exact, attributed, auditable
3. Offline is normal — driver app fully usable with no signal
4. One-person mode — solo owner runs everything without role friction
5. Alerts that matter — expiry, overdue, over-consumption, renewals; no spam
6. Profitability is the headline — home answers "am I making money, per truck/client?"
7. RTL is equal
8. Fast on cheap phones / slow networks

## Dashboard — Home (Owner) Wireframe
```
┌───────────────────────────────────────────────────────────────┐
│ Naql   Transport Demo SARL        [Jamal · Owner] [FR|AR] [⚙] │
├──────────────┬────────────────────────────────────────────────┤
│ EXPLOITATION │  Revenu  | Coûts  | RÉSULTAT NET | Trésorerie    │
│  Dashboard   │  240 000 | 180 000|   +60 000    |  35 000  MAD  │
│  Missions    │ ────────────────────────────────────────────────│
│  Flotte      │  Marge par véhicule        Marge par client      │
│  Gasoil      │  50387  +18 000  2.4 MAD/km   ACME   +22 000     │
│  Consommation│  73472   +9 000  3.1 MAD/km   ...                │
│  Surconso ⚠2 │ ────────────────────────────────────────────────│
│  Documents⚠1 │  ⚠ Alertes: 1 assurance expire (8j) · 1 facture │
│  Disponibilité│     en retard · 2 surconsommations              │
│ COMMERCIAL…  │  Missions actives (4)   ·   Flotte: 2/3 dispo    │
│ RH…          │                                                  │
└──────────────┴────────────────────────────────────────────────┘
```

## Mission Lifecycle Flow
```
Créer mission → assigner véhicule + chauffeur → [chauffeur: en cours → terminé via app]
  → terminé → générer facture → suivre paiement → payé
```

## Driver App Flow (offline-first)
```
Login → Aujourd'hui (mes missions)
  ├── Tap mission → changer statut (en cours / terminé)
  ├── Plein de carburant → litres/prix/compteur + 📷 reçu  (file d'attente si hors-ligne)
  ├── Preuve de livraison → 📷 photo + signature → attachée à la mission
  └── Pointage → entrée/sortie
Barre de sync visible: ● hors-ligne / ⟳ en attente (N) / ✓ synchronisé
```

## Onboarding (new tenant)
```
Signup (société + email + mot de passe) → org créée → tableau de bord avec données démo
  → "Ajoutez votre premier camion" CTA → inviter chauffeurs
```

## Empty States
- No vehicles: "Aucun véhicule. Ajoutez votre premier camion. [+ Ajouter]"
- No missions: "Aucune mission. Planifiez une mission. [+ Nouvelle mission]"
- Driver, no assignment: "Aucune mission aujourd'hui."

## Handoff Points
- **→ UI Designer**: wireframes for visual layer
- **→ Frontend Dev / Mobile Dev**: flows + screen specs
