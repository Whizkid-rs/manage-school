import { test as setup, expect } from "@playwright/test"
import path from "path"

export const ADMIN_FILE = path.join(__dirname, "fixtures/admin.json")
export const PROFESSOR_FILE = path.join(__dirname, "fixtures/professor.json")
export const STUDENT_FILE = path.join(__dirname, "fixtures/student.json")

async function loginAs(
  page: any,
  email: string,
  password: string,
  storageFile: string
) {
  await page.goto("/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL("/dashboard")
  await page.context().storageState({ path: storageFile })
}

setup("authenticate as admin", async ({ page }) => {
  await loginAs(page, "admin@school.com", "admin123", ADMIN_FILE)
})

setup("authenticate as professor", async ({ page }) => {
  await loginAs(page, "john.smith@school.com", "prof123", PROFESSOR_FILE)
})

setup("authenticate as student", async ({ page }) => {
  await loginAs(page, "alice@student.com", "student123", STUDENT_FILE)
})
