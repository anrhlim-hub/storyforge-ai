"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Episode } from "@/types/database";

// Form pakai string untuk semua field (native HTML), konversi di onSubmit
type EpisodeRawForm = {
  title: string;
  episode_number: string;
  season: string;
  theme: string;
  moral_lesson: string;
  target_duration: string;
};

export type EpisodeFormValues = {
  title: string;
  episode_number?: number;
  season: number;
  theme?: string;
  moral_lesson?: string;
  target_duration: number;
};

interface EpisodeFormProps {
  defaultValues?: Partial<Episode>;
  onSubmit: (values: EpisodeFormValues) => Promise<void>;
  submitLabel?: string;
}

export function EpisodeForm({
  defaultValues,
  onSubmit,
  submitLabel = "Simpan",
}: EpisodeFormProps) {
  const form = useForm<EpisodeRawForm>({
    defaultValues: {
      title: defaultValues?.title ?? "",
      episode_number: defaultValues?.episode_number?.toString() ?? "",
      season: (defaultValues?.season ?? 1).toString(),
      theme: defaultValues?.theme ?? "",
      moral_lesson: defaultValues?.moral_lesson ?? "",
      target_duration: (defaultValues?.target_duration ?? 60).toString(),
    },
  });

  function validate(raw: EpisodeRawForm): EpisodeFormValues | null {
    if (!raw.title || raw.title.trim().length < 3) {
      form.setError("title", { message: "Judul minimal 3 karakter" });
      return null;
    }
    return {
      title: raw.title.trim(),
      episode_number: raw.episode_number ? parseInt(raw.episode_number) : undefined,
      season: parseInt(raw.season) || 1,
      theme: raw.theme || undefined,
      moral_lesson: raw.moral_lesson || undefined,
      target_duration: parseInt(raw.target_duration) || 60,
    };
  }

  async function handleSubmit(raw: EpisodeRawForm) {
    const values = validate(raw);
    if (!values) return;
    await onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul Episode *</FormLabel>
              <FormControl>
                <Input placeholder="contoh: Bimo dan Misteri Bintang Jatuh" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="season"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Season</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Season {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="episode_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. Episode</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="contoh: 12" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tema Cerita</FormLabel>
              <FormControl>
                <Input placeholder="contoh: Persahabatan dan kerja sama" {...field} />
              </FormControl>
              <FormDescription>Ide utama yang ingin disampaikan</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="moral_lesson"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pesan Moral</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="contoh: Bersama-sama kita bisa menyelesaikan masalah yang tampak sulit"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durasi Target (detik)</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[30, 45, 60, 90, 120, 180, 300].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} detik {d === 60 ? "(standar)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
