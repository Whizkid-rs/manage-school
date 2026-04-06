import { test, expect } from "@playwright/test"
import path from "path"

const ADMIN_FILE = path.join(__dirname, "fixtures/admin.json")
const PROFESSOR_FILE = path.join(__dirname, "fixtures/professor.json")

// Helper: get the URL of a professor by name from the list
async function getProfessorUrl(page: any, name: string) {
  await page.goto("/professors")
  const link = page.getByRole("link", { name }).first()
  const href = await link.getAttribute("href")
  return href as string
}

test.describe("Professors list", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows professors table with seed data", async ({ page }) => {
    await page.goto("/professors")
    await expect(page.getByRole("heading", { name: "Professors" })).toBeVisible()
    await expect(page.getByRole("link", { name: "John Smith" }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: "Maria Garcia" }).first()).toBeVisible()
  })

  test("shows New Professor button for admin", async ({ page }) => {
    await page.goto("/professors")
    await expect(page.getByRole("link", { name: /New Professor/ })).toBeVisible()
  })

  test("shows Edit link per row for admin", async ({ page }) => {
    await page.goto("/professors")
    await expect(page.getByRole("link", { name: "Edit" }).first()).toBeVisible()
  })
})

test.describe("Professors list — Professor role", () => {
  test.use({ storageState: PROFESSOR_FILE })

  test("does not show New Professor button", async ({ page }) => {
    await page.goto("/professors")
    await expect(page.getByRole("link", { name: /New Professor/ })).not.toBeVisible()
  })

  test("does not show Edit links", async ({ page }) => {
    await page.goto("/professors")
    await expect(page.getByRole("link", { name: "Edit" })).not.toBeVisible()
  })
})

test.describe("Create professor", () => {
  test.use({ storageState: ADMIN_FILE })

  test("form renders all fields", async ({ page }) => {
    await page.goto("/professors/new")
    await expect(page.getByLabel("Full Name")).toBeVisible()
    await expect(page.getByLabel(/Email/)).toBeVisible()
    await expect(page.getByLabel("Hire Date")).toBeVisible()
    await expect(page.getByText("Employment Type")).toBeVisible()
  })

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/professors/new")
    await page.getByRole("button", { name: "Create Professor" }).click()
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible()
    await expect(page.getByText("Invalid email address")).toBeVisible()
    await expect(page.getByText("Hire date is required")).toBeVisible()
  })

  test("creates a professor and redirects to list", async ({ page }) => {
    const uniqueName = `Prof ${Date.now()}`
    await page.goto("/professors/new")
    await page.getByLabel("Full Name").fill(uniqueName)
    await page.getByLabel(/Email/).fill(`prof.${Date.now()}@school.com`)
    await page.getByLabel("Hire Date").fill("2024-01-15")
    await page.getByRole("button", { name: "Create Professor" }).click()
    await page.waitForURL("/professors")
    await expect(page.getByRole("link", { name: uniqueName }).first()).toBeVisible()
  })
})

test.describe("Professor detail page", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows professor details", async ({ page }) => {
    const url = await getProfessorUrl(page, "John Smith")
    await page.goto(url)
    await expect(page.getByText("Contact & Details")).toBeVisible()
    await expect(page.getByText("john.smith@school.com")).toBeVisible()
    await expect(page.getByText("Mathematics", { exact: true })).toBeVisible()
  })

  test("shows assigned courses", async ({ page }) => {
    const url = await getProfessorUrl(page, "John Smith")
    await page.goto(url)
    await expect(page.getByText(/MATH101/)).toBeVisible()
  })

  test("edit button navigates to edit form", async ({ page }) => {
    const url = await getProfessorUrl(page, "John Smith")
    await page.goto(url)
    // Only 1 Edit link on the detail page
    await page.getByRole("link", { name: "Edit" }).click()
    await expect(page.getByLabel("Full Name")).toHaveValue("John Smith")
  })
})

test.describe("Edit professor", () => {
  test.use({ storageState: ADMIN_FILE })

  test("pre-fills form with existing data", async ({ page }) => {
    const url = await getProfessorUrl(page, "Maria Garcia")
    await page.goto(`${url}/edit`)
    await expect(page.getByLabel("Full Name")).toHaveValue("Maria Garcia")
    await expect(page.getByLabel(/Email/)).toBeDisabled()
  })

  test("saves changes and redirects to list", async ({ page }) => {
    const url = await getProfessorUrl(page, "Maria Garcia")
    await page.goto(`${url}/edit`)
    await page.getByLabel("Office Room").fill("D-999")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await page.waitForURL("/professors")
    await expect(page.getByRole("link", { name: "Maria Garcia" }).first()).toBeVisible()
  })
})
