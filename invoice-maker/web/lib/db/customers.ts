export async function getCustomers() {
  const res = await fetch("/api/test/customers", {
    credentials: "include",
    cache: "no-store",
  });
  return res.json();
}
