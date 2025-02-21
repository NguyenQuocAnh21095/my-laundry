'use client';
import {use, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";
import Link from "next/link";
import clsx from "clsx";
import Image from "next/image";

export type InvoiceData = {
    invoice: {
        id: number;
        invoice_name: string;
        created_at: string;
        status_name: string;
        customer_name: string;
        amount: number;
        paid_amount: number;
        method_name: string;
        discount: string;
        created_by: string;
        alias_branch: string;
    };
    items: {
        id: number;
        product_name: string;
        product_code: string;
        quantity: string;
        unit_price: number;
        total_price: number;
    }[];
    coworkers: {
        id: number;
        alias_name: string;
    }[];
};
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

interface DecodedToken {
    id: number;
    role: string;
    branch: number;
    iat?: number;
    exp?: number;
}
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [order, setOrder] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const { id } = use(params);
    const router = useRouter();

    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [role, setRole] = useState<string>("");

    //Kiem tra token valid
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            try {
                const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;
                if (decoded.id) {
                    setLoading(true);
                    setRole(decoded.role);
                }
            } catch (err) {
                console.error("Token is invalid or expired.", err);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        }
    }, [router]);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/order-detail/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch order details");
                const data = await res.json();
                setOrder(data);
            } catch (err) {
                console.error("Error fetching order detail:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetail();
    }, [id]);

    if (loading) return <div>Đang tải...</div>;
    if (!order) return <div>Không tìm thấy hóa đơn.</div>;

    return (
        <div>
            <div className="p-2 text-black overflow-y-scroll max-h-[90vh]">
                <div className="flex justify-between">

                    <h1 className="text-xl font-bold text-blue-600">
                        Chi tiết hóa đơn
                    </h1>
                    <Link href={order?.invoice?.status_name === "Phiếu tạm" ? "/dashboard/orders" : "/dashboard/invoices"}
                          className="text-blue-500">
                        Trở về
                    </Link>
                </div>
                <div className="flex justify-between items-center bg-white rounded-md p-2 mb-1">
                    <div>
                        <p><strong>{order?.invoice?.invoice_name ?? "N/A"}</strong></p>
                        <p>📅 {order?.invoice?.created_at ? dayjs(order.invoice.created_at).format("DD/MM/YYYY HH:mm") : "Chưa có"}</p>
                    </div>

                    <p
                        className={clsx(
                            "rounded-md px-1",
                            order?.invoice?.status_name === "Phiếu tạm"
                                ? "bg-orange-200 text-orange-600"
                                : "bg-green-200 text-green-600"
                        )}
                    >
                        {order?.invoice?.status_name ?? "Không xác định"}
                    </p>
                </div>

                <p className=" bg-white rounded-md p-2 mb-1">👤 {order?.invoice?.customer_name ?? "Không có"}</p>
                <div className="rounded-md px-2 mb-1 bg-white">
                    {order.items.map((p) => (
                        <div key={p.id} className="flex items-center border-b py-2">
                            <Image
                                alt=""
                                src={`/products/cropped_${Math.floor(Math.random() * 17) + 1}.jpg`}
                                width={44}
                                height={32}
                                className="rounded-md mr-2"
                            />
                            <div className="flex flex-col justify-between w-full">
                                <p><strong>{p.product_name}</strong> <br/> {p.product_code}</p>
                                <p>{p.unit_price.toLocaleString()} x {p.quantity}</p>
                            </div>

                            <p className="text-right font-bold">{p.total_price.toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-md px-2 mb-1 bg-white">
                    <div className="flex justify-between border-b py-2">
                        <p>💰 Tổng tiền</p>
                        <p className="text-right">{order?.invoice?.amount ? order.invoice.amount.toLocaleString() : "0"}</p>
                    </div>
                    <div className="flex justify-between border-b py-2">
                        <p>🔻 Giảm giá (%)</p>
                        <p className="text-green-600 text-right">{order?.invoice?.discount ? order.invoice.discount.toLocaleString() : "0"}</p>
                    </div>
                    <div className="flex justify-between border-b py-2 font-bold">
                        <p>💵 Khách cần trả</p>
                        <p className="text-right">{((1 - Number(order.invoice.discount) / 100) * order.invoice.amount).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between border-b py-2 font-bold">
                        <p>💵 Khách đã trả</p>
                        <p className="text-right text-green-600">{order.invoice.paid_amount.toLocaleString()}</p>
                    </div>
                </div>
                <div className="rounded-md px-2 bg-white">
                    <div className="flex justify-between border-b py-2">
                        <p>👨‍💼 Nhân viên tạo: </p>
                        <p>{order?.invoice?.created_by ?? "Không rõ"}</p>
                    </div>
                    <div className="flex justify-between border-b py-2">
                        <p>🏢 Chi nhánh: </p>
                        <p>{order?.invoice?.alias_branch ?? "Không rõ"}</p>
                    </div>
                    <div className="flex justify-between border-b py-2">
                        <p>👨‍💼 Người làm cùng:</p>
                        <ul className="list-disc">
                            {order.coworkers.map((c) => (
                                <p key={c.id}>{c.alias_name}</p>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            {/*Xử lý đơn*/}
            {order?.invoice?.status_name === "Phiếu tạm" && (<>
                {!isPopupOpen ? (
                    <div
                        className="w-full p-2 fixed bottom-0 text-blue-600 text-center bg-white font-bold z-50"
                        onClick={() => setIsPopupOpen(true)}
                    >
                        Xử lý đơn
                    </div>
                ) : (
                    <>
                        {/* Overlay mờ */}
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={() => setIsPopupOpen(false)}
                        ></div>

                        {/* Popup */}
                        <div className="w-full p-4 fixed bottom-0 bg-white font-bold z-50 shadow-lg rounded-t-xl">
                            <div className="flex flex-col gap-3 text-center">
                                <button className="py-2 text-blue-600">🖨️ In đơn</button>
                                {/*<button className="py-2 text-yellow-600">✏️ Sửa đơn</button>*/}
                                { role === "admin" && (<>
                                        <button className="py-2 text-green-600">✅ Xác nhận</button>
                                        <button className="py-2 text-red-600">🗑️ Xóa đơn</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </>)}



        </div>
    );
}
