from playwright.sync_api import sync_playwright

import time
import random
import string
from playwright.sync_api import sync_playwright

def random_string(length=10):
    """Generate a random string of fixed length."""
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Generate random user credentials
    email = f"user_{random_string()}@test.com"
    password = f"Password_{random_string()}"

    # Registration
    page.goto("http://127.0.0.1:8080/register")
    page.get_by_placeholder("nama@email.com").fill(email)
    page.get_by_placeholder("Password Anda").fill(password)
    page.get_by_placeholder("Konfirmasi password Anda").fill(password)
    page.get_by_role("button", name="Daftar").click()

    # Wait for login redirect
    page.wait_for_url("**/login")

    # Login
    page.get_by_placeholder("nama@email.com").fill(email)
    page.get_by_placeholder("Password Anda").fill(password)
    page.get_by_role("button", name="Masuk").click()

    # Wait for dashboard and navigate to xl-topup
    page.wait_for_url("**/dashboard")
    page.goto("http://127.0.0.1:8080/xl-topup")

    # Take a screenshot of the initial page
    page.screenshot(path="jules-scratch/verification/01_initial_page.png")

    # Select "Login dengan Nomor Terdaftar"
    page.get_by_role("radio", name="Login dengan Nomor Terdaftar").click()

    # Take a screenshot of the msisdn input
    page.screenshot(path="jules-scratch/verification/02_msisdn_input.png")

    # Fill in the msisdn
    page.get_by_placeholder("628xxxxx").fill("6281234567890")

    # Take a screenshot of the filled msisdn input
    page.screenshot(path="jules-scratch/verification/03_filled_msisdn_input.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)