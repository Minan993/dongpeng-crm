import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username || !password) {
      return NextResponse.json({ message: "账号和密码不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
    }

    const token = await signAuthToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    });
    setAuthCookie(token);

    return NextResponse.json({
      message: "ok",
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login API error", error);
    return NextResponse.json({ message: "服务器异常，请稍后再试" }, { status: 500 });
  }
}
