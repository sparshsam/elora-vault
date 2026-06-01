import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { validatePolicy, normalizePolicyRequest } from "@/lib/policies/policy-engine";
import type { ProtectionPolicy, PolicyCondition, PolicyAction } from "@/types/policy";
import type { Prisma } from "@prisma/client";

/**
 * GET /api/policies — List all policies for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.policy.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const policies: ProtectionPolicy[] = records.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type as ProtectionPolicy["type"],
      status: r.status as ProtectionPolicy["status"],
      condition: r.condition as unknown as PolicyCondition,
      action: r.action as unknown as PolicyAction,
      description: r.description ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/policies — Create a new behavioral policy.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate
    const validation = validatePolicy(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    // Normalize
    const normalized = normalizePolicyRequest(body);

    // Ensure the User record exists
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email ?? `user-${user.id.slice(0, 8)}@placeholder.elora`,
        },
      });
    } catch {
      // Silently handled
    }

    const record = await prisma.policy.create({
      data: {
        userId: user.id,
        title: normalized.title,
        type: normalized.type,
        status: "draft",
        description: normalized.description,
        condition: JSON.parse(JSON.stringify(normalized.condition)) as Prisma.InputJsonValue,
        action: JSON.parse(JSON.stringify(normalized.action)) as Prisma.InputJsonValue,
      },
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

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
