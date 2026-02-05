import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canViewAllCustomers } from "@/lib/permissions";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  const today = startOfToday();

  const customerWhere = canViewAllCustomers(user) ? {} : { ownerUserId: user.id };

  const [todayNewCustomers, todayFollowups, statusGroup] = await Promise.all([
    prisma.customer.count({
      where: {
        ...customerWhere,
        createdAt: { gte: today }
      }
    }),
    prisma.followup.count({
      where: {
        createdAt: { gte: today },
        customer: customerWhere
      }
    }),
    prisma.customer.groupBy({
      by: ["status"],
      where: customerWhere,
      _count: { status: true }
    })
  ]);

  return NextResponse.json({
    data: {
      todayNewCustomers,
      todayFollowups,
      statusGroup
    }
  });
}
