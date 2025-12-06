import Link from "next/link";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";

/* ==============================
   TypeScript Types
============================== */

type StatusType = "paid" | "pending" | "overdue";

interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  Icon: React.ElementType;
  iconColor?: string;
}

interface InvoiceRowProps {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: StatusType;
}


/* ==============================
   Main Dashboard Page
============================== */

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Welcome back! Here's your business overview.
      </p>

      {/* ===== TOP STATS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {/* Total Invoices */}
        <StatCard
          title="Total Invoices"
          value="24"
          sub="All time"
          Icon={FileText}
        />

        {/* Paid */}
        <StatCard
          title="Paid"
          value="$12,450"
          sub="15 invoices"
          Icon={CheckCircle}
          iconColor="text-green-600"
        />

        {/* Pending */}
        <StatCard
          title="Pending"
          value="$3,280"
          sub="7 invoices"
          Icon={Clock}
          iconColor="text-yellow-600"
        />

        {/* Overdue */}
        <StatCard
          title="Overdue"
          value="$890"
          sub="2 invoices"
          Icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      {/* ===== RECENT INVOICES ===== */}
      <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <InvoiceRow
          id="INV-001"
          client="Acme Corp"
          amount="$2,400"
          date="2024-03-15"
          status="paid"
        />

        <InvoiceRow
          id="INV-002"
          client="Tech Solutions"
          amount="$1,800"
          date="2024-03-18"
          status="pending"
        />

        <InvoiceRow
          id="INV-003"
          client="Design Studio"
          amount="$890"
          date="2024-02-28"
          status="overdue"
        />

        <InvoiceRow
          id="INV-004"
          client="Marketing Co"
          amount="$3,200"
          date="2024-03-20"
          status="paid"
        />
      </div>
    </div>
  );
}


/* ==============================
   Stat Card Component
============================== */

function StatCard({
  title,
  value,
  sub,
  Icon,
  iconColor = "text-gray-500",
}: StatCardProps) {
  return (
    <div className="p-6 border rounded-xl shadow-sm bg-white">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          <p className="text-sm text-gray-500">{sub}</p>
        </div>

        <Icon size={26} className={iconColor} />
      </div>
    </div>
  );
}


/* ==============================
   Invoice Row Component
============================== */

function InvoiceRow({
  id,
  client,
  amount,
  date,
  status,
}: InvoiceRowProps) {
  const statusColors: Record<StatusType, string> = {
    paid: "text-green-600 bg-green-100",
    pending: "text-yellow-700 bg-yellow-100",
    overdue: "text-red-600 bg-red-100",
  };

  return (
    <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition">
      <div>
        <p className="font-semibold">{id}</p>
        <p className="text-gray-500">{client}</p>
      </div>

      <div
        className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}
      >
        {status}
      </div>

      <div className="text-right">
        <p className="font-semibold">{amount}</p>
        <p className="text-gray-500 text-sm">{date}</p>
      </div>
    </div>
  );
}
