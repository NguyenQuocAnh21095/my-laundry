import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db"; // Giả sử bạn đã có pool kết nối PostgreSQL
import jwt from "jsonwebtoken";
import {verifyAuth} from "@/app/middleware/auth";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret"; // Lấy secret từ môi trường

interface DecodedToken {
    id: number;
    role: string;
    branch: number;
    iat?: number;
    exp?: number;
}

interface User {
    id: number;
    role: string;
    branch: number;
}

export async function GET(req: NextRequest) {

    // Kiểm tra token trong header
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json({ error: "Unauthorized, token missing" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;
        if (decoded) {
            const { search = "", criteria = "product_name", order = "asc", branch = 0 } =
                Object.fromEntries(new URL(req.url).searchParams);

            // Xác thực sắp xếp để tránh SQL Injection
            const validCriteria = ["product_name", "total_quantity"];
            const validOrder = ["asc", "desc"];

            const sortField = validCriteria.includes(criteria) ? criteria : "product_name";
            const sortOrder = validOrder.includes(order) ? order : "asc";

            const query = `
                SELECT 
                    p.id, 
                    p.product_name, 
                    p.product_code, 
                    p.unit_price, 
                    p.image,
                    COALESCE(SUM(ii.quantity), 0) AS total_quantity
                FROM products p
                LEFT JOIN invoice_items ii ON p.id = ii.product_id
                WHERE (p.product_name ILIKE $1 OR p.product_code ILIKE $1)
                AND ($2 = 0 OR p.branch_id = $2)
                GROUP BY p.id
                ORDER BY ${sortField} ${sortOrder};
            `;

            const values = [`%${search}%`, branch]; // Thêm branch vào danh sách giá trị

            const result = await pool.query(query, values);

            return NextResponse.json({ products: result.rows });
        }
    } catch (error) {
        console.error("Error verifying token:", error);
        return NextResponse.json({ error: "Token is invalid or expired" }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const { product_name, product_code, unit_price, branch_id, image } = await req.json();

        // Kiểm tra đầu vào
        if (!product_name || !product_code || unit_price == null || !branch_id) {
            return NextResponse.json({ error: "Thiếu thông tin bắt buộc!" }, { status: 400 });
        }

        if (unit_price < 0) {
            return NextResponse.json({ error: "Giá sản phẩm phải >= 0!" }, { status: 400 });
        }

        // Chèn vào database
        const query = `
            INSERT INTO products (product_name, product_code, unit_price, branch_id, image, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *;
        `;
        const values = [product_name, product_code, unit_price, branch_id, image];

        const result = await pool.query(query, values);
        return NextResponse.json({ product: result.rows[0] });

    } catch (error) {
        console.error("Lỗi tạo sản phẩm:", error);
        return NextResponse.json({ error: "Lỗi server!" }, { status: 500 });
    }
}