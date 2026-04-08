import { test, expect } from "@playwright/test"
import path from "path"

const ADMIN_FILE = path.join(__dirname, "fixtures/admin.json")
const PROFESSOR_FILE = path.join(__dirname, "fixtures/professor.json")
const STUDENT_FILE = path.join(__dirname, "fixtures/student.json")

// Helper: get the URL of a student by name from the list
async function getStudentUrl(page: any, name: string) {
  await page.goto("/students")
  const link = page.getByRole("link", { name }).first()
  const href = await link.getAttribute("href")
  return href as string
}

test.describe("Students list — Admin", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows students table with seed data", async ({ page }) => {
    await page.goto("/students")
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Alice Johnson" }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: "Bob Williams" }).first()).toBeVisible()
  })

  test("shows New Student button for admin", async ({ page }) => {
    await page.goto("/students")
    await expect(page.getByRole("link", { name: /New Student/ })).toBeVisible()
  })

  test("shows Edit links per row for admin", async ({ page }) => {
    await page.goto("/students")
    await expect(page.getByRole("link", { name: "Edit" }).first()).toBeVisible()
  })

  test("shows student number column", async ({ page }) => {
    await page.goto("/students")
    await expect(page.getByText("Student No.")).toBeVisible()
    await expect(page.getByText(/2025-000/).first()).toBeVisible()
  })
})

test.describe("Students list — Professor role", () => {
  test.use({ storageState: PROFESSOR_FILE })

  test("can view students list", async ({ page }) => {
    await page.goto("/students")
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible()
  })

  test("does not show New Student button", async ({ page }) => {
    await page.goto("/students")
    await expect(page.getByRole("link", { name: /New Student/ })).not.toBeVisible()
  })

  test("does not show Edit links", async ({ page }) => {
    await page.goto("/students")
    await expect(page.getByRole("link", { name: "Edit" })).not.toBeVisible()
  })
})

test.describe("Students list — Student role", () => {
  test.use({ storageState: STUDENT_FILE })

  test("redirects student to dashboard", async ({ page }) => {
    await page.goto("/students")
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByText(/Welcome back/)).toBeVisible()
  })
})

test.describe("Create student", () => {
  test.use({ storageState: ADMIN_FILE })

  test("form renders all fields", async ({ page }) => {
    await page.goto("/students/new")
    await expect(page.getByRole("heading", { name: "New Student" })).toBeVisible()
    await expect(page.getByLabel("Full Name")).toBeVisible()
    await expect(page.getByLabel(/Email/)).toBeVisible()
    await expect(page.getByLabel(/Student Number/)).toBeVisible()
    await expect(page.getByLabel("Grade / Year")).toBeVisible()
    await expect(page.getByLabel("Guardian Name")).toBeVisible()
  })

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/students/new")
    await page.getByRole("button", { name: "Create Student" }).click()
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible()
    await expect(page.getByText("Invalid email address")).toBeVisible()
    await expect(page.getByText("Student number is required")).toBeVisible()
  })

  test("creates a student and redirects to list", async ({ page }) => {
    const ts = Date.now()
    await page.goto("/students/new")
    await page.getByLabel("Full Name").fill(`Test Student ${ts}`)
    await page.getByLabel(/Email/).fill(`teststudent${ts}@school.com`)
    await page.getByLabel(/Student Number/).fill(`TST${ts.toString().slice(-5)}`)
    await page.getByLabel("Grade / Year").fill("Year 1")
    await page.getByRole("button", { name: "Create Student" }).click()
    await page.waitForURL("/students")
    await expect(page.getByRole("link", { name: `Test Student ${ts}` }).first()).toBeVisible()
  })
})

test.describe("Student detail page", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows student details with stat cards", async ({ page }) => {
    const url = await getStudentUrl(page, "Alice Johnson")
    await page.goto(url)
    await expect(page.getByText("Alice Johnson")).toBeVisible()
    await expect(page.getByText("Active Courses")).toBeVisible()
    await expect(page.getByText("Total Payments")).toBeVisible()
    await expect(page.getByText("Balance Due")).toBeVisible()
  })

  test("shows contact details", async ({ page }) => {
    const url = await getStudentUrl(page, "Alice Johnson")
    await page.goto(url)
    await expect(page.getByText("Contact & Details")).toBeVisible()
    await expect(page.getByText("alice@student.com")).toBeVisible()
  })

  test("shows enrollments table", async ({ page }) => {
    const url = await getStudentUrl(page, "Alice Johnson")
    await page.goto(url)
    await expect(page.getByText(/Enrollments/).first()).toBeVisible()
  })

  test("shows Edit button for admin", async ({ page }) => {
    const url = await getStudentUrl(page, "Alice Johnson")
    await page.goto(url)
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible()
  })

  test("edit button navigates to edit form", async ({ page }) => {
    const url = await getStudentUrl(page, "Alice Johnson")
    await page.goto(url)
    await page.getByRole("link", { name: "Edit" }).click()
    await expect(page.getByLabel("Full Name")).toHaveValue("Alice Johnson")
  })
})

test.describe("Edit student", () => {
  test.use({ storageState: ADMIN_FILE })

  test("pre-fills form with existing data", async ({ page }) => {
    const url = await getStudentUrl(page, "Bob Williams")
    await page.goto(`${url}/edit`)
    await expect(page.getByLabel("Full Name")).toHaveValue("Bob Williams")
    await expect(page.getByLabel(/Email/)).toBeDisabled()
    await expect(page.getByLabel(/Student Number/)).toBeDisabled()
  })

  test("saves changes and redirects to list", async ({ page }) => {
    const url = await getStudentUrl(page, "Bob Williams")
    await page.goto(`${url}/edit`)
    await page.getByLabel("Guardian Name").fill("Updated Guardian")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await page.waitForURL("/students")
    await expect(page.getByRole("link", { name: "Bob Williams" }).first()).toBeVisible()
  })
})
