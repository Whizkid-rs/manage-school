import { test, expect } from "@playwright/test"
import path from "path"

const ADMIN_FILE = path.join(__dirname, "fixtures/admin.json")
const PROFESSOR_FILE = path.join(__dirname, "fixtures/professor.json")
const STUDENT_FILE = path.join(__dirname, "fixtures/student.json")

// Helper: get the URL of a course by code from the list
async function getCourseUrl(page: any, code: string) {
  await page.goto("/courses")
  const link = page.getByRole("link", { name: code }).first()
  const href = await link.getAttribute("href")
  return href as string
}

test.describe("Courses list — Admin", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows courses table with seed data", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible()
    await expect(page.getByRole("link", { name: "MATH101" }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: "PHYS101" }).first()).toBeVisible()
  })

  test("shows New Course button for admin", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("link", { name: /New Course/ })).toBeVisible()
  })

  test("shows Edit links per row for admin", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("link", { name: "Edit" }).first()).toBeVisible()
  })

  test("shows enrolled count and max students", async ({ page }) => {
    await page.goto("/courses")
    // rows have pattern like "3 / 30"
    await expect(page.getByText(/\/ \d+/).first()).toBeVisible()
  })
})

test.describe("Courses list — Professor role", () => {
  test.use({ storageState: PROFESSOR_FILE })

  test("can view courses list", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible()
  })

  test("does not show New Course button", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("link", { name: /New Course/ })).not.toBeVisible()
  })

  test("does not show Edit links", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("link", { name: "Edit" })).not.toBeVisible()
  })
})

test.describe("Courses list — Student role", () => {
  test.use({ storageState: STUDENT_FILE })

  test("can view courses list", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible()
  })

  test("does not show New Course button", async ({ page }) => {
    await page.goto("/courses")
    await expect(page.getByRole("link", { name: /New Course/ })).not.toBeVisible()
  })
})

test.describe("Create course", () => {
  test.use({ storageState: ADMIN_FILE })

  test("form renders all fields", async ({ page }) => {
    await page.goto("/courses/new")
    await expect(page.getByRole("textbox", { name: "Course Code" })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Course Name" })).toBeVisible()
    await expect(page.getByRole("spinbutton", { name: "Credits" })).toBeVisible()
    await expect(page.getByRole("spinbutton", { name: "Max Students" })).toBeVisible()
  })

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/courses/new")
    await page.getByLabel("Course Code").fill("")
    await page.getByRole("button", { name: "Create Course" }).click()
    await expect(page.getByText("Course code is required")).toBeVisible()
  })

  test("creates a course and redirects to list", async ({ page }) => {
    const code = `TEST${Date.now().toString().slice(-5)}`
    await page.goto("/courses/new")
    await page.getByRole("textbox", { name: "Course Code" }).fill(code)
    await page.getByRole("textbox", { name: "Course Name" }).fill("Test Course Name")
    await page.getByRole("spinbutton", { name: "Credits" }).fill("3")
    await page.getByRole("spinbutton", { name: "Max Students" }).fill("25")
    await page.getByRole("button", { name: "Create Course" }).click()
    await page.waitForURL("/courses")
    await expect(page.getByRole("link", { name: code }).first()).toBeVisible()
  })
})

test.describe("Course detail page — Admin", () => {
  test.use({ storageState: ADMIN_FILE })

  test("shows course details with stat cards", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await expect(page.getByText("MATH101")).toBeVisible()
    await expect(page.getByText("Credits")).toBeVisible()
    await expect(page.getByText("Enrolled").first()).toBeVisible()
    await expect(page.getByText("Professors").first()).toBeVisible()
  })

  test("shows assigned professors", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await expect(page.getByText("Assigned Professors")).toBeVisible()
    await expect(page.getByRole("link", { name: "John Smith" })).toBeVisible()
  })

  test("shows enrolled students table", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await expect(page.getByText(/Students/)).toBeVisible()
  })

  test("shows Enroll Student button for admin", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await expect(page.getByRole("link", { name: /Enroll Student/ })).toBeVisible()
  })

  test("edit button navigates to edit form", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await page.getByRole("link", { name: "Edit" }).click()
    await expect(page.getByRole("textbox", { name: "Course Name" })).toHaveValue("Introduction to Calculus")
  })
})

test.describe("Course detail page — Student role", () => {
  test.use({ storageState: STUDENT_FILE })

  test("can view course details", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await expect(page.getByText("MATH101")).toBeVisible()
  })

  test("does not show Enroll Student button", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await expect(page.getByRole("link", { name: /Enroll Student/ })).not.toBeVisible()
  })

  test("does not show Edit button", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(url)
    await expect(page.getByRole("link", { name: "Edit" })).not.toBeVisible()
  })
})

test.describe("Edit course", () => {
  test.use({ storageState: ADMIN_FILE })

  test("pre-fills form with existing data", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(`${url}/edit`)
    await expect(page.getByRole("textbox", { name: "Course Name" })).toHaveValue("Introduction to Calculus")
    await expect(page.getByRole("textbox", { name: "Course Code" })).toBeDisabled()
  })

  test("saves changes and redirects to list", async ({ page }) => {
    const url = await getCourseUrl(page, "PHYS101")
    await page.goto(`${url}/edit`)
    await page.getByLabel("Max Students").fill("40")
    await page.getByRole("button", { name: "Save Changes" }).click()
    await page.waitForURL("/courses")
    await expect(page.getByRole("link", { name: "PHYS101" }).first()).toBeVisible()
  })
})

test.describe("Enroll student", () => {
  test.use({ storageState: ADMIN_FILE })

  test("enroll page shows student dropdown", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(`${url}/enroll`)
    await expect(page.getByText("Enroll Student")).toBeVisible()
    await expect(page.getByLabel("Student")).toBeVisible()
  })

  test("shows error when no student selected", async ({ page }) => {
    const url = await getCourseUrl(page, "MATH101")
    await page.goto(`${url}/enroll`)
    await page.getByRole("button", { name: "Enroll" }).click()
    await expect(page.getByText("Please select a student")).toBeVisible()
  })
})
