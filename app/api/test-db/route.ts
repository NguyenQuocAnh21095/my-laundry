import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
    try {
        const result = await pool.query("SELECT NOW()");
        return NextResponse.json({ time: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
