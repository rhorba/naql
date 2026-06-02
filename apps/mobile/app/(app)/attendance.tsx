import { enqueueOutbox, syncOutbox } from "@/src/sync/engine";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AttendanceStatus = "present" | "absent" | "leave";

const STATUS_OPTIONS: { key: AttendanceStatus; label: string; icon: string; color: string }[] = [
  { key: "present", label: "Présent", icon: "✓", color: "#059669" },
  { key: "absent", label: "Absent", icon: "✗", color: "#dc2626" },
  { key: "leave", label: "Congé", icon: "◷", color: "#2563eb" },
];

export default function AttendanceScreen() {
  const [selected, setSelected] = useState<AttendanceStatus | null>(null);
  const [hours, setHours] = useState<number>(8);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0] as string;

  async function handleClock() {
    if (!selected) {
      Alert.alert("Sélection requise", "Choisissez un statut de présence.");
      return;
    }

    setLoading(true);

    const idempotencyKey = `attendance-${today}-${selected}`;

    await enqueueOutbox("attendance", "record", {
      entity: "attendance",
      idempotencyKey,
      date: today,
      status: selected,
      hours: selected === "present" ? hours : undefined,
      timestamp: Date.now(),
    });

    setSaved(true);
    setLoading(false);
    syncOutbox().catch(console.error);
    Alert.alert(
      "Pointage enregistré",
      `${new Date().toLocaleDateString("fr-MA")} — ${STATUS_OPTIONS.find((o) => o.key === selected)?.label}`
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>
        {new Date().toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long" })}
      </Text>
      <Text style={styles.title}>Pointage du jour</Text>

      <View style={styles.options}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.option,
              selected === opt.key && { borderColor: opt.color, backgroundColor: `${opt.color}15` },
            ]}
            onPress={() => setSelected(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionIcon, { color: opt.color }]}>{opt.icon}</Text>
            <Text
              style={[
                styles.optionLabel,
                selected === opt.key && { color: opt.color, fontWeight: "700" },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected === "present" && (
        <View style={styles.hoursRow}>
          <Text style={styles.hoursLabel}>Heures travaillées</Text>
          <View style={styles.hoursStepper}>
            <TouchableOpacity
              onPress={() => setHours((h) => Math.max(1, h - 1))}
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.hoursValue}>{hours}h</Text>
            <TouchableOpacity
              onPress={() => setHours((h) => Math.min(24, h + 1))}
              style={styles.stepBtn}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.clockBtn, (!selected || loading) && styles.clockBtnDisabled]}
        onPress={handleClock}
        disabled={!selected || loading}
        activeOpacity={0.8}
      >
        <Text style={styles.clockBtnText}>
          {loading ? "Enregistrement…" : saved ? "✓ Pointage enregistré" : "Pointer"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.syncNote}>Le pointage sera synchronisé automatiquement</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 24 },
  dateText: { fontSize: 13, color: "#94a3b8", textTransform: "capitalize", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a", marginBottom: 28 },
  options: { gap: 12, marginBottom: 28 },
  option: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  optionIcon: { fontSize: 24, width: 32, textAlign: "center" },
  optionLabel: { fontSize: 17, color: "#334155", fontWeight: "500" },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  hoursLabel: { fontSize: 15, color: "#334155", fontWeight: "600" },
  hoursStepper: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: { fontSize: 20, color: "#475569", fontWeight: "600" },
  hoursValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    minWidth: 36,
    textAlign: "center",
  },
  clockBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 16,
  },
  clockBtnDisabled: { opacity: 0.4 },
  clockBtnText: { color: "#f59e0b", fontSize: 17, fontWeight: "700" },
  syncNote: { textAlign: "center", color: "#94a3b8", fontSize: 12 },
});
