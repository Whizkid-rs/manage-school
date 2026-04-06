import { test, expect } from "@playwright/test"
import path from "path"

const ADMIN_FILE = path.join(__dirname, "fixtures/admin.json")
const PROFESSOR_FILE = path.join(__dirname, "fixtures/professor.json")
const STUDENT_FILE = path.join(__dirname, "fixtures/student.json")

// ─── TOP NAV ─────────────────────────────────────────────────────────────────

test.describe("TopNav", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows user initials in avatar", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("SA")).toBeVisible() // School Admin → SA
  })

  test("shows role badge", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("ADMIN")).toBeVisible()
  })

  test("dropdown shows name and email on avatar click", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByText("SA").click()
    await expect(page.getByText("School Admin")).toBeVisible()
    await expect(page.getByText("admin@school.com")).toBeVisible()
  })

  test("sign out from dropdown redirects to login", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByText("SA").click()
    await page.getByText("Sign out").click()
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })
})

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

test.describe("Sidebar — Admin", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows all 6 nav items", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Professors" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Courses" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Timetable" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Students" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Payments" })).toBeVisible()
  })

  test("active link is highlighted on dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    const dashLink = page.getByRole("link", { name: "Dashboard" })
    await expect(dashLink).toHaveClass(/bg-primary/)
  })
})

test.describe("Sidebar — Professor", () => {
  test.use({ storageState: PROFESSOR_FILE })

  test("does not show Students or Payments links", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "Students" })).not.toBeVisible()
    await expect(page.getByRole("link", { name: "Payments" })).not.toBeVisible()
  })

  test("shows Dashboard, Professors, Courses, Timetable", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Professors" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Courses" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Timetable" })).toBeVisible()
  })
})

test.describe("Sidebar — Student", () => {
  test.use({ storageState: STUDENT_FILE })

  test("does not show Professors or Students links", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "Professors" })).not.toBeVisible()
    await expect(page.getByRole("link", { name: "Students" })).not.toBeVisible()
  })

  test("shows Dashboard, Courses, Timetable, Payments", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Courses" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Timetable" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Payments" })).toBeVisible()
  })
})

// ─── DASHBOARD KPIs ──────────────────────────────────────────────────────────

test.describe("Dashboard — Admin KPIs", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows 4 KPI cards", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Professors")).toBeVisible()
    await expect(page.getByText("Active Courses")).toBeVisible()
    await expect(page.getByText("Students")).toBeVisible()
    await expect(page.getByText("Overdue Payments")).toBeVisible()
  })

  test("KPI values are numeric", async ({ page }) => {
    await page.goto("/dashboard")
    const cards = page.locator(".text-3xl.font-bold")
    const count = await cards.count()
    expect(count).toBe(4)
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent()
      expect(Number(text)).not.toBeNaN()
    }
  })

  test("shows welcome message with first name", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Welcome back, School")).toBeVisible()
  })
})

test.describe("Dashboard — Professor view", () => {
  test.use({ storageState: PROFESSOR_FILE })

  test("does not show KPI cards", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Active Courses")).not.toBeVisible()
    await expect(page.getByText("Students")).not.toBeVisible()
  })

  test("shows schedule placeholder", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Your schedule")).toBeVisible()
  })
})

test.describe("Dashboard — Student view", () => {
  test.use({ storageState: STUDENT_FILE })

  test("shows overview placeholder", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Your overview")).toBeVisible()
  })
})
