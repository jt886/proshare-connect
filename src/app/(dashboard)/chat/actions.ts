"use server";

import { createClient } from "@/utils/supabase/server";
import { generateEmbedding } from "@/utils/ai/vector-service";
import { openai } from "@/lib/openai/server";

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

        // 2. Generate embedding for query (Use improved service)
        let queryEmbedding: number[] = [];
        try {
            queryEmbedding = await generateEmbedding(query);
        } catch (e) {
            console.error("Embedding failed:", e);
            // Fallback: If embedding fails, we can still chat without context
            // But better to return specific error or try keyword search (not implemented)
        }

        // 3. Search for relevant context using Mixed Search
        // Note: author_name requires the updated SQL function. 
        // If SQL not updated, this might throw error or return null for author_name.
        console.log("Chat Action: Searching mixed context...");

        let searchResults: any[] = [];
        if (queryEmbedding.length > 0) {
            const { data, error } = await supabase.rpc('match_mixed_context', {
                query_embedding: queryEmbedding,
                match_threshold: 0.4, // Slightly higher threshold for better quality
                match_count: 8 // Get enough context from both sources
            });

            if (error) {
                console.error("Vector Search Error:", error);
            } else {
                searchResults = data || [];
            }
        }

        // 4. Separate results
        const documents = searchResults.filter(r => r.source_type === 'document');
        const chatMessages = searchResults.filter(r => r.source_type === 'message');

        // 5. Construct System Prompt
        const docText = documents.map(d =>
            `[Document] ${d.content}`
        ).join("\n\n") || "No relevant documents.";

        const chatText = chatMessages.map(m =>
            `[${new Date(m.created_at).toLocaleDateString()}] ${m.author_name || "User"}: ${m.content}`
        ).join("\n") || "No relevant chat history.";

        const systemPrompt = `You are ProShare AI, a helpful assistant for the "ProShare Connect" community.
You have access to a Knowledge Library (documents) and Community Chat History (messages).

### 📚 RELEVANT KNOWLEDGE LIBRARY
${docText}

### 💬 RELEVANT COMMUNITY CHAT
${chatText}

### INSTRUCTIONS
- Answer the user's question based on the context provided above.
- If the answer is found in the **Knowledge Library**, cite it as a reliable source.
- If the answer is found in the **Community Chat**, mention who said it (e.g., "As John mentioned in the chat...").
- If the answer is not found in either, say so, but try to answer using your general knowledge if appropriate (clarify that it's not from the library).
- Be concise and professional.`;

        // 6. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7
        });

        return { data: completion.choices[0].message.content };
    } catch (err: any) {
        console.error("Chat Action Error:", err);
        return { data: null, error: err.message || "Something went wrong" };
    }
}
