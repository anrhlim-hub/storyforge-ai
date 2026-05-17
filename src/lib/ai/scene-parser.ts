export interface Scene {
  index: number;
  narasi: string;
  dialogs: { character: "bimo" | "kiko" | "narrator"; text: string }[];
  imagePrompt: string;
  animationPrompt: string;
}

export function parseScenes(script: string): Scene[] {
  const lines = script.split("\n").map((l) => l.trim()).filter(Boolean);
  const scenes: Scene[] = [];
  let current: Omit<Scene, "imagePrompt" | "animationPrompt"> | null = null;

  for (const line of lines) {
    const narasi = line.match(/^\[NARASI\]\s*(.+)/i);
    const dialog = line.match(/^\[(BIMO|KIKO)\]\s*(.+)/i);

    if (narasi) {
      if (current) scenes.push(buildScene(current));
      current = { index: scenes.length, narasi: narasi[1].trim(), dialogs: [] };
    } else if (dialog && current) {
      const char = dialog[1].toUpperCase() === "BIMO" ? "bimo" : "kiko";
      current.dialogs.push({ character: char, text: dialog[2].trim() });
    }
  }
  if (current) scenes.push(buildScene(current));

  return scenes.length > 0 ? scenes : [];
}

function buildScene(raw: Omit<Scene, "imagePrompt" | "animationPrompt">): Scene {
  const dialogSummary = raw.dialogs
    .slice(0, 2)
    .map((d) => `${d.character === "bimo" ? "Bimo the panda" : "Kiko the fox"}: ${d.text}`)
    .join(". ");

  const imagePrompt = [
    "Children's 2D animation style, bright and colorful",
    "Bimo: cute black-and-white panda cub age 7, wearing green overalls",
    "Kiko: cute orange fox cub age 7, wearing orange vest",
    `Scene: ${raw.narasi}`,
    dialogSummary ? `Action: ${dialogSummary}` : "",
    "Indonesian forest/nature background, cheerful atmosphere, soft lighting, high quality",
  ].filter(Boolean).join(". ");

  const animationPrompt = [
    "Smooth gentle camera movement, children's 2D animation style",
    `Scene: ${raw.narasi.slice(0, 80)}`,
    "Bimo the panda and Kiko the fox moving naturally",
    "Colorful, cheerful, soft motion, suitable for children aged 3-8",
  ].filter(Boolean).join(". ");

  return { ...raw, imagePrompt, animationPrompt };
}
