import { ResearchFeed } from "@/components/features/research/ResearchFeed";

export default function ResearchPage() {
    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-foreground">AI Research</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Continuous intelligence gathering across key domains.
                </p>
            </div>

            <ResearchFeed />
        </div>
    )
}
