/**
 * DaySelector
 *
 * Toggleable day-of-week buttons for selecting work days.
 * Works on both web and mobile.
 */

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

export type DayKey = (typeof DAYS)[number]["key"];

interface DaySelectorProps {
  selected: DayKey[];
  onChange: (days: DayKey[]) => void;
}

export function DaySelector({ selected, onChange }: DaySelectorProps) {
  const { colors } = useTheme();

  const toggle = (day: DayKey) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <View style={styles.container}>
      {DAYS.map((day) => {
        const isSelected = selected.includes(day.key);
        return (
          <TouchableOpacity
            key={day.key}
            style={[
              styles.day,
              { borderColor: colors.border },
              isSelected && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => toggle(day.key)}>
            <Text
              style={[
                styles.dayText,
                { color: colors.text },
                isSelected && { color: colors.primaryText },
              ]}>
              {day.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  day: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 48,
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
