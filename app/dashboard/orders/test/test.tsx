"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
    quantity: number;
};

const CreateOrder = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products`);
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setProducts(data.products);
            }
        } catch (err) {
            setError("Error fetching products.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Thêm sản phẩm vào danh sách đã chọn
    const handleSelectProduct = (product: Product) => {
        setSelectedProducts((prev) => {
            const exists = prev.some((item) => item.id === product.id);
            if (exists) return prev;
            return [...prev, { id: product.id, product_name: product.product_name, quantity: 1 }];
        });
    };

    // Thay đổi số lượng sản phẩm đã chọn
    const handleQuantityChange = (id: number, quantity: number) => {
        setSelectedProducts((prev) =>
            quantity <= 0
                ? prev.filter((item) => item.id !== id) // Xóa khỏi danh sách nếu số lượng = 0
                : prev.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
    };

    return (
        <div className="products-container md:p-4 text-black">
            {/* Danh sách sản phẩm đã chọn */}
            <div className="selected-products bg-gray-100 p-2 rounded-md mb-4">
                <h2 className="font-bold">Sản phẩm đã chọn</h2>
                {selectedProducts.length > 0 ? (
                    selectedProducts.map((item) => (
                        <div key={item.id} className="flex justify-between p-2 bg-white rounded-md my-1">
                            <span>{item.product_name}</span>
                            <input
                                type="number"
                                className="border w-12 text-center"
                                value={item.quantity}
                                min={1}
                                onChange={(e) => handleQuantityChange(item.id, Number(e.target.value))}
                            />
                        </div>
                    ))
                ) : (
                    <p>Chưa chọn sản phẩm nào</p>
                )}
            </div>

            {/* Danh sách sản phẩm */}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="product-list px-2 space-y-1 max-h-[60vh] overflow-y-auto bg-gray-200">
                    {products.map((product) => {
                        const selectedItem = selectedProducts.find((item) => item.id === product.id);
                        return (
                            <div
                                key={product.id}
                                className={`product-item flex items-center w-full rounded-md p-2 shadow-md cursor-pointer ${selectedItem ? 'bg-blue-500 text-white' : 'bg-white'}`}
                                onClick={() => handleSelectProduct(product)}
                            >
                                <Image
                                    alt=""
                                    src={product.image || "/products/notfound.png"}
                                    width={32}
                                    height={32}
                                    className="object-cover rounded-md max-w-10 mr-2"
                                />
                                <div className="flex justify-between w-full items-center">
                                    <div>
                                        <p className="font-bold">{product.product_name}</p>
                                    </div>
                                    {selectedItem ? (
                                        <input
                                            type="number"
                                            className="border w-12 text-center bg-white text-black"
                                            value={selectedItem.quantity}
                                            min={1}
                                            onChange={(e) => handleQuantityChange(product.id, Number(e.target.value))}
                                        />
                                    ) : (
                                        <button
                                            onClick={() => handleSelectProduct(product)}
                                            className="border p-1 rounded-md bg-blue-500 text-white"
                                        >
                                            Chọn
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CreateOrder;
