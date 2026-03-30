import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const styleMap: Record<string, { style: string; analogy: string; tone: string }> = {
  child: {
    style: "Masalsı ve eğlenceli bir dil kullan. Çok kısa ve basit cümleler yaz.",
    analogy: "Oyun, masal ve çizgi film analojileri kullan.",
    tone: "Bir çocukla sohbet eder gibi sıcak ve neşeli ol.",
  },
  teen: {
    style: "Günlük konuşma dili kullan ama bilgilendirici ol. Orta uzunlukta cümleler yaz.",
    analogy: "Sosyal medya, okul hayatı, spor ve günlük yaşam örnekleri kullan.",
    tone: "Sınava hazırlanan bir öğrenciyle konuşur gibi motive edici ol.",
  },
  university: {
    style: "Akademik ama akıcı bir dil kullan. Yapılandırılmış ve net cümleler yaz.",
    analogy: "Sektörel, bilimsel ve mantıksal analojiler kullan.",
    tone: "Profesyonel ve saygılı, ama anlaşılır ol.",
  },
};

const modeInstructions: Record<string, string> = {
  fast: `ÖĞRENME MODU: HIZLI VE ODAKLI
SERT BİÇİM KURALLARI — BU KURALLARA UYMAZSAN YANIT BAŞARISIZ SAYILIR:
- SIFIR PARAGRAF. Her chunk content alanı YALNIZCA HTML madde işareti listesi olmalı: <ul><li>...</li></ul>
- Her madde aşırı kısa olmalı: maksimum 10 kelime.
- Bionic Reading zorunlu: önemli kelimelerin ilk 2-4 harfini HTML <b> etiketiyle kalın yaz. Örnek: <b>Fak</b>tör, <b>ara</b>ştırma. Markdown yıldız (**) KULLANMA, sadece HTML <b> etiketi kullan.
- analogy alanını null veya boş string yap.
- quiz alanını null yap.
- Her chunk belgenin farklı bir bölümünü kapsamalı.`,

  visual: `ÖĞRENME MODU: GÖRSEL HAFIZA
SERT BİÇİM KURALLARI — BU KURALLARA UYMAZSAN YANIT BAŞARISIZ SAYILIR:
- Her chunk title alanı ilgili bir emoji ile başlamalı (örn: 🧠, 🏗️, 🌍, 🔬).
- Her chunk content kısa cümlelerden oluşmalı; her cümle arasında çift satır sonu bırak.
- chunk analogy alanı zorunlu olarak 💡 ile başlamalı ve çok görsel, akılda kalıcı bir mnemonic içermeli.
- summaryTerms içindeki terimler de mümkünse emoji ile başlamalı ve kısa tanımlı olmalı.
- Metin içinde kalın vurgu gerekiyorsa sadece HTML <b> etiketi kullan. Markdown yıldız (**) YASAK.
- quiz alanını null yap.`,

  deep: `ÖĞRENME MODU: DERİNLEMESİNE ANALİZ
SERT BİÇİM KURALLARI — BU KURALLARA UYMAZSAN YANIT BAŞARISIZ SAYILIR:
- Ayrıntılı, akademik paragraflar burada SERBEST ve TERCİH EDİLİR.
- Karmaşık terminolojiyi, kronolojik akışı, neden-sonuç ilişkilerini ve kanıt zincirini koru.
- Metni 3-4 mantıksal bölüme ayır. Her bölüm belgenin farklı bir alt konusunu detaylı ama anlaşılır biçimde açıklasın.
- Her chunk İÇİN ayrı bir quiz nesnesi ZORUNLU: O bölüme özel, düşündürücü bir 4 seçenekli çoktan seçmeli soru üret. options dizisi tam 4 eleman içermeli, correctIndex doğru cevabın 0-bazlı indeksini göstermeli.
- chunks dizisindeki her elemanın "quiz" alanı dolu olmalı. Üst seviye "quiz" alanını null yap.
- Metin içinde kalın vurgu gerekiyorsa sadece HTML <b> etiketi kullan. Markdown yıldız (**) YASAK.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, age, ageGroup, learningMode } = await req.json();

    if (!text || !age || !ageGroup) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text, age, ageGroup" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mode = learningMode || "fast";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cfg = styleMap[ageGroup] || styleMap.teen;
    const modeInstruction = modeInstructions[mode] || modeInstructions.fast;

    const systemPrompt = `Sen uzman bir pedagogsun ve bilişsel okuma asistanısın. Görevin, verilen akademik metni ${age} yaşındaki bir öğrenci için optimize etmektir.

${modeInstruction}

KURALLAR:
1. ${cfg.style}
2. ${cfg.analogy}
3. ${cfg.tone}
4. Metni mutlaka Türkçe olarak işle.
5. Seçilen öğrenme modunun biçim kuralları zorunludur.
6. KRİTİK KURAL: Kelime içi kalınlaştırma için ASLA Markdown yıldız (**) kullanma. SADECE HTML <b> etiketi kullan.
7. YANIT FORMATI: Yanıtın YALNIZCA geçerli JSON olmalıdır. Hiçbir açıklama metni, markdown kod bloğu veya ek karakter ekleme. Sadece saf JSON döndür.

YAPI FARKINDALIK KURALLARI:
- Metnin ana bölümlerini tespit et.
- Her ana bölüm çıktıda temsil edilmeli.
- Uzun metinlerde daha fazla chunk üret; az sayıda büyük özet üretme.
- Her chunk belgenin farklı bir bölümünü kapsamalı.
- İçeriği ASLA aşırı özetleme. Orijinal metindeki TÜM önemli fikirleri koru.

ÇIKTI FORMATI (Bu formata kesinlikle uy):
{
  "summary": "Metnin GENEL sonuçlarını ve ana argümanlarını yansıtan kapsamlı bir özet (3-5 cümle).",
  "summaryTerms": [
    { "term": "Önemli terim", "definition": "Terimin kısa tanımı" }
  ],
  "chunks": [
    {
      "id": 1,
      "sectionLabel": "Bölüm etiketi (örn: Giriş, Yöntem, Bulgular)",
      "title": "Bölüm başlığı",
      "content": "Basitleştirilmiş içerik (moda göre format)",
      "analogy": "Kavram için bir analoji veya null",
      "keyTerms": [
        { "term": "Terim", "definition": "Tanım" }
      ],
      "quiz": {
        "question": "Bu bölüme özel düşündürücü bir soru (sadece deep modda)",
        "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
        "correctIndex": 0
      }
    }
  ],
  "quiz": {
    "question": "Zorlayıcı bir çoktan seçmeli soru",
    "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
    "correctIndex": 0
  }
}

NOT: "deep" modunda her chunk içinde ayrı bir quiz alanı zorunludur. Üst seviye quiz alanını null yap. Diğer modlarda chunk quiz alanı ve üst seviye quiz alanı null olabilir.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Aşağıdaki metni analiz et ve basitleştir:\n\n${text}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      parsed = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("Failed to parse AI response as JSON:", rawContent);
      parsed = {
        summary: rawContent.slice(0, 500),
        summaryTerms: [],
        chunks: [{ id: 1, title: "Basitleştirilmiş Metin", content: rawContent, analogy: null }],
        quiz: null,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simplify-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
