import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getConversationMessages(body) {
  const { message, messages } = body;

  if (Array.isArray(messages)) {
    return messages;
  }

  if (message) {
    return [{ role: "user", content: message }];
  }

  return [];
}

const personaConfig = {
  personaId: "3dbd92d2-d447-4e7c-81f4-023e5921e683",
  llmId: "CUSTOMER_CLIENT_V1",
};
app.post("/api/session-token", async (req, res) => {
  const anamApiKey = process.env.ANAM_API_KEY;

  if (!anamApiKey) {
    return res.status(500).json({
      error: "ANAM_API_KEY is not configured",
    });
  }

  try { 
    const response = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anamApiKey}`,
      },
      body: JSON.stringify({
        personaConfig,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anam API error:", errorText);

      return res.status(response.status).json({
        error: "Failed to get session token",
        details: errorText,
      });
    }

    const data = await response.json();

    return res.json({
      sessionToken: data.sessionToken,
    });
  } catch (error) {
    console.error("Error fetching session token:", error);

    return res.status(500).json({
      error: "Failed to get session token",
      details: error.message,
    });
  }
});

app.post("/chat-stream", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    }

    const conversationMessages = getConversationMessages(req.body);

    if (!conversationMessages.length || !conversationMessages.at(-1)?.content) {
      return res.status(400).json({ error: "message is required" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: "You are Fiona, a warm and helpful AI assistant. Keep replies concise and conversational.",
        },
        ...conversationMessages,
      ],
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";

      if (content) {
        res.write(`${JSON.stringify({ content })}\n`);
      }
    }

    res.end();
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      error: "LLM failed",
      details: error.error?.message || error.message,
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    }

    const conversationMessages = getConversationMessages(req.body);

    if (!conversationMessages.length || !conversationMessages.at(-1)?.content) {
      return res.status(400).json({ error: "message is required" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Fiona, a warm and helpful AI assistant. Keep replies concise and conversational.",
        },
        ...conversationMessages,
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      error: "LLM failed",
      details: error.error?.message || error.message,
    });
  }
});

app.post("/test", (req, res) => {
  console.log("data received:", req.body);

  res.json({
    reply: "Server got your message!"
  });
});


 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
