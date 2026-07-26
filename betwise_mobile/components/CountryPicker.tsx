import { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, TextInput, FlatList, StyleSheet } from "react-native";
import { ChevronDown, Search, X } from "lucide-react-native";
import { colors, fonts, radius } from "../lib/colors";
import { COUNTRIES, Country, findCountry } from "../lib/countries";

interface CountryPickerProps {
  label: string;
  value: string;
  onChange: (iso2: string) => void;
  error?: string;
}

export default function CountryPicker({ label, value, onChange, error }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = findCountry(value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const select = (c: Country) => {
    onChange(c.iso2);
    setOpen(false);
    setQuery("");
  };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.input, error ? styles.inputError : null]}
      >
        <Text style={selected ? styles.value : styles.placeholder}>
          {selected ? selected.name : "Select your country"}
        </Text>
        <ChevronDown size={16} color={colors.inkFaint} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select country</Text>
            <Pressable onPress={close} hitSlop={10}>
              <X size={20} color={colors.inkMuted} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Search size={15} color={colors.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search countries"
              placeholderTextColor={colors.inkFaint}
              autoFocus
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.iso2}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => select(item)}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowDial}>+{item.dialCode}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: 6,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.riskHigh,
  },
  value: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkPaper,
  },
  placeholder: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkFaint,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.riskHigh,
    marginTop: 5,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.inkPaper,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.stub,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkPaper,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowName: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkPaper,
  },
  rowDial: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkFaint,
  },
});
