// /frontend/src/routes/expenses.list.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export type Expense = { id: number; title: string; amount: number; fileUrl?: string | null };

// Use "/api" if you configured a Vite proxy in dev; otherwise use
// const API = 'http://localhost:3000/api'
const API = "/api";

export default function ExpensesListPage() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`${API}/expenses`, { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`);
      }
      return (await res.json()) as { expenses: Expense[] };
    },
    staleTime: 5_000,
    retry: 1,
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to delete expense");
      }
      return id;
    },
    onMutate: async (id) => {
      setDeleteError(null);
      setDeletingId(id);
      await qc.cancelQueries({ queryKey: ["expenses"] });
      const previous = qc.getQueryData<{ expenses: Expense[] }>(["expenses"]);
      if (previous) {
        qc.setQueryData(["expenses"], {
          expenses: previous.expenses.filter((item) => item.id !== id),
        });
      }
      return { previous };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(["expenses"], ctx.previous);
      setDeleteError((err as Error)?.message ?? "Could not delete expense.");
    },
    onSettled: () => {
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (isError)
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Failed to fetch: {(error as Error).message}</p>
        <button className="mt-3 rounded border px-3 py-1" onClick={() => refetch()} disabled={isFetching}>
          Retry
        </button>
      </div>
    );

  const items = data?.expenses ?? [];

  return (
    <section className="mx-auto max-w-3xl p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Expenses</h2>
        <button className="rounded border px-3 py-1 text-sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {deleteError && <p className="mb-3 text-sm text-red-600">{deleteError}</p>}

      {items.length === 0 ? (
        <div className="rounded border bg-background p-6">
          <p className="text-sm text-muted-foreground">No expenses yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Start by adding your first expense using the form above.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => {
            const isRowDeleting = deletingId === e.id && deleteExpense.isPending;
            return (
              <li
                key={e.id}
                className="flex items-center justify-between rounded border bg-background text-foreground p-3 shadow-sm"
              >
                <div className="flex flex-col">
                  <Link to="/expenses/$id" params={{ id: e.id }} className="font-medium underline hover:text-primary">
                    {e.title}
                  </Link>
                  <span className="text-sm text-muted-foreground">${e.amount}</span>
                </div>

                <div className="flex items-center gap-3">
                  {e.fileUrl ? (
                    <a
                      href={e.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">No receipt</span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Delete "${e.title}"?`)) return;
                      deleteExpense.mutate(e.id);
                    }}
                    disabled={isRowDeleting}
                    className="text-sm text-red-600 underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRowDeleting ? "Removing…" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
