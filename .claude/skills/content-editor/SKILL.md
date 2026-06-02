---
name: content-editor
description: >
  Bilingual content for Naql: French (primary) + Arabic (secondary) for all UI strings,
  module labels, statuses, invoice/payroll terms, alerts, form copy. Trigger on: "translation",
  "i18n", "fr.json", "ar.json", "copy", "label", or any user-facing text work.
---

# Content Editor — Naql

## Voice
- **Operational, not salesy**: "Suivez vos missions et votre flotte." (no "amazing", no FOMO)
- **Concrete**: "Marge par véhicule", "Coût par km", "Facture en retard"
- **Trustworthy about money**: amounts always with currency; "TVA 20 %", "Total TTC"
- **Respectful Arabic**: designed phrasing, RTL-correct; not literal machine translation

## Shared between web + mobile
Statuses, categories, and money labels live in one catalog reused by `apps/web` (next-intl)
and `apps/mobile` (shared message keys). Keep keys identical across platforms.

## French (apps/web/messages/fr.json) — core keys
```json
{
  "nav": {
    "dashboard": "Tableau de bord", "missions": "Missions", "fleet": "Flotte",
    "fuel": "Gasoil", "consumption": "Consommation", "overconsumption": "Surconsommation",
    "vehicleDocs": "Documents véhicules", "alerts": "Alertes", "availability": "Disponibilité",
    "clients": "Clients", "invoicing": "Facturation", "payments": "Paiements",
    "cash": "Caisse", "bank": "Banque", "expenses": "Dépenses",
    "profitability": "Rentabilité / Résultat",
    "employees": "Employés", "attendance": "Pointage", "advances": "Avances",
    "payroll": "Paie", "contracts": "Contrats", "settings": "Paramètres"
  },
  "common": {
    "add": "Ajouter", "edit": "Modifier", "save": "Enregistrer", "cancel": "Annuler",
    "delete": "Supprimer", "search": "Rechercher", "total": "Total", "subtotal": "Sous-total",
    "vat": "TVA", "amount": "Montant", "date": "Date", "status": "Statut",
    "loading": "Chargement…", "noResults": "Aucun résultat.", "confirm": "Confirmer"
  },
  "vehicle": {
    "code": "Code", "registration": "Immatriculation", "make": "Marque", "model": "Modèle",
    "totalVehicles": "Total véhicules",
    "status": { "available": "Disponible", "on_mission": "En mission",
      "maintenance": "En maintenance", "out_of_service": "Hors service" }
  },
  "mission": {
    "status": { "planned": "Planifiée", "in_progress": "En cours", "completed": "Terminée",
      "invoiced": "Facturée", "cancelled": "Annulée" },
    "origin": "Départ", "destination": "Destination", "cargo": "Marchandise",
    "agreedPrice": "Prix convenu", "proofOfDelivery": "Preuve de livraison"
  },
  "fuel": {
    "litres": "Litres", "pricePerLitre": "Prix/litre", "odometer": "Compteur",
    "station": "Station", "scanReceipt": "Scanner le reçu", "consumption": "Consommation (L/100km)"
  },
  "invoice": {
    "number": "N° de facture", "issueDate": "Date d'émission", "dueDate": "Échéance",
    "ice": "ICE", "creditNote": "Avoir",
    "status": { "draft": "Brouillon", "sent": "Envoyée", "partial": "Partielle",
      "paid": "Payée", "overdue": "En retard", "cancelled": "Annulée" }
  },
  "finance": {
    "revenue": "Revenu", "costs": "Coûts", "netResult": "Résultat net", "cash": "Trésorerie",
    "marginPerVehicle": "Marge par véhicule", "marginPerClient": "Marge par client",
    "costPerKm": "Coût par km", "outstanding": "Encours"
  },
  "hr": {
    "baseSalary": "Salaire de base", "net": "Net à payer", "advance": "Avance",
    "contractType": "Type de contrat", "contractEnds": "Fin de contrat",
    "attendance": { "present": "Présent", "absent": "Absent", "leave": "Congé" },
    "runPayroll": "Lancer la paie"
  },
  "alerts": {
    "docExpiring": "Document expire dans {days} j",
    "licenseExpiring": "Permis expire dans {days} j",
    "invoiceOverdue": "Facture en retard",
    "contractRenewal": "Contrat à renouveler",
    "overconsumption": "Surconsommation détectée"
  },
  "sync": { "offline": "Hors ligne", "pending": "En attente ({n})",
    "syncing": "Synchronisation…", "synced": "Synchronisé", "syncNow": "Synchroniser" },
  "auth": { "login": "Connexion", "email": "Email", "password": "Mot de passe",
    "signup": "Créer un compte", "company": "Société" }
}
```

## Arabic (apps/web/messages/ar.json) — core keys (RTL)
```json
{
  "nav": {
    "dashboard": "لوحة التحكم", "missions": "المهام", "fleet": "الأسطول",
    "fuel": "الوقود", "consumption": "الاستهلاك", "overconsumption": "الاستهلاك المفرط",
    "vehicleDocs": "وثائق المركبات", "alerts": "التنبيهات", "availability": "التوفر",
    "clients": "العملاء", "invoicing": "الفوترة", "payments": "المدفوعات",
    "cash": "الصندوق", "bank": "البنك", "expenses": "المصاريف",
    "profitability": "الربحية / النتيجة",
    "employees": "الموظفون", "attendance": "الحضور", "advances": "السلف",
    "payroll": "الأجور", "contracts": "العقود", "settings": "الإعدادات"
  },
  "common": {
    "add": "إضافة", "edit": "تعديل", "save": "حفظ", "cancel": "إلغاء", "delete": "حذف",
    "search": "بحث", "total": "المجموع", "subtotal": "المجموع الفرعي", "vat": "الضريبة",
    "amount": "المبلغ", "date": "التاريخ", "status": "الحالة", "loading": "جارٍ التحميل…",
    "noResults": "لا توجد نتائج.", "confirm": "تأكيد"
  },
  "mission": {
    "status": { "planned": "مخططة", "in_progress": "قيد التنفيذ", "completed": "مكتملة",
      "invoiced": "مفوترة", "cancelled": "ملغاة" }
  },
  "invoice": {
    "status": { "draft": "مسودة", "sent": "مرسلة", "partial": "جزئية",
      "paid": "مدفوعة", "overdue": "متأخرة", "cancelled": "ملغاة" }
  },
  "finance": {
    "revenue": "الإيرادات", "costs": "التكاليف", "netResult": "النتيجة الصافية",
    "marginPerVehicle": "الهامش لكل مركبة", "costPerKm": "التكلفة لكل كم"
  },
  "sync": { "offline": "غير متصل", "pending": "في الانتظار ({n})",
    "syncing": "جارٍ المزامنة…", "synced": "تمت المزامنة", "syncNow": "مزامنة الآن" },
  "auth": { "login": "تسجيل الدخول", "email": "البريد الإلكتروني",
    "password": "كلمة المرور", "signup": "إنشاء حساب", "company": "الشركة" }
}
```

## Rules
- Zero hardcoded user-facing strings (audited by grep in Sprint 6).
- Currency via locale formatter; never bake "MAD" into a translation string.
- Interpolation keys (`{days}`, `{n}`) identical across FR/AR.
- Invoice/payroll terms must match the legal/accounting vocabulary (TVA, ICE, Net à payer).

## Handoff Points
- **→ Frontend Dev / Mobile Dev**: completed fr.json + ar.json + shared keys
- **← Finance / HR Engineers**: exact invoice/payroll terminology
