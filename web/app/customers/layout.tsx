import DashboardLayout from "../dashboard/layout";

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
