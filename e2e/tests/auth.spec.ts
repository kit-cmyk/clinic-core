import { test, expect } from '@playwright/test';

/**
 * Auth flow E2E tests.
 *
 * These tests run against a live app (dev or staging).
 * Set E2E_STAFF_EMAIL / E2E_STAFF_PASSWORD in your environment for login tests.
 * Set E2E_BASE_URL to point at the target environment (default: http://localhost:5173).
 */

const STAFF_EMAIL    = process.env.E2E_STAFF_EMAIL    ?? 'staff@example.com';
const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD ?? 'password123';

test.describe('Login page', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('shows validation error for empty submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Either HTML5 validation or app-level error should be shown
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('notauser@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|wrong|unauthorized/i)).toBeVisible({ timeout: 8000 });
  });

  test('redirects to dashboard on successful login', async ({ page }) => {
    test.skip(!process.env.E2E_STAFF_EMAIL, 'Set E2E_STAFF_EMAIL to run this test');
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(STAFF_EMAIL);
    await page.getByLabel(/password/i).fill(STAFF_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Super admin login page', () => {
  test('renders super admin login form', async ({ page }) => {
    await page.goto('/super-admin/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});

test.describe('Protected routes', () => {
  test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user from /patients to /login', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
