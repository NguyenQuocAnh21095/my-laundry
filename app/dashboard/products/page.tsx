'use client';
import { useEffect, useState } from "react";
import { ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import jwt from "jsonwebtoken";
import {useRouter} from "next/navigation";

export type Product = {
    id: number;
    product_name: string;
    product_code: number;
    unit_price: number;
    image: string;
    total_quantity: number;
};

export type Branch = {
    id: number;
    branch_name: string;
};

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>(""); // Debounce search
    const [sortField, setSortField] = useState<string>("product_name+asc");
    const [branch, setBranch] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [role, setRole] = useState<string>("");
    const router = useRouter();

    interface DecodedToken {
        id: number;
        role: string;
        branch: number;
        iat?: number;
        exp?: number;
    }

    // Lấy role từ localStorage
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
                    setRole(decoded.role);
                } else {
                    setRole(""); // Nếu giải mã không hợp lệ
                }
            } catch (err) {
                // Nếu có lỗi khi giải mã token, có thể là token đã hết hạn hoặc sai
                console.error("Token is invalid or expired.", err, token, SECRET_KEY);
                setRole(""); // Đặt lại thông tin user nếu token không hợp lệ
            } finally {
                setLoading(false); // Set loading to false sau khi xử lý xong
            }
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    // Fetch danh sách branches
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/branches`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setBranches(data.branches);
                    if (data.branches.length === 1) {
                        setBranch(data.branches[0].id); // Nếu chỉ có 1 branch, gán mặc định
                    }
                }
            } catch (err) {
                console.error("Error fetching branches:", err);
                setError("Error fetching branches.");
            }
        };

        fetchBranches();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            const [criteria, order] = sortField.split("+");
            const res = await fetch(`/api/products?search=${debouncedSearch}&criteria=${criteria}&order=${order}&branch=${branch}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setProducts(data.products);
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Error fetching products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (branch !== 0 || role === "admin") {
            fetchProducts();
        }
    }, [debouncedSearch, sortField, branch, role]);

    return (
        <div className="products-container md:p-4 text-black">
            <h1 className="text-2xl font-bold px-2">Hàng Hóa</h1>

            {/* Search */}
            <div className="search-section mb-1 px-2 h-8">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc mã sản phẩm"
                    className="border p-1 rounded-md w-full"
                />
            </div>

            {/* Sort & Branch Filter */}
            <div className="filter-section flex items-center px-2 mb-1 space-x-2">
                {/* Sort */}
                <div className="flex items-center justify-between w-full">
                    {/*<label className="bg-white rounded-md h-8 w-8 p-1">*/}
                    {/*    <ArrowsUpDownIcon />*/}
                    {/*</label>*/}
                    <select
                        onChange={(e) => setSortField(e.target.value)}
                        value={sortField}
                        className="border h-8 p-1 rounded-md bg-white"
                    >
                        <option value="product_name+asc">Tên hàng hóa tăng</option>
                        <option value="product_name+desc">Tên hàng hóa giảm</option>
                        <option value="total_quantity+desc">Dùng nhiều nhất</option>
                        <option value="total_quantity+asc">Dùng ít nhất</option>
                    </select>
                </div>

                {/* Branch Filter (Chỉ hiển thị nếu là admin) */}
                {role === "admin"  && (
                    <select
                        onChange={(e) => setBranch(Number(e.target.value))}
                        value={branch}
                        className="border h-8 p-1 rounded-md bg-white"
                    >
                        <option value={0}>Tất cả chi nhánh</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.branch_name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Error Message */}
            {error && <div className="error-message text-red-500">{error}</div>}

            {/* Product List */}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="product-list px-2 space-y-1 max-h-[75vh] overflow-y-auto bg-gray-200">
                    {products.map((product: Product) => (
                        <div key={product.id}
                             className="product-item flex items-center w-full rounded-md bg-white p-1 shadow-md">
                            <Image
                                alt=""
                                src={product.image || "/products/notfound.png"}
                                width={32}
                                height={32}
                                className="object-cover rounded-md max-w-10 mr-2"
                            />
                            <div className="flex justify-between w-full">
                                {/* Bên trái */}
                                <div>
                                    <p className="font-bold">{product.product_name}</p>
                                    <p className="text-gray-500">{product.product_code}</p>
                                </div>

                                {/* Bên phải */}
                                <div className="text-right">
                                    <p className="font-bold">{product.unit_price.toLocaleString("vi-VN")}</p>
                                    <p className="text-gray-500">Đã bán: {product.total_quantity}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsPage;