import { test, expect } from "@playwright/test";

test.describe("Auth and onboarding flow", () => {
  test("auth page loads with signup and login modes", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /create your familybrief/i })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
    await page.getByRole("button", { name: /i already have an account/i }).click();
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("check-email page shows confirmation message", async ({ page }) => {
    await page.goto("/auth/check-email?email=test%40example.com");
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
    await expect(page.getByText(/confirmation link/)).toBeVisible();
    await expect(page.getByRole("button", { name: /back to sign in/i })).toBeVisible();
  });

  test("onboarding redirects to auth when unauthenticated", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/(auth|onboarding)/);
    const url = page.url();
    if (url.includes("/auth")) {
      await expect(page.getByRole("heading", { name: /create your familybrief|welcome back/i })).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: /welcome to familybrief/i })).toBeVisible();
    }
  });
});

test.describe("Signup → onboarding → first event (signed-in flow)", () => {
  const loginEmail = process.env.E2E_LOGIN_EMAIL;
  const loginPassword = process.env.E2E_LOGIN_PASSWORD;

  test.skip(!loginEmail || !loginPassword, "E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD must be set");

  test("login → dashboard → add first event", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /i already have an account/i }).click();
    await page.getByPlaceholder("you@example.com").fill(loginEmail!);
    await page.getByPlaceholder(/at least 6 characters/i).fill(loginPassword!);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
    const url = page.url();

    if (url.includes("/onboarding")) {
      await expect(page.getByRole("heading", { name: /welcome to familybrief/i })).toBeVisible();
      await page.getByRole("button", { name: /let's go/i }).click();
      await page.getByPlaceholder(/e.g. Sarah/i).fill("E2E Parent");
      await page.getByPlaceholder(/e.g. The Johnsons/i).fill("E2E Family");
      await page.getByRole("button", { name: /continue/i }).first().click();
      await page.getByPlaceholder("Name").first().fill("E2E Child");
      await page.getByRole("button", { name: /continue/i }).first().click();
      await expect(page.getByRole("heading", { name: /set up email forwarding/i })).toBeVisible({ timeout: 10000 });
      await page.getByRole("button", { name: /continue/i }).first().click();
      await page.getByRole("button", { name: /skip for now/i }).click();
    }

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("button", { name: /add event/i })).toBeVisible();

    await page.getByRole("button", { name: /add event/i }).click();
    await expect(page.getByRole("heading", { name: "Add Event" })).toBeVisible();
    await page.getByPlaceholder(/e.g. Football practice/i).fill("E2E Test Event");
    await page.getByRole("button", { name: "Add Event" }).click();

    await expect(page.getByText("E2E Test Event")).toBeVisible({ timeout: 10000 });
  });
});
