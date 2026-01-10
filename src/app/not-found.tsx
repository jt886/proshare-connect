"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col items-center justify-center py-20 bg-background text-foreground">
            <h2 className="text-4xl font-bold mb-4">404</h2>
            <p className="text-xl mb-6">Page not found</p>
            <div className="bg-secondary/50 p-4 rounded-xl mb-8 font-mono text-sm break-all">
                Path: {pathname}
            </div>
            <Link
                href="/"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold transition-transform active:scale-95"
            >
                Return Home
            </Link>
        </div>
    );
}
