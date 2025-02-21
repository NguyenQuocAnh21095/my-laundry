'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import {PlusIcon} from "@heroicons/react/24/outline";
import Link from "next/link";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

interface DecodedToken {
    id: number;
    role: string;
    branch: number;
    iat?: number;
    exp?: number;
}

export type Branch = {
    id: number;
    branch_name: string;
};

export type InvoiceOrder = {
    id: number;
    customer_name: string;
    invoice_name: string;
    branch_id: number;
    created_at: string;
    status_name: string;
    invoice_amount: number;
    products: { product_name: string; quantity: number }[];
};

export default function OrdersPage() {
    const [role, setRole] = useState<string>("");
    const [branch, setBranch] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("desc");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState<string>("");
    const [invoices, setInvoices] = useState<InvoiceOrder[]>([]);
    const [dateFilter, setDateFilter] = useState("today"); // Default is "today"
    const [customDateVisible, setCustomDateVisible] = useState(false); // To show/hide custom date input
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            try {
                const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;
                setRole(decoded.role);
                setBranch(decoded.branch);
                setLoading(true);
            } catch (err) {
                console.error("Token is invalid or expired.", err);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        }
    }, [router]);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/branches`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setBranches(data.branches);
                }
            } catch (err) {
                console.error("Error fetching branches:", err);
                setError("Error fetching branches.");
            }
        };
        fetchBranches();
    }, []);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const params = new URLSearchParams({
                    search,
                    sort,
                    branch_id: branch.toString(),
                    status_id: "1",
                    startDate,
                    endDate
                });
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/orders?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch invoices");
                const data = await res.json();
                setInvoices(data.invoices);
            } catch (error) {
                console.error("Error fetching invoices:", error);
            }
        };

        fetchInvoices(); // Gọi hàm luôn
    }, [search, sort, branch, startDate, endDate]); // Không còn cảnh báo thiếu dependency

    const handleDateFilterChange = (value: string) => {
        setDateFilter(value);
        const today = dayjs();
        let start: string = today.format("YYYY-MM-DD");
        let end: string = today.format("YYYY-MM-DD");

        switch (value) {
            case "today":
                setStartDate(start);
                setEndDate(end);
                setCustomDateVisible(false);
                break;
            case "yesterday":
                start = today.subtract(1, "day").format("YYYY-MM-DD");
                // end = start;
                setStartDate(start);
                setEndDate(end);
                setCustomDateVisible(false);
                break;
            case "last7days":
                start = today.subtract(7, "days").format("YYYY-MM-DD");
                setStartDate(start);
                setEndDate(today.format("YYYY-MM-DD"));
                setCustomDateVisible(false);
                break;
            case "thisMonth":
                start = today.startOf("month").format("YYYY-MM-DD");
                setStartDate(start);
                setEndDate(today.endOf("month").format("YYYY-MM-DD"));
                setCustomDateVisible(false);
                break;
            case "lastMonth":
                start = today.subtract(1, "month").startOf("month").format("YYYY-MM-DD");
                end = today.subtract(1, "month").endOf("month").format("YYYY-MM-DD");
                setStartDate(start);
                setEndDate(end);
                setCustomDateVisible(false);
                break;
            case "custom":
                setCustomDateVisible(true);
                break;
            default:
                break;
        }
    };

    // const handleCustomDateSubmit = () => {
    //     setCustomDateVisible(false);
    //     // Do something with custom startDate and endDate if needed
    // };

    return (
        <div className="md:p-4 text-black">
            <h1 className="text-2xl font-bold px-2">Đơn Nhập</h1>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    {/*Search box*/}
                    <div className="search-section mb-1 px-2 h-8">
                        <input
                            type="text"
                            placeholder="Tìm theo tên khách, mã hóa đơn"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border p-1 rounded-md w-full"
                        />
                    </div>
                    {/*Sort và filter Date*/}
                    <div className="flex items-center justify-between px-2 mb-1 space-x-2">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="border h-8 p-1 rounded-md bg-white"
                        >
                            <option value="desc">Ngày mới nhất</option>
                            <option value="asc">Ngày cũ nhất</option>
                        </select>

                        <select
                            value={dateFilter}
                            onChange={(e) => handleDateFilterChange(e.target.value)}
                            className="border h-8 p-1 rounded-md bg-white"
                        >
                            <option value="today">Hôm nay</option>
                            <option value="yesterday">Hôm qua</option>
                            <option value="last7days">7 ngày qua</option>
                            <option value="thisMonth">Tháng này</option>
                            <option value="lastMonth">Tháng trước</option>
                            <option value="custom">Tùy chỉnh</option>
                        </select>
                    </div>
                    {customDateVisible && (
                        <div className="flex items-center justify-between px-2 mb-1 space-x-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border p-1 rounded-md bg-white"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border p-1 rounded-md bg-white"
                            />
                            {/*<button*/}
                            {/*    onClick={handleCustomDateSubmit}*/}
                            {/*    className="bg-blue-500 text-white rounded-md px-2 py-1"*/}
                            {/*>*/}
                            {/*    Áp dụng*/}
                            {/*</button>*/}
                        </div>
                    )}

                    {role === "admin" && (
                        <div className="items-center px-2 mb-1 space-x-2">
                            <select
                                value={branch}
                                onChange={(e) => setBranch(Number(e.target.value))}
                                className="border h-8 p-1 rounded-md bg-white"
                            >
                                <option value={0}>Tất cả chi nhánh</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {error && <div className="error-message text-red-500">{error}</div>}

                    <div className="px-2 space-y-1 max-h-[75vh] overflow-y-auto bg-gray-200">
                        {invoices.length > 0 ? (
                            invoices.map((inv) => (
                                <Link key={inv.invoice_name}
                                      href={`order-detail/${inv.id}`}
                                     className="flex items-center justify-between w-full rounded-md bg-white p-1 shadow-md">
                                    <div className="flex flex-col">
                                        <p><strong>{inv.customer_name}</strong></p>
                                        <p>{dayjs(inv.created_at).format("DD/MM/YYYY HH:mm")} - {inv.invoice_name}</p>
                                        <div>{inv.products[0].product_name}
                                            <strong> x{inv.products[0].quantity}</strong>{inv.products.length > 1 && (
                                                <p><strong>+{inv.products.length - 1}</strong> dịch vụ khác</p>)}</div>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        {role === "admin" && (<div>CN{inv.branch_id}</div>)}
                                        <p><strong>{inv.invoice_amount.toLocaleString()}</strong></p>
                                        <p className="bg-orange-200 rounded-md text-orange-600 px-1">{inv.status_name}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="px-2 text-gray-500">Không có hóa đơn nào.</p>
                        )}
                    </div>
                </div>
            )}
            <button
                onClick={() => router.push("/dashboard/orders/create-order")}
                className="flex fixed bottom-16 right-4 md:right-16 bg-blue-600 text-white p-4 md:pr-6 rounded-full shadow-lg hover:bg-blue-700 transition"
            >
                <PlusIcon className="w-6 h-6"/>
                <div className="hidden md:block">Thêm</div>
            </button>
        </div>
    );
}
