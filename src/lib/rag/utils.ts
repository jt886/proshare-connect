export function chunkText(text: string, maxTokens: number = 500): string[] {
    // Simple character-based chunking for now. 
    // Ideally, use a tokenizer-aware splitter (like tiktoken) or recursive character splitter.
    // 1 token ~= 4 chars typically. 500 tokens ~= 2000 chars.

    const chunkSize = maxTokens * 4;
    const chunks: string[] = [];

    let currentChunk = "";

    const sentences = text.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
        }
    }

    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
}
