/**
 * TimelinePicker
 *
 * Visual timeline with draggable availability blocks.
 * Users can add, resize, move, and delete blocks.
 *
 * Delete interactions:
 *   - Web: Click block to select, delete button appears above timeline
 *   - Mobile: Long-press (3s) reveals delete option
 *
 * Drag interactions:
 *   - Tap and drag the left/right edges to resize
 *   - Tap and drag the center to move the entire block
 *   - Edges have large touch targets (24px) for easy grabbing
 */

import { useRef, useState, useCallback, useEffect } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Pressable,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { AvailabilityBlock } from "@myonites/shared";

interface TimelinePickerProps {
  workStart: string;
  workEnd: string;
  blocks: AvailabilityBlock[];
  onChange: (blocks: AvailabilityBlock[]) => void;
}

const MIN_BLOCK_MINUTES = 15;
const SNAP_MINUTES = 15;
const LONG_PRESS_MS = 3000;
const EDGE_HIT_WIDTH = 24;

function timeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function formatHour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  if (m === 0) return `${display}${period}`;
  return `${display}:${m.toString().padStart(2, "0")}${period}`;
}

function formatTimeRange(start: string, end: string): string {
  return `${formatHour(timeToMinutes(start))} \u2013 ${formatHour(timeToMinutes(end))}`;
}

