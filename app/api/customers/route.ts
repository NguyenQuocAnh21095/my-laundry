import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db"; // Giả sử bạn đã có pool kết nối PostgreSQL
import { verifyAuth } from "@/app/middleware/auth";

interface User {
    id: number;
    role: string;
    branch: number;
}

// Lấy danh sách người dùng (có thể tìm kiếm theo tên hoặc số điện thoại)
export async function GET(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user.role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
            const {search = "" } = Object.fromEntries(new URL(req.url).searchParams);

            const query = `SELECT * FROM customers 
                WHERE customer_name ILIKE $1 OR customer_phone ILIKE $1
           `;

            const values = [`%${search}%`];

            const result = await pool.query(query,values);
            return NextResponse.json({customers: result.rows});

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}

// Tạo người dùng mới
export async function POST(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user.role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { customer_name, customer_phone, customer_address, branch_id } = await req.json();

        // Validate dữ liệu
        if (!customer_name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await pool.query(
            "INSERT INTO customers (customer_name, customer_phone, customer_address, branch_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [customer_name, customer_phone, customer_address, branch_id]
        );

        const newCustomer = result.rows[0];

        return NextResponse.json({ customer: newCustomer });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ error: `Người dùng đã tồn tại!` }, { status: 500 });
    }
}