import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import https from 'https';
import { randomUUID } from 'crypto';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Отключаем проверку SSL сертификатов для dev (не для продакшена!)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Кэш токена
let cachedToken = null;
let tokenExpiry = 0;

app.use(cors());
app.use(express.json());

// Получение access token
async function getAccessToken() {
  // Проверяем кэш
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  try {
    const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': randomUUID(),
        'Authorization': `Bearer ${process.env.GIGACHAT_AUTH_KEY}`,
      },
      body: `scope=${process.env.GIGACHAT_SCOPE}`,
      agent: httpsAgent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Auth failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_at || 1800) * 1000;
    
    console.log('✅ Access token получен');
    return cachedToken;
  } catch (error) {
    console.error('❌ Ошибка получения токена:', error.message);
    throw error;
  }
}

// Endpoint для проверки статуса
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'GigaChat Proxy Server работает',
    hasToken: !!cachedToken 
  });
});

// Endpoint для отправки сообщений
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Требуется массив messages' });
    }

    // Получаем токен
    const token = await getAccessToken();

    // Отправляем запрос в GigaChat
    const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'GigaChat',
        messages: messages,
        temperature: temperature,
        max_tokens: 2048,
      }),
      agent: httpsAgent
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ошибка GigaChat API:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content;
      console.log('✅ Ответ получен:', reply.substring(0, 50) + '...');
      res.json({ 
        reply: reply,
        model: data.model,
        created: data.created
      });
    } else {
      res.status(500).json({ error: 'Пустой ответ от GigaChat' });
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 GigaChat Proxy Server запущен на http://localhost:${PORT}`);
  console.log(`📡 Endpoint для чата: http://localhost:${PORT}/api/chat\n`);
});
