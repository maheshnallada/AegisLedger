import pytest
from decimal import Decimal

@pytest.fixture
def account_with_5_transactions(client):
    acc = client.post("/api/v1/accounts", json={"name": "History User"}).json()
    acc_id = acc["id"]

    # 3 credits, 2 debits
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "credit", "amount": 100.00, "description": "Tx 1 - Credit", "reference_id": "REF-H1"
    })
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "credit", "amount": 50.00, "description": "Tx 2 - Credit", "reference_id": "REF-H2"
    })
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "debit", "amount": 20.00, "description": "Tx 3 - Debit", "reference_id": "REF-H3"
    })
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "credit", "amount": 30.00, "description": "Tx 4 - Credit", "reference_id": "REF-H4"
    })
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "debit", "amount": 10.00, "description": "Tx 5 - Debit", "reference_id": "REF-H5"
    })
    return acc_id

def test_pagination_page_1_limit_2(client, account_with_5_transactions):
    acc_id = account_with_5_transactions
    res = client.get(f"/api/v1/accounts/{acc_id}/transactions?page=1&limit=2")
    assert res.status_code == 200
    data = res.json()
    assert data["current_page"] == 1
    assert data["page_size"] == 2
    assert data["total_records"] == 5
    assert data["total_pages"] == 3
    assert len(data["items"]) == 2
    # Verify latest-first ordering: latest was Tx 5
    assert data["items"][0]["reference_id"] == "REF-H5"
    assert data["items"][1]["reference_id"] == "REF-H4"

def test_pagination_page_3_last_item(client, account_with_5_transactions):
    acc_id = account_with_5_transactions
    res = client.get(f"/api/v1/accounts/{acc_id}/transactions?page=3&limit=2")
    assert res.status_code == 200
    data = res.json()
    assert data["current_page"] == 3
    assert data["page_size"] == 2
    assert data["total_records"] == 5
    assert data["total_pages"] == 3
    assert len(data["items"]) == 1
    assert data["items"][0]["reference_id"] == "REF-H1"

def test_filter_by_type_credit(client, account_with_5_transactions):
    acc_id = account_with_5_transactions
    res = client.get(f"/api/v1/accounts/{acc_id}/transactions?type=credit")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] == 3
    for item in data["items"]:
        assert item["type"] == "credit"

def test_filter_by_type_debit(client, account_with_5_transactions):
    acc_id = account_with_5_transactions
    res = client.get(f"/api/v1/accounts/{acc_id}/transactions?type=debit")
    assert res.status_code == 200
    data = res.json()
    assert data["total_records"] == 2
    for item in data["items"]:
        assert item["type"] == "debit"

def test_invalid_pagination_parameters(client, account_with_5_transactions):
    acc_id = account_with_5_transactions
    # page < 1
    res = client.get(f"/api/v1/accounts/{acc_id}/transactions?page=0")
    assert res.status_code == 422
    # limit < 1
    res = client.get(f"/api/v1/accounts/{acc_id}/transactions?limit=-5")
    assert res.status_code == 422

def test_get_history_non_existent_account(client):
    res = client.get("/api/v1/accounts/non-existent-account-id/transactions")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "ACCOUNT_NOT_FOUND"
