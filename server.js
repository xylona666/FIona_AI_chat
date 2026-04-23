import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const personaConfig = {
  name: "Fiona",
  personaId: "3dbd92d2-d447-4e7c-81f4-023e5921e683",

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
    });
  }
});

app.post("/chat", async (req, res) => { // only chat 
    try {
    const { message } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "LLM failed" });
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
  console.log(process.env.OPENAI_API_KEY);
});