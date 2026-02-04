import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllCustomers } from "@/lib/permissions";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);

  const ownerUserId = searchParams.get("ownerUserId");
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const type = searchParams.get("type");
  const overdue = searchParams.get("overdue");

  const where: Record<string, unknown> = {};

  if (!canViewAllCustomers(user)) {
    where.ownerUserId = user.id;
  } else if (ownerUserId) {
    where.ownerUserId = ownerUserId;
  }

  if (status) {
    where.status = status;
  }
  if (source) {
    where.source = source;
  }
  if (type) {
    where.type = type;
  }
  if (overdue === "true") {
    where.nextContactAt = { lte: new Date() };
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, role: true } }
    }
  });

  return NextResponse.json({ data: customers });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  const body = await request.json();

  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      phone: body.phone,
      wechat: body.wechat || null,
      address: body.address || null,
      community: body.community || null,
      source: body.source,
      type: body.type,
      tags: body.tags ?? [],
      status: body.status,
      ownerUserId: user.id
    }
  });

  return NextResponse.json({ data: customer });
}
