import express from "express";
import multer from "multer";
import {PDFParse} from "pdf-parse";
import axios from "axios";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";

dotenv.config();

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"));
    }
  },
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
const INDEX_NAME = "medical-documents";
const EMBEDDING_MODEL = "Xenova/all-mpnet-base-v2"; // Hugging Face model
const EMBEDDING_DIMENSION = 768; // Dimension for all-mpnet-base-v2
const TARGET_DIMENSION = 3072; // Pinecone index dimension
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

// Initialize embedding pipeline (lazy loading)
let embeddingPipeline = null;
const getEmbeddingPipeline = async () => {
  if (!embeddingPipeline) {
    console.log("Loading Hugging Face embedding model...");
    embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL);
    console.log("Embedding model loaded successfully");
  }
  return embeddingPipeline;
};

// Helper function to pad embeddings to match Pinecone dimension
const padEmbedding = (embedding, targetDim = TARGET_DIMENSION) => {
  if (embedding.length >= targetDim) {
    return embedding.slice(0, targetDim);
  }
  // Pad with zeros to match target dimension
  return [...embedding, ...new Array(targetDim - embedding.length).fill(0)];
};

// Function to split text into chunks with overlap
const chunkText = (text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    if (chunk.trim().length > 0) {
      chunks.push({
        text: chunk.trim(),
        start,
        end,
      });
    }
    
    start += chunkSize - overlap;
  }

  return chunks;
};

// Function to generate embeddings using Hugging Face
const generateEmbedding = async (text) => {
  try {
    const extractor = await getEmbeddingPipeline();
    
    // Generate embedding
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    
    // Convert tensor to array
    const embedding = Array.from(output.data);
    
    // Pad embedding to match Pinecone index dimension
    return padEmbedding(embedding);
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
};

// Function to generate embeddings in batches (more efficient)
const generateEmbeddingsBatch = async (texts) => {
  try {
    const extractor = await getEmbeddingPipeline();
    
    // Process texts in parallel batches for better performance
    const embeddings = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);
      embeddings.push(padEmbedding(embedding));
    }
    
    return embeddings;
  } catch (error) {
    console.error("Batch embedding failed, falling back to individual:", error.message);
    // Fallback: generate embeddings one by one
    const embeddings = [];
    for (const text of texts) {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }
};

