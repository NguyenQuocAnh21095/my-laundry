import {NextRequest, NextResponse} from "next/server";
import {verifyAuth} from "@/app/middleware/auth";
import pool from "@/app/lib/db";

interface User {
    id: number;
    role: string;
    branch: number;
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
            result = await pool.query("SELECT id, branch_name FROM branches");
        } else {
            // User thường chỉ xem được chính nó
            result = await pool.query("SELECT id, branch_name FROM branches WHERE id = $1", [user.branch]);
        }

        return NextResponse.json({ branches: result.rows });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}