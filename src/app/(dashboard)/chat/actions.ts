"use server";

import { createClient } from "@/utils/supabase/server";
import { getEmbedding, openai } from "@/lib/openai/server";

export type ChatResponse = {
    data: string | null;
    error?: string;
};

export async function chatWithRAG(messages: any[]): Promise<ChatResponse> {
    try {
        const supabase = await createClient();

        // 1. Get user query from last message
        const lastMessage = messages[messages.length - 1];
        const query = lastMessage.content;

        // 2. Generate embedding for query
        const queryEmbedding = await getEmbedding(query);

        // 3. Search for relevant context
        console.log("Chat Action: fetching context...");

        const [docsResult, communityResult] = await Promise.all([
            supabase.rpc('match_documents', {
                query_embedding: queryEmbedding,
                match_threshold: 0.3,
                match_count: 5
            }),
            supabase
                .from("community_messages")
                .select(`
                    content,
                    created_at,
                    profiles:user_id (nickname)
                `)
                .order("created_at", { ascending: false })
        ]);

        const documents = docsResult.data;
        const communityMessages = communityResult.data;

        if (docsResult.error) console.error("Search error:", docsResult.error);
        if (communityResult.error) console.error("Community fetch error:", communityResult.error);

        // 4. Construct system prompt
        const contextText = documents?.map((doc: any) => doc.content).join("\n---\n") || "No relevant documents found.";
        const communityText = communityMessages?.reverse().map((m: any) =>
            `[${new Date(m.created_at).toLocaleTimeString()}] ${m.profiles?.nickname || "User"}: ${m.content}`
        ).join("\n") || "No recent community activity.";

        const systemPrompt = `You are a helpful assistant for ProShare Connect.
  You have access to a knowledge library and recent community chat messages.
  
  COMMUNITY CHAT HISTORY (Recent):
  ${communityText}

  KNOWLEDGE LIBRARY CONTEXT:
  ${contextText}

  INSTRUCTIONS:
  - If the user asks about recent discussions or what others are saying, refer to the COMMUNITY CHAT HISTORY.
  - If the user asks technical or domain questions, prioritize the KNOWLEDGE LIBRARY CONTEXT.
  - If the answer is not in either, use your general knowledge but mention it's outside the provided context.`;

        // 5. Call OpenAI for final response
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content })),
            ],
        });

        return { data: completion.choices[0].message.content };
    } catch (err: any) {
        console.error("Chat Action Error:", err);
        return { data: null, error: err.message || "Something went wrong" };
    }
}
