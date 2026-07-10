import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GenAI on the server
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint for Brainstorming
app.post('/api/ai/brainstorm', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required and must be a string' });
      return;
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Generate 3 creative, short, and distinct sticky note ideas about this topic: "${prompt}". Return a JSON array of objects with keys "content", "category", and "color" (use valid hex codes like #60a5fa, #fb7185, #34d399, #fbbf24, #a78bfa). Keep content under 15 words per note.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              color: { type: Type.STRING },
            },
            required: ['content', 'category', 'color'],
          },
        },
      },
    });

    const text = response.text || '[]';
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Brainstorm failed:', error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// API Endpoint for Refining notes
app.post('/api/ai/refine', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required and must be a string' });
      return;
    }

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Clean up, structure, and professionalize the following note content. If it is a list, make it clear bullet points. If it is a thought, make it more articulate. Keep it concise but insightful. Content: "${content}"`,
    });

    res.json({ refinedText: response.text || content });
  } catch (error: any) {
    console.error('Refine failed:', error);
    res.status(500).json({ error: error.message || 'AI refinement failed' });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
