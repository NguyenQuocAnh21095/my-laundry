import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/app/middleware/auth";
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
        if (!user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '').slice(2); // Format ngày: DDMMYY

        // Truy vấn database để lấy số thứ tự lớn nhất đã có trong ngày hôm đó
        const result = await pool.query(
            `SELECT COALESCE(MAX(invoice_name), 'DH${today}0000') AS last_invoice FROM invoices WHERE invoice_name LIKE $1`,
            [`DH${today}%`]
        );

        const lastInvoice = result.rows[0].last_invoice;
        const lastNumber = parseInt(lastInvoice.slice(-4)) + 1;
        const newInvoiceName = `DH${today}${lastNumber.toString().padStart(4, '0')}`;

        return NextResponse.json({ invoice_name: newInvoiceName });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}