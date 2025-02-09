'use client';

import {
    ArrowRightEndOnRectangleIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentIcon,
    HomeIcon,
    ListBulletIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import clsx from 'clsx';
import {UsersIcon} from "@heroicons/react/16/solid";


const links = [
    {   name: 'Home',
        href: '/dashboard',
        icon: HomeIcon },
    {
        name: 'Products',
        href: '/dashboard/products',
        icon: ListBulletIcon,
    },
    {   name: 'Orders',
        href: '/dashboard/orders',
        icon: ClipboardDocumentIcon
    },
    {   name: 'Invoices',
        href: '/dashboard/invoices',
        icon: ClipboardDocumentCheckIcon
    },
    {   name: 'Users',
        href: '/dashboard/users',
        icon: UsersIcon },
];

export default function NavLinks() {
    const pathname = usePathname();
    const router = useRouter();
    const handleLogout = () => {
        localStorage.removeItem("token"); // Xóa token
        router.push("/login"); // Chuyển hướng về login
    };

    return (
        <>
            {links.map((link) => {
                const LinkIcon = link.icon;
                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={clsx(
                            'flex dm:h-8 h-25 grow items-center justify-center gap-2 rounded-md bg-white text-gray-500 text-sm font-medium md:hover:bg-blue-500 md:hover:text-white md:flex-none md:justify-start md:p-2 md:px-3',
                            pathname === link.href && 'text-blue-500'
                        )}
                    >
                        <LinkIcon
                            className="w-6"
                        />
                        <p className="hidden md:block">{link.name}</p>
                    </Link>

                );
            })}
            <div>
                <button
                    onClick={handleLogout}
                    className="flex h-8 md:h-25 gap-2 mt-auto items-center bg-white text-gray-500 p-2 rounded hover:bg-blue-500 hover:text-white md:w-full">
                    <ArrowRightEndOnRectangleIcon className="w-6"/>
                    <p className="hidden md:block">Logout</p>
                </button>
            </div>
        </>
    );
}
