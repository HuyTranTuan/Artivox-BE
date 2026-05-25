const axios = require("axios");
const { prisma } = require("@libs/prisma");

const AI_PROVIDER = process.env.AI_PROVIDER || "groq";

function resolveApiKey() {
  if (AI_PROVIDER === "groq" && process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  if (AI_PROVIDER === "openrouter" && process.env.OPENROUTER_GATEWAY_API_KEY) return process.env.OPENROUTER_GATEWAY_API_KEY;
  return null;
}
function resolveModel() {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (AI_PROVIDER === "groq") return "llama3-8b-8192";
  return "nvidia/nemotron-3-super-120b-a12b:free";
}

const AI_API_KEY = resolveApiKey();
const AI_MODEL = resolveModel();

async function generateAIResponse(userMessage, conversationContext = []) {
  if (!AI_API_KEY) {
    console.warn("AI_API_KEY not configured in .env, returning default response");
    return getDefaultResponse(userMessage);
  }

  try {
    if (AI_PROVIDER === "groq") {
      return await generateGroqResponse(userMessage, conversationContext);
    } else {
      return await generateOpenAIResponse(userMessage, conversationContext);
    }
  } catch (error) {
    console.error("AI API Error:", error.message);
    return getDefaultResponse(userMessage);
  }
}

/**
 * Call OpenAI-compatible chat completion endpoint.
 * Works with OpenAI, OpenRouter, and any OpenAI-compatible API.
 */
async function callChatCompletion(apiUrl, payload) {
  const response = await axios.post(apiUrl, payload, {
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    // Set a reasonable timeout so the request doesn't hang forever
    timeout: 30000,
  });

  if (!response.data?.choices?.[0]?.message?.content) {
    throw new Error("Invalid AI response format - missing content");
  }

  return response.data.choices[0].message.content;
}

/**
 * Build system message based on provider.
 */
async function buildWebsiteContext() {
  try {
    const [collectionCount, topProducts, totalProducts] = await Promise.all([
      prisma.collection.count({ where: { deletedAt: null, isActive: true } }),
      prisma.product.findMany({
        where: { deletedAt: null, isActive: true },
        orderBy: { ratingAvg: "desc" },
        take: 5,
        select: { name: true, ratingAvg: true, basePrice: true, type: true },
      }),
      prisma.product.count({ where: { deletedAt: null, isActive: true } }),
    ]);
    const topList = topProducts.map((p) => `${p.name} (${p.type}, ⭐${p.ratingAvg}, ${p.basePrice.toLocaleString()}đ)`).join("; ");
    return `\nWebsite live data:\n- ${collectionCount} collections available\n- ${totalProducts} total active products\n- Top rated: ${topList}`;
  } catch {
    return "";
  }
}

function buildSystemMessage(websiteContext = "") {
  return {
    role: "system",
    content: `You are a helpful customer support AI for Artivox, a 3D printing e-commerce platform selling models, materials (FDM/Resin), and tools.
Answer questions about products, collections, orders, pricing, and 3D printing.
Keep responses concise, friendly, and accurate. If unsure, suggest contacting support.${websiteContext}`,
  };
}

/**
 * Generate response using OpenAI API (or OpenRouter / compatible endpoints)
 */
async function generateOpenAIResponse(userMessage, conversationContext = []) {
  const websiteContext = await buildWebsiteContext();
  const messages = [buildSystemMessage(websiteContext), ...conversationContext, { role: "user", content: userMessage }];

  return callChatCompletion("https://api.openai.com/v1/chat/completions", {
    model: AI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 500,
    top_p: 0.9,
  });
}

/**
 * Generate response using Groq API (free tier available)
 * Groq is faster and has a free tier
 */
async function generateGroqResponse(userMessage, conversationContext = []) {
  const websiteContext = await buildWebsiteContext();
  const messages = [
    buildSystemMessage(websiteContext),
    ...conversationContext,
    { role: "user", content: userMessage },
  ];

  return callChatCompletion("https://api.groq.com/openai/v1/chat/completions", {
    model: AI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });
}

/**
 * Get default response when AI is unavailable
 */
function getDefaultResponse(userMessage) {
  const lower = userMessage.toLowerCase();

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return "For pricing information, please check our catalog or contact support. I'd be happy to help you find what you need!";
  }
  if (lower.includes("material") || lower.includes("filament") || lower.includes("resin")) {
    return "We offer a wide range of FDM filaments (PLA, ABS, PETG) and Resin materials (Standard, Tough, Flexible). Visit our Materials section to explore all options!";
  }
  if (lower.includes("delivery") || lower.includes("shipping") || lower.includes("ship")) {
    return "Shipping typically takes 2-5 business days. You'll receive tracking information via email once your order is dispatched.";
  }
  if (lower.includes("payment") || lower.includes("pay") || lower.includes("card")) {
    return "We accept all major payment methods including bank transfer, card payments, and digital wallets.";
  }
  if (lower.includes("order") || lower.includes("track") || lower.includes("status")) {
    return "You can track your order status in your account dashboard. If you need further assistance, please let me know your order number!";
  }
  if (lower.includes("help") || lower.includes("support") || lower.includes("contact")) {
    return "I'm here to help! What would you like to know about our products or services? You can also reach our team directly for complex issues.";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! Welcome to Artivox Support. How can I help you today with our 3D printing products and materials?";
  }

  return "Thank you for your message! I'm here to help with any questions about Artivox products and services. What can I assist you with?";
}

/**
 * Build conversation context from previous messages
 * Returns last N messages in format suitable for AI API
 */
function buildConversationContext(messages = [], maxMessages = 5) {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  return messages
    .slice(-maxMessages)
    .filter((msg) => msg && msg.senderType && msg.content)
    .map((msg) => ({
      role: msg.senderType === "ADMIN" ? "assistant" : "user",
      content: msg.content,
    }));
}

module.exports = {
  generateAIResponse,
  buildConversationContext,
  buildWebsiteContext,
  generateOpenAIResponse,
  generateGroqResponse,
};
