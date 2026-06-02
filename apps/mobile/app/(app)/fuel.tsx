import { enqueueOutbox, syncOutbox } from "@/src/sync/engine";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function FuelScreen() {
  const [litres, setLitres] = useState("");
  const [pricePerLitre, setPricePerLitre] = useState("");
  const [odometer, setOdometer] = useState("");
  const [station, setStation] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [_saved, setSaved] = useState(false);

  async function pickReceipt() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à l'appareil photo est nécessaire.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    const l = Number.parseFloat(litres);
    const ppl = Number.parseFloat(pricePerLitre);

    if (!l || l <= 0 || !ppl || ppl <= 0) {
      Alert.alert("Champs requis", "Veuillez remplir les litres et le prix.");
      return;
    }

    setLoading(true);

    const localId = `fuel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const idempotencyKey = localId;

    await enqueueOutbox("fuel_log", "create", {
      entity: "fuel_log",
      idempotencyKey,
      localId,
      vehicleId: "VEHICLE_FROM_CONTEXT", // In full implementation, comes from driver's active mission
      litres: l,
      pricePerLitre: Math.round(ppl * 100), // MAD → centimes
      odometer: odometer ? Number.parseInt(odometer, 10) : undefined,
      station: station || undefined,
      filledAt: Date.now(),
      receiptUrl: receiptUri ?? undefined,
    });

    setSaved(true);
    setLoading(false);

    // Clear form
    setLitres("");
    setPricePerLitre("");
    setOdometer("");
    setStation("");
    setReceiptUri(null);

    syncOutbox().catch(console.error);

    Alert.alert("Enregistré", "Plein sauvegardé. Synchronisation en cours…");
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.title}>Enregistrer un plein</Text>

        <Field
          label="Litres *"
          value={litres}
          onChangeText={setLitres}
          placeholder="65.5"
          keyboardType="decimal-pad"
        />

        <Field
          label="Prix / litre (MAD) *"
          value={pricePerLitre}
          onChangeText={setPricePerLitre}
          placeholder="12.85"
          keyboardType="decimal-pad"
        />

        <Field
          label="Compteur kilométrique"
          value={odometer}
          onChangeText={setOdometer}
          placeholder="125000"
          keyboardType="number-pad"
        />

        <Field
          label="Station"
          value={station}
          onChangeText={setStation}
          placeholder="Afriquia, Total…"
        />

        {/* Receipt photo */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Reçu (photo)</Text>
          {receiptUri ? (
            <View>
              <Image
                source={{ uri: receiptUri }}
                style={styles.receiptPreview}
                resizeMode="cover"
              />
              <TouchableOpacity style={styles.changePhotoBtn} onPress={pickReceipt}>
                <Text style={styles.changePhotoText}>Changer la photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.cameraBtn} onPress={pickReceipt} activeOpacity={0.8}>
              <Text style={styles.cameraBtnIcon}>📷</Text>
              <Text style={styles.cameraBtnText}>Photographier le reçu</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>
            {loading ? "Enregistrement…" : "Enregistrer le plein"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default" }: FieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  form: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 20 },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#0f172a",
  },
  cameraBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  cameraBtnIcon: { fontSize: 32 },
  cameraBtnText: { color: "#64748b", fontSize: 14, fontWeight: "500" },
  receiptPreview: { width: "100%", height: 180, borderRadius: 10 },
  changePhotoBtn: { marginTop: 8, alignItems: "center" },
  changePhotoText: { color: "#f59e0b", fontSize: 13, fontWeight: "600" },
  saveBtn: {
    marginTop: 8,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
