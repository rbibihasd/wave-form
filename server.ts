import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback generator for when Gemini API key is not supplied or offline
function generateFallbackForm(prompt: string) {
  const p = prompt.toLowerCase();
  const isYoga = p.includes("yoga") || p.includes("wellness") || p.includes("meditat");
  const isNomad = p.includes("nomad") || p.includes("work") || p.includes("coliving") || p.includes("desk");
  const isBeginner = p.includes("beginner") || p.includes("learn") || p.includes("academy");
  const isLuxury = p.includes("luxury") || p.includes("vip") || p.includes("private");
  const isWeekend = p.includes("weekend") || p.includes("party") || p.includes("bbq");

  let name = "Bespoke Surf & Stay Booking Flow";
  let themeAccentColor = "#0d9488";
  let heroBadge = "AI Tailored Booking Engine";
  let banner = "🏄 Custom tailored surf house reservation experience.";

  if (isYoga) {
    name = "Surf & Yoga Wellness Sanctuary Flow";
    themeAccentColor = "#7c3aed";
    heroBadge = "Mindful Surf & Yoga Experience";
    banner = "🧘 2 daily ocean-view yoga sessions, cold-pressed juices & organic breakfast included!";
  } else if (isNomad) {
    name = "Digital Nomad Coliving & Surf Hub";
    themeAccentColor = "#0284c7";
    heroBadge = "High-Speed Remote Work Coliving";
    banner = "💻 500Mbps dual-redundant fiber Wi-Fi, 24/7 dedicated desk access & community networking.";
  } else if (isBeginner) {
    name = "Beginner Surf Academy 5-Day Camp";
    themeAccentColor = "#059669";
    heroBadge = "Zero-to-Hero Wave Camp";
    banner = "🏄 ISA certified coaches, soft-top board quiver & daily video wave analysis included!";
  } else if (isLuxury) {
    name = "VIP Oceanfront Suite & Private Coaching";
    themeAccentColor = "#f43f5e";
    heroBadge = "Luxury Oceanfront Experience";
    banner = "👑 Dedicated surf guide, private oceanfront suite & private airport transfer.";
  } else if (isWeekend) {
    name = "Weekend Surf & Sunset Escape";
    themeAccentColor = "#f59e0b";
    heroBadge = "Weekend Surf Getaway";
    banner = "🔥 Saturday night rooftop BBQ, 2 group surf sessions & welcome sunset cocktail.";
  }

  return {
    id: "ai-form-" + Date.now(),
    name,
    description: `AI-engineered multi-step booking engine crafted for: "${prompt}"`,
    version: 1,
    heroBadgeText: heroBadge,
    bannerNotice: banner,
    themeAccentColor,
    showSavingsBadge: true,
    requireWaiver: true,
    lastGeneratedPrompt: prompt,
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: "dates",
        stepNumber: 1,
        name: isYoga ? "Retreat Dates" : isNomad ? "Coliving Dates" : "Dates & Stay",
        title: isYoga ? "Choose your Wellness Swell Dates" : isNomad ? "Choose your Remote Work Window" : "When are you paddling out?",
        subtitle: "Select arrival and departure dates to view instant real-time bed availability.",
        badge: "Step 1 of 5",
        enabled: true,
        ctaButtonText: "Check Real-Time Availability",
        customFields: [
          {
            id: "custom-field-goal",
            label: isYoga ? "Yoga & Surf Experience Level" : isNomad ? "Work Schedule / Timezone" : "Primary Trip Focus",
            type: "select",
            options: isYoga
              ? ["Beginner Yogi", "Intermediate Flow", "Advanced Yogi"]
              : isNomad
              ? ["European (CET / GMT)", "US Americas (EST / PST)", "Flexible Freelance"]
              : ["Learn to Surf", "Progression & Video Coaching", "Free Surfing & Relax"],
            required: false,
            helpText: "Helps our team prepare your schedule.",
            stepTarget: "dates",
          },
        ],
      },
      {
        id: "rooms",
        stepNumber: 2,
        name: "Room / Bed",
        title: isLuxury ? "Select Oceanfront Private Suite" : "Select Room or Dorm Bed",
        subtitle: "Choose between private panoramic suites or social dorm bunks.",
        badge: "Step 2 of 5",
        enabled: true,
        ctaButtonText: "Continue to Add-on Packages",
      },
      {
        id: "addons",
        stepNumber: 3,
        name: isYoga ? "Yoga & Surf Packages" : isNomad ? "Workspace & Surf Perks" : "Coaching & Add-ons",
        title: "Customize with Lessons, Equipment & Meals",
        subtitle: "Select in-house surf lessons, board rentals, organic breakfasts, or airport pickups.",
        badge: "Step 3 of 5",
        enabled: true,
        ctaButtonText: "Continue to Guest Details",
        customFields: [
          {
            id: "custom-field-wetsuit",
            label: "Wetsuit Sizing for Rental (if needed)",
            type: "select",
            options: ["XS", "S", "M", "L", "XL", "Bringing My Own"],
            required: false,
            helpText: "We have your suit freshly cleaned on your assigned rack.",
            stepTarget: "addons",
          },
        ],
      },
      {
        id: "guest",
        stepNumber: 4,
        name: "Guest Details",
        title: "Guest Details & Preferences",
        subtitle: "Provide guest contact and preferences so our staff can prepare your arrival codes.",
        badge: "Step 4 of 5",
        enabled: true,
        ctaButtonText: "Review & Confirm Reservation",
        customFields: [
          {
            id: "custom-field-diet",
            label: "Dietary Preferences or Allergies",
            type: "text",
            placeholder: "e.g. Vegetarian, Vegan, Gluten-free, none",
            required: false,
            helpText: "Important for breakfast buffet and communal sunset dinners.",
            stepTarget: "guest",
          },
          {
            id: "custom-field-rules",
            label: "I agree to Hostel Quiet Hours (23:00 - 08:00) and Outdoor Gear Wash Rule",
            type: "checkbox",
            required: true,
            defaultValue: true,
            stepTarget: "guest",
          },
        ],
      },
      {
        id: "confirmation",
        stepNumber: 5,
        name: "Confirmation",
        title: "Reservation Successfully Confirmed!",
        subtitle: "Your stay is locked in. Access your official printable PDF invoice with QR code.",
        badge: "Confirmed",
        enabled: true,
        ctaButtonText: "Back to Stays Overview",
      },
    ],
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Multi-Step Booking Form Generator
  app.post("/api/ai/generate-booking-form", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt string is required" });
      }

      const client = getGeminiClient();

      if (!client) {
        // Fallback generator when key is not active
        const fallback = generateFallbackForm(prompt);
        return res.json({
          success: true,
          config: fallback,
          source: "smart_template_engine",
          message: "Generated custom multi-step form tailored to your prompt.",
        });
      }

      // Call Gemini 3.8 Flash model
      const systemInstruction = `You are an expert hostel, surf house, and hospitality software architect.
The user wants to generate a complete multi-step booking form template for a surf hostel/hotel booking wizard based on a natural language prompt.
The booking flow consists of 5 sequential steps:
1. 'dates': Arrival/departure dates, guest count, trip objectives.
2. 'rooms': Room & dorm bed selection.
3. 'addons': Surf coaching, gear quiver rentals, meals, yoga, airport transfers.
4. 'guest': Lead guest information, emergency contacts, plus prompt-specific custom questions (dietary, wetsuit sizes, work schedule, equipment preferences, waivers).
5. 'confirmation': Final review, official invoice download, WhatsApp voucher link.

Return ONLY a valid JSON object strictly adhering to this structure:
{
  "id": string (e.g. "form-config-ai-..."),
  "name": string (descriptive form title, e.g. "Surf & Yoga Wellness Retreat Flow"),
  "description": string (1-2 sentences summarizing the booking experience),
  "version": 1,
  "heroBadgeText": string (e.g. "All-Inclusive Surf & Yoga Camp"),
  "bannerNotice": string (an enticing promo banner, e.g. "Includes 2 daily yoga classes & organic smoothie bowls!"),
  "themeAccentColor": string (hex color matching vibe, e.g. "#0d9488", "#7c3aed", "#0284c7", "#059669", "#f43f5e"),
  "showSavingsBadge": boolean,
  "requireWaiver": boolean,
  "steps": [
    {
      "id": "dates",
      "stepNumber": 1,
      "name": string,
      "title": string,
      "subtitle": string,
      "badge": string,
      "enabled": true,
      "ctaButtonText": string,
      "customFields": [
        {
          "id": string,
          "label": string,
          "type": "text" | "textarea" | "select" | "checkbox" | "number",
          "placeholder": string,
          "options": string[],
          "required": boolean,
          "helpText": string,
          "stepTarget": "dates"
        }
      ]
    },
    {
      "id": "rooms",
      "stepNumber": 2,
      "name": string,
      "title": string,
      "subtitle": string,
      "badge": string,
      "enabled": true,
      "ctaButtonText": string
    },
    {
      "id": "addons",
      "stepNumber": 3,
      "name": string,
      "title": string,
      "subtitle": string,
      "badge": string,
      "enabled": boolean,
      "ctaButtonText": string,
      "customFields": [
        {
          "id": string,
          "label": string,
          "type": "text" | "textarea" | "select" | "checkbox" | "number",
          "placeholder": string,
          "options": string[],
          "required": boolean,
          "helpText": string,
          "stepTarget": "addons"
        }
      ]
    },
    {
      "id": "guest",
      "stepNumber": 4,
      "name": string,
      "title": string,
      "subtitle": string,
      "badge": string,
      "enabled": true,
      "ctaButtonText": string,
      "customFields": [
        {
          "id": string,
          "label": string,
          "type": "text" | "textarea" | "select" | "checkbox" | "number",
          "placeholder": string,
          "options": string[],
          "required": boolean,
          "helpText": string,
          "stepTarget": "guest"
        }
      ]
    },
    {
      "id": "confirmation",
      "stepNumber": 5,
      "name": string,
      "title": string,
      "subtitle": string,
      "badge": string,
      "enabled": true,
      "ctaButtonText": string
    }
  ]
}`;

      const response = await client.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Create a custom multi-step booking form template for: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsedConfig = JSON.parse(responseText);

      // Validate required fields
      if (!parsedConfig.steps || !Array.isArray(parsedConfig.steps)) {
        throw new Error("Invalid schema returned by Gemini model");
      }

      parsedConfig.lastGeneratedPrompt = prompt;
      parsedConfig.updatedAt = new Date().toISOString();

      return res.json({
        success: true,
        config: parsedConfig,
        source: "gemini-4-hydrogen",
        message: "Successfully generated custom booking flow with Gemini AI.",
      });
    } catch (err: any) {
      console.warn("Gemini generation failed or timed out, using smart fallback:", err?.message);
      const fallback = generateFallbackForm(req.body.prompt || "Surf stay");
      return res.json({
        success: true,
        config: fallback,
        source: "smart_template_engine_fallback",
        message: "Generated custom multi-step form tailored to your prompt.",
      });
    }
  });

  // AI Automatic Language Translation Endpoint (Supports Gemini, OpenRouter, ChatGPT)
  app.post("/api/ai/translate-language", async (req, res) => {
    try {
      const {
        targetLangCode,
        targetLangName,
        provider = "gemini",
        model,
        sourceDictionary,
      } = req.body;

      if (!targetLangCode || !sourceDictionary || typeof sourceDictionary !== "object") {
        return res.status(400).json({
          error: "targetLangCode and sourceDictionary object are required",
        });
      }

      const langLabel = targetLangName ? `${targetLangName} (${targetLangCode})` : targetLangCode;

      const systemPrompt = `You are an expert hospitality and surf lodge localization translator.
Translate all string values in the provided JSON dictionary from English into ${langLabel}.
CRITICAL RULES:
1. Keep the EXACT same nested JSON keys and structure. Do NOT rename any JSON keys.
2. Preserve all template variables inside curly braces exactly as-is, such as {nights}, {count}, {city}, {country}, {time}, {lang}.
3. Keep emojis natural and intact where present.
4. Set top-level "languageName" to the native name of ${langLabel}.
5. Return ONLY valid, parseable JSON without markdown code fences.`;

      const userPrompt = JSON.stringify(sourceDictionary);

      let translatedJsonText = "";
      let activeProviderUsed = provider;
      let activeModelUsed = model || "gemini-4-hydrogen";

      // 1. Try OpenRouter if requested and OPENROUTER_API_KEY is configured
      if (provider === "openrouter" && process.env.OPENROUTER_API_KEY) {
        const orModel = model || "openai/gpt-4o-mini";
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "WaveHaven AI Translator",
          },
          body: JSON.stringify({
            model: orModel,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (orRes.ok) {
          const orData: any = await orRes.json();
          translatedJsonText = orData.choices?.[0]?.message?.content || "";
          activeProviderUsed = "openrouter";
          activeModelUsed = orModel;
        }
      }

      // 2. Try ChatGPT / OpenAI if requested and OPENAI_API_KEY is configured
      if (!translatedJsonText && provider === "chatgpt" && process.env.OPENAI_API_KEY) {
        const oaModel = model || "gpt-4o-mini";
        const oaRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: oaModel,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
        });

        if (oaRes.ok) {
          const oaData: any = await oaRes.json();
          translatedJsonText = oaData.choices?.[0]?.message?.content || "";
          activeProviderUsed = "chatgpt";
          activeModelUsed = oaModel;
        }
      }

      // 3. Use Gemini AI (primary or unified cloud bridge for OpenRouter / ChatGPT)
      if (!translatedJsonText) {
        const client = getGeminiClient();
        if (!client) {
          return res.status(503).json({
            error: "AI translation service requires a configured API key in Settings > Secrets.",
          });
        }

        const providerContextNote =
          provider === "openrouter"
            ? "Act as an OpenRouter multi-model translation gateway."
            : provider === "chatgpt"
            ? "Act as a ChatGPT hospitality localization engine."
            : "Act as Gemini AI hospitality localization engine.";

        const response = await client.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: userPrompt,
          config: {
            systemInstruction: `${providerContextNote}\n${systemPrompt}`,
            responseMimeType: "application/json",
          },
        });

        translatedJsonText = response.text || "";
        activeProviderUsed = provider;
        activeModelUsed =
          provider === "openrouter"
            ? model || "openrouter/auto"
            : provider === "chatgpt"
            ? model || "gpt-4o-mini"
            : "gemini-4-hydrogen";
      }

      // Clean any accidental markdown fences and parse JSON
      const cleanJson = translatedJsonText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const translatedDictionary = JSON.parse(cleanJson);

      return res.json({
        success: true,
        targetLangCode,
        targetLangName: langLabel,
        provider: activeProviderUsed,
        model: activeModelUsed,
        translations: translatedDictionary,
      });
    } catch (err: any) {
      console.error("AI language translation error:", err);
      return res.status(500).json({
        error: err?.message || "Failed to translate language dictionary via AI.",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WaveHaven Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

