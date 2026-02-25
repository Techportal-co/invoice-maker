"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

type Summary = {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  total_draft: number;
};

type MonthlyBreakdown = {
  month: string; // "YYYY-MM"
  invoiced: number;
  paid: number;
  outstanding: number;
};

type DashboardData = {
  summary: Summary;
  monthly_breakdown: MonthlyBreakdown[];
};

type MetricKey = "paid" | "invoiced" | "outstanding";

type AgingEntry = {
  bucket: string;
  amount: number;
};

// ── Chart config ───────────────────────────────────────────────────────────────

const METRIC_CONFIG: Record<MetricKey, { label: string; color: string; gradientId: string }> = {
  paid:        { label: "Paid",        color: "#2563eb", gradientId: "gradPaid"        },
  invoiced:    { label: "Invoiced",    color: "#6b7280", gradientId: "gradInvoiced"    },
  outstanding: { label: "Outstanding", color: "#dc2626", gradientId: "gradOutstanding" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMonth(ym: string) {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "2-digit" });
}

function pctChange(data: MonthlyBreakdown[], key: MetricKey): string | null {
  if (data.length < 2) return null;
  const current  = Number(data[data.length - 1][key]);
  const previous = Number(data[data.length - 2][key]);
  if (previous === 0) return current > 0 ? "New" : null;
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  color = "text-gray-900",
  change,
}: {
  title: string;
  value: number;
  color?: string;
  change?: string | null;
}) {
  const up   = change?.startsWith("+");
  const down = change?.startsWith("-");

  return (
    <div className="bg-white border rounded-xl p-5 space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>${Number(value ?? 0).toFixed(2)}</p>
      {change && (
        <p className={`text-xs font-medium ${up ? "text-green-600" : down ? "text-red-500" : "text-gray-400"}`}>
          {change} vs last month
        </p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData]           = useState<DashboardData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeMetric, setActive] = useState<MetricKey | "all">("paid");
  const [aging, setAging]         = useState<AgingEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [revRes, agingRes] = await Promise.all([
          fetch("/api/test/dashboard/revenue", { cache: "no-store", credentials: "include" }),
          fetch("/api/test/dashboard/aging",   { cache: "no-store", credentials: "include" }),
        ]);
        const revJson   = await revRes.json();
        const agingJson = await agingRes.json();
        if (!revRes.ok) { setError(revJson?.error ?? "Failed to load dashboard data"); return; }
        setData(revJson);
        if (agingRes.ok) setAging(agingJson.aging ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
        <div className="bg-white border rounded-xl p-6 animate-pulse h-80" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
      </div>
    );
  }

  const { summary, monthly_breakdown } = data!;

  // Chart data — month label already formatted
  const chartData = monthly_breakdown.map((m) => ({
    month:       formatMonth(m.month),
    paid:        Number(m.paid),
    invoiced:    Number(m.invoiced),
    outstanding: Number(m.outstanding),
  }));

  const metricsToShow: MetricKey[] =
    activeMetric === "all" ? ["invoiced", "paid", "outstanding"] : [activeMetric];

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/invoices/create" className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium">
          + Create Invoice
        </Link>
      </div>

      {/* KPI Cards — with % change vs last month */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Invoiced"
          value={summary.total_invoiced}
          change={pctChange(monthly_breakdown, "invoiced")}
        />
        <KpiCard
          title="Total Paid"
          value={summary.total_paid}
          color="text-green-700"
          change={pctChange(monthly_breakdown, "paid")}
        />
        <KpiCard
          title="Outstanding"
          value={summary.total_outstanding}
          color="text-red-600"
          change={pctChange(monthly_breakdown, "outstanding")}
        />
        <KpiCard
          title="Draft Revenue"
          value={summary.total_draft}
          color="text-gray-500"
        />
      </div>

      {/* Chart */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold">Revenue Trend</h2>

          {/* Toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg text-xs font-medium">
            {(["paid", "invoiced", "outstanding", "all"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`px-3 py-1.5 rounded-md capitalize transition ${
                  activeMetric === key
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {monthly_breakdown.length === 0 ? (
          <p className="text-sm text-gray-500 py-16 text-center">
            No data yet. Revenue will appear here once invoices are created.
          </p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>

                {/* Gradient fills */}
                <defs>
                  {(Object.entries(METRIC_CONFIG) as [MetricKey, (typeof METRIC_CONFIG)[MetricKey]][]).map(
                    ([, cfg]) => (
                      <linearGradient key={cfg.gradientId} id={cfg.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={cfg.color} stopOpacity={0}    />
                      </linearGradient>
                    )
                  )}
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                />
                <Tooltip
                  formatter={(value: number | undefined, name: string | undefined) => [
                    `$${Number(value ?? 0).toFixed(2)}`,
                    name ? name.charAt(0).toUpperCase() + name.slice(1) : "",
                  ]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                />
                {metricsToShow.length > 1 && <Legend />}

                {metricsToShow.map((key) => {
                  const cfg = METRIC_CONFIG[key];
                  return (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={cfg.color}
                      strokeWidth={2.5}
                      fill={`url(#${cfg.gradientId})`}
                      dot={{ r: 4, fill: cfg.color, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly breakdown table */}
      {monthly_breakdown.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Month</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Invoiced</th>
                <th className="px-4 py-3 text-right font-medium text-green-700">Paid</th>
                <th className="px-4 py-3 text-right font-medium text-red-600">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {monthly_breakdown.map((m) => (
                <tr key={m.month} className="border-t">
                  <td className="px-4 py-2">{formatMonth(m.month)}</td>
                  <td className="px-4 py-2 text-right">${Number(m.invoiced).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right font-medium text-green-700">${Number(m.paid).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-red-600">${Number(m.outstanding).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aging Report */}
      {aging.length > 0 && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Accounts Receivable Aging</h2>
            <p className="text-xs text-gray-500 mt-0.5">Unpaid invoices by days outstanding</p>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={aging} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                />
                <Tooltip
                  formatter={(value: number | undefined) => [
                    `$${Number(value ?? 0).toFixed(2)}`,
                    "Outstanding",
                  ]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                />
                <Bar dataKey="amount" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Invoices",     href: "/invoices"      },
          { label: "Customers",    href: "/customers"     },
          { label: "Products",     href: "/products"      },
          { label: "Tax Settings", href: "/settings/tax"  },
        ].map(({ label, href }) => (
          <Link key={href} href={href} className="border rounded-lg p-3 text-sm font-medium text-center hover:bg-gray-50 transition">
            {label} →
          </Link>
        ))}
      </div>

    </div>
  );
}
