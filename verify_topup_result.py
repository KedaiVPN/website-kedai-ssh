import time
import base64
import json
from playwright.sync_api import Page, expect, sync_playwright

def create_dummy_token():
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "id": "1",
        "username": "user",
        "email": "user@example.com",
        "role": "member",
        "phoneNumber": "+628123456789",  # Added phone number
        "exp": 9999999999
    }

    def encode(data):
        return base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")

    return f"{encode(header)}.{encode(payload)}.dummy_signature"

def test_topup_result(page: Page):
    # Set up authentication
    token = create_dummy_token()

    # Go to homepage first to set localStorage
    page.goto("http://localhost:3000")
    page.evaluate(f"localStorage.setItem('auth_token', '{token}')")

    # Mock the API response
    def handle_status(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body='''{
                "success": true,
                "data": {
                    "reference": "T12345",
                    "status": "PAID",
                    "amountNet": 10000,
                    "amountGross": 10000,
                    "paymentMethod": "QRIS",
                    "newToken": null
                }
            }'''
        )

    # Intercept the API call
    page.route("**/api/topup/status/T12345", handle_status)
    page.route("**/api/topup/status/MERCH123", handle_status)

    # Test 1: Navigation with reference param
    print("Testing with reference param...")
    page.goto("http://localhost:3000/topup/result?reference=T12345")

    # Expect to see success message
    expect(page.get_by_text("Topup Berhasil!")).to_be_visible(timeout=10000)
    expect(page.get_by_text("Detail Transaksi")).to_be_visible()
    expect(page.get_by_text("T12345")).to_be_visible()

    # Screenshot 1
    page.screenshot(path="/home/jules/verification/result_reference.png")
    print("Screenshot saved: result_reference.png")

    # Test 2: Navigation with merchant_ref param
    print("Testing with merchant_ref param...")
    page.goto("http://localhost:3000/topup/result?merchant_ref=MERCH123")

    # Expect to see success message
    expect(page.get_by_text("Topup Berhasil!")).to_be_visible(timeout=10000)

    # Screenshot 2
    page.screenshot(path="/home/jules/verification/result_merchant_ref.png")
    print("Screenshot saved: result_merchant_ref.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_topup_result(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="/home/jules/verification/failure.png")
        finally:
            browser.close()
