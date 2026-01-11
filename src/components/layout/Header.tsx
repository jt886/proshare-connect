import { NotificationBell } from "@/components/features/notifications/NotificationBell";
import Link from "next/link";
import { Menu } from "lucide-react";

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
            <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                        ProShare
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    {/* <NotificationBell /> */}
                    <button className="text-muted-foreground hover:text-foreground">
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
