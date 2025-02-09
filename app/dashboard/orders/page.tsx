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

const OrdersPage = () => {

    return (
        <div className="users-container p-4">
            <h1 className="text-2xl font-bold">Orders</h1>
        </div>
    );
};

export default OrdersPage;
