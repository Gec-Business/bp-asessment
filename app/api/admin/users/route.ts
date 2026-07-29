export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all users
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(users);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// POST: Create a new user
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and Password are required" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                email: true,
                createdAt: true
            }
        });

        return NextResponse.json(newUser);

    } catch (e) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

// DELETE: Remove a user
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        // CRITICAL: Prevent deleting the last admin
        const count = await prisma.user.count();
        if (count <= 1) {
            return NextResponse.json({ error: "Cannot delete the last remaining admin." }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
