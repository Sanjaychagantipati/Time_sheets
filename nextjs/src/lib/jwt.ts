import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "9a7b5d3c8e1f2a4b6c8e0d2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b"
);

export async function signToken(payload: { username: string; role: string; name: string; id: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { username: string; role: string; name: string; id: string; sub?: string };
  } catch (e) {
    return null;
  }
}
