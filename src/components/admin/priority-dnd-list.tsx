"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Announcement } from "@/server/db/schema";

interface PriorityDndListProps {
  announcements: Announcement[];
}

function SortableItem({ announcement }: { announcement: Announcement }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: announcement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-md"
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 text-church-muted hover:text-church-text"
        aria-label="드래그하여 순서 변경"
        {...attributes}
        {...listeners}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
        </svg>
      </button>
      <span className="flex-1 text-sm font-medium truncate">
        {announcement.title}
      </span>
      <Badge variant="secondary" className="text-xs font-mono">
        {announcement.priority}
      </Badge>
    </div>
  );
}

export function PriorityDndList({ announcements: initial }: PriorityDndListProps) {
  const [items, setItems] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);

    const newItems = [...items];
    const [moved] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, moved);

    // Assign priority descending (top = highest)
    const updated = newItems.map((item, idx) => ({
      ...item,
      priority: newItems.length - idx,
    }));

    setItems(updated);
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);

    try {
      const res = await fetch("/api/admin/announcements/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            priority: item.priority,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("우선순위가 저장되었습니다");
      setHasChanges(false);
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-church-muted">
        정렬할 공지사항이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2" role="list" aria-label="공지사항 우선순위 목록">
            {items.map((item) => (
              <SortableItem key={item.id} announcement={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-church-navy hover:bg-church-navy/90"
          >
            {saving ? "저장 중..." : "우선순위 저장"}
          </Button>
        </div>
      )}
    </div>
  );
}
