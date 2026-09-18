import fs from "fs";
import path from "path";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

async function verify() {
  console.log("=========================================");
  console.log("FIRESTORE BACKEND SMOKE TEST");
  console.log("=========================================");

  const { ProductRepository } = await import("../src/repositories/product.repository");
  const { SaleRepository } = await import("../src/repositories/sale.repository");
  const { EmployeeRepository } = await import("../src/repositories/employee.repository");

  const pRepo = new ProductRepository();
  const sRepo = new SaleRepository();
  const eRepo = new EmployeeRepository();

  const prods = await pRepo.paginate({ limit: 10 }, "default");
  console.log("✅ PRODUCTS COUNT:", prods.total);
  console.log("   ITEMS:", prods.items.map((i) => `${i.name} (Stock: ${i.stock}, SKU: ${i.sku})`));

  const employees = await eRepo.paginate({ limit: 10 }, "default");
  console.log("✅ EMPLOYEES COUNT:", employees.total);
  console.log("   USERS:", employees.items.map((i) => `${i.name} [${i.role}] (${i.email})`));

  const low = await pRepo.lowStock(10, "default");
  console.log("✅ LOW STOCK ITEMS:", low.length);

  const stats = await sRepo.getRevenueStats("default");
  console.log("✅ REVENUE STATS:", stats);

  console.log("=========================================");
  console.log("ALL REAL FIRESTORE QUERIES PASSED!");
  console.log("=========================================");
}

verify()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("VERIFY_ERROR:", e);
    process.exit(1);
  });
