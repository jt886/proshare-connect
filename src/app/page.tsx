import Link from "next/link";

export default function RootPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground px-6 py-12">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">ProShare Connect</h1>
            <p className="text-muted-foreground mt-4 text-center max-w-sm leading-relaxed">
                Empowering collective intelligence through AI-driven research and community collaboration.
            </p>

            <div className="flex flex-col gap-3 mt-12 w-full max-w-xs">
                <Link
                    href="/signup"
                    className="px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-center shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center"
                >
                    Get Started (Sign Up)
                </Link>
                <Link
                    href="/login"
                    className="px-6 py-4 bg-secondary text-secondary-foreground rounded-2xl font-bold text-center border border-border shadow-sm transition-all active:scale-95 flex items-center justify-center"
                >
                    Sign In to Account
                </Link>
                <Link
                    href="/home"
                    className="text-xs text-center text-muted-foreground mt-6 hover:underline opacity-60"
                >
                    Enter Dashboard
                </Link>
            </div>
        </div>
    );
}
