import { useRef, useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  HANDLE_HIT_PX,
} from "./timelineUtils";
import type { TimelinePickerProps } from "./timelineUtils";
import type { AvailabilityBlock } from "@myonites/shared";

type DragMode = "start" | "end" | "move";

interface DragState {
  blockIndex: number;
  mode: DragMode;
  startX: number;
  origStart: number;
  origEnd: number;
}

export function TimelinePicker({
  workStart,
  workEnd,
  blocks,
  onChange,
}: TimelinePickerProps) {
  const { colors } = useTheme();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const blocksRef = useRef<AvailabilityBlock[]>(blocks);
  blocksRef.current = blocks;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const startMin = timeToMinutes(workStart);
  const endMin = timeToMinutes(workEnd);
  const totalMin = endMin - startMin;

  const hourLabels = generateHourLabels(startMin, endMin, totalMin);

  const getTrackRect = (): DOMRect | null =>
    trackRef.current?.getBoundingClientRect() ?? null;

  const xToMinutes = useCallback(
    (clientX: number): number => {
      const rect = getTrackRect();
      if (!rect) return startMin;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return snap(startMin + ratio * totalMin);
    },
    [startMin, totalMin],
  );

  /* Determine which part of the block was clicked */
  const getDragMode = useCallback(
    (clientX: number, blockIndex: number): DragMode => {
      const rect = getTrackRect();
      if (!rect) return "move";

      const block: AvailabilityBlock | undefined =
        blocksRef.current[blockIndex];
      if (!block) return "move";

      const blockStartPx =
        ((timeToMinutes(block.start) - startMin) / totalMin) * rect.width +
        rect.left;
      const blockEndPx =
        ((timeToMinutes(block.end) - startMin) / totalMin) * rect.width +
        rect.left;

      if (clientX - blockStartPx < HANDLE_HIT_PX) return "start";
      if (blockEndPx - clientX < HANDLE_HIT_PX) return "end";
      return "move";
    },
    [startMin, totalMin],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, blockIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      const block: AvailabilityBlock | undefined = blocks[blockIndex];
      if (!block) return;

      const mode = getDragMode(e.clientX, blockIndex);

      dragRef.current = {
        blockIndex,
        mode,
        startX: e.clientX,
        origStart: timeToMinutes(block.start),
        origEnd: timeToMinutes(block.end),
      };
      setDragging(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const drag = dragRef.current;
        if (!drag) return;

        moveEvent.preventDefault();
        const rect = getTrackRect();
        if (!rect) return;

        const currentMinutes = xToMinutes(moveEvent.clientX);
        const deltaMinutes = currentMinutes - xToMinutes(drag.startX);
        const updated: AvailabilityBlock[] = [...blocksRef.current];
        const targetBlock: AvailabilityBlock | undefined =
          blocksRef.current[drag.blockIndex];

        if (!targetBlock) return;

        if (drag.mode === "start") {
          const newStart = clamp(
            snap(drag.origStart + deltaMinutes),
            startMin,
            drag.origEnd - MIN_BLOCK_MINUTES,
          );
          updated[drag.blockIndex] = {
            start: minutesToTime(newStart),
            end: targetBlock.end,
          };
        } else if (drag.mode === "end") {
          const newEnd = clamp(
            snap(drag.origEnd + deltaMinutes),
            drag.origStart + MIN_BLOCK_MINUTES,
            endMin,
          );
          updated[drag.blockIndex] = {
            start: targetBlock.start,
            end: minutesToTime(newEnd),
          };
        } else {
          const duration = drag.origEnd - drag.origStart;
          const newStart = clamp(
            snap(drag.origStart + deltaMinutes),
            startMin,
            endMin - duration,
          );
          updated[drag.blockIndex] = {
            start: minutesToTime(newStart),
            end: minutesToTime(newStart + duration),
          };
        }

        onChange(updated);
      };

      const handleMouseUp = () => {
        if (dragRef.current) {
          const wasDragging = dragRef.current.startX !== 0;
          dragRef.current = null;
          setDragging(false);

          if (wasDragging) {
            onChange(mergeBlocks(blocksRef.current));
          }
        }
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [blocks, getDragMode, xToMinutes, startMin, endMin, onChange],
  );

  const handleBlockClick = (index: number) => {
    if (!dragging) {
      setSelectedIndex(selectedIndex === index ? null : index);
    }
  };

  const handleBackgroundClick = () => {
    if (!dragging) setSelectedIndex(null);
  };

  const addBlock = () => {
    const newBlock = createNewBlock(blocks, startMin, endMin);
    if (!newBlock) return;
    onChange(mergeBlocks([...blocks, newBlock]));
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
    setSelectedIndex(null);
  };

  return (
    <View style={styles.container}>
      {/* Timeline track */}
      <div
        ref={trackRef}
        onClick={handleBackgroundClick}
        style={{
          position: "relative" as const,
          height: 64,
          display: "flex",
          alignItems: "center",
          userSelect: "none" as const,
          touchAction: "none" as const,
        }}>
        {/* Background track */}
        <div
          style={{
            position: "absolute" as const,
            left: 0,
            right: 0,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.border,
          }}
        />

        {/* Hour ticks */}
        {hourLabels.map((h) => (
          <div
            key={h.label}
            style={{
              position: "absolute" as const,
              left: `${h.percent}%`,
              width: 1,
              height: 14,
              top: 25,
              backgroundColor: colors.textTertiary,
            }}
          />
        ))}

        {/* Draggable blocks */}
        {blocks.map((block: AvailabilityBlock, index: number) => {
          const blockStart = timeToMinutes(block.start);
          const blockEnd = timeToMinutes(block.end);
          const left = minutesToPercent(blockStart, startMin, totalMin);
          const width = minutesToPercent(blockEnd, startMin, totalMin) - left;
          const isSelected = selectedIndex === index;

          return (
            <div
              key={index}
              onMouseDown={(e: React.MouseEvent) => handleMouseDown(e, index)}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleBlockClick(index);
              }}
              style={{
                position: "absolute" as const,
                left: `${left}%`,
                width: `${width}%`,
                height: 48,
                top: 8,
                borderRadius: 10,
                backgroundColor: colors.primary + "30",
                border: `${isSelected ? 2.5 : 1.5}px solid ${isSelected ? colors.primary : colors.primary + "70"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
                userSelect: "none" as const,
              }}>
              {/* Left handle visual */}
              <div
                style={{
                  position: "absolute" as const,
                  left: 3,
                  width: 5,
                  height: 24,
                  borderRadius: 2.5,
                  backgroundColor: colors.primary,
                  opacity: 0.8,
                  cursor: "ew-resize",
                }}
              />

              {/* Label */}
              {width > 12 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: colors.primary,
                    textAlign: "center" as const,
                    pointerEvents: "none" as const,
                    whiteSpace: "nowrap" as const,
                    overflow: "hidden" as const,
                    padding: "0 16px",
                  }}>
                  {formatTime12(block.start)} – {formatTime12(block.end)}
                </span>
              )}

              {/* Right handle visual */}
              <div
                style={{
                  position: "absolute" as const,
                  right: 3,
                  width: 5,
                  height: 24,
                  borderRadius: 2.5,
                  backgroundColor: colors.primary,
                  opacity: 0.8,
                  cursor: "ew-resize",
                }}
              />
            </div>
          );
        })}
      </div>

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

      {/* Summary list with delete cross */}
      {blocks.length > 0 && (
        <View style={styles.summaryList}>
          {blocks.map((block: AvailabilityBlock, index: number) => (
            <View
              key={index}
              style={[styles.summaryRow, { borderColor: colors.border }]}>
              <View
                style={[styles.summaryDot, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.summaryText, { color: colors.text }]}>
                {formatTime12(block.start)} – {formatTime12(block.end)}
              </Text>
              <TouchableOpacity
                onPress={() => removeBlock(index)}
                style={styles.deleteCross}>
                <Text style={[styles.deleteText, { color: colors.danger }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add block */}
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={addBlock}>
        <Text style={[styles.addBtnText, { color: colors.primary }]}>
          + Add Available Block
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelsRow: {
    height: 22,
    position: "relative",
    marginTop: 2,
  },
  hourLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "500",
    transform: [{ translateX: -14 }],
  },
  summaryList: {
    marginTop: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
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
  addBtn: {
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
