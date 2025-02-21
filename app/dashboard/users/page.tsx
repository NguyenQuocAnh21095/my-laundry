'use client';
import { useEffect, useState } from "react";

export type User = {
    id: number;
    alias_name: string;
    username: string;
    role: string;
    branch: number;
    created_at: string;
};

const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");

        try {
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []); // Fetch lại khi debounce search hoặc sort thay đổi

    return (
        <div className="users-container p-4 text-black">
            <h1 className="text-2xl font-bold mb-4">Users</h1>
            {/* Error Message */}
            {error && <div className="error-message text-red-500">{error}</div>}

            {/* Users List */}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="product-list space-y-1 max-h-[75vh] overflow-y-auto">
                    {users.map((user: User) => (
                        <div key={user.id}
                             className="product-item flex items-center justify-between w-full rounded-md bg-white p-2 shadow-md">
                            <h2 className="font-semibold">{user.alias_name}</h2>
                            <p className="text-gray-600">{user.role}</p>
                            <p className="font-bold text-green-600">{user.branch}</p>
                            <p className="font-bold text-green-600">{user.created_at.split('T')[0]}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsersPage;
