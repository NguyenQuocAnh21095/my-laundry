import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db"; // Giả sử bạn đã có pool kết nối PostgreSQL
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret"; // Lấy secret từ môi trường

interface DecodedToken {
    id: number;
    role: string;
    branch: number;
    iat?: number;
    exp?: number;
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
