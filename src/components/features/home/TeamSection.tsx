"use client";

import { useEffect, useState } from "react";
import { getTeamMembers } from "@/app/(dashboard)/home/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TeamSection() {
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await getTeamMembers();
            if (data) setMembers(data);
        };
        fetchMembers();
    }, []);

    if (members.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold px-1">Team Members</h2>
            <div className="flex -space-x-3 overflow-hidden p-1">
                {members.map((member) => (
                    <Avatar key={member.id} className="border-2 border-background h-10 w-10 ring-2 ring-transparent hover:ring-primary transition-all cursor-pointer">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-secondary text-[10px] font-bold">
                            {(member.nickname || "U").substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                ))}
                <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                    +{members.length > 5 ? members.length - 5 : 0}
                </div>
            </div>
        </section>
    );
}
