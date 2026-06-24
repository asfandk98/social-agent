export async function POST(req) {
  try {
    const body = await req.json();

    const {
      serviceType,
      destination,
      origin,
      price,
      currency,
      startDate,
      endDate,
      highlights,
      urgency,
      language,
      platforms = [],
    } = body;

    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_KEY) {
      return Response.json(
        {
          error:
            "OPENROUTER_API_KEY is missing from .env.local",
        },
        { status: 500 }
      );
    }

    if (!OPENROUTER_KEY.startsWith("sk-or-")) {
      return Response.json(
        {
          error:
            "Invalid OpenRouter API key. Keys must start with sk-or-",
        },
        { status: 500 }
      );
    }

    const urgencyMap = {
      normal: "",
      urgent: "Use urgent language — limited availability.",
      flash: "FLASH SALE. Create maximum urgency.",
    };

    const langInstruction =
      language === "arabic"
        ? "Write ONLY in Arabic."
        : language === "both"
        ? "Write first in English, then Arabic separated by ---."
        : "Write in English.";

    const prompt = `
You are a professional social media manager for a UAE travel agency.

Write ad copy for this deal:

SERVICE: ${serviceType}
DESTINATION: ${destination}
ORIGIN: ${origin || "UAE"}
PRICE: ${currency} ${price}
DATES: ${startDate || "Flexible"} to ${endDate || "Flexible"}

HIGHLIGHTS:
${highlights || "Excellent value"}

URGENCY:
${urgencyMap[urgency] || ""}

LANGUAGE:
${langInstruction}

PLATFORMS:
${platforms.join(", ")}

Return ONLY valid JSON.

{
  "facebook":"...",
  "instagram":"...",
  "twitter":"...",
  "tiktok":"...",
  "imagePrompt":"high quality travel photo of ${destination}, professional travel photography, vibrant colors, no text"
}

Only include requested platforms plus imagePrompt.
`;

    // Reliable free model fallbacks
    const MODELS = [
      "meta-llama/llama-3.3-8b-instruct:free",
      "google/gemma-2-9b-it:free",
      "mistralai/mistral-7b-instruct:free",
      "qwen/qwen-2.5-7b-instruct",
    ];

    let rawText = "";
    let lastError = "";

    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model}`);

        const controller = new AbortController();

        const timeout = setTimeout(() => {
          controller.abort();
        }, 30000);

        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${OPENROUTER_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:3000",
              "X-Title": "Travel Ad Studio",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 1200,
            }),
          }
        );

        clearTimeout(timeout);

        const responseText = await res.text();

        console.log(
          `[${model}] Status: ${res.status}`
        );

        console.log(
          `[${model}] Preview:`,
          responseText.slice(0, 300)
        );

        if (!responseText) {
          lastError = "Empty response";
          continue;
        }

        if (responseText.trim().startsWith("<")) {
          lastError =
            "HTML response received from OpenRouter";
          continue;
        }

        let data;

        try {
          data = JSON.parse(responseText);
        } catch (err) {
          lastError =
            "Failed to parse OpenRouter response";
          continue;
        }

        if (data.error) {
          lastError =
            data.error.message ||
            JSON.stringify(data.error);

          console.error(
            `[${model}] Error:`,
            lastError
          );

          continue;
        }

        rawText =
          data?.choices?.[0]?.message?.content || "";

        if (rawText) {
          console.log(
            `Success using model: ${model}`
          );
          break;
        }

        lastError =
          "No content returned from model";
      } catch (err) {
        lastError = err.message;
        console.error(
          `[${model}] Failed:`,
          err.message
        );
      }
    }

    if (!rawText) {
      return Response.json(
        {
          error: `OpenRouter failed. ${lastError}`,
        },
        { status: 500 }
      );
    }

    let captions;

    try {
      const cleaned = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const jsonMatch =
        cleaned.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error(
          "AI did not return valid JSON"
        );
      }

      captions = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(
        "JSON Parse Error:",
        err
      );

      return Response.json(
        {
          error:
            "AI returned invalid JSON format",
          raw: rawText,
        },
        { status: 500 }
      );
    }

    const imagePrompt =
      captions.imagePrompt ||
      `Luxury travel destination in ${destination}`;

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        imagePrompt
      )}?width=1200&height=630&nologo=true&seed=${Date.now()}`;

    return Response.json({
      success: true,
      captions,
      imagePrompt,
      imageUrl,
    });
  } catch (err) {
    console.error(
      "[Generate Route Error]",
      err
    );

    return Response.json(
      {
        error:
          err.message ||
          "Unknown server error",
      },
      { status: 500 }
    );
  }
}