import type { CartItem } from "@/types";

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  gstin?: string;
  invoiceNumber: string;
  date: string;
  cashier: string;
  customer?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: { method: string; amount: number; reference?: string }[];
  tenderedAmount?: number;
  changeAmount?: number;
  footer?: string;
  currencySymbol?: string;
  paperWidth?: "58mm" | "80mm";
}

export function generateThermalReceiptHTML(data: ReceiptData): string {
  const sym = data.currencySymbol ?? "₹";
  const fmt = (n: number) => `${sym}${n.toFixed(2)}`;
  const paper = data.paperWidth ?? "80mm";
  const bodyWidth = paper === "58mm" ? "48mm" : "72mm";
  const pixelWidth = paper === "58mm" ? "210px" : "280px";

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:3px 0">${item.name}<br><small style="color:#444">${item.sku}${item.barcode ? ` | ${item.barcode}` : ""} x${item.quantity}</small></td>
      <td style="text-align:right;padding:3px 0;vertical-align:top">${fmt(
        item.price * item.quantity * (1 - item.discount / 100)
      )}</td>
    </tr>`
    )
    .join("");

  const paymentsHtml = data.payments
    .map(
      (p) =>
        `<div style="display:flex;justify-content:space-between"><span>${p.method.toUpperCase()}${
          p.reference ? ` (${p.reference})` : ""
        }</span><span>${fmt(p.amount)}</span></div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${data.invoiceNumber}</title>
  <style>
    @media print {
      @page { size: ${paper} auto; margin: 2mm; }
      body { width: ${bodyWidth}; margin: 0; padding: 2px; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 'Courier New', monospace;
      font-size: 12px;
      width: ${pixelWidth};
      margin: 0 auto;
      padding: 8px;
      color: #000;
      background: #fff;
      line-height: 1.35;
    }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    hr { border: none; border-top: 1px dashed #444; margin: 6px 0; }
    .total { font-size: 14px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:15px;letter-spacing:0.5px">${data.storeName}</div>
  ${data.storeAddress ? `<div class="center" style="font-size:11px;margin-top:2px">${data.storeAddress}</div>` : ""}
  ${data.storePhone ? `<div class="center" style="font-size:11px">Tel: ${data.storePhone}</div>` : ""}
  ${data.gstin ? `<div class="center" style="font-size:11px">GSTIN: ${data.gstin}</div>` : ""}
  <hr>
  <div style="font-size:11px">
    <div><strong>Invoice:</strong> ${data.invoiceNumber}</div>
    <div><strong>Date:</strong> ${data.date}</div>
    <div><strong>Cashier:</strong> ${data.cashier}</div>
    ${data.customer ? `<div><strong>Customer:</strong> ${data.customer}</div>` : ""}
  </div>
  <hr>
  <table>${itemsHtml}</table>
  <hr>
  <div style="display:flex;justify-content:space-between"><span>Subtotal:</span><span>${fmt(data.subtotal)}</span></div>
  ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Discount:</span><span>-${fmt(data.discount)}</span></div>` : ""}
  <div style="display:flex;justify-content:space-between"><span>Tax / GST:</span><span>${fmt(data.tax)}</span></div>
  <div class="total" style="display:flex;justify-content:space-between;margin-top:4px"><span>GRAND TOTAL:</span><span>${fmt(data.total)}</span></div>
  <hr>
  <div style="font-size:11px">
    <div style="font-weight:600;margin-bottom:2px">Payment:</div>
    ${paymentsHtml}
    ${data.tenderedAmount !== undefined ? `<div style="display:flex;justify-content:space-between;margin-top:2px"><span>Tendered:</span><span>${fmt(data.tenderedAmount)}</span></div>` : ""}
    ${data.changeAmount !== undefined && data.changeAmount > 0 ? `<div style="display:flex;justify-content:space-between"><span>Change:</span><span>${fmt(data.changeAmount)}</span></div>` : ""}
  </div>
  <hr>
  <div class="center" style="font-size:11px;margin-top:4px">${data.footer ?? "Thank you for your purchase!"}</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}

export function printThermalReceipt(data: ReceiptData) {
  const html = generateThermalReceiptHTML(data);
  const win = window.open("", "_blank", "width=360,height=620");
  if (!win) {
    alert("Please allow popups to print receipts");
    return;
  }
  win.document.write(html);
  win.document.close();
}