function snapToGrid(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type DragMode = "start" | "end" | "move";

interface DragState {
  blockIndex: number;
  mode: DragMode;
  initialX: number;
  initialBlockStart: number;
  initialBlockEnd: number;
}

export function TimelinePicker({
  workStart,
  workEnd,
  blocks,
  onChange,
}: TimelinePickerProps) {
  const { colors } = useTheme();
  const containerRef = useRef<View>(null);
  const containerWidth = useRef(0);
  const containerLeft = useRef(0);
  const dragState = useRef<DragState | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [longPressIndex, setLongPressIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startMinutes = timeToMinutes(workStart);
  const endMinutes = timeToMinutes(workEnd);
  const totalMinutes = endMinutes - startMinutes;

  const minutesToPercent = useCallback(
    (minutes: number) => ((minutes - startMinutes) / totalMinutes) * 100,
    [startMinutes, totalMinutes],
  );

  const xToMinutes = useCallback(
    (pageX: number) => {
      const relativeX = pageX - containerLeft.current;
      const ratio = relativeX / containerWidth.current;
      return snapToGrid(startMinutes + ratio * totalMinutes);
    },
    [startMinutes, totalMinutes],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.current = event.nativeEvent.layout.width;
    containerRef.current?.measureInWindow((x) => {
      containerLeft.current = x;
    });
  };

  const getDragMode = (pageX: number, blockIndex: number): DragMode => {
    const block = blocks[blockIndex]!;
    const blockStartPx =
      (minutesToPercent(timeToMinutes(block.start)) / 100) *
        containerWidth.current +
      containerLeft.current;
    const blockEndPx =
      (minutesToPercent(timeToMinutes(block.end)) / 100) *
        containerWidth.current +
      containerLeft.current;

    if (pageX - blockStartPx < EDGE_HIT_WIDTH) return "start";
    if (blockEndPx - pageX < EDGE_HIT_WIDTH) return "end";
    return "move";
  };

  const handleBlockPressIn = (index: number, pageX: number) => {
    const block = blocks[index]!;
    const mode = getDragMode(pageX, index);

    dragState.current = {
      blockIndex: index,
      mode,
      initialX: pageX,
      initialBlockStart: timeToMinutes(block.start),
      initialBlockEnd: timeToMinutes(block.end),
    };

    if (Platform.OS !== "web") {
      longPressTimer.current = setTimeout(() => {
        if (!isDragging) {
          setLongPressIndex(index);
        }
      }, LONG_PRESS_MS);
    }
  };

  const handleMove = useCallback(
    (pageX: number) => {
      if (!dragState.current) return;

      setIsDragging(true);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const { blockIndex, mode, initialX, initialBlockStart, initialBlockEnd } =
        dragState.current;
      const deltaMinutes = xToMinutes(pageX) - xToMinutes(initialX);
      const updated = [...blocks];

      if (mode === "start") {
        const newStart = clamp(
          snapToGrid(initialBlockStart + deltaMinutes),
          startMinutes,
          initialBlockEnd - MIN_BLOCK_MINUTES,
        );
        updated[blockIndex] = {
          start: minutesToTime(newStart),
          end: blocks[blockIndex]!.end,
        };
      } else if (mode === "end") {
        const newEnd = clamp(
          snapToGrid(initialBlockEnd + deltaMinutes),
          initialBlockStart + MIN_BLOCK_MINUTES,
          endMinutes,
        );
        updated[blockIndex] = {
          start: blocks[blockIndex]!.start,
          end: minutesToTime(newEnd),
        };
      } else {
        const duration = initialBlockEnd - initialBlockStart;
        const newStart = clamp(
          snapToGrid(initialBlockStart + deltaMinutes),
          startMinutes,
          endMinutes - duration,
        );
        updated[blockIndex] = {
          start: minutesToTime(newStart),
          end: minutesToTime(newStart + duration),
        };
      }

      onChange(updated);
    },
    [blocks, onChange, xToMinutes, startMinutes, endMinutes],
  );

  const handleRelease = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.current) {
        e.preventDefault();
        handleMove(e.pageX);
      }
    };

    const handleMouseUp = () => {
      if (dragState.current) {
        handleRelease();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMove, handleRelease]);

  const addBlock = () => {
    const lastEnd =
      blocks.length > 0
        ? timeToMinutes(blocks[blocks.length - 1]!.end)
        : startMinutes;

    const newStart = snapToGrid(Math.max(lastEnd + 15, startMinutes));
    const newEnd = snapToGrid(Math.min(newStart + 60, endMinutes));

    if (newEnd - newStart < MIN_BLOCK_MINUTES) return;

    onChange([
      ...blocks,
      { start: minutesToTime(newStart), end: minutesToTime(newEnd) },
    ]);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
    setSelectedIndex(null);
    setLongPressIndex(null);
  };

  const handleBlockClick = (index: number) => {
    if (isDragging) return;
    if (Platform.OS === "web") {
      setSelectedIndex(selectedIndex === index ? null : index);
    }
  };

  const handleBackgroundPress = () => {
    setSelectedIndex(null);
    setLongPressIndex(null);
  };

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
      {/* Delete bar for selected block (web) */}
      {Platform.OS === "web" && selectedIndex !== null && (
        <View style={styles.deleteBar}>
          <Text style={[styles.deleteLabel, { color: colors.textSecondary }]}>
            {formatTimeRange(
              blocks[selectedIndex]!.start,
              blocks[selectedIndex]!.end,
            )}
          </Text>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.danger }]}
            onPress={() => removeBlock(selectedIndex)}>
            <Text style={styles.deleteButtonText}>Delete Block</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Long-press delete for mobile */}
      {Platform.OS !== "web" && longPressIndex !== null && (
        <View style={styles.deleteBar}>
          <Text style={[styles.deleteLabel, { color: colors.textSecondary }]}>
            {formatTimeRange(
              blocks[longPressIndex]!.start,
              blocks[longPressIndex]!.end,
            )}
          </Text>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.danger }]}
            onPress={() => removeBlock(longPressIndex)}>
            <Text style={styles.deleteButtonText}>Delete Block</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => setLongPressIndex(null)}>
            <Text
              style={[
                styles.cancelButtonText,
                { color: colors.textSecondary },
              ]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Pressable onPress={handleBackgroundPress}>
        <View
          ref={containerRef}
          style={styles.timelineWrapper}
          onLayout={handleLayout}>
          <View style={[styles.track, { backgroundColor: colors.border }]} />

          {hourLabels.map((h) => (
            <View
              key={h.label}
              style={[
                styles.hourTick,
                { left: `${h.percent}%`, backgroundColor: colors.textTertiary },
              ]}
            />
          ))}

          {blocks.map((block, index) => {
            const left = minutesToPercent(timeToMinutes(block.start));
            const right = minutesToPercent(timeToMinutes(block.end));
            const width = right - left;
            const isSelected = selectedIndex === index;
            const isLongPressed = longPressIndex === index;

            return (
              <Pressable
                key={index}
                style={[
                  styles.block,
                  {
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: colors.primary + "30",
                    borderColor:
                      isSelected || isLongPressed
                        ? colors.primary
                        : colors.primary + "80",
                    borderWidth: isSelected || isLongPressed ? 2 : 1,
                  },
                ]}
                onPress={() => handleBlockClick(index)}
                onPressIn={(e) => {
                  const pageX = (e.nativeEvent as unknown as { pageX: number })
                    .pageX;
                  handleBlockPressIn(index, pageX);
                }}
                onPressOut={handleRelease}
                onTouchMove={(e) => {
                  if (Platform.OS !== "web") {
                    handleMove(e.nativeEvent.pageX);
                  }
                }}>
                <View
                  style={[
                    styles.edgeHandle,
                    styles.edgeLeft,
                    { backgroundColor: colors.primary },
                  ]}
                />

                {width > 8 && (
                  <Text
                    style={[styles.blockLabel, { color: colors.primary }]}
                    numberOfLines={1}>
                    {formatTimeRange(block.start, block.end)}
                  </Text>
                )}

                <View
                  style={[
                    styles.edgeHandle,
                    styles.edgeRight,
                    { backgroundColor: colors.primary },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

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
      </Pressable>

      <TouchableOpacity
        style={[styles.addButton, { borderColor: colors.primary }]}
        onPress={addBlock}>
        <Text style={[styles.addButtonText, { color: colors.primary }]}>
          + Add Available Block
        </Text>
      </TouchableOpacity>

      {blocks.length > 0 && (
        <View style={styles.blockList}>
          {blocks.map((block, index) => (
            <View
              key={index}
              style={[styles.blockListItem, { borderColor: colors.border }]}>
              <View
                style={[styles.blockDot, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.blockListText, { color: colors.text }]}>
                {formatTimeRange(block.start, block.end)}
              </Text>
              <Text
                style={[styles.blockDuration, { color: colors.textTertiary }]}>
                {timeToMinutes(block.end) - timeToMinutes(block.start)} min
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  deleteBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  deleteLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  timelineWrapper: {
    height: 72,
    position: "relative",
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
  },
  hourTick: {
    position: "absolute",
    width: 1,
    height: 16,
    top: 28,
  },
  block: {
    position: "absolute",
    height: 52,
    top: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: { cursor: "grab" as unknown as undefined },
      default: {},
    }),
  },
  edgeHandle: {
    position: "absolute",
    width: 6,
    height: 32,
    borderRadius: 3,
    top: 8,
    ...Platform.select({
      web: { cursor: "ew-resize" as unknown as undefined },
      default: {},
    }),
  },
  edgeLeft: {
    left: 4,
  },
  edgeRight: {
    right: 4,
  },
  blockLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  labelsRow: {
    height: 24,
    position: "relative",
    marginTop: 4,
  },
  hourLabel: {
    position: "absolute",
    fontSize: 11,
    fontWeight: "500",
    transform: [{ translateX: -14 }],
  },
  addButton: {
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  blockList: {
    marginTop: 16,
    gap: 8,
  },
  blockListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  blockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  blockListText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  blockDuration: {
    fontSize: 13,
  },
});
