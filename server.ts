import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Helper to handle transient model errors (503 UNAVAILABLE, 429 RATE LIMIT)
  async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 1200): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        const isTransient =
          err?.status === 503 ||
          err?.status === 429 ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('rate');

        if (isTransient && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`Transient error on attempt ${attempt + 1}, retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  // 1. Analyze single paragraph
  app.post('/api/gemini/analyze-paragraph', async (req, res) => {
    try {
      const {
        paragraphText,
        sectionHeading,
        previousSummary,
        pageNumber,
        paragraphIndex,
        targetLanguage = 'English',
      } = req.body;

      if (!paragraphText || typeof paragraphText !== 'string') {
        return res.status(400).json({ error: 'Paragraph text is required.' });
      }

      const langInstruction =
        targetLanguage === 'Tamil'
          ? 'Crucial: Output the explanation, keyTerms definitions, examNotes, and examQuestion strictly in fluent, natural TAMIL (தமிழ்). Keep core technical terms in brackets in English (e.g., மைட்டோகாண்ட்ரியா (Mitochondria)).'
          : targetLanguage === 'Telugu'
          ? 'Crucial: Output the explanation, keyTerms definitions, examNotes, and examQuestion strictly in fluent, natural TELUGU (తెలుగు). Keep core technical terms in brackets in English (e.g., మైటోకాండ్రియా (Mitochondria)).'
          : 'Output the explanation, keyTerms, examNotes, and examQuestion in clear, simple student English.';

      const prompt = `Target Language: ${targetLanguage}
Section / Subtopic: ${sectionHeading || 'General Study Material'}
Document Location: Page ${pageNumber || 1}, Paragraph ${(paragraphIndex ?? 0) + 1}
Previous Context Summary: ${previousSummary || 'Beginning of section / no prior context.'}

Paragraph to analyze:
"""
${paragraphText.trim()}
"""

${langInstruction}
Provide your tutor breakdown according to the requested schema.`;

      let response: any;
      const modelCandidates = ['gemini-2.5-flash', 'gemini-3.8-flash'];
      let lastErr: any = null;

      for (const model of modelCandidates) {
        try {
          response = await callWithRetry(async () => {
            return await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                systemInstruction: `You are an expert student tutor. Explain accurately from the given text, do not invent facts, keep notes short, exam-oriented, and strictly respond in ${targetLanguage}.`,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    explanation: {
                      type: Type.STRING,
                      description: `Explain the paragraph in easy language as if teaching a first-year student in ${targetLanguage} (3-5 sentences).`,
                    },
                    keyTerms: {
                      type: Type.ARRAY,
                      description: `Each important term with a concise one-line definition in ${targetLanguage}.`,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          term: { type: Type.STRING },
                          meaning: { type: Type.STRING },
                        },
                        required: ['term', 'meaning'],
                      },
                    },
                    examNotes: {
                      type: Type.ARRAY,
                      description: `3-6 concise, revision-ready bullet points likely to be asked in an exam in ${targetLanguage}.`,
                      items: { type: Type.STRING },
                    },
                    examQuestion: {
                      type: Type.OBJECT,
                      description: `1 likely exam question and 1 concise model answer in ${targetLanguage}.`,
                      properties: {
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING },
                      },
                      required: ['question', 'answer'],
                    },
                  },
                  required: ['explanation', 'keyTerms', 'examNotes', 'examQuestion'],
                },
              },
            });
          });
          if (response?.text) break;
        } catch (err: any) {
          lastErr = err;
          const msg = String(err?.message || '');
          if (msg.includes('no longer available') || msg.includes('NOT_FOUND') || err?.status === 404) {
            console.warn(`Model ${model} not available, trying next fallback model...`);
            continue;
          }
          throw err;
        }
      }

      if (!response?.text) {
        throw lastErr || new Error('Received empty response from Gemini model.');
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini model.');
      }

      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/gemini/analyze-paragraph:', error);
      const isRateLimit =
        error?.status === 429 ||
        String(error?.message).toLowerCase().includes('rate') ||
        String(error?.message).toLowerCase().includes('quota');

      return res.status(isRateLimit ? 429 : 500).json({
        error: isRateLimit
          ? 'AI Rate limit reached. Retrying shortly...'
          : error?.message || 'Failed to analyze paragraph.',
        isRateLimit,
      });
    }
  });

  // 2. Summarize Whole Document
  app.post('/api/gemini/summarize-document', async (req, res) => {
    try {
      const { documentText, title, targetLanguage = 'English' } = req.body;
      if (!documentText || typeof documentText !== 'string') {
        return res.status(400).json({ error: 'Document text is required.' });
      }

      // Limit prompt size if extremely large
      const truncatedText = documentText.slice(0, 35000);

      const langInstruction =
        targetLanguage === 'Tamil'
          ? 'Output the executiveSummary, coreThemes, topExamTips, and highYieldDefinitions in natural, clear TAMIL (தமிழ்).'
          : targetLanguage === 'Telugu'
          ? 'Output the executiveSummary, coreThemes, topExamTips, and highYieldDefinitions in natural, clear TELUGU (తెలుగు).'
          : 'Output in clear, high-yield English.';

      const prompt = `Target Language: ${targetLanguage}
Document Title: ${title || 'Study Material'}

Full Document Text:
"""
${truncatedText}
"""

${langInstruction}
Create an exhaustive 1-page high-yield exam revision guide in ${targetLanguage}.`;

      let response: any;
      const modelCandidates = ['gemini-2.5-flash', 'gemini-3.8-flash'];
      let lastErr: any = null;

      for (const model of modelCandidates) {
        try {
          response = await callWithRetry(async () => {
            return await ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                systemInstruction:
                  'You are an expert tutor creating a comprehensive, high-yield student exam study cheat sheet strictly based on the provided text.',
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    executiveSummary: {
                      type: Type.STRING,
                      description: '4-6 sentences synthesizing the entire material.',
                    },
                    coreThemes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          theme: { type: Type.STRING },
                          keyTakeaways: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                        required: ['theme', 'keyTakeaways'],
                      },
                    },
                    topExamTips: {
                      type: Type.ARRAY,
                      description: '4-6 crucial test tips, common pitfalls, or formulas to remember.',
                      items: { type: Type.STRING },
                    },
                    highYieldDefinitions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          term: { type: Type.STRING },
                          definition: { type: Type.STRING },
                        },
                        required: ['term', 'definition'],
                      },
                    },
                  },
                  required: [
                    'title',
                    'executiveSummary',
                    'coreThemes',
                    'topExamTips',
                    'highYieldDefinitions',
                  ],
                },
              },
            });
          });
          if (response?.text) break;
        } catch (err: any) {
          lastErr = err;
          const msg = String(err?.message || '');
          if (msg.includes('no longer available') || msg.includes('NOT_FOUND') || err?.status === 404) {
            console.warn(`Model ${model} not available for summary, trying fallback...`);
            continue;
          }
          throw err;
        }
      }

      if (!response?.text) {
        throw lastErr || new Error('Received empty response from Gemini model.');
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini model.');
      }

      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error in /api/gemini/summarize-document:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to summarize document.',
      });
    }
  });

  // 3. Fallback semantic subtopic grouping
  app.post('/api/gemini/group-subtopics', async (req, res) => {
    try {
      const { snippets } = req.body;
      if (!Array.isArray(snippets) || snippets.length === 0) {
        return res.status(400).json({ error: 'Snippets array required.' });
      }

      const prompt = `Here are paragraphs from a document. Group them into 3-8 logical study subtopics/headings with title and the starting paragraph ID:
${JSON.stringify(snippets.slice(0, 30))}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Group document paragraphs into a clean table of contents / syllabus.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                paragraphId: { type: Type.STRING },
                pageNumber: { type: Type.NUMBER },
              },
              required: ['title', 'paragraphId', 'pageNumber'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Error grouping subtopics:', error);
      return res.status(500).json({ error: error?.message || 'Failed to group subtopics' });
    }
  });

  // Mount Vite or static dist
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart PDF Analyzer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
