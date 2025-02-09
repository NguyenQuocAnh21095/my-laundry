import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

interface DecodedToken {
    id: number;
    role: string;
    branch: number;
}

export function verifyAuth(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;
        // console.log(typeof decoded);

        return decoded;
    } catch (err) {
        return NextResponse.json({ error: "Invalid token:",err }, { status: 403 });
    }
}
