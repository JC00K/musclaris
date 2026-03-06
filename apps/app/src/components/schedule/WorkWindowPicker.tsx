/**
 * WorkWindowPicker
 *
 * Two time pickers for setting the work window start and end.
 * Uses scrollable hour/minute selectors that work cross-platform.
 */

import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface WorkWindowPickerProps {
  startTime: string; // "HH:MM"
  endTime: string;
  onChangeStart: (time: string) => void;
  onChangeEnd: (time: string) => void;
}

function formatDisplayTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour = h ?? 0;
  const minute = m ?? 0;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

interface TimePickerModalProps {
  visible: boolean;
  currentTime: string;
  onSelect: (time: string) => void;
  onClose: () => void;
  label: string;
}

function TimePickerModal({
  visible,
  currentTime,
  onSelect,
  onClose,
  label,
}: TimePickerModalProps) {
  const { colors } = useTheme();
  const [parts] = useState(() => {
    const [h, m] = currentTime.split(":").map(Number);
    return { hour: h ?? 0, minute: m ?? 0 };
  });
  const [selectedHour, setSelectedHour] = useState(parts.hour);
  const [selectedMinute, setSelectedMinute] = useState(parts.minute);

  const handleConfirm = () => {
    const time = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    onSelect(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {label}
          </Text>

          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text
                style={[styles.pickerLabel, { color: colors.textTertiary }]}>
                Hour
              </Text>
              <ScrollView
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}>
                {HOURS.map((hour) => {
                  const isSelected = hour === selectedHour;
                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setSelectedHour(hour)}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: colors.text },
                          isSelected && { color: colors.primaryText },
                        ]}>
                        {hour === 0
                          ? "12 AM"
                          : hour <= 12
                            ? `${hour} ${hour === 12 ? "PM" : "AM"}`
                            : `${hour - 12} PM`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text
                style={[styles.pickerLabel, { color: colors.textTertiary }]}>
                Minute
              </Text>
              <ScrollView
                style={styles.pickerScroll}
                showsVerticalScrollIndicator={false}>
                {MINUTES.map((minute) => {
                  const isSelected = minute === selectedMinute;
                  return (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        isSelected && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setSelectedMinute(minute)}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: colors.text },
                          isSelected && { color: colors.primaryText },
                        ]}>
                        :{minute.toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { borderColor: colors.border }]}
              onPress={onClose}>
              <Text
                style={[
                  styles.modalButtonText,
                  { color: colors.textSecondary },
                ]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}>
              <Text
                style={[styles.modalButtonText, { color: colors.primaryText }]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function WorkWindowPicker({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}: WorkWindowPickerProps) {
  const { colors } = useTheme();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            Start
          </Text>
          <TouchableOpacity
            style={[
              styles.timeButton,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              },
            ]}
            onPress={() => setShowStartPicker(true)}>
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatDisplayTime(startTime)}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.separator, { color: colors.textTertiary }]}>
          to
        </Text>

        <View style={styles.timeField}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            End
          </Text>
          <TouchableOpacity
            style={[
              styles.timeButton,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              },
            ]}
            onPress={() => setShowEndPicker(true)}>
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatDisplayTime(endTime)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TimePickerModal
        visible={showStartPicker}
        currentTime={startTime}
        onSelect={onChangeStart}
        onClose={() => setShowStartPicker(false)}
        label="Shift Start"
      />

      <TimePickerModal
        visible={showEndPicker}
        currentTime={endTime}
        onSelect={onChangeEnd}
        onClose={() => setShowEndPicker(false)}
        label="Shift End"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  timeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  separator: {
    fontSize: 16,
    paddingBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    ...Platform.select({
      web: { maxHeight: 480 },
      default: { maxHeight: "80%" as unknown as number },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pickerScroll: {
    height: 200,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 4,
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