// Function to store chunks in Pinecone
const storeInPinecone = async (chunks, filename, userId = "default") => {
  try {
    const index = pinecone.index(INDEX_NAME);
    const vectors = [];

    console.log(`Generating embeddings for ${chunks.length} chunks...`);

    // Process in batches for efficiency
    const batchSize = 20; // OpenRouter batch limit
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      const batchTexts = batchChunks.map(chunk => chunk.text);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      try {
        // Try batch embedding first
        const embeddings = await generateEmbeddingsBatch(batchTexts);
        
        // Create vectors with embeddings
        for (let j = 0; j < batchChunks.length; j++) {
          const chunk = batchChunks[j];
          const globalIndex = i + j;
          
          vectors.push({
            id: `${userId}_${filename}_chunk_${globalIndex}`,
            values: embeddings[j],
            metadata: {
              text: chunk.text,
              filename,
              userId,
              chunkIndex: globalIndex,
              start: chunk.start,
              end: chunk.end,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (batchError) {
        console.log("Batch processing failed, using individual embeddings");
        // Fallback to individual processing
        for (let j = 0; j < batchChunks.length; j++) {
          const chunk = batchChunks[j];
          const globalIndex = i + j;
          const embedding = await generateEmbedding(chunk.text);
          
          vectors.push({
            id: `${userId}_${filename}_chunk_${globalIndex}`,
            values: embedding,
            metadata: {
              text: chunk.text,
              filename,
              userId,
              chunkIndex: globalIndex,
              start: chunk.start,
              end: chunk.end,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Log progress
      console.log(`Processed ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`);
    }

    // Upsert vectors to Pinecone in batches
    console.log("Uploading vectors to Pinecone...");
    const upsertBatchSize = 100;
    for (let i = 0; i < vectors.length; i += upsertBatchSize) {
      const batch = vectors.slice(i, i + upsertBatchSize);
      await index.upsert(batch);
      console.log(`Uploaded batch ${Math.floor(i / upsertBatchSize) + 1}/${Math.ceil(vectors.length / upsertBatchSize)}`);
    }

    console.log(`Successfully stored ${vectors.length} vectors in Pinecone`);
    return vectors.length;
  } catch (error) {
    console.error("Error storing in Pinecone:", error);
    throw error;
  }
};

// Function to retrieve relevant chunks from Pinecone
const retrieveRelevantChunks = async (query, userId = "default", topK = 5) => {
  try {
    const index = pinecone.index(INDEX_NAME);
    
    // Generate embedding for the query
    console.log("Generating query embedding...");
    const queryEmbedding = await generateEmbedding(query);
    
    // Query Pinecone
    console.log("Searching Pinecone...");
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: {
        userId: { $eq: userId },
      },
    });

    // Extract and return the text chunks with scores
    const relevantChunks = queryResponse.matches.map((match) => ({
      text: match.metadata.text,
      score: match.score,
      filename: match.metadata.filename,
      chunkIndex: match.metadata.chunkIndex,
    }));

    return relevantChunks;
  } catch (error) {
    console.error("Error retrieving from Pinecone:", error);
    throw error;
  }
};

// Multiple PDF parsing strategies
const tryMultiplePdfParsers = async (pdfBuffer) => {
  // Convert Buffer to Uint8Array as required by pdf-parse
  const uint8Array = new Uint8Array(pdfBuffer);
  
  const strategies = [
    async () => {
      console.log("Trying standard pdf-parse...");
      const pdfParse = new PDFParse(uint8Array);
      const data = await pdfParse.getText();
      return data.text;
    },
    async () => {
      console.log("Trying pdf-parse with max pages option...");
      const pdfParse = new PDFParse(uint8Array, {
        max: 0, // Parse all pages
      });
      const data = await pdfParse.getText();
      return data.text;
    },
    async () => {
      console.log("Trying pdf-parse with custom page render...");
      const pdfParse = new PDFParse(uint8Array, {
        max: 0,
        pagerender: async (pageData) => {
          try {
            const textContent = await pageData.getTextContent();
            let lastY, text = "";
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += "\n" + item.str;
              }
              lastY = item.transform[5];
            }
            return text;
          } catch (error) {
            return pageData
              .getTextContent()
              .then((content) =>
                content.items.map((item) => item.str).join(" ")
              );
          }
        },
      });
      const data = await pdfParse.getText();
      return data.text;
    },
  ];

  let lastError;
  let extractedText = "";

  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = await strategies[i]();
      if (result && result.trim().length > 0) {
        console.log(`Successfully parsed PDF with strategy ${i + 1}`);
        extractedText = result;
        break;
      }
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error.message);
      lastError = error;
      if (i === strategies.length - 1) {
        throw lastError;
      }
    }
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw lastError || new Error("All PDF parsing strategies failed");
  }

  return extractedText;
};

// PDF Upload endpoint with RAG
router.post("/pdf-upload", (req, res) => {
  const uploadSingle = upload.single("pdf");

  uploadSingle(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File too large. Maximum size allowed is 10MB",
        });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      console.log(`Processing PDF: ${req.file.originalname}`);

      const pdfBuffer = req.file.buffer;

      // Validate PDF header
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (!pdfHeader.startsWith("%PDF")) {
        return res.status(400).json({
          error: "Invalid PDF file format",
        });
      }

      // Extract text from PDF
      const extractedText = await tryMultiplePdfParsers(pdfBuffer);

      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({
          error: "No text content could be extracted from the PDF",
        });
      }

      console.log(`Extracted ${extractedText.length} characters`);

      // Chunk the text
      const chunks = chunkText(extractedText);
      console.log(`Created ${chunks.length} chunks`);

      // Get userId from request (you can implement proper auth)
      const userId = req.body.userId || "default";

      // Store in Pinecone
      const vectorCount = await storeInPinecone(
        chunks,
        req.file.originalname,
        userId
      );

      res.json({
        message: "PDF processed and stored successfully",
        filename: req.file.originalname,
        textLength: extractedText.length,
        chunksCreated: chunks.length,
        vectorsStored: vectorCount,
        preview: extractedText.substring(0, 200) + "...",
      });
    } catch (error) {
      console.error("PDF processing error:", error);
      
      let errorMessage = "Failed to process PDF";
      if (error.message.includes("embedding")) {
        errorMessage = "Failed to generate embeddings using Hugging Face model.";
      }
      
      res.status(500).json({
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
});

// Ask endpoint with RAG
router.post("/ask", async (req, res) => {
  const { query, userId = "default", topK = 5 } = req.body;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: "Query cannot be empty" });
  }

  try {
    console.log(`Processing query: "${query.substring(0, 100)}"`);

    // Retrieve relevant chunks from Pinecone
    const relevantChunks = await retrieveRelevantChunks(query, userId, topK);

    if (!relevantChunks || relevantChunks.length === 0) {
      return res.status(404).json({
        error: "No relevant information found. Please upload a PDF first.",
      });
    }

    console.log(`Retrieved ${relevantChunks.length} relevant chunks`);

    // Combine relevant chunks into context
    const context = relevantChunks
      .map((chunk, idx) => `[Chunk ${idx + 1} - Score: ${chunk.score.toFixed(3)}]:\n${chunk.text}`)
      .join("\n\n");

    // Generate response using AI with retrieved context
    const models = [
      "tngtech/deepseek-r1t2-chimera:free",
      "perplexity/llama-3.1-sonar-small-chat",
      "google/gemma-2-9b-it"
    ];
    
    // Check if API key is configured
    if (!OPENROUTER_API_KEY) {
      console.error("OpenRouter API key is not configured");
      return res.status(500).json({
        error: "OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to your .env file.",
      });
    }

    let response;

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        response = await axios.post(
          `${OPENROUTER_API_URL}/chat/completions`,
          {
            model,
            messages: [
              {
                role: "system",
                content: `You are a helpful healthcare AI assistant. Answer questions based on the provided document excerpts. If the information isn't in the excerpts, say so clearly. Always recommend consulting healthcare professionals for medical decisions.`,
              },
              {
                role: "user",
                content: `Based on these document excerpts, please answer the question:

${context}

Question: ${query}

Provide a clear, accurate answer based on the excerpts above.`,
              },
            ],
            max_tokens: 1024,
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:5173", // Optional: helps with rate limits
              "X-Title": "Medical Document Assistant", // Optional: shows in OpenRouter dashboard
            },
            timeout: 30000,
          }
        );
        console.log(`Successfully got response from ${model}`);
        break;
      } catch (error) {
        console.log(`Model ${model} failed:`, error.response?.data?.error || error.response?.data || error.message);
        continue;
      }
    }

    if (!response?.data?.choices?.[0]?.message?.content) {
      // If all models failed, return the context directly without AI processing
      return res.status(503).json({
        error: "AI service unavailable. Please check your OpenRouter API key at https://openrouter.ai/keys",
        suggestion: "Your OpenRouter API key may be invalid, expired, or you may need to add credits to your account.",
        relevantContext: relevantChunks.map((chunk) => ({
          text: chunk.text,
          filename: chunk.filename,
          score: chunk.score,
        })),
      });
    }

    const answer = response.data.choices[0].message.content.trim();

    res.json({
      answer,
      sources: relevantChunks.map((chunk) => ({
        filename: chunk.filename,
        score: chunk.score,
        chunkIndex: chunk.chunkIndex,
        preview: chunk.text.substring(0, 150) + "...",
      })),
      chunksUsed: relevantChunks.length,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    
    let errorMessage = "Failed to process query";
    if (error.message.includes("embedding")) {
      errorMessage = "Failed to generate query embedding using Hugging Face model.";
    }
    
    res.status(500).json({
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get list of uploaded documents
router.get("/documents", async (req, res) => {
  const { userId = "default" } = req.query;

  try {
    const index = pinecone.index(INDEX_NAME);
    
    // Query to get unique filenames (this is a workaround since Pinecone doesn't have a direct "list unique metadata" function)
    const stats = await index.describeIndexStats();
    
    res.json({
      message: "Use metadata filtering to track documents",
      totalVectors: stats.totalRecordCount,
      suggestion: "Implement a separate database (MongoDB) to track document metadata",
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Delete user's documents from Pinecone
router.delete("/documents", async (req, res) => {
  const { userId = "default", filename } = req.body;

  try {
    const index = pinecone.index(INDEX_NAME);
    
    // Delete by filter
    if (filename) {
      // Delete specific document
      await index.deleteMany({
        userId: { $eq: userId },
        filename: { $eq: filename },
      });
    } else {
      // Delete all documents for user
      await index.deleteMany({
        userId: { $eq: userId },
      });
    }

    res.json({
      message: filename
        ? `Deleted document: ${filename}`
        : "Deleted all documents for user",
      userId,
    });
  } catch (error) {
    console.error("Error deleting documents:", error);
    res.status(500).json({ error: "Failed to delete documents" });
  }
});

export default router;