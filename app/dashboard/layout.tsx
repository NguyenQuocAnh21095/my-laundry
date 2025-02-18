'use client';

import NavLinks from "@/app/ui/dashboard/nav-link";

export default function DashboardLayout({
                                            children,
                                        }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col md:flex-row-reverse h-screen">
            {/* Nội dung chính */}
            <div className="flex-1 md:p-4 bg-gray-200">
                {children}
            </div>
            {/* Sidebar */}
            <div className="flex w-full bg-white text-gray-500 md:flex md:flex-col md:p-4 md:w-64 md:space-y-4
                    fixed bottom-0 md:static md:h-full">
                <NavLinks/>

            </div>
        </div>
    );
}