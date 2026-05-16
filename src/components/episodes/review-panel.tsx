"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  MessageSquare, CheckCircle2, XCircle, Send,
  CheckCheck, Circle, Trash2, Loader2, Volume2, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Note = {
  id: string;
  note: string;
  status: "open" | "resolved";
  created_at: string;
  profiles: { full_name: string | null } | null;
};

type AudioFile = { character: string; url: string; key: string };

export function ReviewPanel({
  episodeId,
  episodeStatus,
}: {
  episodeId: string;
  episodeStatus: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [showAudio, setShowAudio] = useState(false);

  const loadNotes = useCallback(async () => {
    const res = await fetch(`/api/review/notes?episodeId=${episodeId}`);
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }, [episodeId]);

  const loadAudio = useCallback(async () => {
    const res = await fetch(`/api/production/jobs?episodeId=${episodeId}`);
    if (!res.ok) return;
    const jobs: Array<{ job_type: string; status: string; result: unknown }> = await res.json();
    const voiceJob = jobs.find((j) => j.job_type === "voice_over" && j.status === "completed");
    if (!voiceJob?.result) return;
    const result = voiceJob.result as { audio_files?: AudioFile[] };
    if (Array.isArray(result.audio_files) && result.audio_files.length > 0) {
      setAudioFiles(result.audio_files);
    }
  }, [episodeId]);

  useEffect(() => { void loadNotes(); void loadAudio(); }, [loadNotes, loadAudio]);

  async function handlePostNote() {
    if (!newNote.trim()) return;
    setPosting(true);
    const res = await fetch("/api/review/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId, note: newNote }),
    });
    if (res.ok) {
      setNewNote("");
      loadNotes();
    } else {
      toast.error("Gagal menambahkan catatan");
    }
    setPosting(false);
  }

  async function handleToggleNote(noteId: string, current: "open" | "resolved") {
    await fetch(`/api/review/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: current === "open" ? "resolved" : "open" }),
    });
    loadNotes();
  }

  async function handleDeleteNote(noteId: string) {
    await fetch(`/api/review/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function handleApprove() {
    setApproving(true);
    const res = await fetch("/api/review/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId }),
    });
    if (res.ok) {
      toast.success("Episode disetujui!");
      router.refresh();
    } else {
      toast.error("Gagal menyetujui episode");
    }
    setApproving(false);
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    const res = await fetch("/api/review/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ episodeId, reason: rejectReason }),
    });
    if (res.ok) {
      toast.success("Episode dikembalikan untuk revisi");
      setShowRejectForm(false);
      setRejectReason("");
      router.refresh();
    } else {
      toast.error("Gagal menolak episode");
    }
    setRejecting(false);
  }

  const openNotes = notes.filter((n) => n.status === "open");
  const resolvedNotes = notes.filter((n) => n.status === "resolved");

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Review & Catatan</h2>
          {openNotes.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
              {openNotes.length} terbuka
            </span>
          )}
        </div>

        {/* Tombol approve/reject hanya saat status = review */}
        {episodeStatus === "review" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Setujui
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowRejectForm((v) => !v)}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Tolak
            </Button>
          </div>
        )}

        {episodeStatus === "approved" && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
            <CheckCheck className="h-3.5 w-3.5" />
            Disetujui
          </span>
        )}
      </div>

      {/* Audio Preview */}
      {audioFiles.length > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-500/5">
          <button
            onClick={() => setShowAudio((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-purple-700"
          >
            <span className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Preview Voice Over ({audioFiles.length} file)
            </span>
            {showAudio ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showAudio && (
            <div className="border-t border-purple-200 px-3 pb-3 pt-2 space-y-2">
              {audioFiles.map((af, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-center text-xs font-medium capitalize text-purple-700">
                    {af.character}
                  </span>
                  <audio controls className="h-8 w-full" src={af.url} preload="none" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form reject */}
      {showRejectForm && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <p className="text-xs font-medium text-destructive">Alasan penolakan</p>
          <div className="flex gap-2">
            <input
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Tuliskan alasan penolakan..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReject()}
              autoFocus
            />
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
              {rejecting ? "..." : "Kirim"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>Batal</Button>
          </div>
        </div>
      )}

      {/* Tambah catatan */}
      <div className="flex gap-2">
        <input
          className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Tambah catatan review..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handlePostNote()}
        />
        <Button size="sm" onClick={handlePostNote} disabled={posting || !newNote.trim()}>
          {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Daftar catatan */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Belum ada catatan review
        </p>
      ) : (
        <div className="space-y-2">
          {/* Open notes dulu */}
          {openNotes.map((note) => (
            <NoteItem key={note.id} note={note} onToggle={handleToggleNote} onDelete={handleDeleteNote} />
          ))}
          {/* Resolved notes */}
          {resolvedNotes.length > 0 && (
            <>
              {openNotes.length > 0 && <div className="border-t my-2" />}
              {resolvedNotes.map((note) => (
                <NoteItem key={note.id} note={note} onToggle={handleToggleNote} onDelete={handleDeleteNote} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NoteItem({
  note,
  onToggle,
  onDelete,
}: {
  note: Note;
  onToggle: (id: string, status: "open" | "resolved") => void;
  onDelete: (id: string) => void;
}) {
  const isResolved = note.status === "resolved";
  return (
    <div className={`flex items-start gap-2 rounded-lg p-2.5 text-sm transition-colors ${isResolved ? "opacity-50" : "bg-muted/40"}`}>
      <button
        onClick={() => onToggle(note.id, note.status)}
        className={`mt-0.5 shrink-0 ${isResolved ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
      >
        {isResolved ? <CheckCheck className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`leading-snug ${isResolved ? "line-through text-muted-foreground" : ""}`}>
          {note.note}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {note.profiles?.full_name ?? "Reviewer"} ·{" "}
          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: idLocale })}
        </p>
      </div>
      <button
        onClick={() => onDelete(note.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
