"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import {
  LogOut,
  User,
  Clock,
  ClipboardList,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import {
  readPolicyActivity,
  type PolicyActivityEvent,
} from "@/lib/policies/policy-suggestions";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { address, isConnected } = useAccount();
  const [email, setEmail] = useState("");
  const [defaultDuration, setDefaultDuration] = useState<7 | 30 | 90>(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [policyActivity, setPolicyActivity] = useState<PolicyActivityEvent[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    getUser();
    const savedDuration = localStorage.getItem("elora_vault_default_duration");
    if (savedDuration) {
      const d = parseInt(savedDuration);
      if ([7, 30, 90].includes(d)) setDefaultDuration(d as 7 | 30 | 90);
    }
    setPolicyActivity(readPolicyActivity());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDurationChange = (d: 7 | 30 | 90) => {
    setDefaultDuration(d);
    localStorage.setItem("elora_vault_default_duration", d.toString());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const recentPolicyActivity = [...policyActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-small text-text-tertiary mt-1.5">
          A quiet place to configure your environment.
        </p>
      </div>

      {/* ── Account ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Account
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-surface shadow-sm px-5 py-4">
          <div>
            <p className="text-tiny text-text-tertiary mb-0.5">Email</p>
            <p className="text-sm text-text-primary">
              {email || "Loading..."}
            </p>
          </div>
          {isConnected && shortAddress && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-tiny text-text-tertiary mb-0.5">
                Connected wallet
              </p>
              <p className="text-sm font-mono text-text-primary">
                {shortAddress}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Preferences
          </h2>
        </div>

        {/* Default protection duration */}
        <div className="rounded-xl border border-border bg-surface px-5 py-4 mb-3">
          <p className="text-sm font-medium text-text-primary mb-1">
            Default protection duration
          </p>
          <p className="text-small text-text-tertiary mb-4">
            How long new capital protections last by default.
          </p>
          <div className="flex gap-2">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-xs font-medium border transition-all",
                  defaultDuration === d
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-border bg-surface-subtle text-text-tertiary hover:text-text-secondary hover:border-border-hover",
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Notifications placeholder */}
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-0.5">
                Lock expiry notifications
              </p>
              <p className="text-small text-text-tertiary">
                Get notified when protected capital unlocks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors shrink-0 ml-4",
                notificationsEnabled ? "bg-green-500" : "bg-surface-hover",
              )}
              disabled
            >
              <div
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  notificationsEnabled
                    ? "translate-x-[22px]"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <p className="text-tiny text-text-subtle mt-2 italic">
            Future-ready — available when notifications are supported.
          </p>
        </div>
      </div>

      {/* ── Policy Activity ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Recent policy activity
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <p className="text-sm font-medium text-text-primary mb-1">
            Suggestions & decisions
          </p>
          <p className="text-small text-text-tertiary mb-4">
            A record of recent policy suggestions and your responses.
            Policies never move capital without your confirmation.
          </p>
          {recentPolicyActivity.length > 0 ? (
            <div className="space-y-3">
              {recentPolicyActivity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-small font-medium text-text-primary">
                      {event.title}
                    </p>
                    <p className="text-tiny text-text-tertiary mt-0.5">
                      {event.sourcePolicy} &middot; {event.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-tiny text-text-muted">
                    {new Date(event.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-small text-text-tertiary">
              No policy suggestions recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* ── Labs & Research ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Labs & research
          </h2>
        </div>

        <div className="space-y-3">
          <Link
            href="/settings/labs"
            className="block rounded-xl border border-border bg-surface shadow-sm p-5 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary mb-0.5">
                  Labs
                </p>
                <p className="text-small text-text-tertiary">
                  Experimental wallet capability checks and infrastructure
                  previews kept separate from day-to-day settings.
                </p>
                <p className="text-tiny text-text-muted mt-1">
                  Research-only. Production wallet flows remain unchanged.
                </p>
              </div>
              <span className="shrink-0 text-tiny text-text-muted mt-1">
                Open &rarr;
              </span>
            </div>
          </Link>

          <Link
            href="/research"
            className="block rounded-xl border border-border bg-surface shadow-sm p-5 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary mb-0.5">
                  Research
                </p>
                <p className="text-small text-text-tertiary">
                  Productive protection concepts and future capital separation
                  research.
                </p>
                <p className="text-tiny text-text-muted mt-1">
                  No strategies are active. No automatic capital movement.
                </p>
              </div>
              <span className="shrink-0 text-tiny text-text-muted mt-1">
                View &rarr;
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Sign Out ── */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-small text-text-tertiary hover:text-danger transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}
