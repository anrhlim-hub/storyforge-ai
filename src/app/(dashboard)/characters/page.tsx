"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Users, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Character, CharacterType } from "@/types/database";

const TYPE_LABELS: Record<CharacterType, string> = {
  main: "Utama",
  supporting: "Pendukung",
  background: "Latar",
};

const TYPE_COLORS: Record<CharacterType, string> = {
  main: "bg-primary/10 text-primary border-primary/20",
  supporting: "bg-orange-500/10 text-orange-600 border-orange-200",
  background: "bg-muted text-muted-foreground border-border",
};

const CHARACTER_EMOJIS: Record<string, string> = {
  Panda: "🐼",
  Fox: "🦊",
  Rabbit: "🐰",
  Bear: "🐻",
  Cat: "🐱",
  Dog: "🐶",
  Bird: "🐦",
};

type CharacterFormData = {
  name: string;
  type: CharacterType;
  species: string;
  description: string;
  personality: string;
};

const EMPTY_FORM: CharacterFormData = {
  name: "",
  type: "supporting",
  species: "",
  description: "",
  personality: "",
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<CharacterType | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CharacterFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadCharacters = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/characters");
    if (res.ok) setCharacters(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadCharacters(); }, [loadCharacters]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(char: Character) {
    setEditingId(char.id);
    setForm({
      name: char.name,
      type: char.type,
      species: char.species ?? "",
      description: char.description ?? "",
      personality: char.personality ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Nama karakter wajib diisi");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      species: form.species.trim() || null,
      description: form.description.trim() || null,
      personality: form.personality.trim() || null,
    };

    const res = editingId
      ? await fetch(`/api/characters/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      toast.success(editingId ? "Karakter diperbarui" : "Karakter ditambahkan");
      setDialogOpen(false);
      loadCharacters();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Gagal menyimpan");
    }
    setSaving(false);
  }

  async function handleToggleActive(char: Character) {
    const res = await fetch(`/api/characters/${char.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !char.is_active }),
    });
    if (res.ok) {
      setCharacters((prev) =>
        prev.map((c) => c.id === char.id ? { ...c, is_active: !c.is_active } : c)
      );
    }
  }

  const filtered = filterType === "all"
    ? characters
    : characters.filter((c) => c.type === filterType);

  const mainCount = characters.filter((c) => c.type === "main").length;
  const activeCount = characters.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          <p className="text-sm text-muted-foreground">
            {characters.length} karakter · {activeCount} aktif · {mainCount} utama
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Karakter
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Karakter" : "Tambah Karakter Baru"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama *</label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="cth: Bimo, Kiko"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipe</label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as CharacterType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Utama</SelectItem>
                      <SelectItem value="supporting">Pendukung</SelectItem>
                      <SelectItem value="background">Latar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Spesies</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="cth: Panda, Fox"
                    value={form.species}
                    onChange={(e) => setForm({ ...form, species: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deskripsi</label>
                <textarea
                  className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  placeholder="Deskripsi karakter secara umum..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kepribadian</label>
                <textarea
                  className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  placeholder="Sifat dan kepribadian karakter..."
                  value={form.personality}
                  onChange={(e) => setForm({ ...form, personality: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "main", "supporting", "background"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
              filterType === t
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {t === "all" ? "Semua" : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
          <Users className="mb-4 h-12 w-12 opacity-30" />
          <p className="font-medium text-muted-foreground">Belum ada karakter</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Klik "Tambah Karakter" untuk mulai
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((char) => {
            const emoji = CHARACTER_EMOJIS[char.species ?? ""] ?? "✨";
            return (
              <div
                key={char.id}
                className={`relative rounded-2xl border bg-card p-5 transition-all hover:shadow-md ${
                  !char.is_active ? "opacity-50" : ""
                }`}
              >
                {/* Header karakter */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                      {emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold leading-tight">{char.name}</h3>
                      {char.species && (
                        <p className="text-xs text-muted-foreground">{char.species}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(char)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                {/* Badge tipe */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[char.type]}`}>
                    {char.type === "main" ? <Star className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {TYPE_LABELS[char.type]}
                  </span>
                  {!char.is_active && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Nonaktif
                    </span>
                  )}
                </div>

                {/* Deskripsi */}
                {char.description && (
                  <p className="mb-2 text-sm text-muted-foreground line-clamp-2">
                    {char.description}
                  </p>
                )}

                {/* Kepribadian */}
                {char.personality && (
                  <p className="text-xs text-muted-foreground italic line-clamp-1">
                    💬 {char.personality}
                  </p>
                )}

                {/* Toggle aktif */}
                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {char.is_active ? "Aktif di produksi" : "Tidak aktif"}
                  </span>
                  <button
                    onClick={() => handleToggleActive(char)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      char.is_active ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        char.is_active ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
