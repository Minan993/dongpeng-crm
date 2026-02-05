import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canEditCustomer, canViewCustomer } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, role: true } },
      followups: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } }
      }
    }
  });

  if (!customer || !canViewCustomer(user, customer)) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  return NextResponse.json({ data: customer });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer || !canEditCustomer(user, customer)) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const updated = await prisma.customer.update({
    where: { id: params.id },
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
      nextContactAt: body.nextContactAt ? new Date(body.nextContactAt) : null
    }
  });

  return NextResponse.json({ data: updated });
}
