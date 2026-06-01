/**
 * GET /api/policies/activity
 *
 * Returns policy lifecycle events for the Activity timeline.
 * Works alongside /api/wallet/transactions to show policy-related
 * capital behavior without storing duplicate records.
 *
 * Derived events:
 *   - "policy-created": from Policy.createdAt (DB record)
 *   - "policy-status-change": from Policy.updatedAt when status changed
 *
 * Suggestion events (accepted/dismissed) are tracked client-side in
 * localStorage via the policy-suggestions module — this endpoint
 * returns only what the database can confirm.
 *
 * Policy suggestions themselves are NOT auto-executed. This endpoint
 * is read-only — it surfaces past decisions, not future automation.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type PolicyActivityEventType =
  | "policy-created"
  | "policy-activated"
  | "policy-paused"
  | "policy-deleted";

export interface PolicyActivityEvent {
  id: string;
  type: PolicyActivityEventType;
  policyTitle: string;
  policyType: string;
  description: string;
  occurredAt: string;
}

export interface PolicyActivityResponse {
  events: PolicyActivityEvent[];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.policy.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const events: PolicyActivityEvent[] = [];

    for (const record of records) {
      // Creation event — derived from createdAt
      events.push({
        id: `policy-created-${record.id}`,
        type: "policy-created",
        policyTitle: record.title,
        policyType: record.type,
        description: `Policy created: ${record.title}`,
        occurredAt: record.createdAt.toISOString(),
      });

      // Activation/pause — derived from status vs createdAt
      // If status is active and createdAt != updatedAt, infer activation event
      if (
        record.status === "active" &&
        record.updatedAt.getTime() !== record.createdAt.getTime()
      ) {
        events.push({
          id: `policy-activated-${record.id}`,
          type: "policy-activated",
          policyTitle: record.title,
          policyType: record.type,
          description: `Policy activated: ${record.title}`,
          occurredAt: record.updatedAt.toISOString(),
        });
      }

      // If paused and updatedAt != createdAt, infer pause
      if (
        record.status === "draft" &&
        record.updatedAt.getTime() !== record.createdAt.getTime()
      ) {
        events.push({
          id: `policy-paused-${record.id}`,
          type: "policy-paused",
          policyTitle: record.title,
          policyType: record.type,
          description: `Policy paused: ${record.title}`,
          occurredAt: record.updatedAt.toISOString(),
        });
      }
    }

    // Sort most recent first
    events.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    return NextResponse.json<PolicyActivityResponse>({ events });
  } catch (error) {
    console.error("Error fetching policy activity:", error);
    return NextResponse.json(
      { error: "Could not load policy activity." },
      { status: 500 },
    );
  }
}
