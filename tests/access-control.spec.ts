import { test, expect } from "@playwright/test"
import path from "path"

const ADMIN_FILE = path.join(__dirname, "fixtures/admin.json")
const PROFESSOR_FILE = path.join(__dirname, "fixtures/professor.json")
const STUDENT_FILE = path.join(__dirname, "fixtures/student.json")

test.describe("Admin access control", () => {
  test.use({ storageState: ADMIN_FILE })

  test("can access /dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("can access /professors", async ({ page }) => {
    await page.goto("/professors")
    expect(page.url()).toContain("/professors")
  })

  test("can access /professors/new", async ({ page }) => {
    await page.goto("/professors/new")
    expect(page.url()).toContain("/professors/new")
  })

  test("can access /students", async ({ page }) => {
    await page.goto("/students")
    expect(page.url()).toContain("/students")
  })

  test("can access /payments", async ({ page }) => {
    await page.goto("/payments")
    expect(page.url()).toContain("/payments")
  })

  test("can access /timetable/manage", async ({ page }) => {
    await page.goto("/timetable/manage")
    expect(page.url()).toContain("/timetable/manage")
  })
})

test.describe("Professor access control", () => {
  test.use({ storageState: PROFESSOR_FILE })

  test("can access /dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("can access /professors (read-only list)", async ({ page }) => {
    await page.goto("/professors")
    expect(page.url()).toContain("/professors")
  })

  test("is redirected away from /professors/new", async ({ page }) => {
    await page.goto("/professors/new")
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("is redirected away from /payments", async ({ page }) => {
    await page.goto("/payments")
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("is redirected away from /timetable/manage", async ({ page }) => {
    await page.goto("/timetable/manage")
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("can access /courses", async ({ page }) => {
    await page.goto("/courses")
    expect(page.url()).toContain("/courses")
  })

  test("can access /timetable", async ({ page }) => {
    await page.goto("/timetable")
    expect(page.url()).toContain("/timetable")
  })
})

test.describe("Student access control", () => {
  test.use({ storageState: STUDENT_FILE })

  test("can access /dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("is redirected away from /professors", async ({ page }) => {
    await page.goto("/professors")
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("is redirected away from /students", async ({ page }) => {
    await page.goto("/students")
    await page.waitForURL("/dashboard")
    expect(page.url()).toContain("/dashboard")
  })

  test("can access /courses", async ({ page }) => {
    await page.goto("/courses")
    expect(page.url()).toContain("/courses")
  })

  test("can access /timetable", async ({ page }) => {
    await page.goto("/timetable")
    expect(page.url()).toContain("/timetable")
  })

  test("can access /payments (own only)", async ({ page }) => {
    await page.goto("/payments")
    expect(page.url()).toContain("/payments")
  })
})
