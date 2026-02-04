import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllCustomers } from "@/lib/permissions";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  const now = new Date();

  const where = {
    ...(canViewAllCustomers(user) ? {} : { ownerUserId: user.id }),
    nextContactAt: { lte: now }
  };

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { nextContactAt: "asc" },
    include: { owner: { select: { id: true, name: true } } }
  });

  return NextResponse.json({ data: customers });
}
