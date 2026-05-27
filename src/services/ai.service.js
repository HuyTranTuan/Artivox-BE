const axios = require("axios");
const { prisma } = require("@libs/prisma");

const API_KEY = process.env.OPENROUTER_GATEWAY_API_KEY;
const MODEL = process.env.AI_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

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
    const topList = topProducts.map((p) => `${p.name} (${p.type}, ⭐${p.ratingAvg}, ${p.basePrice.toLocaleString()}₫)`).join("; ");
    return `\nWebsite live data:\n- ${collectionCount} collections available\n- ${totalProducts} total active products\n- Top rated: ${topList}`;
  } catch {
    return "";
  }
}

function buildSystemMessage(websiteContext = "") {
  return {
    role: "system",
    content: `You are a helpful customer support AI for Artivox, a 3D printing e-commerce platform selling models, materials (FDM/Resin), and tools. Answer questions about products, collections, orders, pricing, and 3D printing. Keep responses concise, friendly, and accurate. If unsure, suggest contacting support.${websiteContext}`,
  };
}

function getDefaultResponse(userMessage) {
  const lower = userMessage.toLowerCase();
  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much"))
    return "For pricing information, please check our catalog or contact support.";
  if (lower.includes("material") || lower.includes("filament") || lower.includes("resin"))
    return "We offer FDM filaments (PLA, ABS, PETG) and Resin materials (Standard, Tough, Flexible). Visit our Materials section!";
  if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("ship"))
    return "Shipping typically takes 2–5 business days. You'll receive tracking info once your order is dispatched.";
  if (lower.includes("payment") || lower.includes("pay"))
    return "We accept bank transfer, card payments, and digital wallets.";
  if (lower.includes("order") || lower.includes("track") || lower.includes("status"))
    return "Track your order in your account dashboard. Need help? Share your order number.";
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey"))
    return "Hello! Welcome to Artivox Support. How can I help you with our 3D printing products?";
  return "I'm here to help with any questions about Artivox products and services. What can I assist you with?";
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateAIResponse(userMessage, conversationContext = []) {
  if (!API_KEY) return getDefaultResponse(userMessage);

  try {
    const websiteContext = await buildWebsiteContext();
    const messages = [
      buildSystemMessage(websiteContext),
      ...conversationContext,
      { role: "user", content: userMessage },
    ];
    const { data } = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model: MODEL, messages, temperature: 0.7, max_tokens: 500, top_p: 0.9 },
      { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, timeout: 30000 },
    );
    return data.choices?.[0]?.message?.content ?? getDefaultResponse(userMessage);
  } catch (error) {
    console.error("AI API Error:", error.message);
    return getDefaultResponse(userMessage);
  }
}

/**
 * Async generator that yields tokens one at a time.
 * - No API key → simulates streaming with 40ms delay per word
 * - With API key → streams from OpenRouter, yielding each delta token
 */
async function* streamAITokens(userMessage, conversationContext = []) {
  if (!API_KEY) {
    const fallbackText = getDefaultResponse(userMessage);
    const words = fallbackText.split(/(\s+)/);
    for (const word of words) {
      if (word) {
        yield word;
        await delay(40);
      }
    }
    return;
  }

  try {
    const websiteContext = await buildWebsiteContext();
    const messages = [
      buildSystemMessage(websiteContext),
      ...conversationContext,
      { role: "user", content: userMessage },
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model: MODEL, messages, temperature: 0.7, max_tokens: 500, top_p: 0.9, stream: true },
      {
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        responseType: "stream",
        timeout: 30000,
      },
    );

    let buffer = "";
    // Use for-await to consume the axios response stream chunk by chunk
    for await (const rawChunk of response.data) {
      buffer += rawChunk.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) yield token;
          } catch {
            // partial JSON — skip
          }
        }
      }
    }

    // Flush leftover buffer
    if (buffer) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {}
      }
    }
  } catch (error) {
    console.error("AI Stream API Error:", error.message);
    // Fallback: yield the default response word by word
    const fallbackText = getDefaultResponse(userMessage);
    const words = fallbackText.split(/(\s+)/);
    for (const word of words) {
      if (word) {
        yield word;
        await delay(40);
      }
    }
  }
}

function buildConversationContext(messages = [], maxMessages = 5) {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  return messages
    .slice(-maxMessages)
    .filter((msg) => msg?.senderType && msg.content)
    .map((msg) => ({ role: msg.senderType === "ADMIN" ? "assistant" : "user", content: msg.content }));
}

module.exports = { generateAIResponse, streamAITokens, buildConversationContext };