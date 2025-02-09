'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";
interface DecodedToken {
    id: number;
    role: string;
    branch: number;
    iat?: number;
    exp?: number;
}
const CreateProductPage = () => {
    // const [role, setRole] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [productCode, setProductCode] = useState('');
    const [unitPrice, setUnitPrice] = useState<number | string>('');
    const [branchId, setBranchId] = useState<number>(1); // Set giá trị mặc định chi nhánh 1
    const [image, setImage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<{ id: number; branch_name: string }[]>([]); // State để lưu danh sách chi nhánh
    const [continueCreating, setContinueCreating] = useState(false); // Trạng thái để kiểm tra có tiếp tục tạo sản phẩm không
    const router = useRouter();

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
                if (!decoded) {
                    // Lưu thông tin người dùng sau khi giải mã
                    router.push("/login");
                } else {
                    // setRole(decoded.role); // Nếu giải mã không hợp lệ
                    console.log("Thông tin user hợp lệ");
                }
            } catch (err) {
                // Nếu có lỗi khi giải mã token, có thể là token đã hết hạn hoặc sai
                console.error("Token is invalid or expired.", err, token, SECRET_KEY);
                router.push("/login");
                // setRole(null); // Đặt lại thông tin user nếu token không hợp lệ
            } finally {
                setLoading(false); // Set loading to false sau khi xử lý xong
            }
        }
    }, [router]);

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
                        setBranchId(data.branches[0].id); // Nếu chỉ có 1 branch, gán mặc định
                    }
                }
            } catch (err) {
                console.error("Error fetching branches:", err);
                setError("Error fetching branches.");
            }
        };

        fetchBranches();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!productName || !productCode || !unitPrice || !branchId) {
            setError('Tất cả các trường là bắt buộc!');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    product_name: productName,
                    product_code: productCode,
                    unit_price: Number(unitPrice),
                    branch_id: branchId,
                    image,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                if (continueCreating) {
                    // Nếu chọn "Tạo và tiếp tục", không chuyển hướng, reset form
                    setProductName('');
                    setProductCode('');
                    setUnitPrice('');
                    setBranchId(1); // Mặc định chi nhánh đầu tiên
                    setImage('');
                    setError('');
                } else {
                    // Nếu không chọn "Tạo và tiếp tục", chuyển đến danh sách sản phẩm
                    router.push('/dashboard/products');
                }
            }
        } catch (err) {
            console.error('Error creating product:', err);
            setError('Có lỗi xảy ra khi tạo sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 text-black">
            <h2 className="text-2xl font-bold mb-4">Tạo Sản Phẩm</h2>
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                    <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-md"
                        placeholder="Nhập tên sản phẩm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Mã sản phẩm</label>
                    <input
                        type="text"
                        value={productCode}
                        onChange={(e) => setProductCode(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-md"
                        placeholder="Nhập mã sản phẩm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Giá sản phẩm</label>
                    <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-md"
                        placeholder="Nhập giá sản phẩm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Chi nhánh</label>
                    <select
                        value={branchId}
                        onChange={(e) => setBranchId(Number(e.target.value))}
                        className="mt-1 block w-full p-2 border rounded-md bg-white"
                    >
                        {branches.length > 0 ? (
                            <>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </>
                        ) : (
                            <option value={0}>Không có chi nhánh</option>
                        )}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Ảnh sản phẩm (URL)</label>
                    <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-md"
                        placeholder="Nhập URL ảnh sản phẩm"
                    />
                </div>

                {error && <div className="text-red-500">{error}</div>}

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md ${loading ? 'bg-gray-400' : 'bg-blue-600'} text-white`}
                    >
                        {loading ? 'Đang tạo...' : 'Tạo sản phẩm'}
                    </button>

                    {/* Nút "Tạo và tiếp tục" */}
                    <button
                        type="button"
                        onClick={() => setContinueCreating(true)}
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md ${loading ? 'bg-gray-400' : 'bg-green-600'} text-white`}
                    >
                        {loading ? 'Đang tạo...' : 'Tạo và tiếp tục'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProductPage;