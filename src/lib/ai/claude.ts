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

  const prompt = `Kamu adalah penulis script animasi anak-anak Indonesia yang profesional.

Buat script episode animasi berjudul "${input.title}" dengan detail berikut:
${input.theme ? `- Tema: ${input.theme}` : ""}
${input.moral_lesson ? `- Pesan Moral: ${input.moral_lesson}` : ""}
- Durasi Target: ${input.target_duration} detik

KARAKTER UTAMA:
- BIMO: Panda jantan 7 tahun, ceria, pemberani, kadang ceroboh, suka petualangan
- KIKO: Rubah betina 7 tahun, cerdas, kreatif, suka memecahkan masalah dengan cara unik

FORMAT SCRIPT (gunakan format ini dengan TEPAT, tanpa tanda bintang, tanpa markdown):
[NARASI] Deskripsi visual adegan yang detail (latar, suasana, aksi)
[BIMO] Dialog Bimo
[KIKO] Dialog Kiko

PENTING:
- Jangan gunakan markdown seperti **teks** atau _teks_. Hanya gunakan format [TAG] polos.
- Setiap [NARASI] harus deskripsi VISUAL yang kaya dan spesifik (untuk animasi)
- WAJIB ada tepat 8 blok [NARASI] yang membagi episode menjadi 8 adegan visual

STRUKTUR 8 ADEGAN:
1. [NARASI] Pembuka — perkenalan setting dan karakter
2. [NARASI] Pemicu — masalah atau tantangan muncul
3. [NARASI] Reaksi — Bimo dan Kiko merespons
4. [NARASI] Eksplorasi — mereka mencari solusi
5. [NARASI] Rintangan — hambatan atau twist
6. [NARASI] Penemuan — solusi ditemukan
7. [NARASI] Aksi — menerapkan solusi
8. [NARASI] Penutup — resolusi dan pelajaran

PANDUAN PENULISAN:
1. Bahasa Indonesia sederhana untuk anak usia 3-8 tahun
2. Dialog singkat (1-2 kalimat), energik, ekspresif
3. Pesan moral muncul dari tindakan, BUKAN ceramah
4. Setiap adegan visual bisa dianimasikan 5 detik

Tulis script yang lengkap dengan tepat 8 blok [NARASI] sekarang:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2048,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Tidak ada respons dari OpenAI");
  // Bersihkan markdown bold yang kadang ditambahkan GPT: **[BIMO]** → [BIMO]
  return content.trim().replace(/\*\*(\[(?:NARASI|BIMO|KIKO)\])\*\*/gi, "$1");
}
