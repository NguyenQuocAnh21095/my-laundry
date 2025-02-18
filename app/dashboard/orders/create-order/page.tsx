"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import clsx from "clsx";
import jwt from "jsonwebtoken";
import {useRouter} from "next/navigation";

// Hàm debounce giúp delay request
const useDebounce = (value: string, delay: number = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

interface Customer {
    id: number;
    customer_name: string;
    customer_phone: string;
}

//Phần Product
export type Product = {
    id: number;
    product_name: string;
    product_code: number;
    unit_price: number;
    image: string;
    total_quantity: number;
};

export type SelectedProduct = {
    id: number;
    product_name: string;
    product_code: number;
    unit_price: number;
    image: string;
    quantity: number;
};

export type Branch = {
    id: number;
    branch_name: string;
};

interface DecodedToken {
    id: number;
    role: string;
    branch: number;
    iat?: number;
    exp?: number;
}

//Phần Users
export type User = {
    id: number;
    alias_name: string;
    username: string;
    role: string;
    branch: number;
    created_at: string;
}

const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

const CreateOrder = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showStep, setShowStep] = useState<number>(1);

    //Phần product
    const [products, setProducts] = useState<Product[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [searchProduct, setSearchProduct] = useState<string>("");
    const [debouncedSearchProduct, setDebouncedSearchProduct] = useState<string>(""); // Debounce search
    const [sortField, setSortField] = useState<string>("total_quantity+desc");
    const [branch, setBranch] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [role, setRole] = useState<string>("");
    const router = useRouter();

    //Phần Users
    const [users, setUsers] = useState<User[]>([]);
    const [createdUser, setCreatedUser] = useState<User | null>(null);
    const [coworkerUsers, setCoworkerUsers] = useState<User[]>([]);

    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);  //Lấy được danh sách sản phẩm
    //Phần Review thông tin
    const [discount, setDiscount] = useState<number>(0);

    // State cho form tạo khách hàng
    const [newCustomer, setNewCustomer] = useState({
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        branch_id: branch, // Giả sử branch_id mặc định là 1
    });

    //Dùng debounce search
    const debouncedSearch = useDebounce(search, 500);
    // Lấy role từ localStorage
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            // Nếu không có token, chuyển hướng về trang login
            router.push("/login");
        } else {
            try {
                setLoading(true);
                // Nếu có token, giải mã JWT và lấy thông tin user
                const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;
                // setDebugLog("hello");
                if (!decoded) {
                    // Lưu thông tin người dùng sau khi giải mã
                    router.push("/login");
                } else {
                    setRole(decoded.role);
                    setBranch(decoded.branch)
                }
            } catch (err) {
                // Nếu có lỗi khi giải mã token, có thể là token đã hết hạn hoặc sai
                console.error("Token is invalid or expired.", err, token, SECRET_KEY);
                router.push("/login");
            } finally {
                setLoading(false); // Set loading to false sau khi xử lý xong
            }
        }
    }, [router]);
    // Debounce search Product
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchProduct(searchProduct);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchProduct]);
    // Fetch danh sách branches, users
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

        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("No token found");
                    return;
                }

                const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;

                const res = await fetch(`/api/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                if (data.error) {
                    setError(data.error);
                } else {
                    // Cập nhật users
                    setUsers(data.users);

                    // Tìm user trong danh sách users với decoded.id
                    const foundUser = data.users.find((user: User) => user.id === decoded.id);

                    if (foundUser) {
                        // Nếu tìm thấy user, gán vào createdUser và loại bỏ khỏi danh sách users
                        setCreatedUser(foundUser);
                        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== decoded.id));
                    }
                }
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Error fetching users.");
            }
        };


        fetchBranches();
        fetchUsers();
    }, []);
    // Lấy danh sách products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const token = localStorage.getItem("token");

            try {
                const [criteria, order] = sortField.split("+");
                const res = await fetch(`/api/products?search=${debouncedSearchProduct}&criteria=${criteria}&order=${order}&branch=${branch}`, {
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

        if (branch !== 0 || role === "admin") {
            fetchProducts();
        }
    }, [debouncedSearchProduct, sortField, branch, role]); // ✅ Không còn cảnh báo

    //Xử lý debounce
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`/api/customers?search=${debouncedSearch}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();

                if (data?.customers) {
                    setCustomers(data.customers);
                } else {
                    setCustomers([]);
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        };

        fetchCustomers();
    }, [debouncedSearch]); //Chỉ fetch khi search đã debounce
    //Xử lý chọn user
    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
    };
    //Xử lý tạo user
    const handleCreateCustomer = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/customers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newCustomer),
            });

            const data = await res.json();
            if (res.ok) {
                setShowCreateForm(false); // Ẩn form
                setSelectedCustomer(data.customer); // Chọn user vừa tạo
                setSearch(""); // Reset tìm kiếm để hiển thị toàn bộ danh sách
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Error creating customer:", error);
        }
    };
    //Xử lý selectedProduct
    const handleSelectProduct = (product: Product) => {
        setSelectedProducts((prev) => {
            const exists = prev.some((item) => item.id === product.id);

            if (exists) {
                // Nếu sản phẩm đã tồn tại, lọc nó ra khỏi danh sách
                return prev.filter((item) => item.id !== product.id);
            } else {
                // Nếu chưa có, thêm vào danh sách
                return [...prev, {
                    id: product.id,
                    product_name: product.product_name,
                    product_code: product.product_code,
                    unit_price: product.unit_price,
                    image: product.image,
                    quantity: 1 }];
            }
        });
    };
    //XỬ lý số lượng thay đổi
    const handleQuantityChange = (id: number, quantity: number) => {
        if (quantity < 0) return;
        setSelectedProducts((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    };
    const getTotalQuantity = (selectedProducts: SelectedProduct[]) => {
        return selectedProducts.reduce((total, product) => total + product.quantity, 0);
    };
    const getTotalPrice = (selectedProducts: SelectedProduct[]) => {
        return selectedProducts.reduce((total, product) => total + product.unit_price * product.quantity, 0);
    };

    //Phần thông tin User
    const handleCoworkerSelection = (userId: number, checked: boolean) => {
        if (checked) {
            // Thêm vào coworkerUsers nếu chưa có
            setCoworkerUsers((prev) => [...prev, users.find((user) => user.id === userId)!]);
        } else {
            // Loại bỏ khỏi coworkerUsers
            setCoworkerUsers((prev) => prev.filter((user) => user.id !== userId));
        }
    };

    //Phần submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/invoice-name`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const dataRes = await res.json();
            if (dataRes.error) {
                console.log(dataRes.error);
            }
            const invoice_name = dataRes.invoice_name

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    invoice: {
                        invoice_name: invoice_name,
                        customer_id: selectedCustomer?.id,
                        branch_id: branch,
                        amount: getTotalPrice(selectedProducts),
                        paid_amount: 0,
                        pay_method: 1,
                        status_id: 1,
                        created_by: createdUser?.id,
                        discount: discount
                    },
                    items: selectedProducts.map(product => ({
                        product_id: product.id,
                        quantity: product.quantity,
                        unit_price: product.unit_price,
                        total_price: product.quantity * product.unit_price
                    })),
                    coworkers: coworkerUsers.map(user => user.id)
                }),
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
            } else {
                    alert(data.message);
                    setError('');
                    // Nếu không chọn "Tạo và tiếp tục", chuyển đến danh sách sản phẩm
                    router.push('/dashboard/orders');
                }
        } catch (err) {
            console.error('Error creating order:', err);
            setError('Có lỗi xảy ra khi tạo đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-black">
            {!showCreateForm ? (
                showStep === 1 ? (
                    <>
                        <div className="text-2xl font-bold px-2 text-center text-blue-500">Bước 1/4</div>
                        <h1 className="text-2xl font-bold px-2 text-center">Chọn tên khách</h1>
                        <div className="flex search-section mb-1 px-2 h-8">
                            <input
                                type="text"
                                placeholder="Tìm theo tên, số điện thoại"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border p-1 rounded-md w-full mr-2 md:mr-4"
                            />
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="flex bg-blue-500 text-white p-1 px-2 md:pr-6 rounded-md shadow-lg hover:bg-blue-600 transition"
                            >
                                <PlusIcon className="w-6 h-6" />
                                <div className="hidden md:block">Thêm</div>
                            </button>
                        </div>
                        {!selectedCustomer ? (
                            <div className="text-center bg-gray-400 text-white rounded-md m-2 py-2 font-bold">
                                Chưa Chọn Khách Hàng
                            </div>
                        ) : (
                            <p className="text-center bg-blue-400 text-white rounded-md m-2 py-2">
                                <strong>{selectedCustomer.customer_name}</strong>
                            </p>
                        )}
                        {customers.length === 0 ? (
                            <p>Không có khách hàng nào.</p>
                        ) : (
                            <div className="px-2 max-h-[60vh] overflow-y-auto bg-gray-200">
                                <ul>
                                    {customers.map((customer) => (
                                        <li
                                            key={customer.id}
                                            style={{
                                                cursor: "pointer",
                                                fontWeight:
                                                    selectedCustomer?.id === customer.id ? "bold" : "normal",
                                            }}
                                            onClick={() => handleSelectCustomer(customer)}
                                            className="flex items-center w-full rounded-md bg-white p-1 shadow-md mb-1"
                                        >
                                            <div className="flex items-center">
                                                <Image
                                                    alt=""
                                                    src={`/products/cropped_${Math.floor(Math.random() * 17) + 1}.jpg`}
                                                    width={128}
                                                    height={128}
                                                    className="object-cover rounded-md mr-2 max-w-8 max-h-8"
                                                />
                                                <div>
                                                    <div className="font-bold">{customer.customer_name}</div>
                                                    <p className="bg-gray-200 rounded-md">
                                                        {customer.customer_phone}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex fixed bottom-10 w-full height-full justify-between items-center space-x-2 p-4 shadow rounded-md bg-white">
                            <Link
                                href="/dashboard/orders"
                                className="w-full bg-gray-300 text-white py-2 px-4 text-center rounded-md hover:bg-gray-500"
                            >
                                Hủy
                            </Link>
                            <button
                                onClick={() => setShowStep(2)}
                                className={clsx("w-full text-white py-2 px-4 rounded-md",
                                    selectedCustomer?.id ? 'bg-blue-500' : 'bg-blue-200',
                                )}
                                disabled={!selectedCustomer?.id}
                            >
                                Chọn dịch vụ
                            </button>
                        </div>
                    </>
                ) : showStep === 2 ? (
                    <>
                        <div className="text-2xl font-bold px-2 text-center text-blue-500">Bước 2/4</div>
                        <h1 className="text-2xl font-bold px-2 text-center">Chọn Dịch Vụ</h1>
                        {/*Phần dịch vụ*/}
                        <div>
                            <div className="products-container md:p-4 text-black">
                                <div>
                                    {/* Search */}
                                    <div className="search-section mb-1 px-2 h-8">
                                        <input
                                            type="text"
                                            value={searchProduct}
                                            onChange={(e) => setSearchProduct(e.target.value)}
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
                                        {role === "admin" && (
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

                                    {/*Bỏ chọn sản phẩm*/}
                                    <div
                                        className="flex justify-between items-center px-2 mx-2 rounded-md bg-white"
                                    >
                                        {/*<button*/}
                                        {/*    className="bg-red-500 text-white px-4 py-2 rounded-md mt-2"*/}
                                        {/*    onClick={() => {*/}
                                        {/*        setSelectedProducts((prev) => prev.filter((item) => item.quantity > 0));*/}
                                        {/*    }}*/}
                                        {/*>*/}
                                        {/*    Xóa sản phẩm 0 {getTotalPrice(selectedProducts).toLocaleString("vi-VN")}*/}
                                        {/*</button>*/}
                                        <div className="flex items-center">
                                        <div className="font-bold mr-2">Tổng tiền hàng:
                                        </div>
                                            <div className="border border-blue-500 px-2 rounded-md text-blue-500 my-1"> {getTotalQuantity(selectedProducts).toFixed(2)}</div>
                                        </div>
                                        <div
                                            className="text-blue-500 font-bold text-xl">{getTotalPrice(selectedProducts).toLocaleString("vi-VN")} đ
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={() => setSelectedProducts([])}
                                                className="m-2 font-bold text-blue-500">Bỏ chọn tất cả
                                        </button>
                                    </div>

                                    {/*Kiểm tra sản phẩm đã chọn*/}
                                    {/*<h2 className="font-bold">Sản phẩm đã chọn</h2>*/}
                                    {/*{selectedProducts.length > 0 ? (*/}
                                    {/*    selectedProducts.map((item) => (*/}
                                    {/*        <div key={item.id}*/}
                                    {/*             className="flex justify-between p-1 bg-white rounded-md my-1">*/}
                                    {/*            <span>{item.product_name}</span>*/}
                                    {/*            <input*/}
                                    {/*                type="number"*/}
                                    {/*                className="border w-12 text-center rounded-md min-w-16"*/}
                                    {/*                value={item.quantity}*/}
                                    {/*                onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}*/}
                                    {/*            />*/}
                                    {/*        </div>*/}
                                    {/*    ))*/}
                                    {/*) : (*/}
                                    {/*    <p>Chưa chọn sản phẩm nào</p>*/}
                                    {/*)}*/}

                                    {/* Error Message */}
                                    {error && <div className="error-message text-red-500">{error}</div>}

                                    {/* Product List */}
                                    {loading ? (
                                        <div>Loading...</div>
                                    ) : (
                                        <div
                                            className="product-list px-2 space-y-1 max-h-[60vh] overflow-y-auto bg-gray-200">
                                            {products.map((product) => {
                                                const selectedItem = selectedProducts.find((item) => item.id === product.id);
                                                return (
                                                    <div key={product.id}
                                                         className={`product-item ${selectedItem ? "bg-blue-100" : "bg-white"} flex items-center w-full rounded-md p-1 shadow-md min-h-16`}

                                                    >
                                                        <Image
                                                            alt=""
                                                            src={product.image || "/products/notfound.png"}
                                                            width={32}
                                                            height={32}
                                                            className="object-cover rounded-md max-w-10 mr-2"
                                                        />
                                                        <div className="flex justify-between w-full">
                                                            {/* Bên trái */}
                                                            <div className="w-full"
                                                                 onClick={() => handleSelectProduct(product)}>
                                                                <p className="font-bold">{product.product_name}</p>
                                                                <p className="text-gray-500">{product.product_code} - KH
                                                                    đặt: {product.total_quantity}</p>
                                                            </div>

                                                            {/* Bên phải */}
                                                            <div className="text-right mr-4">
                                                                <p className="font-bold text-blue-500">{product.unit_price.toLocaleString("vi-VN")}</p>
                                                                {selectedItem && (
                                                                    <input
                                                                        type="number"
                                                                        className="border w-12 text-center text-black rounded-md min-w-16"
                                                                        value={selectedItem.quantity === 0 ? '' : selectedItem.quantity}
                                                                        min={0}
                                                                        onChange={(e) => handleQuantityChange(product.id, Number(e.target.value))}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                    )}
                                </div>
                            </div>
                        </div>

                        {/*Button điều hướng*/}
                        <div
                            className="flex fixed bottom-10 w-full height-full justify-between items-center space-x-2 p-4 shadow rounded-md bg-white">
                            <button
                                onClick={() => setShowStep(1)}
                                className="w-full bg-gray-300 text-white py-2 px-4 rounded-md hover:bg-gray-500"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={() => {
                                    setShowStep(3);
                                    setSelectedProducts((prev) => prev.filter((item) => item.quantity > 0));
                                }}
                                disabled={selectedProducts.length === 0}
                                className={clsx("w-full text-white py-2 px-4 rounded-md",
                                    selectedProducts.length === 0 ? 'bg-blue-200' : 'bg-blue-500',
                                )}
                            >
                                Tiếp theo
                            </button>
                        </div>
                    </>
                ) : showStep === 3 ? (
                    <>
                        <div className="text-2xl font-bold px-2 text-center text-blue-500">Bước 3/4</div>
                        <h1 className="text-2xl font-bold px-2 text-center">Thông tin dành cho<br/>người tạo đơn</h1>
                        {/*Kiểm tra sản phẩm đã chọn*/}
                        {/*<h2 className="font-bold">Sản phẩm đã chọn</h2>*/}
                        {/*{selectedProducts.length > 0 ? (*/}
                        {/*    selectedProducts.map((item) => (*/}
                        {/*        <div key={item.id}*/}
                        {/*             className="flex justify-between p-1 bg-white rounded-md my-1">*/}
                        {/*            <span>{item.product_name}</span>*/}
                        {/*            <input*/}
                        {/*                type="number"*/}
                        {/*                className="border w-12 text-center rounded-md min-w-16"*/}
                        {/*                value={item.quantity}*/}
                        {/*                onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*    ))*/}
                        {/*) : (*/}
                        {/*    <p>Chưa chọn sản phẩm nào</p>*/}
                        {/*)}*/}
                        <div className="my-4 bg-white mx-2 p-4 space-y-2 rounded-md">
                            <p><strong>Người tạo:</strong> {createdUser?.alias_name}</p>
                            <p><strong>Ngày tạo đơn:</strong> {new Date().toLocaleString()}</p>
                            <h3><strong>Người làm cùng:</strong></h3>
                            <div>
                                {users.map((user) => (
                                    <div key={user.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`coworker-${user.id}`}
                                            checked={coworkerUsers.some((u) => u.id === user.id)}
                                            onChange={(e) => handleCoworkerSelection(user.id, e.target.checked)}
                                        />
                                        <label htmlFor={`coworker-${user.id}`} className="ml-2">
                                            {user.alias_name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {/*<div>*/}
                            {/*    {coworkerUsers.length > 0 ? (*/}
                            {/*        <div>*/}
                            {/*            {coworkerUsers.map((user) => (*/}
                            {/*                <div key={user.id} className="flex items-center">*/}
                            {/*                    <p>{user.alias_name}</p> /!* Hiển thị tên người làm chung *!/*/}
                            {/*                </div>*/}
                            {/*            ))}*/}
                            {/*        </div>*/}
                            {/*    ) : (*/}
                            {/*        <div>Không có người làm chung</div>*/}
                            {/*    )}*/}
                            {/*</div>*/}
                        </div>
                        {/*Button điều hướng */}
                        <div
                            className="flex fixed bottom-10 w-full height-full justify-between items-center space-x-2 p-4 shadow rounded-md bg-white">
                            <button
                                onClick={() => setShowStep(2)}
                                className="w-full bg-gray-300 text-white py-2 px-4 rounded-md hover:bg-gray-500"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={() => setShowStep(4)}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                            >
                                Tiếp theo
                            </button>
                        </div>
                    </>
                ): showStep === 4 ? (
                    <>
                        <div className="text-2xl font-bold px-2 text-center text-blue-500">Bước 4/4</div>
                        <h1 className="text-2xl font-bold px-2 text-center">Tổng hợp thông tin đơn</h1>
                        <div className="px-4 mt-4 space-y-1 overflow-y-scroll max-h-[65vh]">
                            <div className="flex justify-between bg-white px-4 py-2 rounded-md">
                                <p>Tên khách:</p>
                                <p className="text-right font-bold">{selectedCustomer?.customer_name}</p>
                            </div>
                            <div className="bg-white p-2 rounded-md">
                                {selectedProducts.length > 0 ? (
                                    selectedProducts.map((item) => (
                                        <div key={item.id}
                                             className="flex p-1 bg-white rounded-md my-1">
                                            <Image
                                                alt=""
                                                src={item.image || "/products/notfound.png"}
                                                width={44}
                                                height={32}
                                                className="rounded-md mr-2"
                                            />
                                            <div className="flex justify-between w-full">
                                                {/* Bên trái */}
                                                <div>
                                                    <p className="font-bold">{item.product_name}</p>
                                                    <p className="text-gray-500">{item.unit_price.toLocaleString("vi-VN")}</p>
                                                </div>

                                                {/* Bên phải */}
                                                <div className="text-right">
                                                    <p className="text-gray-500 font-bold">{item.quantity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>Chưa chọn sản phẩm nào</p>
                                )}
                            </div>
                            <div className="bg-white p-2 rounded-md space-y-1">
                                <div className="flex justify-between px-2 rounded-md">
                                    <p>Tổng tiền: </p>
                                    <p>{getTotalPrice(selectedProducts).toLocaleString("vi-VN")}</p>
                                </div>
                                <div className="flex justify-between px-2 rounded-md">
                                    <p>Giảm giá (%): </p>
                                    <input type="number" value={discount} min={0} onChange={(e) => setDiscount(Number(e.target.value))} className="border border-green-500 rounded-md text-center max-w-20"/>
                                </div>
                                <div className="flex justify-between px-2 rounded-md font-bold">
                                    <p>Khách cần trả: </p>
                                    <p>{(getTotalPrice(selectedProducts)*(1-discount/100)).toLocaleString("vi-VN")}</p>
                                </div>
                                <div className="flex justify-between px-2 rounded-md">
                                    <p>Khách đã trả: </p>
                                    <p>0</p>
                                </div>
                                <div className="flex justify-between bg-white px-2 rounded-md">
                                    <p>Phương thức thanh toán:</p>
                                    <p>chưa có</p>
                                </div>
                            </div>
                            <div className="flex justify-between bg-white p-2 rounded-md">
                                <p>Người tạo đơn:</p>
                                <p><strong>{createdUser?.alias_name}</strong></p>
                            </div>
                            <div className="flex justify-between bg-white p-2 rounded-md">
                                Người làm cùng:
                                <div className="font-bold">
                                {coworkerUsers.length === 0 ? 'Không có':(
                                coworkerUsers.map((item) => (
                                    <div key={item.id}
                                         className="text-blue-500">
                                        <p>{item.alias_name}</p>
                                    </div>
                                ))
                            )}</div>
                            </div>
                            {role === 'admin' ? (
                                <div>
                                <select
                                    className="bg-white p-2 rounded-md w-full focus:outline-none"
                                    onChange={(e) => setBranch(Number(e.target.value))}
                                    value={branch}
                                >
                                    <option value={0} disabled>Chọn chi nhánh</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.branch_name}
                                        </option>
                                    ))}
                                </select>
                                {/*<div className="bg-white p-2 rounded-md">Chi nhánh {branch}</div>*/}
                                </div>
                            ) : (
                                <div className="bg-white p-2 rounded-md">Chi nhánh {branch}</div>
                            )}



                        </div>
                        {/*Button điều hướng */}
                        <div
                            className="flex fixed bottom-10 w-full height-full justify-between items-center space-x-2 p-4 shadow rounded-md bg-white">
                            <button
                                onClick={() => setShowStep(3)}
                                className="w-full bg-gray-300 text-white py-2 px-4 rounded-md hover:bg-gray-500"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={branch === 0 || loading}
                                className={clsx("w-full text-white py-2 px-4 rounded-md",
                                    branch === 0 ? 'bg-blue-200' : 'bg-blue-500',
                                )}
                            >
                                {loading ? 'Đang xử lý...' : 'Tạo đơn'}
                            </button>
                        </div>
                    </>
                ) : null
            ) : (
                <div className="md:p-4 text-black px-2">
                    <h3 className="text-2xl font-bold my-4 text-center">Tạo Khách Hàng Mới</h3>
                    <div
                        className="flex flex-col height-full justify-center items-center space-y-2 p-4 mb-2 shadow rounded-md bg-white">
                        <Image
                            alt=""
                            src={`/products/cropped_${Math.floor(Math.random() * 17) + 1}.jpg`}
                            width={128}
                            height={128}
                            className="object-cover rounded-md mt-4 mb-8 max-w-32 max-h-32"
                        />
                        <input
                            type="text"
                            placeholder="Tên khách hàng"
                            value={newCustomer.customer_name}
                            onChange={(e) => setNewCustomer({...newCustomer, customer_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Số điện thoại"
                            value={newCustomer.customer_phone}
                            onChange={(e) => setNewCustomer({...newCustomer, customer_phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Địa chỉ"
                            value={newCustomer.customer_address}
                            onChange={(e) => setNewCustomer({...newCustomer, customer_address: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div
                        className="flex height-full justify-between items-center space-x-2 p-4 shadow rounded-md bg-white">
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="w-full bg-gray-300 text-white py-2 px-4 rounded-md hover:bg-gray-500"
                        >
                        Hủy
                        </button>
                        <button
                            onClick={handleCreateCustomer}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateOrder;
