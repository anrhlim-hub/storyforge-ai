"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Film, Globe, TrendingUp, CheckCircle, RefreshCw, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

type Stats = {
  total: number;
  draft: number;
  inProduction: number;
  approved: number;
  published: number;
};

type MonthData = { month: string; count: number };

type RecentEpisode = {
  id: string;
  title: string;
  published_at: string;
  facebook_post_id: string | null;
  published_url: string | null;
};

type AnalyticsData = {
  stats: Stats;
  episodesByMonth: MonthData[];
  publishedByMonth: MonthData[];
  recentPublished: RecentEpisode[];
  facebookPage: { name: string; followers: number } | null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground p-6">
        Gagal memuat data analytics.
      </div>
    );
  }

  const { stats, episodesByMonth, publishedByMonth, recentPublished, facebookPage } = data;

  const statCards = [
    {
      label: "Total Episode",
      value: stats.total,
      icon: Film,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Dipublish",
      value: stats.published,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Dalam Proses",
      value: stats.inProduction,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: facebookPage ? "Pengikut FB" : "Pengikut FB",
      value: facebookPage ? facebookPage.followers.toLocaleString("id-ID") : "—",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performa konten StoryForge AI
            {facebookPage && ` · ${facebookPage.name}`}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} mb-3`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Episode Dibuat per Bulan</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={episodesByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="count" name="Episode" fill="#7BC043" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Episode Dipublish per Bulan</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={publishedByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar dataKey="count" name="Dipublish" fill="#FF7F32" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-4">Status Episode</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Draft", value: stats.draft, dot: "bg-gray-400" },
            { label: "Dalam Proses", value: stats.inProduction, dot: "bg-amber-500" },
            { label: "Disetujui", value: stats.approved, dot: "bg-blue-500" },
            { label: "Dipublish", value: stats.published, dot: "bg-green-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className={`mt-2 h-2.5 w-2.5 rounded-full ${item.dot} shrink-0`} />
              <div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
                <div className="text-2xl font-bold">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Published */}
      {recentPublished.length > 0 ? (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-4">Episode Terpublish Terbaru</h2>
          <div className="divide-y">
            {recentPublished.map((ep) => (
              <div key={ep.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-sm">{ep.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ep.published_at
                      ? formatDistanceToNow(new Date(ep.published_at), { addSuffix: true, locale: id })
                      : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ep.facebook_post_id && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ep.facebook_post_id.startsWith("sim_")
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-green-500/10 text-green-600"
                    }`}>
                      {ep.facebook_post_id.startsWith("sim_") ? "Simulasi" : "Live"}
                    </span>
                  )}
                  {ep.published_url && (
                    <a
                      href={ep.published_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-5 text-center py-10 text-muted-foreground text-sm">
          Belum ada episode yang dipublish
        </div>
      )}
    </div>
  );
}
