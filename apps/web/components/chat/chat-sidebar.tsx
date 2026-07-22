'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, Trash2, ChevronLeft } from 'lucide-react';
import type { ChatSession } from '@/lib/chat/storage';

type Props = {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  /** Quando embutido em widget, sidebar é sempre overlay (não ocupa espaço) */
  embedded?: boolean;
};

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Rótulo de agrupamento (estilo lista lateral minimalista). */
function sidebarSectionLabel(updatedAt: number): string {
  const d = new Date(updatedAt);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameLocalCalendarDay(d, today)) return 'Hoje';
  if (sameLocalCalendarDay(d, yesterday)) return 'Ontem';
  if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  }
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ChatSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onToggle,
  embedded = false,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <>
      {isOpen && (
        <div
          className={`absolute inset-0 z-40 bg-black/40 ${embedded ? '' : 'fixed sm:hidden'}`}
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${
          embedded
            ? 'absolute inset-y-0 left-0 z-50 flex w-[85%] max-w-[280px] flex-col border-r border-[#e5e5e5] bg-[#fafafa] shadow-xl transition-transform duration-200 ease-out'
            : 'fixed inset-y-0 left-0 z-50 flex w-[80vw] max-w-[320px] flex-col border-r border-[#e5e5e5] bg-[#fafafa] shadow-xl transition-transform duration-200 ease-out sm:static sm:w-[280px] sm:max-w-none sm:translate-x-0 sm:shadow-none'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#e5e5e5] px-3 py-2.5 sm:px-3 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#424242] transition-colors hover:bg-black/[0.06] ${embedded ? '' : 'sm:hidden'}`}
              aria-label="Fechar menu"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => {
                onNew();
              }}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-left text-[13px] font-medium text-[#202020] shadow-sm transition-colors hover:bg-[#f4f4f4]"
            >
              <Plus size={18} className="shrink-0 text-[#424242]" strokeWidth={2} />
              Nova conversa
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {sessions.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] leading-relaxed text-[#6e6e6e]">
              Nenhuma conversa ainda. Toque em Nova conversa para começar.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {(() => {
                const rows: ReactNode[] = [];
                let prevSection: string | null = null;
                for (const session of sessions) {
                  const section = sidebarSectionLabel(session.updatedAt);
                  const showHeading = section !== prevSection;
                  prevSection = section;
                  if (showHeading) {
                    rows.push(
                      <li
                        key={`section-${session.id}-${section}`}
                        className="px-2 pb-1 pt-3 first:pt-1"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8e8e8e]">
                          {section}
                        </p>
                      </li>,
                    );
                  }
                  rows.push(
                    <li
                      key={session.id}
                      className={`group relative flex items-center rounded-xl transition-[background-color,box-shadow] duration-200 ease-out ${
                        activeId === session.id
                          ? 'bg-[#d6d6d6] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]'
                          : 'hover:bg-[#e4e4e4] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(session.id);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-snug text-[#202020]">
                          {session.title}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-[#8e8e8e]">
                          {new Date(session.updatedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </button>

                      {confirmDelete === session.id ? (
                        <div className="absolute inset-x-1 bottom-0 z-10 flex items-center justify-end gap-2 rounded-md border border-[#e5e5e5] bg-[#fafafa] px-2 py-1.5 shadow-md">
                          <span className="text-[11px] text-[#6e6e6e]">Apagar?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(session.id);
                              setConfirmDelete(null);
                            }}
                            className="rounded bg-[#c62828] px-2 py-0.5 text-[11px] font-medium text-white"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="rounded border border-[#e0e0e0] bg-white px-2 py-0.5 text-[11px] font-medium text-[#424242]"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(session.id);
                          }}
                          className="mr-1 shrink-0 rounded-md p-1.5 text-[#8e8e8e] opacity-70 transition-opacity hover:bg-[#ffebee] hover:text-[#c62828] sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Apagar conversa"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </li>,
                  );
                }
                return rows;
              })()}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
