"use client";

import { useState, useEffect, useCallback } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CreatePolicyModal } from "@/components/policies/create-policy-modal";
import { PolicyCard } from "@/components/policies/policy-card";
import { SummaryCard } from "@/components/policies/summary-card";
import type { ProtectionPolicy } from "@/types/policy";
import { Plus, FileText } from "lucide-react";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<ProtectionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch("/api/policies");
      if (res.ok) {
        const data = await res.json();
        setPolicies(data);
      }
    } catch {
      // Silently handle — will show empty state.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleCreated = () => {
    setCreateOpen(false);
    fetchPolicies();
  };

  const handleStatusChange = async (
    id: string,
    status: ProtectionPolicy["status"],
  ) => {
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchPolicies();
      }
    } catch {
      // Silently handle.
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/policies/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchPolicies();
      }
    } catch {
      // Silently handle.
    }
  };

  // ── Summary metrics ──
  const activeCount = policies.filter((p) => p.status === "active").length;
  const draftCount = policies.filter((p) => p.status === "draft").length;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* ═══════════════════════════════════════ */}
        {/* HEADER                                */}
        {/* ═══════════════════════════════════════ */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-light tracking-tight text-text-primary">
              Policies
            </h1>
            <p className="text-body text-text-secondary mt-1.5 leading-relaxed">
              Define how capital should behave before emotion arrives.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-4 py-2 text-small font-medium hover:bg-green-600 transition-colors shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Policy
          </button>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* SUMMARY CARDS                         */}
        {/* ═══════════════════════════════════════ */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="Active Policies"
            value={activeCount}
            color="green"
          />
          <SummaryCard
            label="Draft Policies"
            value={draftCount}
            color="muted"
          />
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* POLICY LIST                           */}
        {/* ═══════════════════════════════════════ */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-surface p-6 animate-pulse"
              >
                <div className="h-4 w-1/3 bg-surface-hover rounded mb-3" />
                <div className="h-3 w-2/3 bg-surface-hover rounded mb-2" />
                <div className="h-3 w-1/2 bg-surface-hover rounded" />
              </div>
            ))}
          </div>
        ) : policies.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface shadow-sm p-12 md:p-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
                <FileText className="h-5 w-5 text-text-tertiary" />
              </div>
              <p className="text-sm font-medium text-text-primary">No policies yet.</p>
              <p className="text-small text-text-tertiary mt-2 max-w-xs">
                Policies let you describe how capital should behave before urgency
                arrives.
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-5 py-2.5 text-small font-medium hover:bg-green-600 transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create your first policy
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* CALM FOOTER                           */}
        {/* ═══════════════════════════════════════ */}
        <p className="text-tiny text-text-muted text-center leading-relaxed max-w-md mx-auto pb-8">
          Policies describe how capital should behave. They define intentions —
          execution is a separate layer.
        </p>
      </div>

      {/* Create Policy Modal */}
      <CreatePolicyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </PageShell>
  );
}
