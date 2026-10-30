import pytest
from decimal import Decimal

def test_create_account_initial_balance_zero(client):
    response = client.post("/api/v1/accounts", json={"name": "Alice Smith"})
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice Smith"
    assert Decimal(str(data["balance"])) == Decimal("0.0000")
    assert "id" in data
    assert len(data["id"]) > 10
    assert "created_at" in data

def test_client_cannot_set_initial_balance(client):
    # Attempt to tamper with initial balance
    response = client.post("/api/v1/accounts", json={"name": "Bob Tamper", "balance": 9999.99})
    assert response.status_code == 201
    data = response.json()
    # Must ignore or strip balance; balance must strictly remain 0.0000
    assert Decimal(str(data["balance"])) == Decimal("0.0000")

def test_account_creation_missing_name_fails(client):
    response = client.post("/api/v1/accounts", json={})
    assert response.status_code == 422

def test_account_creation_empty_name_fails(client):
    response = client.post("/api/v1/accounts", json={"name": "   "})
    assert response.status_code == 422

def test_get_account_balance_success(client):
    created = client.post("/api/v1/accounts", json={"name": "Charlie"}).json()
    account_id = created["id"]
    
    response = client.get(f"/api/v1/accounts/{account_id}/balance")
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == account_id
    assert Decimal(str(data["balance"])) == Decimal("0.0000")

def test_get_account_balance_not_found(client):
    response = client.get("/api/v1/accounts/non-existent-uuid/balance")
    assert response.status_code == 404
    err = response.json()
    assert err["error"]["code"] == "ACCOUNT_NOT_FOUND"

def test_list_accounts(client):
    client.post("/api/v1/accounts", json={"name": "User 1"})
    client.post("/api/v1/accounts", json={"name": "User 2"})
    
    response = client.get("/api/v1/accounts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
