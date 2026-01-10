"use client";

import { useState, useEffect } from "react";
import { getCurrentProfile, updateNickname } from "@/app/(dashboard)/home/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { User, Check, Edit2 } from "lucide-react";

export function NicknameEditor() {
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await getCurrentProfile();
            if (data) {
                setProfile(data);
                setNickname(data.nickname || "");
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async () => {
        if (!nickname.trim()) return;
        setIsLoading(true);
        const result = await updateNickname(nickname);
        console.log("Update Nickname Result:", result);
        if (result.success) {
            toast.success("Nickname updated!");
            setIsEditing(false);
            setProfile({ ...profile, nickname });
        } else {
            console.error("Update Nickname Error:", result.error);
            toast.error(result.error || "Failed to update");
        }
        setIsLoading(false);
    };

    if (!profile) return null;

    return (
        <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-2xl border border-border/50">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <User className="h-5 w-5" />
            </div>
            <div className="flex-1 overflow-hidden">
                {isEditing ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdate();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="h-10 bg-background border-none focus-visible:ring-2 focus-visible:ring-primary/20 text-sm"
                            autoFocus
                            placeholder="Enter nickname..."
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="h-10 w-10 shrink-0 rounded-xl"
                            disabled={isLoading}
                        >
                            <Check className="h-5 w-5" />
                        </Button>
                    </form>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Nickname</p>
                            <p className="font-bold truncate text-sm">{profile.nickname || "Set a nickname..."}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit2 className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
