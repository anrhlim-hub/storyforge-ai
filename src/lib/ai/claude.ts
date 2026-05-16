import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
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

FORMAT SCRIPT (gunakan format ini dengan TEPAT, tanpa tanda bintang, tanpa markdown):
[NARASI] Deskripsi adegan / setting
[BIMO] Dialog Bimo
[KIKO] Dialog Kiko

PENTING: Jangan gunakan markdown seperti **teks** atau _teks_. Hanya gunakan format [TAG] polos.

PANDUAN:
1. Gunakan bahasa Indonesia yang mudah dipahami anak usia 3-8 tahun
2. Bagi dalam 3 bagian: Pembuka (perkenalan masalah), Petualangan (mencari solusi), Penutup (resolusi + pelajaran tersirat)
3. Pesan moral disampaikan melalui tindakan dan dialog alami, BUKAN ceramah langsung
4. Setiap dialog singkat (1-2 kalimat), energik, dan ekspresif
5. Sertakan 2-3 adegan narasi untuk transisi visual

Tulis script yang lengkap sekarang:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1024,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Tidak ada respons dari OpenAI");
  // Bersihkan markdown bold yang kadang ditambahkan GPT: **[BIMO]** → [BIMO]
  return content.trim().replace(/\*\*(\[(?:NARASI|BIMO|KIKO)\])\*\*/gi, "$1");
}
