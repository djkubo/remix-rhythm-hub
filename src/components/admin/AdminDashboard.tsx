import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  Copy,
  Users,
  Eye,
  MousePointer,
  Clock,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  country_name: string | null;
  tags?: string[] | null;
  source: string | null;
  intent_plan?: string | null;
  created_at: string;
  manychat_synced: boolean | null;
  manychat_subscriber_id?: string | null;
  payment_provider?: string | null;
  payment_id?: string | null;
  paid_at?: string | null;
  shipping_to?: unknown;
  shipping_label_url?: string | null;
  shipping_tracking_number?: string | null;
  shipping_carrier?: string | null;
  shipping_servicelevel?: string | null;
  shipping_status?: string | null;
}

interface AnalyticsSummary {
  total_visitors: number;
  total_sessions: number;
  total_page_views: number;
  total_clicks: number;
  avg_time_on_page: number;
  avg_scroll_depth: number;
  conversion_rate: number;
}

interface DailyTrend {
  date: string;
  visitors: number;
  page_views: number;
}

interface BreakdownItem {
  name: string;
  value: number;
}

interface SourceBreakdown {
  sources: BreakdownItem[];
  mediums: BreakdownItem[];
  campaigns: BreakdownItem[];
}

type LeadBucket = "paid" | "pending" | "test";
type SalesFilter = "all" | "paid" | "pending" | "test";

interface EnrichedLead {
  lead: Lead;
  bucket: LeadBucket;
  productKey: string;
  productLabel: string;
  isPlaceholderEmail: boolean;
}

const PRODUCT_LABELS: Record<string, string> = {
  usb128: "USB 128 GB",
  usb_500gb: "USB 500 GB",
  anual: "Plan anual",
  djedits: "Curso DJ Edits",
  plan_1tb_mensual: "Membresía 1 TB mensual",
  plan_1tb_trimestral: "Membresía 1 TB trimestral",
  plan_2tb_anual: "Membresía 2 TB anual",
  membresia: "Membresía",
  gratis: "Gratis",
  unknown: "Sin definir",
};

const PRODUCT_PRICES: Record<string, number> = {
  usb128: 97,
  usb_500gb: 197,
  djedits: 47,
  anual: 197,
  plan_1tb_mensual: 19.5,
  plan_1tb_trimestral: 49.5,
  plan_1tb_semestral: 89,
  plan_1tb_anual: 149,
};

const SHIPPING_PRODUCTS_SET = new Set(["usb128", "usb_500gb"]);

const TEST_SOURCE_MARKERS = new Set(["smoke_test", "qa_test"]);
const TEST_TAG_MARKERS = new Set(["smoke_test", "qa_test"]);
const TEST_TEXT_MARKERS = ["smoke test", "qa test", "test checkout", "test usb", "codex.test+"];

function normalizeText(value: unknown): string {
  return String(value ?? "").toLowerCase().trim();
}

function getLeadTags(tags: string[] | null | undefined): string[] {
  return Array.isArray(tags) ? tags : [];
}

function isPlaceholderLeadEmail(email: string | null | undefined): boolean {
  const normalized = normalizeText(email);
  if (!normalized) return true;
  if (normalized === "pending") return true;
  if (normalized.endsWith("@example.invalid")) return true;
  return normalized.startsWith("pending+");
}

function inferLeadProductKey(lead: Lead): string {
  const tags = getLeadTags(lead.tags).map(normalizeText);
  const candidates = [lead.intent_plan, lead.source, ...tags].map(normalizeText);

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (PRODUCT_LABELS[candidate]) return candidate;
  }

  if (normalizeText(lead.source) === "membresia") return "membresia";
  if (normalizeText(lead.source).includes("usb")) return "usb128";
  return normalizeText(lead.source) || "unknown";
}

function isTestLead(lead: Lead): boolean {
  const source = normalizeText(lead.source);
  if (TEST_SOURCE_MARKERS.has(source)) return true;

  const tags = getLeadTags(lead.tags).map(normalizeText);
  if (tags.some((tag) => TEST_TAG_MARKERS.has(tag))) return true;

  const name = normalizeText(lead.name);
  const email = normalizeText(lead.email);
  const haystack = `${name} | ${email}`;
  return TEST_TEXT_MARKERS.some((marker) => haystack.includes(marker));
}

