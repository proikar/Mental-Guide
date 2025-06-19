import db from "./db.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const MOOD_CONFIG = {
  model: "gemini-1.5-flash",
  temperature: 0.3,
  maxTokens: 500,
  apiKey: process.env.GEMINI_API_KEY,
};

const MIN_MESSAGES_FOR_ANALYSIS = 5;
const ANALYSIS_WINDOW = 5;

async function callGeminiAPI(prompt) {
  if (!MOOD_CONFIG.apiKey) {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${MOOD_CONFIG.model}:generateContent?key=${MOOD_CONFIG.apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: MOOD_CONFIG.temperature,
          maxOutputTokens: MOOD_CONFIG.maxTokens,
        },
      },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return resultText;

  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    throw error;
  }
}

function parseSentimentResult(result) {
  try {
    const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();

    const jsonStart = cleanedResult.indexOf("{");
    const jsonEnd = cleanedResult.lastIndexOf("}") + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("JSON not found in response");
    }

    const jsonStr = cleanedResult.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonStr);

    return {
      mood: ['positive', 'negative', 'neutral'].includes(parsed.mood?.toLowerCase())
        ? parsed.mood.toLowerCase()
        : 'neutral',
      score: typeof parsed.score === "number" && parsed.score >= -1 && parsed.score <= 1
        ? parsed.score
        : 0,
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.slice(0, 5).map(k => k.trim())
        : [],
    };
  } catch (err) {
    console.error("Ошибка парсинга настроения:", err);

    const keywordMatch = result.match(/keywords":\s*\[([^\]]+)\]/);
    let keywords = [];

    if (keywordMatch) {
      keywords = keywordMatch[1]
        .split(',')
        .map(k => k.trim().replace(/["']/g, ''))
        .filter(k => k)
        .slice(0, 5);
    }

    return {
      mood: "neutral",
      score: 0,
      keywords,
    };
  }
}

export async function analyzeAIResponses(user_id) {
  try {
    const [rows] = await db.query(
      "SELECT input FROM chats WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [user_id, ANALYSIS_WINDOW]
    );

    if (!rows || rows.length < MIN_MESSAGES_FOR_ANALYSIS) {
      return { status: "error", message: "Недостаточно сообщений для анализа." };
    }

    const messages = rows.reverse().map(row => row.input).join("\n");

    const prompt = `Проанализируй настроение пользователя на основе его последних сообщений.
Учти контекст и изменение настроения со временем. Ответ верни в JSON формате:
{
  "mood": "positive/neutral/negative",
  "score": число от -1 до 1,
  "keywords": ["макс 5 ключевых слов"]
}
Сообщения пользователя (в хронологическом порядке):\n${messages}`;

    const geminiResult = await callGeminiAPI(prompt);
    const sentiment = parseSentimentResult(geminiResult);

    await db.query(
      "INSERT INTO mood_history (user_id, mood, score, keywords) VALUES (?, ?, ?, ?)",
      [user_id, sentiment.mood, sentiment.score, JSON.stringify(sentiment.keywords)]
    );

    return {
      status: "success",
      mood: sentiment.mood,
      score: sentiment.score,
      keywords: sentiment.keywords,
    };
  } catch (error) {
    console.error("Ошибка анализа настроения:", error);
    return {
      status: "error",
      message: "Ошибка анализа или базы данных",
    };
  }
}

export async function getMoodHistory(user_id, limit = 30) {
  try {
    const [rows] = await db.query(
      "SELECT mood, score AS mood_score, keywords, created_at FROM mood_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [user_id, limit]
    );

    return rows.map(row => {
      try {
        return {
          ...row,
          keywords: row.keywords ? JSON.parse(row.keywords) : []
        };
      } catch {
        return {
          ...row,
          keywords: []
        };
      }
    });
  } catch (error) {
    console.error("Ошибка получения истории настроения:", error);
    throw error;
  }
}
