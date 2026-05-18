const axios = require("axios");

// AI service for generating responses
// Supports: OpenAI GPT-4, Groq (free tier available), OpenRouter

const AI_PROVIDER = process.env.AI_PROVIDER || "openai"; // "openai" or "groq"

/**
 * Resolve AI API key from multiple possible env variable names.
 * Supports different naming conventions across environments.
 */
function resolveApiKey() {
  // Primary keys
  if (process.env.AI_API_KEY) return process.env.AI_API_KEY;
  if (AI_PROVIDER === "groq" && process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  if (AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  // Fallback keys (legacy / gateway support)
  if (process.env.OPENROUTER_GATEWAY_API_KEY) return process.env.OPENROUTER_GATEWAY_API_KEY;
  if (process.env.VERCEL_GATEWAY_API_KEY) return process.env.VERCEL_GATEWAY_API_KEY;
  if (process.env.AI_API_KEY_OPENAI) return process.env.AI_API_KEY_OPENAI;
  if (process.env.AI_API_KEY_GROQ) return process.env.AI_API_KEY_GROQ;

  return null;
}

const AI_API_KEY = resolveApiKey();

/**
 * Resolve the model to use based on provider.
 */
function resolveModel() {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  if (AI_PROVIDER === "groq") return "mixtral-8x7b-32768";
  return "gpt-4-turbo-preview";
}

const AI_MODEL = resolveModel();

/**
 * Generate AI response for chat message
 * Integrates with OpenAI, Groq, or OpenRouter API
 */
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
function buildSystemMessage() {
  return {
    role: "system",
    content: `You are a helpful customer support assistant for Artivox, 
a 3D printing materials and tools e-commerce platform. 
You help customers with product inquiries, orders, technical questions about 3D printing, 
and general support. Keep responses concise and friendly. 
Always provide accurate information about 3D printing, materials (FDM, Resin), 
and tools. If you don't know something, suggest the customer contact support.`,
  };
}

/**
 * Generate response using OpenAI API (or OpenRouter / compatible endpoints)
 */
async function generateOpenAIResponse(userMessage, conversationContext = []) {
  const messages = [buildSystemMessage(), ...conversationContext, { role: "user", content: userMessage }];

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
  const messages = [
    {
      role: "system",
      content: `You are a helpful customer support assistant for Artivox, 
a 3D printing materials and tools e-commerce platform. 
Keep responses concise (under 200 words). 
Help with: product questions, orders, 3D printing guidance, material selection.`,
    },
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
  generateOpenAIResponse,
  generateGroqResponse,
};
