"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";

// Mock Data for AI Research with actual source URLs
const researchItems = [
    {
        id: 1,
        category: "AI",
        title: "GPT-5 Rumors & Expected Features",
        summary: "Speculations suggest improved reasoning capabilities and multimodal native integration. OpenAI has not confirmed a release date yet.",
        source: "TechCrunch",
        url: "https://techcrunch.com/tag/openai/",
        date: "2h ago",
        trend: "High",
    },
    {
        id: 2,
        category: "Finance",
        title: "Crypto Market Volatility Analysis",
        summary: "Bitcoin sees a 5% dip following regulatory news from the EU. Analysts predict a stabilization period next week.",
        source: "Bloomberg",
        url: "https://www.bloomberg.com/crypto",
        date: "4h ago",
        trend: "Medium",
    },
    {
        id: 3,
        category: "Medical",
        title: "New RNA Vaccine Breakthrough",
        summary: "Researchers have developed a more stable RNA vaccine candidate that requires less rigorous cold storage.",
        source: "Nature",
        url: "https://www.nature.com/articles/d41586-024-00001-x", // Placeholder relevant link
        date: "6h ago",
        trend: "Very High",
    },
    {
        id: 4,
        category: "Technology",
        title: "Solid-State Battery Progress for EVs",
        summary: "Major automakers report breakthroughs in solid-state battery energy density, promising 1000km range per charge.",
        source: "Reuters",
        url: "https://www.reuters.com/business/autos-transportation/",
        date: "8h ago",
        trend: "High",
    },
];

export function ResearchFeed() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            {researchItems.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-none">
                                {item.category}
                            </Badge>
                            {item.trend === "Very High" && (
                                <span className="flex items-center text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Viral
                                </span>
                            )}
                        </div>
                        <CardTitle className="text-xl leading-tight font-bold tracking-tight">
                            {item.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {item.summary}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground/60">{item.source} • {item.date}</span>
                            <Link
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center font-medium text-primary hover:underline group"
                            >
                                Read more
                                <ExternalLink className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
