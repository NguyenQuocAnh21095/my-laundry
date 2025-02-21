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

        if (!user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Lấy branch_id từ query parameters
        const { searchParams } = new URL(req.url);
        const branch_id = searchParams.get("branch_id");

        if (!branch_id || !["1", "2"].includes(branch_id)) {
            return NextResponse.json({ error: "Invalid branch_id" }, { status: 400 });
        }

        const year = new Date().getFullYear().toString().slice(-2); // Lấy YY từ năm hiện tại

        // Truy vấn database để lấy số thứ tự lớn nhất trong năm
        const result = await pool.query(
            `SELECT COALESCE(MAX(invoice_name), 'CN${branch_id}${year}00000') AS last_invoice 
             FROM invoices WHERE invoice_name LIKE $1`,
            [`CN${branch_id}${year}%`]
        );

        const lastInvoice = result.rows[0].last_invoice;
        const lastNumber = parseInt(lastInvoice.slice(-5)) + 1;
        const newInvoiceName = `CN${branch_id}${year}${lastNumber.toString().padStart(5, '0')}`;

        return NextResponse.json({ invoice_name: newInvoiceName });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
