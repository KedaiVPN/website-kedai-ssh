import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Login
        page.goto("http://localhost:8080/login")
        page.get_by_label("Email").fill("user@example.com")
        page.get_by_label("Password").fill("password")
        page.get_by_role("button", name="Masuk", exact=True).click()
        expect(page).to_have_url("http://localhost:8080/dashboard")

        # Navigate to XL page
        page.goto("http://localhost:8080/dashboard/xl")

        # Open purchase dialog
        page.get_by_role("button", name="Beli").first.click()

        # Fill in phone number and select payment method
        page.get_by_label("Nomor HP").fill("6281234567890")
        page.get_by_label("Pilih Pembayaran").click()
        page.get_by_role("option", name="DANA").click()

        # Click purchase
        page.get_by_role("button", name="Beli").click()

        # Wait for the success message
        expect(page.get_by_text("Pembelian berhasil!")).to_be_visible()

        # Take screenshot
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)