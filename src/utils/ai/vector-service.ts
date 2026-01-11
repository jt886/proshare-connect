import OpenAI from "openai";

// Initialize OpenAI client
// Note: Next.js automatically loads .env.local variables into process.env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a vector embedding for the given text using OpenAI's text-embedding-3-small model.
 * This embedding is compatible with the 1536-dimensional vector column in Supabase.
 * 
 * @param text - The input text or message to vectorize.
 * @returns A Promise that resolves to an array of numbers (the vector).
 * @throws Error if the API call fails or input is invalid.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        throw new Error("Invalid input: Text cannot be empty.");
    }

    // Preprocess: remove newlines to improve performance for some embedding models
    // (Standard practice recommended by OpenAI for older models, harmless for new ones)
    const sanitizedText = text.replace(/\n/g, " ");

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: sanitizedText,
            dimensions: 1536, // Explicitly match Supabase vector column size
            encoding_format: "float",
        });

        const embedding = response.data[0].embedding;
        return embedding;
    } catch (error: any) {
        console.error("Error generating embedding:", error);

        // Enhance error message for debugging
        if (error.response) {
            throw new Error(`OpenAI API Error: ${error.response.status} - ${error.response.data.error.message}`);
        } else {
            throw new Error(`Failed to generate embedding: ${error.message}`);
        }
    }
}
