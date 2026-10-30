import pytest
from decimal import Decimal

@pytest.fixture
def funded_account_pair(client):
    acc_a = client.post("/api/v1/accounts", json={"name": "Sender A"}).json()["id"]
    acc_b = client.post("/api/v1/accounts", json={"name": "Receiver B"}).json()["id"]

    # Fund account A with 100
    client.post(f"/api/v1/accounts/{acc_a}/transactions", json={
        "type": "credit", "amount": 100.00, "description": "Seed A", "reference_id": "SEED-A"
    })
    # Fund account B with 50
    client.post(f"/api/v1/accounts/{acc_b}/transactions", json={
        "type": "credit", "amount": 50.00, "description": "Seed B", "reference_id": "SEED-B"
    })
    return acc_a, acc_b

def test_money_transfer_success_and_atomicity(client, funded_account_pair):
    acc_a, acc_b = funded_account_pair
    # Transfer 30 from A to B (matches PDF example)
    res = client.post("/api/v1/transfers", json={
        "source_account_id": acc_a,
        "destination_account_id": acc_b,
        "amount": 30.00,
        "reference_id": "XFER-001",
        "description": "Payment for lunch"
    })
    assert res.status_code == 201
    transfer = res.json()
    assert transfer["source_account_id"] == acc_a
    assert transfer["destination_account_id"] == acc_b
    assert Decimal(str(transfer["amount"])) == Decimal("30.0000")
    assert transfer["reference_id"] == "XFER-001"

    # Verify Account A balance: 100 - 30 = 70
    bal_a = client.get(f"/api/v1/accounts/{acc_a}/balance").json()
    assert Decimal(str(bal_a["balance"])) == Decimal("70.0000")

    # Verify Account B balance: 50 + 30 = 80
    bal_b = client.get(f"/api/v1/accounts/{acc_b}/balance").json()
    assert Decimal(str(bal_b["balance"])) == Decimal("80.0000")

    # Verify debit transaction logged for A
    history_a = client.get(f"/api/v1/accounts/{acc_a}/transactions").json()
    assert any(tx["type"] == "debit" and Decimal(str(tx["amount"])) == Decimal("30.0000") for tx in history_a["items"])

    # Verify credit transaction logged for B
    history_b = client.get(f"/api/v1/accounts/{acc_b}/transactions").json()
    assert any(tx["type"] == "credit" and Decimal(str(tx["amount"])) == Decimal("30.0000") for tx in history_b["items"])

def test_transfer_insufficient_funds_rolls_back_completely(client, funded_account_pair):
    acc_a, acc_b = funded_account_pair
    # Attempt to transfer 150 from A (A only has 100)
    res = client.post("/api/v1/transfers", json={
        "source_account_id": acc_a,
        "destination_account_id": acc_b,
        "amount": 150.00,
        "reference_id": "XFER-OVERDRAFT",
        "description": "Overdraft attempt"
    })
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INSUFFICIENT_FUNDS"

    # Verify balances completely unaffected: A=100, B=50
    bal_a = client.get(f"/api/v1/accounts/{acc_a}/balance").json()
    bal_b = client.get(f"/api/v1/accounts/{acc_b}/balance").json()
    assert Decimal(str(bal_a["balance"])) == Decimal("100.0000")
    assert Decimal(str(bal_b["balance"])) == Decimal("50.0000")

def test_transfer_to_non_existent_destination(client, funded_account_pair):
    acc_a, _ = funded_account_pair
    res = client.post("/api/v1/transfers", json={
        "source_account_id": acc_a,
        "destination_account_id": "non-existent-account",
        "amount": 20.00,
        "reference_id": "XFER-GHOST",
        "description": "To ghost"
    })
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "ACCOUNT_NOT_FOUND"

    # Balance of A unchanged
    bal_a = client.get(f"/api/v1/accounts/{acc_a}/balance").json()
    assert Decimal(str(bal_a["balance"])) == Decimal("100.0000")

def test_transfer_from_non_existent_source(client, funded_account_pair):
    _, acc_b = funded_account_pair
    res = client.post("/api/v1/transfers", json={
        "source_account_id": "non-existent-account",
        "destination_account_id": acc_b,
        "amount": 20.00,
        "reference_id": "XFER-GHOST-SRC",
        "description": "From ghost"
    })
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "ACCOUNT_NOT_FOUND"

def test_self_transfer_rejected(client, funded_account_pair):
    acc_a, _ = funded_account_pair
    res = client.post("/api/v1/transfers", json={
        "source_account_id": acc_a,
        "destination_account_id": acc_a,
        "amount": 10.00,
        "reference_id": "XFER-SELF",
        "description": "Self transfer"
    })
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "SELF_TRANSFER_PROHIBITED"

def test_duplicate_transfer_reference_id_rejected(client, funded_account_pair):
    acc_a, acc_b = funded_account_pair
    res1 = client.post("/api/v1/transfers", json={
        "source_account_id": acc_a,
        "destination_account_id": acc_b,
        "amount": 20.00,
        "reference_id": "XFER-DUP",
        "description": "First run"
    })
    assert res1.status_code == 201

    res2 = client.post("/api/v1/transfers", json={
        "source_account_id": acc_a,
        "destination_account_id": acc_b,
        "amount": 20.00,
        "reference_id": "XFER-DUP",
        "description": "Replay run"
    })
    assert res2.status_code == 409
    assert res2.json()["error"]["code"] == "DUPLICATE_TRANSACTION"
