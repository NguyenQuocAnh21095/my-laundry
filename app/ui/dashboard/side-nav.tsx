import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-link';
import MienLogo from "@/app/ui/mien-logo";
import {ArrowRightOnRectangleIcon} from '@heroicons/react/24/outline';
import { signOut } from '@/auth';

export default function SideNav() {
    return (
        <div className="flex h-full flex-col md:px-2">
            <Link
                className="p-1 flex items-center justify-start bg-green-600 md:h-40"
                href="/dashboard"
            >
                <div className="text-white md:w-40">
                    <MienLogo/>
                </div>
            </Link>
            <div className="flex p-1 grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
                <NavLinks />
                <div className="hidden h-auto w-full grow rounded-md bg-gray-200 md:block"></div>
                <form
                    action={async () => {
                        'use server';
                        await signOut();
                    }}
                >
                    <button className="flex h-[32px] text-black w-full grow items-center justify-center gap-2 rounded-md bg-gray-200 p-3 text-sm font-medium hover:bg-green-500 hover:text-white md:flex-none md:justify-start md:p-2 md:px-3">
                        <ArrowRightOnRectangleIcon className="w-6" />
                        <div className="hidden md:block">Sign Out</div>
                    </button>
                </form>
            </div>
        </div>
    );
}
