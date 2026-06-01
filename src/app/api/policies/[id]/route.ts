import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { canTransitionTo } from "@/lib/policies/policy-engine";
import type { ProtectionPolicy, PolicyStatus, PolicyCondition, PolicyAction } from "@/types/policy";
import type { Prisma } from "@prisma/client";

/**
 * PATCH /api/policies/:id — Update a policy (title, status, condition, action, description).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.policy.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate status transition if changing status
    if (body.status && body.status !== existing.status) {
      if (!canTransitionTo(existing.status as PolicyStatus, body.status)) {
        return NextResponse.json(
          {
            error: `Cannot transition from "${existing.status}" to "${body.status}".`,
          },
          { status: 400 },
        );
      }
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.status !== undefined) data.status = body.status;
    if (body.description !== undefined)
      data.description = String(body.description).trim() || null;
    if (body.condition !== undefined)
      data.condition = body.condition as unknown as Prisma.InputJsonValue;
    if (body.action !== undefined)
      data.action = body.action as unknown as Prisma.InputJsonValue;

    const record = await prisma.policy.update({
      where: { id },
      data,
    });

    const policy: ProtectionPolicy = {
      id: record.id,
      title: record.title,
      type: record.type as ProtectionPolicy["type"],
      status: record.status as ProtectionPolicy["status"],
      condition: record.condition as unknown as PolicyCondition,
      action: record.action as unknown as PolicyAction,
      description: record.description ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/policies/:id — Delete a policy.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.policy.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    await prisma.policy.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
