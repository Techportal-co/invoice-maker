export async function createInvoice(payload: any) {
  const res = await fetch("/api/test/invoices/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.json();
}
