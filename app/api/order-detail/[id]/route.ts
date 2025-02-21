import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import {verifyAuth} from "@/app/middleware/auth";

interface User {
    id: number;
    role: string;
    branch: number;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    if (!id) {
        return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }
    const user = verifyAuth(req) as User;
    if (!user.role) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    try {
        const client = await pool.connect();

        // Lấy thông tin hóa đơn
        const invoiceQuery = `
            SELECT i.id, i.invoice_name, i.created_at, s.status_name, c.customer_name, 
                   i.amount, i.paid_amount, pm.method_name, i.discount, u.alias_name AS created_by, b.alias_branch
            FROM invoices i
            JOIN customers c ON c.id = i.customer_id 
            JOIN statuses s ON s.id = i.status_id 
            JOIN branches b ON b.id = i.branch_id 
            JOIN users u ON u.id = i.created_by 
            JOIN pay_methods pm on pm.id = i.pay_method 
            WHERE i.id = $1;
        `;
        const invoiceResult = await client.query(invoiceQuery, [id]);
        const invoice = invoiceResult.rows[0];

        if (!invoice) {
            client.release();
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Lấy danh sách sản phẩm trong hóa đơn
        const itemsQuery = `
            SELECT ii.id, p.product_name, p.product_code, ii.quantity, ii.unit_price, ii.total_price
            FROM invoice_items ii
            JOIN products p ON p.id = ii.product_id
            WHERE ii.invoice_id = $1;
        `;
        const itemsResult = await client.query(itemsQuery, [id]);

        // Lấy danh sách nhân viên liên quan
        const coworkersQuery = `
            SELECT ic.id, u.alias_name
            FROM invoice_coworkers ic
            JOIN users u ON u.id = ic.user_id
            WHERE ic.invoice_id = $1;
        `;
        const coworkersResult = await client.query(coworkersQuery, [id]);

        client.release();

        return NextResponse.json({
            invoice,
            items: itemsResult.rows,
            coworkers: coworkersResult.rows,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params; // ✅ Đợi params được giải quyết trước khi dùng

    if (!id) {
        return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    const user = verifyAuth(req) as User;
    if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { paid_amount, debt_amount, confirmed_by, confirmed_at, status_id } = await req.json();

        const client = await pool.connect();

        // Cập nhật hóa đơn
        const invoiceQuery = `
            UPDATE invoices
            SET paid_amount = $2, debt_amount = $3, confirmed_by = $4, confirmed_at = $5, status_id = $6
            WHERE id = $1
            RETURNING *;
        `;

        const { rows } = await client.query(invoiceQuery, [id, paid_amount, debt_amount, confirmed_by, confirmed_at, status_id]);
        client.release();

        if (!rows.length) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({
            code: 200,
            message: 'Cập nhật thành công',
            invoice: rows[0],
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
