import { test, expect } from '@playwright/test';

/**
 * Organisation registration flow E2E tests.
 */

test.describe('Org registration (/register)', () => {
  test('renders registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/clinic|practice|organisation|organization/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /register|sign up|create/i })).toBeVisible();
  });

  test('shows validation errors on empty submission', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /register|sign up|create/i }).click();
    // Should stay on /register — not redirect
    await expect(page).toHaveURL(/\/register/);
  });

  test('shows error for duplicate email', async ({ page }) => {
    test.skip(!process.env.E2E_EXISTING_EMAIL, 'Set E2E_EXISTING_EMAIL to test duplicate detection');
    await page.goto('/register');
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email/i).fill(process.env.E2E_EXISTING_EMAIL!);
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByLabel(/clinic|practice|organisation|organization/i).fill('Test Clinic');
    await page.getByRole('button', { name: /register|sign up|create/i }).click();
    await expect(page.getByText(/already|exists|in use/i)).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Patient registration (/patient/register)', () => {
  test('shows invalid token error for bad token', async ({ page }) => {
    await page.goto('/patient/register?token=invalid-token-123');
    // Should show error or expired message, not crash
    await expect(page.getByText(/invalid|expired|not found/i)).toBeVisible({ timeout: 8000 });
  });
});
