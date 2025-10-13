from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Login as admin
        page.goto("http://localhost:8080/admin")
        page.get_by_label("Username").fill("admin")
        page.get_by_label("Password").fill("admin_password_123")
        page.get_by_role("button", name="Login").click()
        expect(page).to_have_url("http://localhost:8080/admin/dashboard")

        # Navigate to XL Packages tab
        page.get_by_role("tab", name="XL Packages").click()

        # Click the sync button
        page.get_by_role("button", name="Sinkronkan Paket dari Provider").click()

        # Wait for the dialog to appear and take a screenshot
        expect(page.get_by_role("dialog")).to_be_visible()
        expect(page.get_by_text("Sinkronkan Paket dari Provider")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/sync_modal.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)