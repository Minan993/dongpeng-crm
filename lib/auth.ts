import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const COOKIE_NAME = "crm_token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
};

export async function signAuthToken(user: AuthUser) {
  return new SignJWT({
    sub: user.id,
    role: user.role,
    name: user.name,
    username: user.username
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    const payload = await verifyAuthToken(token);
    const userId = payload.sub;
    if (!userId) {
      return null;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    };
  } catch (error) {
    console.error("Auth token invalid", error);
    return null;
  }
}

export function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
