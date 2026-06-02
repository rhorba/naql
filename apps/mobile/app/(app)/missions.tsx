import { enqueueOutbox, fetchMissions, getCachedMissions, syncOutbox } from "@/src/sync/engine";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Mission {
  id: string;
  status: string;
  originCity: string;
  destinationCity: string;
  cargo: string | null;
  clientName: string;
  startDate: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "#64748b",
  in_progress: "#f59e0b",
  completed: "#059669",
  cancelled: "#dc2626",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planifiée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const NEXT_STATUS: Record<string, string> = {
  planned: "in_progress",
  in_progress: "completed",
};

const NEXT_LABEL: Record<string, string> = {
  planned: "Démarrer",
  in_progress: "Terminer",
};

export default function MissionsScreen() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const cached = await getCachedMissions();
    setMissions(cached as Mission[]);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMissions();
    await load();
    setRefreshing(false);
  }, [load]);

  async function advanceMission(mission: Mission) {
    const next = NEXT_STATUS[mission.status];
    if (!next) return;

    const idempotencyKey = `mission-status-${mission.id}-${next}-${Date.now()}`;

    await enqueueOutbox("mission_status", "update", {
      entity: "mission_status",
      idempotencyKey,
      missionId: mission.id,
      status: next,
      timestamp: Date.now(),
    });

    // Optimistic update
    setMissions((prev) => prev.map((m) => (m.id === mission.id ? { ...m, status: next } : m)));

    syncOutbox().catch(console.error);
  }

  function confirmAdvance(mission: Mission) {
    const next = NEXT_STATUS[mission.status];
    const label = NEXT_LABEL[mission.status];
    if (!next || !label) return;

    Alert.alert(label, `${label} la mission ${mission.originCity} → ${mission.destinationCity} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: label, onPress: () => advanceMission(mission) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={missions}
        keyExtractor={(m) => m.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
        contentContainerStyle={missions.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContent}>
            <Text style={styles.emptyText}>Aucune mission assignée.</Text>
            <Text style={styles.emptySubtext}>Tirez vers le bas pour actualiser.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = STATUS_COLORS[item.status] ?? "#64748b";
          const next = NEXT_STATUS[item.status];

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text style={[styles.statusText, { color }]}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>

              <Text style={styles.route}>
                {item.originCity} → {item.destinationCity}
              </Text>
              <Text style={styles.client}>{item.clientName}</Text>
              {item.cargo && <Text style={styles.cargo}>{item.cargo}</Text>}
              <Text style={styles.date}>
                {new Date(item.startDate).toLocaleDateString("fr-MA")}
              </Text>

              {next && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => confirmAdvance(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>{NEXT_LABEL[item.status]}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  empty: { flex: 1, justifyContent: "center" },
  emptyContent: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#94a3b8", fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: "#cbd5e1", fontSize: 13, marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  route: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  client: { fontSize: 13, color: "#475569", marginBottom: 2 },
  cargo: { fontSize: 13, color: "#94a3b8", fontStyle: "italic", marginBottom: 4 },
  date: { fontSize: 12, color: "#94a3b8" },
  actionBtn: {
    marginTop: 14,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionBtnText: { color: "#f59e0b", fontSize: 14, fontWeight: "700" },
});
