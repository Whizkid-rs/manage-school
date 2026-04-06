import { test, expect } from "@playwright/test"

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("renders login form", async ({ page }) => {
    await expect(page.getByText("School Management").first()).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible()
  })

  test("shows validation errors for empty submit", async ({ page }) => {
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.getByText("Invalid email address")).toBeVisible()
    await expect(page.getByText("Password is required")).toBeVisible()
  })

  test("shows error for invalid email format", async ({ page }) => {
    await page.getByLabel("Email").fill("notanemail")
    await page.getByLabel("Password").fill("anything")
    await page.getByRole("button", { name: "Sign in" }).click()
    // noValidate on form means react-hook-form handles email validation
    await expect(page.getByText("Invalid email address")).toBeVisible()
  })

  test("shows error for wrong credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("wrong@school.com")
    await page.getByLabel("Password").fill("wrongpassword")
    await page.getByRole("button", { name: "Sign in" }).click()
    await expect(page.getByText("Invalid email or password")).toBeVisible()
  })

  test("redirects to dashboard on successful admin login", async ({ page }) => {
    await page.getByLabel("Email").fill("admin@school.com")
    await page.getByLabel("Password").fill("admin123")
    await page.getByRole("button", { name: "Sign in" }).click()
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("redirects to dashboard on successful professor login", async ({ page }) => {
    await page.getByLabel("Email").fill("john.smith@school.com")
    await page.getByLabel("Password").fill("prof123")
    await page.getByRole("button", { name: "Sign in" }).click()
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("redirects to dashboard on successful student login", async ({ page }) => {
    await page.getByLabel("Email").fill("alice@student.com")
    await page.getByLabel("Password").fill("student123")
    await page.getByRole("button", { name: "Sign in" }).click()
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })
})

test.describe("Unauthenticated access", () => {
  test("root redirects to login", async ({ page }) => {
    await page.goto("/")
    await page.waitForURL("/login")
    expect(page.url()).toContain("/login")
  })

  test("protected route /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("protected route /professors redirects to login", async ({ page }) => {
    await page.goto("/professors")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })

  test("protected route /payments redirects to login", async ({ page }) => {
    await page.goto("/payments")
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain("/login")
  })
})
