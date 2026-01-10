"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRight, Zap, Shield, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const newsData = [
    {
        category: "AI",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        items: [
            { title: "OpenAI 'Operator' agent launching in January", trend: "+85%", hot: true, url: "https://techcrunch.com/?s=openai+operator" },
            { title: "DeepSeek-V3 sets new open source benchmarks", trend: "+42%", hot: false, url: "https://github.com/deepseek-ai/DeepSeek-V3" }
        ]
    },
    {
        category: "Tech",
        icon: Globe,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        items: [
            { title: "Quantum computing breakthrough in silicon error correction", trend: "+12%", hot: false, url: "https://www.nature.com/articles/s41586-024-00001-x" },
            { title: "New solid-state battery production starts in Japan", trend: "+67%", hot: true, url: "https://www.reuters.com/business/autos-transportation/" }
        ]
    },
    {
        category: "Security",
        icon: Shield,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        items: [
            { title: "Zero-day vulnerability found in major mobile browsers", trend: "High Risk", hot: true, url: "https://www.bleepingcomputer.com/" },
        ]
    }
];

export function HomeTrends() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-lg font-semibold">Market Trends</h2>
                <Link href="/research" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                    View all <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="space-y-4">
                {newsData.map((section) => (
                    <Card key={section.category} className="border-none shadow-none bg-secondary/20">
                        <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
                            <div className={cn("p-2 rounded-xl", section.bg)}>
                                <section.icon className={cn("h-4 w-4", section.color)} />
                            </div>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-60">
                                {section.category}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-4">
                            {section.items.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start justify-between group active:opacity-70 transition-all"
                                >
                                    <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors flex-1 pr-4">
                                        {item.title}
                                    </p>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className={cn("text-[10px] font-bold", item.hot ? "text-red-500" : "text-muted-foreground")}>
                                            {item.trend}
                                        </span>
                                        {item.hot && <TrendingUp className="h-3 w-3 text-red-500" />}
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
