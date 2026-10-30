import concurrent.futures
import pytest
from decimal import Decimal

def test_concurrent_debits_prevent_double_spending(client):
    """
    Race Condition & Double Spending Prevention Test:
    Account has 100.00.
    10 concurrent threads each attempt to debit 60.00 simultaneously.
    If unsynchronized, multiple debits could succeed (balance < 0).
    With our locking engine, exactly 1 debit must succeed and 9 must be rejected.
    Final balance must be exactly 40.00.
    """
    acc = client.post("/api/v1/accounts", json={"name": "Race Tester"}).json()
    acc_id = acc["id"]

    # Seed with 100.00
    client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
        "type": "credit", "amount": 100.00, "description": "Seed 100", "reference_id": "CONCUR-SEED"
    })

    def attempt_debit(thread_idx: int):
        return client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
            "type": "debit",
            "amount": 60.00,
            "description": f"Concurrent debit {thread_idx}",
            "reference_id": f"THREAD-TX-{thread_idx}"
        })

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(attempt_debit, i) for i in range(10)]
        responses = [f.result() for f in futures]

    successes = [r for r in responses if r.status_code == 201]
    rejections = [r for r in responses if r.status_code == 400]

    assert len(successes) == 1, f"Expected exactly 1 success, got {len(successes)}"
    assert len(rejections) == 9, f"Expected 9 rejections, got {len(rejections)}"

    # Check final balance
    bal = client.get(f"/api/v1/accounts/{acc_id}/balance").json()
    assert Decimal(str(bal["balance"])) == Decimal("40.0000")

    # Run audit check
    audit = client.get(f"/api/v1/accounts/{acc_id}/audit").json()
    assert audit["is_reconciled"] is True
    assert Decimal(str(audit["drift"])) == Decimal("0.0000")

def test_concurrent_duplicate_reference_burst(client):
    """
    Idempotency Burst Test:
    10 concurrent threads fire the EXACT same transaction payload with the same reference_id.
    Exactly 1 must succeed; 9 must return 409 Conflict.
    Account balance must only increment once.
    """
    acc = client.post("/api/v1/accounts", json={"name": "Idempotency Tester"}).json()
    acc_id = acc["id"]

    def fire_same_tx():
        return client.post(f"/api/v1/accounts/{acc_id}/transactions", json={
            "type": "credit",
            "amount": 50.00,
            "description": "Burst Deposit",
            "reference_id": "BURST-IDEM-KEY-999"
        })

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(fire_same_tx) for _ in range(10)]
        responses = [f.result() for f in futures]

    successes = [r for r in responses if r.status_code == 201]
    conflicts = [r for r in responses if r.status_code == 409]

    assert len(successes) == 1
    assert len(conflicts) == 9

    bal = client.get(f"/api/v1/accounts/{acc_id}/balance").json()
    assert Decimal(str(bal["balance"])) == Decimal("50.0000")

def test_concurrent_bidirectional_transfers_no_deadlock(client):
    """
    Deadlock Elimination Test:
    Account A has 200, Account B has 200.
    10 threads transfer 10 from A -> B.
    10 threads transfer 10 from B -> A.
    All 20 run concurrently.
    Deterministic lock ordering ensures zero deadlocks.
    """
    acc_a = client.post("/api/v1/accounts", json={"name": "Node A"}).json()["id"]
    acc_b = client.post("/api/v1/accounts", json={"name": "Node B"}).json()["id"]

    client.post(f"/api/v1/accounts/{acc_a}/transactions", json={
        "type": "credit", "amount": 200.00, "description": "Seed A", "reference_id": "SEED-A-CONC"
    })
    client.post(f"/api/v1/accounts/{acc_b}/transactions", json={
        "type": "credit", "amount": 200.00, "description": "Seed B", "reference_id": "SEED-B-CONC"
    })

    def transfer_a_to_b(idx):
        return client.post("/api/v1/transfers", json={
            "source_account_id": acc_a,
            "destination_account_id": acc_b,
            "amount": 10.00,
            "reference_id": f"XFER-A-B-{idx}",
            "description": f"A to B {idx}"
        })

    def transfer_b_to_a(idx):
        return client.post("/api/v1/transfers", json={
            "source_account_id": acc_b,
            "destination_account_id": acc_a,
            "amount": 10.00,
            "reference_id": f"XFER-B-A-{idx}",
            "description": f"B to A {idx}"
        })

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        f_ab = [executor.submit(transfer_a_to_b, i) for i in range(10)]
        f_ba = [executor.submit(transfer_b_to_a, i) for i in range(10)]
        all_futures = f_ab + f_ba
        responses = [f.result() for f in all_futures]

    successes = [r for r in responses if r.status_code == 201]
    assert len(successes) == 20

    # Net change: 10 * 10 sent and 10 * 10 received = 200 each!
    bal_a = client.get(f"/api/v1/accounts/{acc_a}/balance").json()
    bal_b = client.get(f"/api/v1/accounts/{acc_b}/balance").json()
    assert Decimal(str(bal_a["balance"])) == Decimal("200.0000")
    assert Decimal(str(bal_b["balance"])) == Decimal("200.0000")
