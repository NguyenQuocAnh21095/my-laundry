import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/app/middleware/auth";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";


interface User {
    id: number;
    role: string;
    branch: number;
}

export async function POST(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Lấy dữ liệu từ request
        const { alias_name, username, password, role, branch } = await req.json();

        // Kiểm tra nếu thiếu dữ liệu
        if (!alias_name || !username || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Chèn dữ liệu vào database
        const result = await pool.query(
            "INSERT INTO users (alias_name, username, password, role, branch) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [alias_name, username, hashedPassword, role || "staff", branch || 1]
        );

        return NextResponse.json({ user: result.rows[0] }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;

        // Nếu không có token, chặn truy cập
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let result;
        if (user.role === "admin") {
            // Admin lấy danh sách tất cả user
            result = await pool.query("SELECT id, alias_name, username, role, branch, created_at FROM users");
        } else {
            // User thường chỉ xem được chính nó
            result = await pool.query("SELECT id, alias_name, username, role, branch, created_at FROM users WHERE id = $1", [user.id]);
        }

        return NextResponse.json({ users: result.rows });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Lấy dữ liệu từ request
        const { id, alias_name, username, password, branch, role } = await req.json();

        // Kiểm tra nếu thiếu `id`
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Lấy thông tin user hiện tại
        const existingUser = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (existingUser.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Mã hóa mật khẩu nếu có thay đổi
        let hashedPassword = existingUser.rows[0].password;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 12);
        }

        // Cập nhật thông tin user
        const result = await pool.query(
            "UPDATE users SET alias_name = $1, username = $2, password = $3, branch = $4, role = $5 WHERE id = $6 RETURNING *",
            [alias_name, username, hashedPassword, branch, role, id]
        );

        return NextResponse.json({ user: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Lấy dữ liệu từ request
        const { id } = await req.json();

        // Kiểm tra nếu thiếu `id`
        if (!id) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        // Kiểm tra nếu user tồn tại
        const existingUser = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (existingUser.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Xóa người dùng khỏi database
        await pool.query("DELETE FROM users WHERE id = $1", [id]);

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}