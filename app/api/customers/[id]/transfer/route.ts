import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canTransferCustomer } from "@/lib/permissions";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  if (!canTransferCustomer(user)) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }
  const body = await request.json();
  const targetUserId = body.ownerUserId as string | undefined;
  if (!targetUserId) {
    return NextResponse.json({ message: "缺少归属人" }, { status: 400 });
  }

  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: { ownerUserId: targetUserId }
  });

  return NextResponse.json({ data: updated });
}
