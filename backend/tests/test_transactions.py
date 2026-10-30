import pytest
from decimal import Decimal

@pytest.fixture
def created_account_id(client):
    response = client.post("/api/v1/accounts", json={"name": "Transaction Tester"})
    assert response.status_code == 201
    return response.json()["id"]

def test_credit_increases_balance(client, created_account_id):
    # Initial balance is 0
    res = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit",
        "amount": 100.50,
        "description": "Initial Deposit",
        "reference_id": "DEP-001"
    })
    assert res.status_code == 201
    tx = res.json()
    assert tx["account_id"] == created_account_id
    assert tx["type"] == "credit"
    assert Decimal(str(tx["amount"])) == Decimal("100.5000")
    assert tx["reference_id"] == "DEP-001"
    assert "id" in tx
    assert "created_at" in tx

    # Check updated balance
    bal_res = client.get(f"/api/v1/accounts/{created_account_id}/balance")
    assert Decimal(str(bal_res.json()["balance"])) == Decimal("100.5000")

def test_debit_decreases_balance(client, created_account_id):
    # First credit 100
    client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit",
        "amount": 100.00,
        "description": "Seed money",
        "reference_id": "SEED-1"
    })
    # Then debit 30
    res = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "debit",
        "amount": 30.00,
        "description": "Coffee & Snack",
        "reference_id": "COFFEE-1"
    })
    assert res.status_code == 201
    bal_res = client.get(f"/api/v1/accounts/{created_account_id}/balance")
    assert Decimal(str(bal_res.json()["balance"])) == Decimal("70.0000")

def test_debit_insufficient_funds_rejected(client, created_account_id):
    # Credit 100
    client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit",
        "amount": 100.00,
        "description": "Seed",
        "reference_id": "SEED-2"
    })
    # Attempt to debit 150
    res = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "debit",
        "amount": 150.00,
        "description": "Expensive gadget",
        "reference_id": "GADGET-1"
    })
    assert res.status_code == 400
    err = res.json()
    assert err["error"]["code"] == "INSUFFICIENT_FUNDS"

    # Verify balance remains unchanged at 100
    bal_res = client.get(f"/api/v1/accounts/{created_account_id}/balance")
    assert Decimal(str(bal_res.json()["balance"])) == Decimal("100.0000")

def test_duplicate_reference_id_same_account_rejected(client, created_account_id):
    # First transaction with REF-DUP-1
    res1 = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit",
        "amount": 50.00,
        "description": "First try",
        "reference_id": "REF-DUP-1"
    })
    assert res1.status_code == 201

    # Second transaction with SAME REF-DUP-1
    res2 = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit",
        "amount": 50.00,
        "description": "Duplicate retry",
        "reference_id": "REF-DUP-1"
    })
    assert res2.status_code == 409
    err = res2.json()
    assert err["error"]["code"] == "DUPLICATE_TRANSACTION"

    # Balance must only have changed once: 50, not 100
    bal_res = client.get(f"/api/v1/accounts/{created_account_id}/balance")
    assert Decimal(str(bal_res.json()["balance"])) == Decimal("50.0000")

def test_same_reference_id_different_accounts_allowed(client, created_account_id):
    # Account 2
    acc2_res = client.post("/api/v1/accounts", json={"name": "Second Account"})
    acc2_id = acc2_res.json()["id"]

    # Post REF-SHARED to account 1
    res1 = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit", "amount": 25.00, "description": "Shared Ref", "reference_id": "REF-SHARED"
    })
    assert res1.status_code == 201

    # Post REF-SHARED to account 2 -> Must succeed!
    res2 = client.post(f"/api/v1/accounts/{acc2_id}/transactions", json={
        "type": "credit", "amount": 75.00, "description": "Shared Ref", "reference_id": "REF-SHARED"
    })
    assert res2.status_code == 201

def test_transaction_invalid_amount_zero_or_negative(client, created_account_id):
    res_zero = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit", "amount": 0, "description": "Zero", "reference_id": "REF-ZERO"
    })
    assert res_zero.status_code == 422

    res_neg = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "credit", "amount": -10, "description": "Negative", "reference_id": "REF-NEG"
    })
    assert res_neg.status_code == 422

def test_transaction_invalid_type(client, created_account_id):
    res = client.post(f"/api/v1/accounts/{created_account_id}/transactions", json={
        "type": "invest", "amount": 100, "description": "Invalid", "reference_id": "REF-INV"
    })
    assert res.status_code == 422

def test_transaction_non_existent_account(client):
    res = client.post("/api/v1/accounts/non-existent-account-id/transactions", json={
        "type": "credit", "amount": 100, "description": "Ghost", "reference_id": "REF-GHOST"
    })
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "ACCOUNT_NOT_FOUND"

