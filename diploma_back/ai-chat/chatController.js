import axios from "axios";
import db from "./db.js";
import dotenv from "dotenv";
import { analyzeAIResponses, getMoodHistory } from "./moodAnalysis.js";

dotenv.config();

const AI_CONFIG = {
  model: "gemini-1.5-flash",
  temperature: 0.6,
  maxTokens: 1200,
  maxContextLength: 3500,
  safetySettings: [
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
};

const userHistoryCache = new Map();
const CACHE_CLEAR_INTERVAL_MS = 60 * 60 * 1000;
const userMessageCount = new Map();

// База знаний по психологии (мы может расширять, можно сделать текствый файл БД для ИИ.)
const PSYCHOLOGY_KNOWLEDGE = `
### Основные психологические подходы:
1. **Когнитивно-поведенческая терапия (КПТ)** - Фокусируется на связи мыслей, эмоций и поведения
2. **Диалектическая поведенческая терапия (ДПТ)** - Помогает регулировать эмоции
3. **Терапия принятия и ответственности (ACT)** - Учит принимать трудные мысли и чувства
4. **Психодинамический подход** - Исследует бессознательные процессы

### Техники работы с:
- **Тревогой**: Дыхательные упражнения 4-7-8, когнитивная реструктуризация
- **Депрессией**: Поведенческая активация, ведение дневника настроения
- **Стрессом**: Прогрессивная мысленная релаксация, mindfulness

### Этические принципы:
1. Не давать медицинских диагнозов
2. При острых состояниях рекомендовать специалиста
3. Сохранять конфиденциальность (исключая угрозу жизни)
`;

async function checkUserExists(userId) {
  try {
    const [rows] = await db.query(
      'SELECT id FROM user WHERE id = ? LIMIT 1',
      [userId]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

function validateUserInput(input) {
  if (!input || typeof input !== "string" || input.trim() === "") {
    return { valid: false, message: "Сообщение не может быть пустым" };
  }
  if (input.length > 500) {
    return { valid: false, message: "Сообщение должно быть короче 500 символов" };
  }
  
  // тута базовый фильтр опасных тем
  const dangerPatterns = [
    /(суицид|самоубийств|повеситься|резать вены)/i,
    /(насилие|избиение|изнасилование)/i,
    /(наркотик|героин|кокаин|спайс)/i
  ];
  
  for (const pattern of dangerPatterns) {
    if (pattern.test(input)) {
      return { 
        valid: false, 
        message: "Если вы в кризисной ситуации, немедленно обратитесь за помощью: 8-800-2000-122" 
      };
    }
  }
  
  return { valid: true };
}

function buildPrompt(history, currentInput) {
  let prompt = `Ты профессиональный психолог Mental Guide. Твоя задача - помогать пользователям разбираться в их психологических трудностях, используя научно обоснованные методы.

${PSYCHOLOGY_KNOWLEDGE}

**Правила работы:**
1. Всегда учитывай контекст диалога
2. Будь эмпатичным, поддерживающим, но профессиональным
3. Избегай медицинских диагнозов
4. Используй техники из КПТ, ACT, ДПТ где уместно
5. При острых состояниях настоятельно рекомендовать специалиста
6. Давай конкретные, практические рекомендации
7. Объясняй психологические механизмы простым языком

**История диалога:`;
  
  if (history.length > 0) {
    history.slice(-6).forEach(msg => {
      prompt += `\nПользователь: ${msg.input}`;
      prompt += `\nТы: ${msg.response}`;
    });
  } else {
    prompt += "\n(Нет истории)";
  }

  prompt += `\n\nТекущий запрос: ${currentInput}\n\nТвой ответ (макс 3-4 предложения, с практическим советом):`;
  return prompt;
}

export async function chat(req, res) {
  const { user_input: userInput } = req.body;
  const user_id = req.user_id;

  if (!user_id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Необходима авторизация"
    });
  }

  const inputValidation = validateUserInput(userInput);
  if (!inputValidation.valid) {
    return res.status(400).json({
      error: "Invalid input",
      message: inputValidation.message,
    });
  }

  try {
    const userExists = await checkUserExists(user_id);
    if (!userExists) {
      return res.status(404).json({
        error: "User not found",
        message: "Пользователь не найден"
      });
    }

    let history = userHistoryCache.get(user_id);
    if (!history || history.length === 0) {
      const [dbHistory] = await db.query(
        'SELECT input, response FROM chats WHERE user_id = ? ORDER BY created_at ASC LIMIT 10',
        [user_id]
      );
      history = dbHistory || [];
      userHistoryCache.set(user_id, history);
    }

    const prompt = buildPrompt(history, userInput);
    const url = `https://generativelanguage.googleapis.com/v1/models/${AI_CONFIG.model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: AI_CONFIG.temperature,
        maxOutputTokens: AI_CONFIG.maxTokens,
        topP: 0.9,
        topK: 40
      },
      safetySettings: AI_CONFIG.safetySettings
    }, { timeout: 15000 });

    let reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Не удалось получить ответ. Пожалуйста, попробуйте еще раз.";

    if (reply.length > 600) {
      reply = reply.substring(0, 600) + "...";
    }

    await db.query(
      'INSERT INTO chats (input, response, user_id) VALUES (?, ?, ?)',
      [userInput, reply, user_id]
    );

    if (history.length >= 10) history.shift();
    history.push({ input: userInput, response: reply });
    userHistoryCache.set(user_id, history);

    let messageCount = userMessageCount.get(user_id) || 0;
    messageCount++;
    userMessageCount.set(user_id, messageCount);
    
    if (messageCount >= 3) {
      userMessageCount.set(user_id, 0);
      
      analyzeAIResponses(user_id).catch(error => {
        console.error('Фоновый анализ не удался:', error);
      });
    }

    return res.json({ reply });

  } catch (error) {
    console.error("Ошибка в chat:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.response?.data?.error?.message || "Произошла ошибка на сервере. Попробуйте позже."
    });
  }
}

export async function history(req, res) {
  const user_id = req.user_id;

  if (!user_id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Необходима авторизация"
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT input, response, created_at FROM chats WHERE user_id = ? ORDER BY created_at ASC LIMIT 50',
      [user_id]
    );

    return res.json({ history: rows });

  } catch (error) {
    console.error("Ошибка в history:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка при получении истории сообщений"
    });
  }
}

export async function mood(req, res) {
  const user_id = req.user_id;
  const { mood } = req.body;

  if (!user_id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Необходима авторизация"
    });
  }

  if (!mood || typeof mood !== 'string' || mood.length > 100) {
    return res.status(400).json({
      error: "Invalid mood",
      message: "Настроение не указано или слишком длинное"
    });
  }

  try {
    await db.query(
      'INSERT INTO mood (user_id, mood) VALUES (?, ?)',
      [user_id, mood]
    );
    return res.json({ message: "Настроение сохранено" });
  } catch (error) {
    console.error("Ошибка в mood:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка при сохранении настроения"
    });
  }
}

export async function moodHistory(req, res) {
  const user_id = req.user_id;
  const limit = parseInt(req.query.limit) || 30;

  if (!user_id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Необходима авторизация"
    });
  }

  try {
    const moods = await getMoodHistory(user_id, limit);
    return res.json(moods);
  } catch (error) {
    console.error("Ошибка в moodHistory:", error);
    
    try {
      const [rows] = await db.query(
        "SELECT mood, score AS mood_score, created_at FROM mood_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        [user_id, limit]
      );
      
      return res.json(rows.map(row => ({
        ...row,
        keywords: []
      })));
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Ошибка при получении истории настроений"
      });
    }
  }
}

export async function currentMood(req, res) {
  const user_id = req.user_id;

  if (!user_id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Необходима авторизация"
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT mood, score AS mood_score, keywords, created_at FROM mood_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [user_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Нет данных о настроении"
      });
    }
    
    const moodData = rows[0];
    
    try {
      moodData.keywords = moodData.keywords ? JSON.parse(moodData.keywords) : [];
    } catch (e) {
      console.warn("Ошибка парсинга ключевых слов, используем пустой массив");
      moodData.keywords = [];
    }
    
    return res.json(moodData);
  } catch (error) {
    console.error("Ошибка в currentMood:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Ошибка при получении текущего настроения"
    });
  }
}

setInterval(() => {
  userHistoryCache.clear();
  console.log("Очистка кэша истории пользователей");
}, CACHE_CLEAR_INTERVAL_MS);