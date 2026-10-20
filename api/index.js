import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import { createCanvas, loadImage } from 'canvas';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const openai = new OpenAI({ apiKey });

    // Convert uploaded buffer to base64 data URL for OpenAI Vision
    const base64Image = req.file.buffer.toString('base64');
    const imageDataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    // Step 1: Generate 6 captions using OpenAI
    const prompt = "Analyze this image and generate exactly 6 distinct, short, hilarious meme captions specifically tailored to what is happening in the image. Provide ONLY the 6 captions as a numbered list (1 to 6), without any extra conversational filler or introduction.";
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        }
      ],
      max_tokens: 400,
    });

    const content = response.choices[0].message.content;
    const lines = content.trim().split("\n");
    let captions = [];
    for (let line of lines) {
      const cleaned = line.replace(/^[\d]+[\.\)]\s*/, "").trim();
      if (cleaned) captions.push(cleaned);
    }
    if (captions.length < 6) {
      captions = lines.map(l => l.trim()).filter(Boolean).slice(0, 6);
    }
    captions = captions.slice(0, 6);

    // Step 2: Overlay captions on images using node-canvas
    const originalImage = await loadImage(req.file.buffer);
    const memeImages = [];

    for (let cap of captions) {
      const canvas = createCanvas(originalImage.width, originalImage.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(originalImage, 0, 0);

      // Text styling
      const fontSize = Math.max(18, Math.floor(originalImage.height / 18));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = Math.max(2, fontSize / 8);

      // Word wrapping
      const words = cap.split(' ');
      let linesArray = [];
      let currentLine = '';

      for (let word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width <= originalImage.width - 40) {
          currentLine = testLine;
        } else {
          if (currentLine) linesArray.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) linesArray.push(currentLine);

      const lineHeight = fontSize * 1.2;
      const startY = originalImage.height - (linesArray.length * lineHeight) - 20;

      linesArray.forEach((line, index) => {
        const yPos = startY + (index * lineHeight);
        const xPos = originalImage.width / 2;
        ctx.strokeText(line, xPos, yPos);
        ctx.fillText(line, xPos, yPos);
      });

      const memeBase64 = canvas.toDataURL('image/jpeg');
      memeImages.push({ caption: cap, image: memeBase64 });
    }

    return res.json({ success: true, memes: memeImages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

export default app;