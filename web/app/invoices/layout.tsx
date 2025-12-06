import DashboardLayout from "../dashboard/layout";

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
