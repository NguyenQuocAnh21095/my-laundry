'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jwt from "jsonwebtoken";
import Link from "next/link";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";
interface DecodedToken {
    id: number;
    role: string;
    branch: number;
    iat?: number;
    exp?: number;
}

const DashboardPage = () => {
    const [user, setUser] = useState<string | null>(null); // Thay state thành string | null
    const [loading, setLoading] = useState<boolean>(true); // Thêm loading state
    // const [debugLog, setDebugLog] = useState<string>('');
    const router = useRouter();

    //Kiem tra token valid
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            // Nếu không có token, chuyển hướng về trang login
            router.push("/login");
        } else {
            try {
                // Nếu có token, giải mã JWT và lấy thông tin user
                const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;
                // setDebugLog("hello");
                if (decoded) {
                    // Lưu thông tin người dùng sau khi giải mã
                    setUser(decoded.role);
                } else {
                    setUser(null); // Nếu giải mã không hợp lệ
                }
            } catch (err) {
                // Nếu có lỗi khi giải mã token, có thể là token đã hết hạn hoặc sai
                console.error("Token is invalid or expired.", err, token, SECRET_KEY);
                setUser(null); // Đặt lại thông tin user nếu token không hợp lệ
            } finally {
                setLoading(false); // Set loading to false sau khi xử lý xong
            }
        }
    }, [router]);

    if (loading) {
        return <div className="text-center">Loading...</div>; // Hiển thị khi đang tải
    }

    return (
        <div className="dashboard-container p-6 text-black">
            <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
            {user ? (
                <p>Hello, User ID: {user}!</p>
            ) : (
                <p>Failed to load user data. Please <Link href="/login">log in</Link> again.</p>
            )}
            {/*<div>{debugLog}</div>*/}
        </div>
    );
};

export default DashboardPage;
