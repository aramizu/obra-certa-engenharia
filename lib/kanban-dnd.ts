export const DND_ACTIVATION_PX = 8;

export type MovableTask = {
  id: string;
  statusColumnId: string | null;
  orderInColumn: number;
};

export type DropTarget = {
  columnId: string;
  index: number;
};

export function shouldActivateDrag(
  originX: number,
  originY: number,
  x: number,
  y: number,
  threshold = DND_ACTIVATION_PX
) {
  const dx = x - originX;
  const dy = y - originY;
  return dx * dx + dy * dy >= threshold * threshold;
}

export function dropIndexFromY(
  cardRects: Array<{ top: number; height: number }>,
  clientY: number
) {
  for (let i = 0; i < cardRects.length; i++) {
    const rect = cardRects[i];
    if (clientY < rect.top + rect.height / 2) return i;
  }
  return cardRects.length;
}

export function hitTestColumn(
  clientX: number,
  clientY: number,
  draggedTaskId: string
): DropTarget | null {
  if (typeof document === "undefined") return null;
  const el = document.elementFromPoint(clientX, clientY);
  const column = el?.closest<HTMLElement>("[data-column-id]");
  const columnId = column?.dataset.columnId;
  if (!columnId) return null;

  const cards = Array.from(column.querySelectorAll<HTMLElement>("[data-task-id]")).filter(
    (card) => card.dataset.taskId !== draggedTaskId
  );
  const index = dropIndexFromY(
    cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return { top: rect.top, height: rect.height };
    }),
    clientY
  );
  return { columnId, index };
}

export function applyTaskMove<T extends MovableTask>(
  tasks: T[],
  taskId: string,
  columnId: string,
  orderInColumn: number
): T[] {
  const moving = tasks.find((task) => task.id === taskId);
  if (!moving) return tasks;

  const without = tasks.filter((task) => task.id !== taskId);
  const dest = without
    .filter((task) => task.statusColumnId === columnId)
    .sort((a, b) => a.orderInColumn - b.orderInColumn);
  const index = Math.max(0, Math.min(orderInColumn, dest.length));
  dest.splice(index, 0, { ...moving, statusColumnId: columnId });
  const destReindexed = dest.map((task, i) => ({
    ...task,
    statusColumnId: columnId,
    orderInColumn: i,
  }));

  const sourceColumnId = moving.statusColumnId;
  const others = without.filter((task) => task.statusColumnId !== columnId);

  if (!sourceColumnId || sourceColumnId === columnId) {
    return [...others, ...destReindexed];
  }

  const sourceReindexed = others
    .filter((task) => task.statusColumnId === sourceColumnId)
    .sort((a, b) => a.orderInColumn - b.orderInColumn)
    .map((task, i) => ({ ...task, orderInColumn: i }));
  const rest = others.filter((task) => task.statusColumnId !== sourceColumnId);
  return [...rest, ...sourceReindexed, ...destReindexed];
}
