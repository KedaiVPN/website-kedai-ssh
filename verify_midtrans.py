from playwright.sync_api import Page, expect, sync_playwright
import time
import base64
import json

def verify_midtrans(page: Page):
    print("Preparing verification...")

    # Generate a dummy JWT
    header = base64.b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip('=')
    # exp = now + 1 hour
    exp = int(time.time()) + 3600
    payload_data = {"id": 1, "username": "testuser", "email": "test@example.com", "role": "member", "iat": 1516239022, "exp": exp}
    payload = base64.b64encode(json.dumps(payload_data).encode()).decode().rstrip('=')
    signature = "dummy_signature"
    token = f"{header}.{payload}.{signature}"

    # Go to a page (even 404) to set localStorage
    page.goto("http://127.0.0.1:8080/login")
    page.evaluate(f"localStorage.setItem('auth_token', '{token}')")
    print(f"Injected token: {token}")

    # Mock Config Endpoint for MIDTRANS
    page.route("**/api/topup/config", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"success": true, "gateway": "MIDTRANS", "clientKey": "SB-Mid-client-mock", "isProduction": false}'
    ))

    # Mock Topup History
    page.route("**/api/topup/history*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"success": true, "data": []}'
    ))

    # Go to Topup
    print("Navigating to Topup page...")
    page.goto("http://127.0.0.1:8080/topup")

    # Wait for page load
    page.wait_for_load_state("networkidle")

    # Check if we are still on login page (redirected)
    if "login" in page.url:
        print("Still redirected to login. Auth injection might have failed.")
    else:
        print("Successfully on Topup page.")

    print("Taking screenshot of Midtrans UI...")
    page.screenshot(path="/home/jules/verification/topup_midtrans.png")

    # Verify Midtrans UI element
    try:
        expect(page.get_by_text("Pembayaran Otomatis via Midtrans")).to_be_visible(timeout=5000)
        print("Midtrans UI detected.")
    except Exception as e:
        print("Midtrans UI NOT detected.")

    # Now Mock Config Endpoint for TRIPAY
    print("Switching to Tripay mock...")
    page.unroute("**/api/topup/config")
    page.route("**/api/topup/config", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"success": true, "gateway": "TRIPAY"}'
    ))

    page.reload()
    page.wait_for_load_state("networkidle")

    print("Taking screenshot of Tripay UI...")
    page.screenshot(path="/home/jules/verification/topup_tripay.png")

    try:
        expect(page.get_by_text("Metode Pembayaran")).to_be_visible(timeout=5000)
        print("Tripay UI detected.")
    except Exception as e:
        print("Tripay UI NOT detected.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_midtrans(page)
        finally:
            browser.close()
