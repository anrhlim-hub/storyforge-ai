import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const SOURCE_DIR = "C:\\Users\\Asus\\Downloads\\A";

// Map folder prefix → nama file di R2
const FOLDER_MAP = {
  "01": "01-morning-vibes.mp3",
  "02": "02-playtime.mp3",
  "03": "03-super-excited.mp3",
  "04": "04-adventure-begins.mp3",
  "05": "05-cozy-afternoon.mp3",
  "06": "06-bedtime-story.mp3",
  "07": "07-deep-thinking.mp3",
  "08": "08-friendship-moment.mp3",
  "09": "09-sad-but-okay.mp3",
  "10": "10-uh-oh.mp3",
  "11": "11-mystery-time.mp3",
  "12": "12-chase-scene.mp3",
  "13": "13-countdown.mp3",
  "14": "14-problem-solved.mp3",
  "15": "15-learning.mp3",
  "16": "16-victory.mp3",
  "17": "17-ending.mp3",
  "18": "18-silly-mistake.mp3",
  "19": "19-magic-moment.mp3",
  "20": "20-end-credits.mp3",
};

async function uploadAll() {
  const folders = readdirSync(SOURCE_DIR).filter((f) =>
    statSync(join(SOURCE_DIR, f)).isDirectory()
  );

  let success = 0;
  let failed = 0;

  for (const folder of folders) {
    const prefix = folder.split(" ")[0]; // "01", "02", dst
    const targetName = FOLDER_MAP[prefix];
    if (!targetName) {
      console.log(`⚠️  Skip: ${folder} (tidak ada mapping)`);
      continue;
    }

    // Cari file MP3 di dalam folder
    const folderPath = join(SOURCE_DIR, folder);
    const files = readdirSync(folderPath).filter((f) => extname(f) === ".mp3");
    if (files.length === 0) {
      console.log(`⚠️  Skip: ${folder} (tidak ada MP3)`);
      continue;
    }

    const filePath = join(folderPath, files[0]);
    const fileBuffer = readFileSync(filePath);
    const key = `music-library/${targetName}`;

    try {
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: "audio/mpeg",
      }));
      console.log(`✅ Uploaded: ${files[0]} → ${key}`);
      success++;
    } catch (err) {
      console.log(`❌ Failed: ${folder} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📦 Selesai: ${success} berhasil, ${failed} gagal`);
  console.log(`🎵 URL contoh: ${process.env.R2_PUBLIC_URL}/music-library/01-morning-vibes.mp3`);
}

uploadAll();
