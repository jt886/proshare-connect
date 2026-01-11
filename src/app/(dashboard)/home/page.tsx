"use client";

import { HomeTrends } from "@/components/features/home/HomeTrends";
import { TeamSection } from "@/components/features/home/TeamSection";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function HomePage() {
    return (
        <div className="space-y-8 pb-24 max-w-md mx-auto">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Today</h1>
                    <p className="text-sm text-muted-foreground font-medium">January 10, 2026 (v1.5.2 Check)</p>
                </div>
                <div className="flex gap-2">

                    <Link href="/settings">
                        <Button variant="secondary" size="icon" className="rounded-2xl h-10 w-10">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Button size="icon" className="rounded-2xl h-10 w-10 shadow-lg shadow-primary/20">
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Team Area */}
            <TeamSection />

            {/* Trends Area */}
            <HomeTrends />

            {/* AI Insight Section */}
            <section className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    AI INSIGHT
                </h3>
                <p className="text-sm font-medium leading-relaxed italic opacity-80">
                    "Based on your team's最近の活動, it looks like **DeepSeek-V3** and **Quantum Breaking** are the most relevant topics for your current research. I've highlighted them above."
                </p>
            </section>
        </div>
    )
}
