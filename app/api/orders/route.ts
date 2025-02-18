import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";
import {verifyAuth} from "@/app/middleware/auth";
import dayjs from 'dayjs';

interface User {
    id: number;
    role: string;
    branch: number;
}

interface Item {
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export async function GET(req: NextRequest) {
    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user.role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const { search = "", sort = "desc", branch_id, status_id = 0, startDate, endDate } =
            Object.fromEntries(new URL(req.url).searchParams);

        const today = dayjs().format("YYYY-MM-DD");

        const start = startDate ? `${startDate} 00:00:00` : `${today} 00:00:00`;
        const end = endDate ? `${endDate} 23:59:59` : `${today} 23:59:59`;

        const query = `
            SELECT 
                c.customer_name, 
                i.invoice_name,
                i.branch_id,
                i.created_at,
                s.status_name,
                i.amount AS invoice_amount, 
                json_agg(json_build_object('product_name', p.product_name, 'quantity', ii.quantity)) AS products
            FROM 
                invoices i
            JOIN 
                customers c ON i.customer_id = c.id
            JOIN 
                invoice_items ii ON i.id = ii.invoice_id
            JOIN 
                products p ON ii.product_id = p.id
            JOIN
                statuses s ON s.id = i.status_id 
            WHERE 
                (c.customer_name ILIKE $1 OR i.invoice_name ILIKE $1)
                AND ($2 = 0 OR i.branch_id = $2)
                AND i.created_at BETWEEN $3 AND $4
                AND ($5 = 0 OR i.status_id = $5)
            GROUP BY 
                i.id, c.customer_name, i.invoice_name, i.branch_id, i.created_at, s.status_name, i.amount
            ORDER BY 
                i.created_at ${sort.toUpperCase()};
        `;

        const values = [`%${search}%`, Number(branch_id), start, end, Number(status_id)];

        const result = await pool.query(query, values);

        return NextResponse.json({ invoices: result.rows });

    } catch (error) {
        console.error("Error verifying token:", error);
        return NextResponse.json({ error: "Token is invalid or expired" }, { status: 401 });
    }
}

export async function POST(req: NextRequest) {
    const client = await pool.connect();

    try {
        // Xác thực user từ token
        const user = verifyAuth(req) as User;
        if (!user.role) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const { invoice, items, coworkers } = await req.json();

        await client.query("BEGIN"); // Bắt đầu transaction

        // 1️⃣ Tạo hóa đơn (invoices)
        const invoiceQuery = `
            INSERT INTO invoices (invoice_name, customer_id, branch_id, amount, paid_amount, pay_method, status_id, created_by, confirmed_by, discount, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10, NOW())
            RETURNING id;
        `;
        const invoiceValues = [
            invoice.invoice_name, invoice.customer_id, invoice.branch_id,
            invoice.amount, invoice.paid_amount, invoice.pay_method,
            invoice.status_id, invoice.created_by, invoice.confirmed_by,
            invoice.discount
        ];
        const invoiceRes = await client.query(invoiceQuery, invoiceValues);
        const invoiceId = invoiceRes.rows[0].id;

        // 2️⃣ Thêm sản phẩm vào invoice_items
        const itemQuery = `
            INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, total_price)
            VALUES ${items.map((_:never, i:number) => `($1, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, $${i * 4 + 5})`).join(", ")}
        `;
        const itemValues = [
            invoiceId,
            ...items.flatMap((item: Item) => [item.product_id, item.quantity, item.unit_price, item.total_price])
        ];
        await client.query(itemQuery, itemValues);

        // 3️⃣ Thêm nhân viên phụ trách (invoice_coworkers)
        if (coworkers.length > 0) {
            const coworkerQuery = `
                INSERT INTO invoice_coworkers (invoice_id, user_id)
                VALUES ${coworkers.map((_:never, i:number) => `($1, $${i + 2})`).join(", ")}
            `;
            const coworkerValues = [invoiceId, ...coworkers];
            await client.query(coworkerQuery, coworkerValues);
        }

        await client.query("COMMIT"); // Commit transaction

        return NextResponse.json({ success: true, message:"Tạo đơn thành công!",invoiceId });
    } catch (error) {
        await client.query("ROLLBACK"); // Rollback nếu có lỗi
        console.error("Transaction failed:", error);
        return NextResponse.json({ error: "Lỗi khi tạo hóa đơn" }, { status: 500 });
    } finally {
        client.release();
    }
}