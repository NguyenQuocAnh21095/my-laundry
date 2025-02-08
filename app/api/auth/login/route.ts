import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret"; // Nên lưu trong biến môi trường

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        // Kiểm tra dữ liệu đầu vào
        if (!username || !password) {
            return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
        }

        // Kiểm tra user có tồn tại không
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const user = result.rows[0];

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Xác định branch cho admin
        const branch = user.role === "admin" ? 0 : user.branch;

        // Tạo token JWT
        const token = jwt.sign({ id: user.id, role: user.role, branch }, SECRET_KEY, { expiresIn: "1h" });

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                alias_name: user.alias_name,
                username: user.username,
                branch,
                role: user.role,
                created_at: user.created_at,
            }
        });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
