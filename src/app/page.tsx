import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Video, Bot } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#7BC043]/10 via-background to-[#FF7F32]/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Animation Platform</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(to right, #7BC043, #FF7F32)",
              }}
            >
              StoryForge AI
            </span>
          </h1>

          <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
            Buat konten animasi anak-anak secara otomatis dengan AI.
            <br />
            <span className="text-base">Bimo &amp; Kiko Adventure Universe</span>
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/login">Mulai Sekarang</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="/about">Pelajari Lebih Lanjut</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#7BC043]/10 text-[#7BC043]">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">AI Automation</h3>
            <p className="text-sm text-muted-foreground">
              Otomatisasi penuh dari script hingga upload ke Facebook
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#FF7F32]/10 text-[#FF7F32]">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">3-5 Episode/Hari</h3>
            <p className="text-sm text-muted-foreground">
              Skala produksi tinggi dengan kualitas tetap terjaga
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Smart Workflow</h3>
            <p className="text-sm text-muted-foreground">
              80% AI automation + 20% human touch untuk kualitas optimal
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
