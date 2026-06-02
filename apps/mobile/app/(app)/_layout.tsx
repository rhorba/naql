import { fetchMissions, getSyncStatus, onSyncStatus, syncOutbox } from "@/src/sync/engine";
import type { SyncStatus } from "@/src/sync/engine";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";

const SYNC_INTERVAL_MS = 30_000;

export default function AppLayout() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => {
    const unsub = onSyncStatus(setSyncStatus);

    // Initial fetch
    fetchMissions().catch(console.error);
    syncOutbox().catch(console.error);

    // Periodic sync
    const interval = setInterval(() => {
      syncOutbox().catch(console.error);
    }, SYNC_INTERVAL_MS);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const syncBadge = syncStatus === "syncing" ? "⟳" : syncStatus === "error" ? "⚠" : "";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293b" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        headerRight: () =>
          syncBadge ? (
            <Text style={{ color: "#f59e0b", marginRight: 16, fontSize: 16 }}>{syncBadge}</Text>
          ) : null,
      }}
    >
      <Tabs.Screen
        name="missions"
        options={{ title: "Missions", tabBarLabel: "Missions", tabBarIcon: () => <Text>🗺</Text> }}
      />
      <Tabs.Screen
        name="fuel"
        options={{ title: "Gasoil", tabBarLabel: "Gasoil", tabBarIcon: () => <Text>⛽</Text> }}
      />
      <Tabs.Screen
        name="attendance"
        options={{ title: "Pointage", tabBarLabel: "Pointage", tabBarIcon: () => <Text>📅</Text> }}
      />
    </Tabs>
  );
}
