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

  await page
    .locator("a")
    .filter({ hasText: /^Tickets$/ })
    .click();
  await page.getByLabel("All Tickets").locator("a").click();
  await page.getByRole("button", { name: "" }).click();
  await page.getByPlaceholder("Subject or Title of the ticket").click();
  await page.getByPlaceholder("Subject or Title of the ticket").fill("Test 1");
  await page.getByPlaceholder("Body of the ticket").click();
  await page.getByPlaceholder("Body of the ticket").fill("Test Body");
  await page
    .locator("#pr_id_26_content div")
    .filter({ hasText: "Groupempty" })
    .getByRole("button")
    .first()
    .click();
  await page.getByLabel("Helpdesk").click();
  await page
    .locator("div")
    .filter({ hasText: /^empty$/ })
    .getByRole("button")
    .click();
  await page.getByLabel("Bob Resolver").getByText("Bob Resolver").click();
  await page.getByLabel("Create", { exact: true }).click();

  await checkAlert(page, "Record created successfully. ID:");

  await page.getByPlaceholder("Body of the ticket").click();
  await page.getByPlaceholder("Body of the ticket").fill("Test Body asdf");
  await page.getByLabel("Update", { exact: true }).click();
  await checkAlert(page, "Update completed successfully");

  // update the requester to system
  await page.locator('div#requester[data-pc-name="dropdown"]').click();
  await page
    .locator('span.p-dropdown-item-label[data-pc-section="itemlabel"]', {
      hasText: "System",
    })
    .click();

  await page.getByLabel("Update", { exact: true }).click();
  await checkAlert(page, "Update completed successfully");
});

async function checkAlert(page, message) {
  // Wait for the alert to appear. This is usually called by an action that triggers an alert. It may take a bit for it to pop up.
  await page.waitForTimeout(1000);
  // Create a locator for all alert elements
  const alerts = page.locator('[role="alert"]');

  // Get the count of alert elements
  const count = await alerts.count();

  let messageFound = false;

  //const test1 = await alerts.nth(0).textContent();
  //const test2 = await alerts.nth(1).textContent();
  //console.log({ test1, test2, count });

  // Iterate through each alert element
  for (let i = 0; i < count; i++) {
    // Get the text content of the alert
    const alertText = await alerts.nth(i).textContent();
    //console.log("alertText", alertText);

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
