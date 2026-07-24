import React from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PROJECT_STATUSES, PROJECT_STATUS_STYLES } from '@/lib/constants';
import ProjectStatusBadge from './ProjectStatusBadge';
import ApprovalBadge from './ApprovalBadge';

export default function KanbanBoard({ projects, onMoveStatus }) {
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    onMoveStatus(result.draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {PROJECT_STATUSES.map((col) => {
          const items = projects.filter((p) => (p.status || 'Not Started') === col);
          const s = PROJECT_STATUS_STYLES[col];
          return (
            <div key={col} className="flex-1 min-w-[230px] max-w-[280px]">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <h3 className="text-sm font-semibold text-stone-700">{col}</h3>
                </div>
                <span className="text-xs text-stone-400">{items.length}</span>
              </div>
              <Droppable droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[80px] rounded-2xl p-1.5 transition ${snapshot.isDraggingOver ? 'bg-orange-50' : 'bg-stone-100/60'}`}
                  >
                    {items.map((p, index) => (
                      <Draggable key={p.id} draggableId={p.id} index={index}>
                        {(prov) => (
                          <Link
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            to={`/projects/${p.id}`}
                            className="block bg-white rounded-xl border border-stone-100 shadow-sm p-3 hover:shadow-md hover:border-orange-200 transition"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <ProjectStatusBadge status={p.status} />
                              {p.approval_status === 'Pending' && <ApprovalBadge status="Pending" />}
                            </div>
                            <p className="mt-2 text-sm font-semibold text-stone-800 leading-snug">{p.name}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {p.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{p.category}</span>}
                              {(p.functions_involved || []).slice(0, 2).map((f) => (
                                <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{f}</span>
                              ))}
                            </div>
                            {p.status === 'Done' && p.review_status === 'Pending' && (
                              <p className="mt-2 text-[10px] font-semibold text-amber-600">Review required</p>
                            )}
                          </Link>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}