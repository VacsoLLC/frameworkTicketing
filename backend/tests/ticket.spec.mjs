import { test, expect } from "@playwright/test";
// get the env
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

loadEnv();

test.use({
  ignoreHTTPSErrors: true,
});

test("login", async ({ page }) => {
  await login(page);
});

test("create ticket", async ({ page }) => {
  await login(page);

  await page.getByLabel("Create Ticket").locator("a").click();

  await textField(page, "subject", "Test2");
  await textField(page, "body", "Test Body");
  await selectDropdown(page, "group", "Helpdesk");
  await selectDropdown(page, "assignedTo", "Bob Resolver");
  await clickButton(page, "Create");
  await checkAlert(page, "Record created successfully. ID:");

  await textField(page, "body", "Test Body asdf");
  await clickButton(page, "Update");
  await checkAlert(page, "Update completed successfully");

  await selectDropdown(page, "requester", "System");
  await clickButton(page, "Update");
  await checkAlert(page, "Update completed successfully");
});

async function textField(page, field, value) {
  await page.fill(`#${field}`, value);
}

async function selectDropdown(page, field, option) {
  await page.locator(`#${field} .p-dropdown-trigger`).click();
  await page
    .locator(`.p-dropdown-panel .p-dropdown-item:has-text("${option}")`)
    .click();
}

async function clickButton(page, text) {
  await page.locator(`button[aria-label="${text}"]`).click();
}

async function checkAlert(page, message) {
  // Wait for the alert to appear. This is usually called by an action that triggers an alert. It may take a bit for it to pop up.
  await page.waitForTimeout(1000);
  // Create a locator for all alert elements
  const alerts = page.locator('[role="alert"]');

  // Get the count of alert elements
  const count = await alerts.count();

  let messageFound = false;

  // Iterate through each alert element
  for (let i = 0; i < count; i++) {
    // Get the text content of the alert
    const alertText = await alerts.nth(i).textContent();

    // Check if the alert contains the message
    if (alertText.includes(message)) {
      messageFound = true;

      // Click the button within the alert
      await alerts.nth(i).locator("button").click();
      break;
    }
  }

  // Assert that the message was found in at least one alert
  expect(messageFound).toBe(true);
}

async function login(page) {
  await page.goto("https://localhost:5173/");
  await page.getByLabel("Email Address").click();
  await page.getByLabel("Email Address").fill("admin");
  await page.getByLabel("Password").click();
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByText("Login successful").click();

  await expect(page.getByRole("alert")).toContainText("Login successful");
}

function loadEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const pathToEnv = join(__dirname, "../.env");
  config({ path: pathToEnv });
}
