"use client";

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
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { reorderQuestionsAction, updateQuestionAction } from "@/lib/recruiter/actions";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  order: number;
  text: string;
  timeLimitSec: number;
  retakes: number;
  thinkTimeSec: number;
};

export function QuestionBuilder({
  interviewId,
  questions: initial,
}: {
  interviewId: string;
  questions: Question[];
}) {
  const [questions, setQuestions] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [, startTransition] = useTransition();
  const prevCountRef = useRef(initial.length);

  const questionIds = initial.map((q) => q.id).join(",");

  useEffect(() => {
    setQuestions(initial);
    if (initial.length > prevCountRef.current) {
      setActiveId(initial[initial.length - 1]!.id);
    } else {
      setActiveId((current) => {
        if (initial.some((q) => q.id === current)) return current;
        return initial[0]?.id ?? "";
      });
    }
    prevCountRef.current = initial.length;
  }, [questionIds, initial]);

  function patchQuestion(id: string, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const active = questions.find((q) => q.id === activeId) ?? questions[0];

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const next = arrayMove(questions, oldIndex, newIndex);
    setQuestions(next);
    startTransition(() =>
      reorderQuestionsAction(
        interviewId,
        next.map((q) => q.id),
      ),
    );
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          {questions.map((q, i) => (
            <SortableQuestion
              key={q.id}
              question={q}
              index={i}
              isActive={q.id === active?.id}
              onSelect={() => setActiveId(q.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {active && (
        <div key={active.id} className="rounded-[14px] border border-primary/30 bg-primary-tint/30 p-4">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-primary">
            Editing question {(questions.findIndex((q) => q.id === active.id) ?? 0) + 1}
          </p>
          <label className="block text-sm font-semibold text-muted">Question text</label>
          <textarea
            className="mt-2 w-full rounded-[10px] border border-[#E4DDCD] bg-white p-3 font-display text-lg"
            defaultValue={active.text}
            onBlur={(e) => {
              const text = e.target.value.trim() || "New question";
              patchQuestion(active.id, { text });
              startTransition(() => updateQuestionAction(active.id, { text }));
            }}
          />
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            {(
              [
                ["Time limit (sec)", "timeLimitSec", active.timeLimitSec],
                ["Retakes", "retakes", active.retakes],
                ["Think time (sec)", "thinkTimeSec", active.thinkTimeSec],
              ] as const
            ).map(([label, key, val]) => (
              <label key={key} className="block">
                <span className="font-semibold text-muted">{label}</span>
                <input
                  type="number"
                  name={key}
                  defaultValue={val}
                  className="mt-1 w-full rounded-[10px] border border-[#E4DDCD] px-2 py-1.5"
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    patchQuestion(active.id, { [key]: value });
                    startTransition(() => updateQuestionAction(active.id, { [key]: value }));
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableQuestion({
  question,
  index,
  isActive,
  onSelect,
}: {
  question: Question;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: question.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 transition-colors",
        isActive ? "border-primary bg-primary-tint/40 ring-1 ring-primary/20" : "border-hairline bg-white hover:border-primary/40",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={`Question ${index + 1}: ${question.text}`}
    >
      <button
        type="button"
        className="text-faint"
        aria-label={`Drag to reorder question ${index + 1}`}
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-tint text-xs font-semibold text-primary">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{question.text}</div>
        <div className="text-xs text-faint">
          Video · {Math.round(question.timeLimitSec / 60)} min
        </div>
      </div>
    </div>
  );
}
