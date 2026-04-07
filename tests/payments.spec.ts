import { test, expect } from "@playwright/test"
import path from "path"

const ADMIN_FILE = path.join(__dirname, "fixtures/admin.json")
const PROFESSOR_FILE = path.join(__dirname, "fixtures/professor.json")
const STUDENT_FILE = path.join(__dirname, "fixtures/student.json")

// Helper: get a payment's detail URL by invoice number
async function getPaymentUrl(page: any, invoiceNumber: string) {
  await page.goto("/payments")
  const link = page.getByRole("link", { name: invoiceNumber }).first()
  const href = await link.getAttribute("href")
  return href as string
}

test.describe("Payments list — Admin", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows payments table with seed data", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible()
    await expect(page.getByText("INV-2025-0001")).toBeVisible()
    await expect(page.getByText("INV-2025-0002")).toBeVisible()
  })

  test("shows New Payment button for admin", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByRole("link", { name: /New Payment/ })).toBeVisible()
  })

  test("shows PAID badge for paid invoice", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByText("PAID").first()).toBeVisible()
  })

  test("shows OVERDUE for past-due pending invoices", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByText("OVERDUE").first()).toBeVisible()
  })

  test("shows PARTIAL badge", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByText("PARTIAL")).toBeVisible()
  })

  test("shows overdue count in subtitle", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByText(/overdue/)).toBeVisible()
  })
})

test.describe("Payments list — Professor role", () => {
  test.use({ storageState: PROFESSOR_FILE })

  test("redirects professor to dashboard", async ({ page }) => {
    await page.goto("/payments")
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText(/Welcome back/)).toBeVisible()
  })
})

test.describe("Payments list — Student role", () => {
  test.use({ storageState: STUDENT_FILE })

  test("shows only own payments", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible()
    // Alice only has INV-2025-0001
    await expect(page.getByText("INV-2025-0001")).toBeVisible()
    await expect(page.getByText("INV-2025-0002")).not.toBeVisible()
  })

  test("does not show New Payment button", async ({ page }) => {
    await page.goto("/payments")
    await expect(page.getByRole("link", { name: /New Payment/ })).not.toBeVisible()
  })
})

test.describe("Create payment", () => {
  test.use({ storageState: ADMIN_FILE })

  test("form renders with student selector and type fields", async ({ page }) => {
    await page.goto("/payments/new")
    await expect(page.getByRole("heading", { name: "New Payment" })).toBeVisible()
    await expect(page.getByLabel(/Amount/)).toBeVisible()
    await expect(page.getByLabel("Due Date")).toBeVisible()
    await expect(page.getByText("Select a student...")).toBeVisible()
  })

  test("creates a payment and redirects to list", async ({ page }) => {
    await page.goto("/payments/new")
    // Select student
    await page.getByText("Select a student...").click()
    await page.getByRole("option", { name: /Alice Johnson/ }).click()
    // Fill amount and due date
    await page.getByLabel(/Amount/).fill("500")
    await page.getByLabel("Due Date").fill("2027-12-31")
    await page.getByRole("button", { name: "Create Payment" }).click()
    await page.waitForURL("/payments")
    // Should show the new invoice
    await expect(page.getByText(/INV-/).first()).toBeVisible()
  })
})

test.describe("Payment detail — Admin", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows invoice details and stat cards", async ({ page }) => {
    const url = await getPaymentUrl(page, "INV-2025-0001")
    await page.goto(url)
    await expect(page.getByText("INV-2025-0001")).toBeVisible()
    await expect(page.getByText("Amount")).toBeVisible()
    await expect(page.getByText("Paid", { exact: true })).toBeVisible()
    await expect(page.getByText("Balance")).toBeVisible()
  })

  test("shows student link on detail page", async ({ page }) => {
    const url = await getPaymentUrl(page, "INV-2025-0001")
    await page.goto(url)
    await expect(page.getByRole("link", { name: "Alice Johnson" })).toBeVisible()
  })

  test("shows Update Payment section for admin", async ({ page }) => {
    const url = await getPaymentUrl(page, "INV-2025-0002")
    await page.goto(url)
    await expect(page.getByText("Update Payment")).toBeVisible()
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeVisible()
  })

  test("mark as paid in full button is visible for unpaid invoice", async ({ page }) => {
    const url = await getPaymentUrl(page, "INV-2025-0002")
    await page.goto(url)
    await expect(page.getByRole("button", { name: /Mark as Paid/ })).toBeVisible()
  })

  test("paid invoice does not show mark as paid button", async ({ page }) => {
    const url = await getPaymentUrl(page, "INV-2025-0001")
    await page.goto(url)
    await expect(page.getByRole("button", { name: /Mark as Paid/ })).not.toBeVisible()
  })
})

test.describe("Payment detail — Student role", () => {
  test.use({ storageState: STUDENT_FILE })

  test("can view own payment detail", async ({ page }) => {
    const url = await getPaymentUrl(page, "INV-2025-0001")
    await page.goto(url)
    await expect(page.getByText("INV-2025-0001")).toBeVisible()
  })

  test("does not show Update Payment section", async ({ page }) => {
    const url = await getPaymentUrl(page, "INV-2025-0001")
    await page.goto(url)
    await expect(page.getByText("Update Payment")).not.toBeVisible()
  })
})
