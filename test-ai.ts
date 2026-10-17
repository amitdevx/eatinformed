import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const imagePath = process.env.TEST_IMAGE_PATH || process.argv[2] || path.join(__dirname, 'test-label.jpg');
    if (!fs.existsSync(imagePath)) {
      console.log(`Test image not found at ${imagePath}. Pass path as argument or set TEST_IMAGE_PATH.`);
      return;
    }
    console.log(`Loading image from ${imagePath}...`);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64Image}`;

    console.log("Extracting ingredients using NVIDIA NIM 11b...");
    const { nimClient, parseNIMResponse } = await import('./src/ai/nim');
    
    const systemPrompt = `You are a strict JSON data extraction API. Return NOTHING BUT A RAW JSON OBJECT. No markdown, no conversational text.

{
  "ingredients": ["item1"],
  "nutrition": {
    "rawText": "...",
    "servingSizeLabel": "...",
    "nutrients": [{"nutrient": "Fat", "perServing": "1g", "per100mL": "2g"}]
  },
  "status": "success"
}

Extract the ingredients list and nutritional facts. IF YOU OUTPUT ANY TEXT OUTSIDE THE JSON OBJECT, THE SYSTEM WILL CRASH.`;

    const response = await nimClient!.chat.completions.create({
      model: 'meta/llama-3.2-11b-vision-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
      top_p: 0.9,
    });
    
    const rawContent = response.choices?.[0]?.message?.content;
    console.log("\n--- Extraction Result ---");
    console.log("RAW:", rawContent);
    const extractResult = parseNIMResponse(rawContent);
    console.log("PARSED:", JSON.stringify(extractResult, null, 2));
  } catch (err) {
    console.error("Error running test:", err);
  }
}

run();