function getLeadBucket(lead: Lead): LeadBucket {
  if (isTestLead(lead)) return "test";
  if (lead.paid_at) return "paid";
  return "pending";
}

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const dateLocale = language === "es" ? es : enUS;
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState("7");
  const [activeTab, setActiveTab] = useState<"sales" | "overview" | "sources" | "events">("sales");
  const [salesFilter, setSalesFilter] = useState<SalesFilter>("all");
  const [salesSearch, setSalesSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [resyncingLeadId, setResyncingLeadId] = useState<string | null>(null);

  // Pagination
  const PAGE_SIZE = 50;
  const [leadsPage, setLeadsPage] = useState(0);
  const [salesPage, setSalesPage] = useState(0);

  const { startDate, endDate } = useMemo(() => {
    const days = Math.max(1, Number.parseInt(dateRange, 10) || 7);
    // "Last N days" should include today, so subtract N - 1.
    const start = startOfDay(subDays(new Date(), Math.max(0, days - 1)));
    const end = endOfDay(new Date());
    return { startDate: start, endDate: end };
  }, [dateRange]);

  const fmtInt = (value: number | null | undefined): string => {
    return typeof value === "number" ? value.toLocaleString() : "—";
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" ? "Se copió al portapapeles." : "Copied to clipboard.",
      });
    } catch {
      toast({
        title: language === "es" ? "No se pudo copiar" : "Copy failed",
        description:
          language === "es"
            ? "No se pudo copiar al portapapeles."
            : "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const resyncManyChat = async (leadId: string) => {
    if (!leadId) return;
    if (resyncingLeadId) return;

    setResyncingLeadId(leadId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-manychat", {
        body: { leadId },
      });

      if (error) throw error;

      const ok = Boolean((data as { success?: unknown } | null)?.success);
      toast({
        title: language === "es" ? "ManyChat" : "ManyChat",
        description: ok
          ? language === "es"
            ? "Sincronización completada."
            : "Sync completed."
          : language === "es"
            ? "No se pudo sincronizar."
            : "Unable to sync.",
        variant: ok ? "default" : "destructive",
      });
    } catch (err) {
      console.error("ManyChat resync error:", err);
      toast({
        title: language === "es" ? "Error" : "Error",
        description:
          language === "es"
            ? "No se pudo sincronizar con ManyChat."
            : "Could not sync with ManyChat.",
        variant: "destructive",
      });
    } finally {
      setResyncingLeadId(null);
    }
  };

  const renderTags = (tags: string[] | null | undefined) => {
    const list = Array.isArray(tags) ? tags : [];
    if (!list.length) return <span className="text-muted-foreground">—</span>;

    const sorted = [...list].sort();
    const visible = sorted.slice(0, 4);
    const extra = sorted.length - visible.length;

    return (
      <div className="flex flex-wrap gap-1 max-w-[260px]">
        {visible.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-border/60 bg-card/40 px-2 py-0.5 text-[10px] text-muted-foreground"
          >
            {tag}
          </Badge>
        ))}
        {extra > 0 ? (
          <Badge
            variant="secondary"
            className="px-2 py-0.5 text-[10px]"
          >
            +{extra}
          </Badge>
        ) : null}
      </div>
    );
  };

  const renderPayment = (lead: Lead) => {
    const paidAt = lead.paid_at ? new Date(lead.paid_at) : null;
    const provider = (lead.payment_provider || "").toUpperCase();
    const isPaid = Boolean(paidAt);

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge
            variant={isPaid ? "default" : "outline"}
            className={isPaid ? "bg-green-600 hover:bg-green-600" : ""}
          >
            {isPaid ? (language === "es" ? "PAGADO" : "PAID") : (language === "es" ? "PENDIENTE" : "PENDING")}
          </Badge>
          {provider ? (
            <span className="text-xs text-muted-foreground">{provider}</span>
          ) : null}
        </div>
        {paidAt ? (
          <p className="text-xs text-muted-foreground">
            {format(paidAt, "dd MMM yyyy HH:mm", { locale: dateLocale })}
          </p>
        ) : null}
      </div>
    );
  };

  const renderShipping = (lead: Lead) => {
    const status = (lead.shipping_status || "").trim();
    const tracking = (lead.shipping_tracking_number || "").trim();

    if (!status && !tracking) {
      return <span className="text-muted-foreground">—</span>;
    }

    return (
      <div className="space-y-1">
        {status ? (
          <p className="text-xs font-medium">{status}</p>
        ) : null}
        {tracking ? (
          <p className="text-xs text-muted-foreground">{tracking}</p>
        ) : null}
      </div>
    );
  };

  const renderLeadBucket = (bucket: LeadBucket) => {
    if (bucket === "paid") {
      return (
        <Badge className="bg-green-600 hover:bg-green-600">
          {language === "es" ? "VENTA REAL" : "REAL SALE"}
        </Badge>
      );
    }
    if (bucket === "test") {
      return <Badge variant="secondary">{language === "es" ? "TEST" : "TEST"}</Badge>;
    }
    return <Badge variant="outline">{language === "es" ? "PENDIENTE" : "PENDING"}</Badge>;
  };

  // Reset pages when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { setLeadsPage(0); setSalesPage(0); }, [dateRange]);

  // Fetch total leads count (lightweight — head-only request)
  const { data: leadsCount } = useQuery({
    queryKey: ["admin-leads-count", dateRange],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const totalLeadsPages = Math.max(1, Math.ceil((leadsCount ?? 0) / PAGE_SIZE));

  // Fetch leads — paginated
  const {
    data: leads,
    isLoading: leadsLoading,
    isFetching: leadsFetching,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["admin-leads", dateRange, leadsPage],
    queryFn: async () => {
      const from = leadsPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data as Lead[];
    },
  });

  const filteredLeads = useMemo(() => {
    if (!leads?.length) return [];
    const q = normalizeText(salesSearch);
    if (!q) return leads;

    return leads.filter((lead) => {
      const hay = [
        lead.name,
        lead.email,
        lead.phone,
        lead.country_name || "",
        lead.source || "",
        lead.intent_plan || "",
        (lead.tags || []).join(" "),
        lead.payment_provider || "",
        lead.shipping_status || "",
        lead.shipping_tracking_number || "",
      ].map(normalizeText).join(" | ");

      return hay.includes(q);
    });
  }, [salesSearch, leads]);

  const enrichedLeads = useMemo<EnrichedLead[]>(() => {
    if (!leads?.length) return [];
    return leads.map((lead) => {
      const productKey = inferLeadProductKey(lead);
      const productLabel =
        PRODUCT_LABELS[productKey] ||
        (language === "es" ? "Sin definir" : "Unmapped");
      return {
        lead,
        bucket: getLeadBucket(lead),
        productKey,
        productLabel,
        isPlaceholderEmail: isPlaceholderLeadEmail(lead.email),
      };
    });
  }, [language, leads]);

  const salesMetrics = useMemo(() => {
    const paid = enrichedLeads.filter((item) => item.bucket === "paid").length;
    const pending = enrichedLeads.filter((item) => item.bucket === "pending").length;
    const tests = enrichedLeads.filter((item) => item.bucket === "test").length;
    const pendingNoContact = enrichedLeads.filter(
      (item) =>
        item.bucket === "pending" &&
        item.isPlaceholderEmail &&
        !normalizeText(item.lead.phone),
    ).length;
    const paidWithoutManyChat = enrichedLeads.filter(
      (item) => item.bucket === "paid" && !item.lead.manychat_synced,
    ).length;
    const revenue = enrichedLeads
      .filter((item) => item.bucket === "paid")
      .reduce((sum, item) => sum + (PRODUCT_PRICES[item.productKey] || 0), 0);
    const needsShipment = enrichedLeads.filter(
      (item) =>
        item.bucket === "paid" &&
        SHIPPING_PRODUCTS_SET.has(item.productKey) &&
        !item.lead.shipping_tracking_number &&
        !item.lead.shipping_label_url,
    ).length;

    return { paid, pending, tests, pendingNoContact, paidWithoutManyChat, revenue, needsShipment };
  }, [enrichedLeads]);

  const filteredSalesLeads = useMemo(() => {
    const q = normalizeText(salesSearch);

    return enrichedLeads.filter((item) => {
      const matchesFilter =
        salesFilter === "all" ||
        (salesFilter === "paid" && item.bucket === "paid") ||
        (salesFilter === "pending" && item.bucket === "pending") ||
        (salesFilter === "test" && item.bucket === "test");

      if (!matchesFilter) return false;
      if (!q) return true;

      const hay = [
        item.lead.name,
        item.lead.email,
        item.lead.phone,
        item.lead.country_name || "",
        item.lead.source || "",
        item.lead.intent_plan || "",
        (item.lead.tags || []).join(" "),
        item.lead.payment_provider || "",
        item.lead.payment_id || "",
        item.productKey,
        item.productLabel,
        item.bucket,
      ].map(normalizeText).join(" | ");

      return hay.includes(q);
    });
  }, [enrichedLeads, salesFilter, salesSearch]);

  // Fetch analytics summary via RPC (optimized - no raw data download)
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["admin-analytics-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_analytics_summary", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;

      const summary = data as {
        total_visitors: number;
        total_sessions: number;
        total_page_views: number;
        total_clicks: number;
        avg_time_on_page: number;
        avg_scroll_depth: number;
      };

      // Calculate conversion rate with leads count
      const conversionRate = summary.total_visitors > 0
        ? ((leads?.length || 0) / summary.total_visitors) * 100
        : 0;

      return {
        ...summary,
        conversion_rate: conversionRate,
      } as AnalyticsSummary;
    },
    enabled: leads !== undefined, // Wait for leads to calculate conversion rate
  });

  // Fetch daily trends via RPC (optimized)
  const { data: dailyTrends, isFetching: trendsFetching, refetch: refetchTrends } = useQuery({
    queryKey: ["admin-trends-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_trends", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return (data as DailyTrend[]) || [];
    },
  });

  // Fetch event breakdown via RPC (optimized)
  const { data: eventBreakdown, isFetching: eventsFetching, refetch: refetchEvents } = useQuery({
    queryKey: ["admin-events-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_breakdown", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return (data as BreakdownItem[]) || [];
    },
  });

  // Fetch country breakdown via RPC (optimized)
  const { data: countryBreakdown, isFetching: countriesFetching, refetch: refetchCountries } = useQuery({
    queryKey: ["admin-countries-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_country_breakdown", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return (data as BreakdownItem[]) || [];
    },
  });

  // Fetch traffic sources breakdown via RPC (optimized)
  const { data: sourceBreakdown, isFetching: sourcesFetching, refetch: refetchSources } = useQuery({
    queryKey: ["admin-sources-rpc", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_source_breakdown", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      return data as unknown as SourceBreakdown;
    },
  });

  const isRefreshing =
    leadsFetching ||
    analyticsFetching ||
    trendsFetching ||
    eventsFetching ||
    countriesFetching ||
    sourcesFetching;

  const dailyTrendsData = dailyTrends ?? [];
  const eventBreakdownData = eventBreakdown ?? [];
  const countryBreakdownData = countryBreakdown ?? [];

  const handleRefresh = () => {
    refetchLeads();
    refetchAnalytics();
    refetchTrends();
    refetchEvents();
    refetchCountries();
    refetchSources();
  };

  const exportLeadsCSV = () => {
    if (!filteredLeads?.length) return;

    const headers = [
      t("admin.dashboard.name"),
      t("admin.dashboard.email"),
      t("admin.dashboard.phone"),
      t("admin.dashboard.country"),
      t("admin.dashboard.source"),
      "Tags",
      "Payment Provider",
      "Paid At",
      "Shipping Status",
      "Tracking",
      t("admin.dashboard.date"),
      "ManyChat Sync",
      "ManyChat Subscriber ID",
      "Lead ID",
    ];

    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.country_name || "",
      lead.source || "",
      (lead.tags || []).join("|"),
      lead.payment_provider || "",
      lead.paid_at ? format(new Date(lead.paid_at), "yyyy-MM-dd HH:mm") : "",
      lead.shipping_status || "",
      lead.shipping_tracking_number || "",
      format(new Date(lead.created_at), "dd/MM/yyyy HH:mm"),
      lead.manychat_synced ? t("admin.dashboard.yes") : t("admin.dashboard.no"),
      lead.manychat_subscriber_id || "",
      lead.id,
    ]);

    const sanitizeForSpreadsheet = (value: string): string => {
      // Prevent Excel/Sheets formula injection.
      return /^[=+\-@]/.test(value) ? `'${value}` : value;
    };

    const toCsvCell = (value: unknown): string => {
      const str = sanitizeForSpreadsheet(String(value ?? ""));
      const escaped = str.replace(/"/g, '""');
      const needsQuotes = /[",\n\r]/.test(escaped);
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(toCsvCell).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const exportSalesCSV = () => {
    if (!filteredSalesLeads.length) return;

    const headers = [
      language === "es" ? "Tipo" : "Type",
      language === "es" ? "Estado" : "Status",
      language === "es" ? "Producto" : "Product",
      t("admin.dashboard.name"),
      t("admin.dashboard.email"),
      t("admin.dashboard.phone"),
      language === "es" ? "Proveedor de pago" : "Payment provider",
      language === "es" ? "ID de pago" : "Payment ID",
      language === "es" ? "Fecha de pago" : "Paid at",
      t("admin.dashboard.date"),
      "Lead ID",
    ];

    const rows = filteredSalesLeads.map((item) => [
      item.bucket,
      item.lead.paid_at ? "paid" : "pending",
      item.productKey,
      item.lead.name,
      item.lead.email,
      item.lead.phone,
      item.lead.payment_provider || "",
      item.lead.payment_id || "",
      item.lead.paid_at ? format(new Date(item.lead.paid_at), "yyyy-MM-dd HH:mm") : "",
      format(new Date(item.lead.created_at), "yyyy-MM-dd HH:mm"),
      item.lead.id,
    ]);

    const sanitizeForSpreadsheet = (value: string): string => {
      return /^[=+\-@]/.test(value) ? `'${value}` : value;
    };

    const toCsvCell = (value: unknown): string => {
      const str = sanitizeForSpreadsheet(String(value ?? ""));
      const escaped = str.replace(/"/g, '""');
      const needsQuotes = /[",\n\r]/.test(escaped);
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(toCsvCell).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("admin.dashboard.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("admin.dashboard.last7days")}</SelectItem>
              <SelectItem value="14">{t("admin.dashboard.last14days")}</SelectItem>
              <SelectItem value="30">{t("admin.dashboard.last30days")}</SelectItem>
              <SelectItem value="90">{t("admin.dashboard.last90days")}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { id: "sales", label: language === "es" ? `Leads & Ventas (${leadsCount ?? 0})` : `Leads & Sales (${leadsCount ?? 0})` },
          { id: "overview", label: t("admin.dashboard.tabOverview") },
          { id: "sources", label: t("admin.dashboard.tabSources") },
          { id: "events", label: t("admin.dashboard.tabEvents") },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sales Tab */}
      {activeTab === "sales" && (
        <div className="space-y-4">
          {/* Compact Stat Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
              <DollarSign className="w-4 h-4 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                  {language === "es" ? "Revenue" : "Revenue"}
                </p>
                <p className="text-lg font-bold text-green-500">${salesMetrics.revenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
              <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                  {language === "es" ? "Ventas" : "Sales"}
                </p>
                <p className="text-lg font-bold text-green-500">{salesMetrics.paid}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                  {language === "es" ? "Pendientes" : "Pending"}
                </p>
                <p className="text-lg font-bold">{salesMetrics.pending}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
              <Package className="w-4 h-4 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                  {language === "es" ? "Sin envío" : "Needs ship"}
                </p>
                <p className="text-lg font-bold text-orange-500">{salesMetrics.needsShipment}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
              <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">Tests</p>
                <p className="text-lg font-bold text-zinc-500">{salesMetrics.tests}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">ManyChat</p>
                <p className="text-lg font-bold text-blue-500">{salesMetrics.paidWithoutManyChat}</p>
              </div>
            </div>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: language === "es" ? "Todo" : "All", count: enrichedLeads.length },
                { id: "paid", label: language === "es" ? "Pagados" : "Paid", count: salesMetrics.paid },
                { id: "pending", label: language === "es" ? "Pendientes" : "Pending", count: salesMetrics.pending },
                { id: "test", label: "Tests", count: salesMetrics.tests },
              ].map((option) => (
                <Button
                  key={option.id}
                  variant={salesFilter === option.id ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSalesFilter(option.id as SalesFilter)}
                >
                  {option.label} ({option.count})
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                placeholder={language === "es" ? "Buscar..." : "Search..."}
                className="w-full sm:w-56 h-8 text-sm"
              />
              <Button variant="outline" size="sm" className="h-8" onClick={exportSalesCSV} disabled={!filteredSalesLeads.length}>
                <Download className="w-3.5 h-3.5 mr-1" />
                CSV
              </Button>
            </div>
          </div>

          {/* Simplified Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{language === "es" ? "Estado" : "Status"}</TableHead>
                  <TableHead>{language === "es" ? "Producto" : "Product"}</TableHead>
                  <TableHead>{t("admin.dashboard.name")}</TableHead>
                  <TableHead>{language === "es" ? "Contacto" : "Contact"}</TableHead>
                  <TableHead>{language === "es" ? "Envío" : "Shipping"}</TableHead>
                  <TableHead>{t("admin.dashboard.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {t("admin.dashboard.loading")}
                    </TableCell>
                  </TableRow>
                ) : filteredSalesLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {language === "es" ? "No hay resultados." : "No results."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalesLeads.map((item) => (
                    <TableRow
                      key={item.lead.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedLead(item.lead)}
                    >
                      <TableCell>{renderLeadBucket(item.bucket)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{item.productLabel}</p>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{item.lead.name || "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <p className={item.isPlaceholderEmail ? "text-amber-500" : ""}>
                            {item.isPlaceholderEmail
                              ? "📧 " + (language === "es" ? "Pendiente" : "Pending")
                              : item.lead.email}
                          </p>
                          {item.lead.phone ? (
                            <p className="text-muted-foreground">{item.lead.phone}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {SHIPPING_PRODUCTS_SET.has(item.productKey) ? (
                          item.lead.shipping_tracking_number ? (
                            <Badge variant="outline" className="text-[10px] border-green-600 text-green-500">
                              📦 {language === "es" ? "Enviado" : "Shipped"}
                            </Badge>
                          ) : item.lead.shipping_label_url ? (
                            <Badge variant="outline" className="text-[10px] border-blue-600 text-blue-500">
                              🏷️ Label
                            </Badge>
                          ) : item.bucket === "paid" ? (
                            <Badge variant="outline" className="text-[10px] border-orange-600 text-orange-500">
                              ⚠️ {language === "es" ? "Sin envío" : "Needs ship"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">{language === "es" ? "Digital" : "Digital"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(
                          new Date(item.lead.paid_at || item.lead.created_at),
                          "dd MMM HH:mm",
                          { locale: dateLocale },
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {language === "es"
                ? `Página ${salesPage + 1} de ${totalLeadsPages} · ${leadsCount ?? 0} total`
                : `Page ${salesPage + 1} of ${totalLeadsPages} · ${leadsCount ?? 0} total`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7" disabled={salesPage <= 0} onClick={() => setSalesPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                {language === "es" ? "Ant" : "Prev"}
              </Button>
              <Button variant="outline" size="sm" className="h-7" disabled={salesPage >= totalLeadsPages - 1} onClick={() => setSalesPage((p) => Math.min(totalLeadsPages - 1, p + 1))}>
                {language === "es" ? "Sig" : "Next"}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.uniqueVisitors")}
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : fmtInt(analytics?.total_visitors)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.pageViews")}
                </CardTitle>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : fmtInt(analytics?.total_page_views)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.ctaClicks")}
                </CardTitle>
                <MousePointer className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? "..." : fmtInt(analytics?.total_clicks)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("admin.dashboard.conversionRate")}
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {analyticsLoading ? "..." : `${(analytics?.conversion_rate ?? 0).toFixed(2)}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Traffic Trend */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.trafficTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        name={t("admin.dashboard.visitors")}
                      />
                      <Line
                        type="monotone"
                        dataKey="page_views"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        dot={false}
                        name={t("admin.dashboard.pageViews")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Events Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.eventsByType")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventBreakdownData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Country Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.visitorsByCountry")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {countryBreakdownData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.engagementMetrics")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t("admin.dashboard.avgScroll")}</span>
                    <span className="font-medium">{analytics?.avg_scroll_depth?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${analytics?.avg_scroll_depth || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t("admin.dashboard.avgTime")}</span>
                    <span className="font-medium">
                      {Math.floor((analytics?.avg_time_on_page || 0) / 60)}m {Math.round((analytics?.avg_time_on_page || 0) % 60)}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {analytics?.total_sessions?.toLocaleString() || 0} {t("admin.dashboard.totalSessions")}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t("admin.dashboard.capturedLeads")}</span>
                    <span className="text-2xl font-bold text-green-500">{leads?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === "sources" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t("admin.dashboard.trafficSources")} (utm_source)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sourceBreakdown?.sources?.map((source, index) => {
                    const total = sourceBreakdown.sources.reduce((a, b) => a + b.value, 0);
                    const percent = total > 0 ? (source.value / total) * 100 : 0;
                    return (
                      <div key={source.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium capitalize flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {source.name}
                          </span>
                          <span className="text-muted-foreground">
                            {source.value} ({percent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!sourceBreakdown?.sources?.length && (
                    <p className="text-muted-foreground text-center py-8">
                      {t("admin.dashboard.noSourceData")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Mediums */}
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.dashboard.mediums")} (utm_medium)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceBreakdown?.mediums || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceBreakdown?.mediums?.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Campaigns */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t("admin.dashboard.campaigns")} (utm_campaign)</CardTitle>
              </CardHeader>
              <CardContent>
                {sourceBreakdown?.campaigns?.length ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sourceBreakdown.campaigns}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="name"
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name={t("admin.dashboard.visitors")}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {t("admin.dashboard.noCampaigns")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* UTM Guide */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.dashboard.utmGuideTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  {t("admin.dashboard.utmGuideDesc")}
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <code>
                    https://tudominio.com/?utm_source=instagram&utm_medium=social&utm_campaign=lanzamiento
                  </code>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <p className="font-medium">utm_source</p>
                    <p className="text-muted-foreground">
                      {t("admin.dashboard.utmSource")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">utm_medium</p>
                    <p className="text-muted-foreground">
                      {t("admin.dashboard.utmMedium")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">utm_campaign</p>
                    <p className="text-muted-foreground">
                      {t("admin.dashboard.utmCampaign")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lead Detail Dialog (shared - works from any tab) */}
      <Dialog open={Boolean(selectedLead)} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === "es" ? "Detalle del lead" : "Lead details"}
            </DialogTitle>
          </DialogHeader>

          {selectedLead ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.dashboard.name")}</p>
                  <p className="font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.dashboard.email")}</p>
                  <p className="font-medium break-all">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.dashboard.phone")}</p>
                  <p className="font-medium">{selectedLead.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.dashboard.country")}</p>
                  <p className="font-medium">{selectedLead.country_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.dashboard.source")}</p>
                  <p className="font-medium">{selectedLead.source || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("admin.dashboard.date")}</p>
                  <p className="font-medium">
                    {format(new Date(selectedLead.created_at), "dd MMM yyyy HH:mm", { locale: dateLocale })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Pago" : "Payment"}
                  </p>
                  {renderPayment(selectedLead)}
                  {selectedLead.payment_id ? (
                    <div className="text-xs text-muted-foreground break-all">
                      {language === "es" ? "ID:" : "ID:"} {selectedLead.payment_id}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {language === "es" ? "Envío" : "Shipping"}
                  </p>
                  {renderShipping(selectedLead)}
                  {selectedLead.shipping_label_url ? (
                    <a
                      href={selectedLead.shipping_label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline"
                    >
                      {language === "es" ? "Ver etiqueta" : "View label"}
                    </a>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Tags</p>
                  {renderTags(selectedLead.tags)}
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">ManyChat</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedLead.manychat_synced ? "default" : "outline"}>
                      {selectedLead.manychat_synced
                        ? language === "es" ? "Sincronizado" : "Synced"
                        : language === "es" ? "No" : "No"}
                    </Badge>
                    {selectedLead.manychat_subscriber_id ? (
                      <span className="text-xs text-muted-foreground break-all">
                        {selectedLead.manychat_subscriber_id}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => void copyToClipboard(selectedLead.id)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {language === "es" ? "Copiar Lead ID" : "Copy Lead ID"}
                  </Button>
                  <Button
                    onClick={() => void resyncManyChat(selectedLead.id)}
                    disabled={Boolean(resyncingLeadId)}
                  >
                    {resyncingLeadId === selectedLead.id
                      ? language === "es" ? "Sincronizando..." : "Syncing..."
                      : language === "es" ? "Re-sync ManyChat" : "Re-sync ManyChat"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.dashboard.allEvents")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
