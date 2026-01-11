"use client";

import { toast } from "sonner";

export function DebugNotificationButton() {
    return (
        <button
            onClick={() => toast.success("System Notification Check: OK!")}
            className="fixed bottom-20 left-0 right-0 z-50 flex justify-center opacity-80 active:scale-95 transition-transform"
        >
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20">
                Tap to Test Notification (v1.5.4)
            </span>
        </button>
    );
}
