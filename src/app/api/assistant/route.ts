import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { rateLimitAsync } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getGeminiKey() {
  return process.env.ANALYSIS_FALLBACK_KEY || process.env.GEMINI_API_KEY;
}

function getOpenAiKey() {
  return process.env.ANALYSIS_PRIMARY_KEY || process.env.OPENAI_API_KEY;
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await rateLimitAsync(`assistant:${user.id}`, 30, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const message = String(body.message || "").trim().slice(0, 2000);
  const locale = body.locale === "en" ? "en" : "fa";
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const system =
    locale === "fa"
      ? `تو دستیار گیاه‌یار هستی — مربی مراقبت از گیاهان آپارتمانی برای کاربران ایرانی.
قوانین:
- کوتاه، عملی و فارسی پاسخ بده.
- اگر بیماری/آفت محتمل است، نام فارسی بده و ۲–۴ قدم درمان پیشنهاد کن.
- محصولات رایج بازار ایران را در صورت نیاز نام ببر (صابون حشره‌کش، روغن چریش، بردوفیکس، NPK، آهن کلاته) بدون ادعای پزشکی قطعی.
- اگر مطمئن نیستی، بگو عکس نزدیک از برگ بگیرند یا از بخش اسکن/مشاوره استفاده کنند.
- نام علمی را در پرانتز لاتین نگه دار.`
      : `You are GiahYar, a houseplant care assistant.
Be practical and concise. Prefer actionable steps. Suggest common care products when useful. If unsure, ask for a closer leaf photo or expert consult.`;

  const geminiKey = getGeminiKey();
  const openaiKey = getOpenAiKey();

  if (!geminiKey && !openaiKey) {
    const fallback =
      locale === "fa"
        ? "دستیار هوشمند فعلاً بدون کلید Gemini/OpenAI در دسترس نیست. از اسکن برگ، لایت‌متر، پیشنهاد گیاه، فروشگاه مراقبت یا مشاوره کارشناس استفاده کنید."
        : "AI assistant needs Gemini/OpenAI keys. Use scan, light meter, recommendations, shop, or expert consult meanwhile.";
    return NextResponse.json({ reply: fallback, demo: true });
  }

  try {
    if (geminiKey) {
      const model =
        process.env.GEMINI_MODEL ||
        process.env.ANALYSIS_GEMINI_MODEL ||
        "gemini-2.0-flash";
      const contents = [
        ...history.map((h: { role?: string; content?: string }) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: String(h.content || "") }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
            generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
          }),
        }
      );
      if (!res.ok) throw new Error(`Gemini ${res.status}`);
      const data = await res.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ||
        "";
      if (!reply) throw new Error("Empty reply");
      return NextResponse.json({ reply });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          ...history.map((h: { role?: string; content?: string }) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: String(h.content || ""),
          })),
          { role: "user", content: message },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      {
        reply:
          locale === "fa"
            ? "پاسخ دستیار موقتاً در دسترس نیست. اسکن برگ یا مشاوره کارشناس را امتحان کنید."
            : "Assistant temporarily unavailable. Try leaf scan or expert consult.",
      },
      { status: 503 }
    );
  }
}
