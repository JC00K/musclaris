/**
 * ScheduleTimeline
 *
 * Visual timeline showing proposed workout slots within
 * the work window. Each slot is a colored marker with
 * its time and session type. Used on the confirmation screen.
 */

import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { ProposedSlot } from "@myonites/shared";

interface ScheduleTimelineProps {
  workStart: string; // "HH:MM"
  workEnd: string;
  slots: ProposedSlot[];
}

function timeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function formatTime(isoOrHHMM: string): string {
  let h: number;
  let m: number;

  if (isoOrHHMM.includes("T")) {
    const timePart = isoOrHHMM.split("T")[1] ?? "00:00";
    const parts = timePart.split(":").map(Number);
    h = parts[0] ?? 0;
    m = parts[1] ?? 0;
  } else {
    const parts = isoOrHHMM.split(":").map(Number);
    h = parts[0] ?? 0;
    m = parts[1] ?? 0;
  }

  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatHour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
}

function slotTimeToMinutes(slot: ProposedSlot): number {
  if (slot.time.includes("T")) {
    const timePart = slot.time.split("T")[1] ?? "00:00";
    return timeToMinutes(timePart);
  }
  return timeToMinutes(slot.time);
}

export function ScheduleTimeline({
  workStart,
  workEnd,
  slots,
}: ScheduleTimelineProps) {
  const { colors } = useTheme();

  const startMinutes = timeToMinutes(workStart);
  const endMinutes = timeToMinutes(workEnd);
  const totalMinutes = endMinutes - startMinutes;

  const minutesToPercent = (minutes: number) =>
    ((minutes - startMinutes) / totalMinutes) * 100;

  /* Generate hour labels */
  const hourLabels: { label: string; percent: number }[] = [];
  for (let h = Math.ceil(startMinutes / 60); h * 60 <= endMinutes; h++) {
    const minutes = h * 60;
    if (minutes >= startMinutes && minutes <= endMinutes) {
      hourLabels.push({
        label: formatHour(minutes),
        percent: minutesToPercent(minutes),
      });
    }
  }

  return (
    <View style={styles.container}>
      {/* Timeline track */}
      <View style={styles.trackWrapper}>
        <View style={[styles.track, { backgroundColor: colors.border }]} />

        {/* Hour markers */}
        {hourLabels.map((h) => (
          <View
            key={h.label}
            style={[
              styles.hourMarker,
              { left: `${h.percent}%`, backgroundColor: colors.textTertiary },
            ]}
          />
        ))}

        {/* Slot markers */}
        {slots.map((slot) => {
          const minutes = slotTimeToMinutes(slot);
          const percent = minutesToPercent(minutes);
          const isMental = slot.sessionType === "mental";

          return (
            <View
              key={slot.slotNumber}
              style={[
                styles.slotMarker,
                {
                  left: `${percent}%`,
                  backgroundColor: isMental ? colors.success : colors.primary,
                },
              ]}>
              <Text style={styles.slotNumber}>{slot.slotNumber}</Text>
            </View>
          );
        })}
      </View>

      {/* Hour labels */}
      <View style={styles.labelsRow}>
        {hourLabels.map((h) => (
          <Text
            key={h.label}
            style={[
              styles.hourLabel,
              { color: colors.textTertiary, left: `${h.percent}%` },
            ]}>
            {h.label}
          </Text>
        ))}
      </View>

      {/* Slot details list */}
      <View style={styles.slotList}>
        {slots.map((slot) => {
          const isMental = slot.sessionType === "mental";
          return (
            <View
              key={slot.slotNumber}
              style={[styles.slotRow, { borderColor: colors.border }]}>
              <View
                style={[
                  styles.slotBadge,
                  {
                    backgroundColor: isMental ? colors.success : colors.primary,
                  },
                ]}>
                <Text style={styles.slotBadgeText}>{slot.slotNumber}</Text>
              </View>
              <View style={styles.slotInfo}>
                <Text style={[styles.slotTime, { color: colors.text }]}>
                  {formatTime(slot.time)}
                </Text>
                <Text style={[styles.slotType, { color: colors.textTertiary }]}>
                  {isMental ? "Mental Wellness" : "Physical"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  trackWrapper: {
    height: 60,
    position: "relative",
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
  },
  hourMarker: {
    position: "absolute",
    width: 1,
    height: 12,
    top: 24,
  },
  slotMarker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    top: 16,
    marginLeft: -14,
    alignItems: "center",
    justifyContent: "center",
  },
  slotNumber: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  labelsRow: {
    height: 20,
    position: "relative",
    marginTop: 4,
  },
  hourLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "500",
    transform: [{ translateX: -12 }],
  },
  slotList: {
    marginTop: 24,
    gap: 8,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  slotBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  slotBadgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: "600",
  },
  slotType: {
    fontSize: 13,
    marginTop: 2,
  },
});
