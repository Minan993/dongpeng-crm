import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canEditCustomer } from "@/lib/permissions";

export async function POST(
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
  const nextContactAt = body.nextContactAt ? new Date(body.nextContactAt) : null;

  const followup = await prisma.followup.create({
    data: {
      customerId: params.id,
      userId: user.id,
      method: body.method,
      content: body.content,
      nextContactAt
    }
  });

  await prisma.customer.update({
    where: { id: params.id },
    data: {
      lastFollowupAt: new Date(),
      nextContactAt
    }
  });

  return NextResponse.json({ data: followup });
}
