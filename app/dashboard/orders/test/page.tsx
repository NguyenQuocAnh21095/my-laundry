"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import jwt from "jsonwebtoken";
import { useRouter } from "next/navigation";

// export type Product = {
//     id: number;
//     product_name: string;
//     product_code: number;
//     unit_price: number;
//     image: string;
//     total_quantity: number;
// };
//
// export type SelectedProduct = {
//     id: number;
//     product_name: string;
//     quantity: number;
// };

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
    // const [products, setProducts] = useState<Product[]>([]);
    // const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    // const [searchProduct, setSearchProduct] = useState<string>("");
    // const [debouncedSearchProduct, setDebouncedSearchProduct] = useState<string>("");
    // const [sortField, setSortField] = useState<string>("total_quantity+desc");
    const [branch, setBranch] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [role, setRole] = useState<string>("");

    const [users, setUsers] = useState<User[]>([]);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            try {
                setLoading(true);
                const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] }) as DecodedToken;
                if (!decoded) {
                    router.push("/login");
                } else {
                    setRole(decoded.role);
                    setBranch(decoded.branch);
                }
            } catch (err) {
                console.error("Token is invalid or expired.", err);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        }
    }, []);

    // useEffect(() => {
    //     const handler = setTimeout(() => {
    //         setDebouncedSearchProduct(searchProduct);
    //     }, 500);
    //     return () => clearTimeout(handler);
    // }, [searchProduct]);

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
                const res = await fetch(`/api/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (data.error) {
                    setError(data.error);
                } else {
                    setUsers(data.users);
                }
            } catch (err) {
                console.error("Error fetching users:", err);
                setError("Error fetching users.");
            }
        };
        fetchUsers();
        fetchBranches();
    }, []);

    // const fetchProducts = async () => {
    //     setLoading(true);
    //     const token = localStorage.getItem("token");
    //
    //     try {
    //         const [criteria, order] = sortField.split("+");
    //         const res = await fetch(`/api/products?search=${debouncedSearchProduct}&criteria=${criteria}&order=${order}&branch=${branch}`, {
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             },
    //         });
    //
    //         const data = await res.json();
    //         if (data.error) {
    //             setError(data.error);
    //         } else {
    //             setProducts(data.products);
    //         }
    //     } catch (err) {
    //         console.error("Error fetching products:", err);
    //         setError("Error fetching products.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     if (branch !== 0 || role === "admin") {
    //         fetchProducts();
    //     }
    // }, [debouncedSearchProduct, sortField, branch, role]);

    // const handleSelectProduct = (product: Product) => {
    //     setSelectedProducts((prev) => {
    //         const exists = prev.some((item) => item.id === product.id);
    //
    //         if (exists) {
    //             // Nếu sản phẩm đã tồn tại, lọc nó ra khỏi danh sách
    //             return prev;
    //         } else {
    //             // Nếu chưa có, thêm vào danh sách
    //             return [...prev, { id: product.id, product_name: product.product_name, quantity: 1 }];
    //         }
    //     });
    // };

    // const handleQuantityChange = (id: number, quantity: number) => {
    //     if (quantity < 0) return;
    //     setSelectedProducts((prev) =>
    //         quantity === 0
    //             ? prev.filter((item) => item.id !== id)
    //             : prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    //     );
    // };
    // const handleQuantityChange = (id: number, quantity: number) => {
    //     if (quantity < 0) return;
    //     setSelectedProducts((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    //     );
    // };

    return (
        <div className="products-container md:p-4 text-black">
            <div>branch: {branches[0]?.id} <br/> {users[0]?.alias_name}</div>
            {/*<div>*/}
            {/*    <div className="search-section mb-1 px-2 h-8">*/}
            {/*        <input*/}
            {/*            type="text"*/}
            {/*            value={searchProduct}*/}
            {/*            onChange={(e) => setSearchProduct(e.target.value)}*/}
            {/*            placeholder="Tìm theo tên hoặc mã sản phẩm"*/}
            {/*            className="border p-1 rounded-md w-full"*/}
            {/*        />*/}
            {/*    </div>*/}

            {/*    <div className="filter-section flex items-center px-2 mb-1 space-x-2">*/}
            {/*        <select*/}
            {/*            onChange={(e) => setSortField(e.target.value)}*/}
            {/*            value={sortField}*/}
            {/*            className="border h-8 p-1 rounded-md bg-white"*/}
            {/*        >*/}
            {/*            <option value="product_name+asc">Tên hàng hóa tăng</option>*/}
            {/*            <option value="product_name+desc">Tên hàng hóa giảm</option>*/}
            {/*            <option value="total_quantity+desc">Dùng nhiều nhất</option>*/}
            {/*            <option value="total_quantity+asc">Dùng ít nhất</option>*/}
            {/*        </select>*/}

            {/*        {role === "admin" && (*/}
            {/*            <select*/}
            {/*                onChange={(e) => setBranch(Number(e.target.value))}*/}
            {/*                value={branch}*/}
            {/*                className="border h-8 p-1 rounded-md bg-white"*/}
            {/*            >*/}
            {/*                <option value={0}>Tất cả chi nhánh</option>*/}
            {/*                {branches.map((b) => (*/}
            {/*                    <option key={b.id} value={b.id}>*/}
            {/*                        {b.branch_name}*/}
            {/*                    </option>*/}
            {/*                ))}*/}
            {/*            </select>*/}
            {/*        )}*/}
            {/*    </div>*/}

            {/*    <div className="selected-products bg-gray-100 p-2 rounded-md">*/}
            {/*        <button onClick={() => setSelectedProducts([])}>Xóa</button>*/}
            {/*        <button*/}
            {/*            className="bg-red-500 text-white px-4 py-2 rounded-md mt-2"*/}
            {/*            onClick={() => {*/}
            {/*                setSelectedProducts((prev) => prev.filter((item) => item.quantity > 0));*/}
            {/*            }}*/}
            {/*        >*/}
            {/*            Xóa sản phẩm 0*/}
            {/*        </button>*/}
            {/*        <h2 className="font-bold">Sản phẩm đã chọn</h2>*/}
            {/*        {selectedProducts.length > 0 ? (*/}
            {/*            selectedProducts.map((item) => (*/}
            {/*                <div key={item.id} className="flex justify-between p-1 bg-white rounded-md my-1">*/}
            {/*                    <span>{item.product_name}</span>*/}
            {/*                    <input*/}
            {/*                        type="number"*/}
            {/*                        className="border w-12 text-center rounded-md min-w-16"*/}
            {/*                        value={item.quantity}*/}
            {/*                        onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*            ))*/}
            {/*        ) : (*/}
            {/*            <p>Chưa chọn sản phẩm nào</p>*/}
            {/*        )}*/}
            {/*    </div>*/}

            {/*    {error && <div className="error-message text-red-500">{error}</div>}*/}

            {/*    {loading ? (*/}
            {/*        <div>Loading...</div>*/}
            {/*    ) : (*/}
            {/*        <div className="product-list px-2 space-y-1 max-h-[60vh] overflow-y-auto bg-gray-200">*/}
            {/*            {products.map((product) => {*/}
            {/*                const selectedItem = selectedProducts.find((item) => item.id === product.id);*/}
            {/*                return (*/}
            {/*                    <div key={product.id} className={`product-item ${selectedItem ? "bg-blue-400 text-white" : "bg-white"} flex items-center w-full rounded-md p-2 shadow-md`}*/}
            {/*                         onClick={() => handleSelectProduct(product)}*/}
            {/*                    >*/}
            {/*                        <Image*/}
            {/*                            alt=""*/}
            {/*                            src={product.image || "/products/notfound.png"}*/}
            {/*                            width={32}*/}
            {/*                            height={32}*/}
            {/*                            className="object-cover rounded-md max-w-10 mr-2"*/}
            {/*                        />*/}
            {/*                        <div className="flex justify-between w-full items-center">*/}
            {/*                            <div>*/}
            {/*                                <p className="font-bold">{product.product_name}*/}
            {/*                                </p>*/}
            {/*                            </div>*/}
            {/*                            {selectedItem && (*/}
            {/*                                <input*/}
            {/*                                    type="number"*/}
            {/*                                    className="border w-12 text-center text-black rounded-md min-w-16"*/}
            {/*                                    value={selectedItem.quantity === 0 ? '':selectedItem.quantity}*/}
            {/*                                    min={0}*/}
            {/*                                    onChange={(e) => handleQuantityChange(product.id, Number(e.target.value))}*/}
            {/*                                />*/}
            {/*                            )*/}
            {/*                            //     : (*/}
            {/*                            //     <button*/}
            {/*                            //         onClick={() => handleSelectProduct(product)}*/}
            {/*                            //         className="border p-1 rounded-md bg-blue-500 text-white"*/}
            {/*                            //     >*/}
            {/*                            //         Chọn*/}
            {/*                            //     </button>*/}
            {/*                            // )*/}
            {/*                            }*/}
            {/*                        </div>*/}
            {/*                    </div>*/}
            {/*                );*/}
            {/*            })}*/}
            {/*        </div>*/}
            {/*    )}*/}
            {/*</div>*/}
        </div>
    );
};

export default CreateOrder;
