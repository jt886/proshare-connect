"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TrendingUp, ArrowRight, Zap, Shield, Globe, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const newsData = [
    {
        category: "AI",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        items: [
            {
                title: "OpenAI 'Operator' agent launching in January",
                trend: "+85%",
                hot: true,
                url: "https://techcrunch.com/?s=openai+operator",
                isExternal: true
            },
            {
                title: "DeepSeek-V3 sets new open source benchmarks",
                trend: "+42%",
                hot: false,
                url: null, // Internal item
                isExternal: false,
                content: "DeepSeek-V3 has been released, setting new standards for open-source AI models. It outperforms Llama 3 on several benchmarks including reasoning and coding tasks. Key features include a larger context window and improved multi-lingual support, making it a strong contender in the global AI landscape."
            }
        ]
    },
    {
        category: "Tech",
        icon: Globe,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        items: [
            { title: "Quantum computing breakthrough in silicon error correction", trend: "+12%", hot: false, url: "https://www.nature.com/articles/s41586-024-00001-x", isExternal: true },
            { title: "SpaceX Starship orbital test confirmed for next week", trend: "New", hot: true, url: "https://www.spacex.com/updates", isExternal: true },
            { title: "New solid-state battery production starts in Japan", trend: "+67%", hot: true, url: "https://www.reuters.com/business/autos-transportation/", isExternal: true }
        ]
    },
    {
        category: "Security",
        icon: Shield,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        items: [
            { title: "Zero-day vulnerability found in major mobile browsers", trend: "High Risk", hot: true, url: "https://www.bleepingcomputer.com/", isExternal: true },
        ]
    }
];

export function HomeTrends() {
    const [selectedTrend, setSelectedTrend] = useState<any>(null);

    // Step 2: News Notification Logic
    // In a real app, this would check a timestamp from the DB.
    // Here, we check if the mock data signature has changed.
    useEffect(() => {
        const checkNews = () => {
            const currentSignature = JSON.stringify(newsData.map(c => c.items.map(i => i.title)));
            const lastSeen = localStorage.getItem("last_seen_news_sig_v1");

            if (lastSeen !== currentSignature) {
                // New news detected!
                // Wait a moment purely for effect
                setTimeout(() => {
                    toast.info("Update: New Market Trends available!", {
                        description: "Check the latest AI & Tech news.",
                        duration: 5000,
                    });
                    localStorage.setItem("last_seen_news_sig_v1", currentSignature);
                }, 1500);
            }
        };

        checkNews();
    }, []);

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
                            {section.items.map((item, idx) => {
                                const ItemContent = () => (
                                    <>
                                        <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors flex-1 pr-4 text-left">
                                            {item.title}
                                        </p>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className={cn("text-[10px] font-bold", item.hot ? "text-red-500" : "text-muted-foreground")}>
                                                {item.trend}
                                            </span>
                                            {item.hot && <TrendingUp className="h-3 w-3 text-red-500" />}
                                        </div>
                                    </>
                                );

                                if (item.isExternal && item.url) {
                                    return (
                                        <Link
                                            key={idx}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-start justify-between group active:opacity-70 transition-all"
                                        >
                                            <ItemContent />
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedTrend(item)}
                                        className="flex w-full items-start justify-between group active:opacity-70 transition-all"
                                    >
                                        <ItemContent />
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={!!selectedTrend} onOpenChange={(open) => !open && setSelectedTrend(null)}>
                <DialogContent className="max-w-[90%] rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-left text-lg leading-tight">{selectedTrend?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2 text-xs font-medium text-muted-foreground">
                            <span className="bg-secondary px-2 py-1 rounded-full">{selectedTrend?.trend} Interest</span>
                            {selectedTrend?.hot && <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Hot Topic</span>}
                        </div>
                        <DialogDescription className="text-base leading-relaxed pt-2 text-foreground">
                            {selectedTrend?.content || "No detailed information available for this topic."}
                        </DialogDescription>
                        <div className="pt-2 flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => setSelectedTrend(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
