"""
Payment tests — billing plan, order creation, verify.
"""
import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from payment import PLAN_PRICES
from tests.test_helpers import create_user_for_client


# ═══════════════════════════════════════════════════════════════════════════════
# Plan Prices (pure logic)
# ═══════════════════════════════════════════════════════════════════════════════

class TestPlanPrices:
    def test_plus_price(self):
        assert PLAN_PRICES["plus"] == 49900

    def test_pro_price(self):
        assert PLAN_PRICES["pro"] == 99900

    def test_enterprise_price(self):
        assert PLAN_PRICES["enterprise"] == 499900

    def test_prices_in_paise(self):
        """All prices should be in paise (INR * 100)."""
        for plan, price in PLAN_PRICES.items():
            assert price > 100, f"{plan} price seems too low for paise"


# ═══════════════════════════════════════════════════════════════════════════════
# Get Current Plan
# ═══════════════════════════════════════════════════════════════════════════════

class TestGetPlan:
    def test_get_plan(self, client):
        h, _ = create_user_for_client(client)
        resp = client.get("/api/billing/plan", headers=h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["plan"] == "free"
        assert "email" in data

    def test_get_plan_unauthenticated(self, client):
        resp = client.get("/api/billing/plan")
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# Create Order
# ═══════════════════════════════════════════════════════════════════════════════

class TestCreateOrder:
    def test_create_order_no_razorpay(self, client):
        """Should return 503 when Razorpay is not configured."""
        h, _ = create_user_for_client(client)
        resp = client.post("/api/billing/create-order", json={
            "plan_id": "pro"
        }, headers=h)
        # Without Razorpay keys, should fail (500 or 503)
        assert resp.status_code in (500, 503)

    def test_create_order_invalid_plan(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/billing/create-order", json={
            "plan_id": "invalid_plan"
        }, headers=h)
        assert resp.status_code == 400

    def test_create_order_same_plan_rejected(self, client):
        h, _ = create_user_for_client(client)
        resp = client.post("/api/billing/create-order", json={
            "plan_id": "free"
        }, headers=h)
        assert resp.status_code == 400

    def test_create_order_unauthenticated(self, client):
        resp = client.post("/api/billing/create-order", json={"plan_id": "pro"})
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# Verify Payment
# ═══════════════════════════════════════════════════════════════════════════════

class TestVerifyPayment:
    def test_verify_no_razorpay(self, client):
        """Should return 503 when Razorpay is not configured."""
        h, _ = create_user_for_client(client)
        resp = client.post("/api/billing/verify", json={
            "razorpay_order_id": "order_xxx",
            "razorpay_payment_id": "pay_xxx",
            "razorpay_signature": "sig_xxx",
            "plan_id": "pro",
        }, headers=h)
        assert resp.status_code in (400, 503)

    def test_verify_invalid_plan(self, client):
        """Invalid plan_id should return 400, even without Razorpay configured."""
        h, _ = create_user_for_client(client)
        resp = client.post("/api/billing/verify", json={
            "razorpay_order_id": "order_xxx",
            "razorpay_payment_id": "pay_xxx",
            "razorpay_signature": "sig_xxx",
            "plan_id": "invalid",
        }, headers=h)
        assert resp.status_code == 400

    def test_verify_unauthenticated(self, client):
        resp = client.post("/api/billing/verify", json={
            "razorpay_order_id": "order_xxx",
            "razorpay_payment_id": "pay_xxx",
            "razorpay_signature": "sig_xxx",
            "plan_id": "pro",
        })
        assert resp.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════════
# Verify Payment with Mocked Razorpay
# ═══════════════════════════════════════════════════════════════════════════════

class TestVerifyPaymentMocked:
    """Tests that mock the Razorpay client to simulate real payment flows."""

    @patch("payment.rzp_client")
    def test_verify_invalid_signature_rejected(self, mock_rzp, client):
        """Payment with invalid signature should be rejected with 400."""
        h, _ = create_user_for_client(client)

        # Mock order.create to return a fake order
        mock_order = MagicMock()
        mock_order.__getitem__.side_effect = {
            "id": "order_mock_123",
            "amount": 99900,
            "currency": "INR",
        }.__getitem__
        mock_rzp.order.create.return_value = mock_order

        # Create the order first (stores in _pending_orders)
        client.post("/api/billing/create-order", json={"plan_id": "pro"}, headers=h)

        # Mock verify_payment_signature to raise (invalid sig)
        mock_rzp.utility.verify_payment_signature.side_effect = Exception("Invalid signature")

        resp = client.post("/api/billing/verify", json={
            "razorpay_order_id": "order_mock_123",
            "razorpay_payment_id": "pay_mock_456",
            "razorpay_signature": "bad_signature",
            "plan_id": "pro",
        }, headers=h)

        assert resp.status_code == 400
        assert "signature" in resp.json()["message"].lower()

    @patch("payment.rzp_client")
    def test_verify_success(self, mock_rzp, client):
        """Valid payment should upgrade plan to pro."""
        h, email = create_user_for_client(client)

        # Mock order.create
        mock_order = MagicMock()
        mock_order.__getitem__.side_effect = {
            "id": "order_success_1",
            "amount": 99900,
            "currency": "INR",
        }.__getitem__
        mock_rzp.order.create.return_value = mock_order

        # Create order
        client.post("/api/billing/create-order", json={"plan_id": "pro"}, headers=h)

        # Mock verify_payment_signature (valid)
        mock_rzp.utility.verify_payment_signature.return_value = True

        # Mock payment.fetch
        mock_payment = MagicMock()
        mock_payment.get.side_effect = {
            "amount": 99900,
            "status": "captured",
        }.get
        mock_rzp.payment.fetch.return_value = mock_payment

        # Verify payment
        resp = client.post("/api/billing/verify", json={
            "razorpay_order_id": "order_success_1",
            "razorpay_payment_id": "pay_success_1",
            "razorpay_signature": "valid_sig",
            "plan_id": "pro",
        }, headers=h)

        assert resp.status_code == 200
        data = resp.json()
        assert data["plan"] == "pro"
        assert data["status"] == "success"

    @patch("payment.rzp_client")
    def test_verify_expired_order_rejected(self, mock_rzp, client):
        """Expired order should be rejected even with valid signature."""
        h, _ = create_user_for_client(client)

        # Mock order.create
        mock_order = MagicMock()
        mock_order.__getitem__.side_effect = {
            "id": "order_expired_1",
            "amount": 99900,
            "currency": "INR",
        }.__getitem__
        mock_rzp.order.create.return_value = mock_order

        # Create order
        client.post("/api/billing/create-order", json={"plan_id": "pro"}, headers=h)

        # Manually expire the order by manipulating _pending_orders
        import payment as pay_mod
        with pay_mod._pending_orders_lock:
            if "order_expired_1" in pay_mod._pending_orders:
                pay_mod._pending_orders["order_expired_1"]["created_at"] = 0  # expired

        mock_rzp.utility.verify_payment_signature.return_value = True

        resp = client.post("/api/billing/verify", json={
            "razorpay_order_id": "order_expired_1",
            "razorpay_payment_id": "pay_expired_1",
            "razorpay_signature": "valid_sig",
            "plan_id": "pro",
        }, headers=h)

        assert resp.status_code == 400
        assert "expired" in resp.json()["message"].lower()
