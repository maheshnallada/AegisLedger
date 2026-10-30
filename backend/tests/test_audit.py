import pytest
from decimal import Decimal

@pytest.fixture
def account_with_ledger_entries(client):
    acc = client.post("/api/v1/accounts", json={"name": "Audit Customer"}).json()
    acc_id = acc["id"]

    # Match Section 5 Balance Consistency example exactly:
    # Initial: 0
    # Credit: 100
    # Credit: 50
    # Debit: 30
    # Debit: 20
    # Final balance: 100
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "credit", "amount": 100.00, "description": "Deposit 1", "reference_id": "AUDIT-1"
    })
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "credit", "amount": 50.00, "description": "Deposit 2", "reference_id": "AUDIT-2"
    })
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "debit", "amount": 30.00, "description": "Withdrawal 1", "reference_id": "AUDIT-3"
    })
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "debit", "amount": 20.00, "description": "Withdrawal 2", "reference_id": "AUDIT-4"
    })

    # Failed debit (overdraft attempt) - must NOT affect balance or audit
    failed_res = client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "debit", "amount": 500.00, "description": "Rejected overdraft", "reference_id": "AUDIT-REJECTED"
    })
    assert failed_res.status_code == 400

    return acc_id

def test_audit_reconciliation_exact_match(client, account_with_ledger_entries):
    acc_id = account_with_ledger_entries
    res = client.get(f"/api/v1/accounts/{acc_id}/audit")
    assert res.status_code == 200
    data = res.json()

    assert data["account_id"] == acc_id
    assert Decimal(str(data["cached_balance"])) == Decimal("100.0000")
    assert Decimal(str(data["total_credits"])) == Decimal("150.0000")
    assert Decimal(str(data["total_debits"])) == Decimal("50.0000")
    assert Decimal(str(data["computed_balance"])) == Decimal("100.0000")
    assert Decimal(str(data["drift"])) == Decimal("0.0000")
    assert data["is_reconciled"] is True
    assert data["total_transactions"] == 4

def test_audit_non_existent_account(client):
    res = client.get("/api/v1/accounts/non-existent-account-id/audit")
    assert res.status_code == 404
    err = res.json()
    assert err["success"] is False
    assert err["error"]["code"] == "ACCOUNT_NOT_FOUND"

def test_validation_error_format(client):
    # Missing required 'name' field
    res = client.post("/api/v1/accounts", json={})
    assert res.status_code == 422
    err = res.json()
    assert err["success"] is False
    assert err["error"]["code"] == "VALIDATION_ERROR"
    assert "name" in str(err["error"]["details"])

