import { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  Dimensions,
  Pressable,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import {
  timeToMinutes,
  minutesToTime,
  minutesToPercent,
  formatTime12,
  snap,
  clamp,
  mergeBlocks,
  generateHourLabels,
  createNewBlock,
  MIN_BLOCK_MINUTES,
} from "./timelineUtils";
import type { TimelinePickerProps } from "./timelineUtils";
import type { AvailabilityBlock } from "@myonites/shared";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTAINER_PADDING = 20;
const TRACK_WIDTH = SCREEN_WIDTH - CONTAINER_PADDING * 2 - 20;
const HANDLE_WIDTH = 30;

type DragMode = "start" | "end" | "move";

interface DraggableBlockProps {
  block: AvailabilityBlock;
  index: number;
  colors: {
    primary: string;
    text: string;
    border: string;
    surface: string;
    textTertiary: string;
    danger: string;
  };
  startMin: number;
  totalMin: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (index: number, start: string, end: string) => void;
  onFinalize: () => void;
}

export function TimelinePicker({
  workStart,
  workEnd,
  blocks,
  onChange,
}: TimelinePickerProps) {
  const { colors } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const startMin = timeToMinutes(workStart);
  const endMin = timeToMinutes(workEnd);
  const totalMin = endMin - startMin;
  const hourLabels = generateHourLabels(startMin, endMin, totalMin);

  const handleUpdate = useCallback(
    (index: number, newStart: string, newEnd: string) => {
      const updated = [...blocks];
      updated[index] = { start: newStart, end: newEnd };
      onChange(updated);
    },
    [blocks, onChange],
  );

  const handleFinalize = useCallback(() => {
    onChange(mergeBlocks([...blocks]));
  }, [blocks, onChange]);

  const handleAddBlock = useCallback(() => {
    const nb = createNewBlock(blocks, startMin, endMin);
    if (nb) onChange(mergeBlocks([...blocks, nb]));
  }, [blocks, startMin, endMin, onChange]);

  const handleDeleteBlock = useCallback(
    (index: number) => {
      onChange(blocks.filter((_, i) => i !== index));
    },
    [blocks, onChange],
  );

  return (
    <Pressable style={styles.container} onPress={() => setSelectedIndex(null)}>
      <View style={styles.timelineWrapper}>
        <View style={styles.trackContainer}>
          <View style={[styles.rail, { backgroundColor: colors.border }]} />

          {hourLabels.map((h) => (
            <View
              key={h.label}
              style={[
                styles.tick,
                { left: `${h.percent}%`, backgroundColor: colors.textTertiary },
              ]}
            />
          ))}

          {blocks.map((block, index) => (
            <DraggableBlock
              key={index}
              block={block}
              index={index}
              colors={colors}
              startMin={startMin}
              totalMin={totalMin}
              isSelected={selectedIndex === index}
              onSelect={() => setSelectedIndex(index)}
              onUpdate={handleUpdate}
              onFinalize={handleFinalize}
            />
          ))}
        </View>

        <View style={styles.labelsRow}>
          {hourLabels.map((h, i) => (
            <Text
              key={h.label}
              style={[
                styles.hourLabel,
                { color: colors.textTertiary, left: `${h.percent}%` },
                i === 0 && { transform: [{ translateX: 0 }] },
                i === hourLabels.length - 1 && {
                  transform: [{ translateX: -22 }],
                },
              ]}>
              {h.label}
            </Text>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={handleAddBlock}>
        <Text style={[styles.addBtnText, { color: colors.primary }]}>
          + Add Available Block
        </Text>
      </TouchableOpacity>

      <View style={styles.summaryList}>
        {blocks.map((block, index) => (
          <View
            key={index}
            style={[
              styles.summaryRow,
              {
                borderColor:
                  selectedIndex === index ? colors.primary : colors.border,
                backgroundColor: colors.surface,
                borderWidth: selectedIndex === index ? 1.5 : 1,
              },
            ]}>
            <View
              style={[styles.summaryDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {formatTime12(block.start)} – {formatTime12(block.end)}
            </Text>
            <TouchableOpacity
              onPress={() => handleDeleteBlock(index)}
              style={styles.deleteCross}>
              <Text style={[styles.deleteText, { color: colors.danger }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function DraggableBlock({
  block,
  index,
  colors,
  startMin,
  totalMin,
  isSelected,
  onSelect,
  onUpdate,
  onFinalize,
}: DraggableBlockProps) {
  const leftPercent = minutesToPercent(
    timeToMinutes(block.start),
    startMin,
    totalMin,
  );
  const widthPercent =
    minutesToPercent(timeToMinutes(block.end), startMin, totalMin) -
    leftPercent;

  // Calculate physical width in pixels to determine font size
  const pixelWidth = (widthPercent / 100) * TRACK_WIDTH;

  // Dynamic font sizing: min 7, max 12
  const dynamicFontSize = clamp(pixelWidth / 14, 7, 12);

  const createResponder = useCallback(
    (mode: DragMode) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: onSelect,
        onPanResponderMove: (_, gesture) => {
          const minPerPixel = totalMin / TRACK_WIDTH;
          const deltaMins = snap(gesture.dx * minPerPixel);
          const origS = timeToMinutes(block.start);
          const origE = timeToMinutes(block.end);

          let newS = origS,
            newE = origE;

          if (mode === "start") {
            newS = clamp(
              snap(origS + deltaMins),
              startMin,
              origE - MIN_BLOCK_MINUTES,
            );
          } else if (mode === "end") {
            newE = clamp(
              snap(origE + deltaMins),
              origS + MIN_BLOCK_MINUTES,
              startMin + totalMin,
            );
          } else {
            const duration = origE - origS;
            newS = clamp(
              snap(origS + deltaMins),
              startMin,
              startMin + totalMin - duration,
            );
            newE = newS + duration;
          }
          onUpdate(index, minutesToTime(newS), minutesToTime(newE));
        },
        onPanResponderRelease: onFinalize,
      }),
    [block, index, onSelect, onUpdate, onFinalize, startMin, totalMin],
  );

  const startRes = useMemo(() => createResponder("start"), [createResponder]);
  const endRes = useMemo(() => createResponder("end"), [createResponder]);
  const moveRes = useMemo(() => createResponder("move"), [createResponder]);

  return (
    <View
      style={[
        styles.block,
        {
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          backgroundColor: colors.primary + "20",
          borderColor: isSelected ? colors.primary : colors.primary + "60",
          borderWidth: isSelected ? 2 : 1.5,
        },
      ]}>
      <View style={styles.moveZone} {...moveRes.panHandlers} />

      <View style={styles.handle} {...startRes.panHandlers}>
        <View style={[styles.handleBar, { backgroundColor: colors.primary }]} />
      </View>

      {/* Dynamic range text */}
      <Text
        style={[
          styles.blockLabel,
          { color: colors.primary, fontSize: dynamicFontSize },
        ]}
        numberOfLines={1}>
        {formatTime12(block.start)} – {formatTime12(block.end)}
      </Text>

      <View style={[styles.handle, { right: 0 }]} {...endRes.panHandlers}>
        <View style={[styles.handleBar, { backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  timelineWrapper: { marginTop: 10 },
  trackContainer: {
    height: 70,
    justifyContent: "center",
    position: "relative",
    marginHorizontal: 10,
  },
  rail: { position: "absolute", left: 0, right: 0, height: 6, borderRadius: 3 },
  tick: { position: "absolute", width: 1, height: 12, top: 41 },
  block: {
    position: "absolute",
    height: 46,
    top: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  moveZone: { ...StyleSheet.absoluteFillObject },
  handle: {
    position: "absolute",
    width: HANDLE_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  handleBar: { width: 3, height: 20, borderRadius: 1.5, opacity: 0.7 },
  blockLabel: {
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
    // Ensure text stays between handles even when small
    paddingHorizontal: HANDLE_WIDTH - 5,
  },
  labelsRow: {
    height: 20,
    marginTop: 4,
    position: "relative",
    marginHorizontal: 10,
  },
  hourLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "600",
    transform: [{ translateX: -12 }],
  },
  addBtn: {
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    padding: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  addBtnText: { fontSize: 14, fontWeight: "700" },
  summaryList: { gap: 8 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryText: { flex: 1, fontSize: 14, fontWeight: "600" },
  deleteCross: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
