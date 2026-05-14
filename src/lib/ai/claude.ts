import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ScriptInput {
  title: string;
  theme?: string | null;
  moral_lesson?: string | null;
  target_duration: number;
}

export async function generateScript(input: ScriptInput): Promise<string> {
  const wordCount = Math.round((input.target_duration / 60) * 120);

  const prompt = `Kamu adalah penulis script animasi anak-anak Indonesia yang kreatif dan berpengalaman.

Buat script episode animasi berjudul "${input.title}" dengan detail berikut:
${input.theme ? `- Tema: ${input.theme}` : ""}
${input.moral_lesson ? `- Pesan Moral: ${input.moral_lesson}` : ""}
- Durasi Target: ${input.target_duration} detik (sekitar ${wordCount} kata)

KARAKTER UTAMA:
- BIMO: Panda jantan 7 tahun, ceria, pemberani, kadang ceroboh, suka petualangan
- KIKO: Rubah betina 7 tahun, cerdas, kreatif, suka memecahkan masalah dengan cara unik

FORMAT SCRIPT (gunakan format ini dengan tepat):
[NARASI] Deskripsi adegan / setting
[BIMO] Dialog Bimo
[KIKO] Dialog Kiko

PANDUAN:
1. Gunakan bahasa Indonesia yang mudah dipahami anak usia 3-8 tahun
2. Bagi dalam 3 bagian: Pembuka (perkenalan masalah), Petualangan (mencari solusi), Penutup (resolusi + pelajaran tersirat)
3. Pesan moral disampaikan melalui tindakan dan dialog alami, BUKAN ceramah langsung
4. Setiap dialog singkat (1-2 kalimat), energik, dan ekspresif
5. Sertakan 2-3 adegan narasi untuk transisi visual

Tulis script yang lengkap sekarang:`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from Claude");
  return content.text.trim();
}
