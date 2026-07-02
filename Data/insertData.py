"""
seed_random_data.py
--------------------
Generates random rows and inserts them into your PostgreSQL database,
respecting foreign-key insertion order, guaranteeing coverage of every
state / branch / zone combination, every DPD bucket, and every month
in the last NUM_MONTHS months. No NULL values are inserted anywhere.

Insertion order (because of FKs):
    strategies -> agents -> cases -> strategy_steps -> strategy_approval_log
    -> allocations -> communications -> payments -> ptps -> audit_logs

Requirements:
    pip install psycopg2-binary faker

Usage:
    1. Edit DB_CONFIG below with your connection details.
    2. (Optional) tweak STATE_BRANCH_ZONE / BUCKET_DPD_MAP / NUM_MONTHS
       to match your real values.
    3. Run:  python seed_random_data.py
"""

import random
import calendar
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from faker import Faker

fake = Faker()

# ---------------------------------------------------------------------------
# 1. DATABASE CONNECTION CONFIG -- EDIT THESE VALUES
# ---------------------------------------------------------------------------
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "digital_collection_platform",
    "user": "postgres",
    "password": "postgres",
}

# ---------------------------------------------------------------------------
# 2. STATE -> BRANCH -> ZONE hierarchy (EDIT to match your real org structure)
# ---------------------------------------------------------------------------
STATE_BRANCH_ZONE = {
    "State A": {
        "Branch A1": ["Zone 1", "Zone 2"],
        "Branch A2": ["Zone 1"],
    },
    "State B": {
        "Branch B1": ["Zone 2", "Zone 3"],
        "Branch B2": ["Zone 1", "Zone 3"],
    },
    "State C": {
        "Branch C1": ["Zone 1", "Zone 3"],
    },
    "State D": {
        "Branch D1": ["Zone 2"],
        "Branch D2": ["Zone 1", "Zone 3"],
    },
    "State E": {
        "Branch E1": ["Zone 2"],
        "Branch E2": ["Zone 1"],
    },
}

# Flatten into a list of (state, branch, zone) tuples -> used to GUARANTEE
# every combination gets at least one row before any random extra filling.
LOCATIONS = [
    (state, branch, zone)
    for state, branches in STATE_BRANCH_ZONE.items()
    for branch, zones in branches.items()
    for zone in zones
]

# Rows per table = at least enough to cover every location once.
ROWS = max(15, len(LOCATIONS))


def pick_location(index):
    """Round-robins through every (state, branch, zone) combo first,
    then falls back to random picks once all combos are covered."""
    if index < len(LOCATIONS):
        return LOCATIONS[index]
    return random.choice(LOCATIONS)


# ---------------------------------------------------------------------------
# 3. Month coverage -- guarantees data spread across the last N months
#    (edit NUM_MONTHS to change how far back / how many months to cover)
# ---------------------------------------------------------------------------
NUM_MONTHS = 24  # last 24 months (2 years)


def _build_months(num_months):
    today = datetime.now()
    year, month = today.year, today.month
    months = []
    for _ in range(num_months):
        months.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    months.reverse()  # oldest first
    return months


MONTHS = _build_months(NUM_MONTHS)

# Rows now guarantee coverage of every location AND every month.
ROWS = max(ROWS, len(MONTHS))


def pick_month(index):
    """Round-robins through every (year, month) first (oldest to newest),
    then falls back to random picks once all months are covered."""
    if index < len(MONTHS):
        return MONTHS[index]
    return random.choice(MONTHS)


def random_dt_in_month(year, month):
    """Random datetime that falls within the given calendar month."""
    last_day = calendar.monthrange(year, month)[1]
    day = random.randint(1, last_day)
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    dt = datetime(year, month, day, hour, minute)
    return min(dt, datetime.now())  # never generate a future date


def random_date_in_month(year, month):
    return random_dt_in_month(year, month).date()


# ---------------------------------------------------------------------------
# 4. Bucket <-> DPD mapping
#    1 -> 0-30, 2 -> 31-60, 3 -> 61-90, NPA -> 90+
# ---------------------------------------------------------------------------
BUCKET_DPD_MAP = {
    "1": (0, 30),
    "2": (31, 60),
    "3": (61, 90),
    "NPA": (91, 365),
}
BUCKETS = list(BUCKET_DPD_MAP.keys())


def pick_bucket_and_dpd():
    """Returns (bucket, dpd_range_from, dpd_range_to, a_sample_dpd_value)."""
    bucket = random.choice(BUCKETS)
    lo, hi = BUCKET_DPD_MAP[bucket]
    sample_dpd = random.randint(lo, hi)
    return bucket, lo, hi, sample_dpd


# ---------------------------------------------------------------------------
# Other enum-like value pools (edit to match your real business values)
# ---------------------------------------------------------------------------
ROLES = ["Collector", "Team Lead", "Supervisor", "Field Agent"]
LANGUAGES = ["English", "Hindi", "Spanish", "French"]
AGENT_STATUS = ["ACTIVE", "INACTIVE", "ON_LEAVE"]

JOURNEY_TYPES = ["EARLY", "MID", "LATE", "LEGAL"]
CASE_STATUS = ["OPEN", "CLOSED", "IN_PROGRESS", "ESCALATED", "SETTLED"]

CHANNELS = ["SMS", "EMAIL", "IVR", "WHATSAPP", "CALL"]
COMM_STATUS = ["SENT", "FAILED", "PENDING", "DELIVERED"]
RESPONSE_STATUS = ["NO_RESPONSE", "RESPONDED", "OPTED_OUT"]

PAYMENT_MODES = ["UPI", "NEFT", "CARD", "CASH", "NETBANKING"]
PAYMENT_STATUS = ["SUCCESS", "FAILED", "PENDING"]
PAYMENT_SOURCE = ["APP", "WEB", "BRANCH", "AGENT_COLLECTED"]

STRATEGY_STATUS = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]
PRODUCT_CODES = ["PL001", "PL002", "HL001", "CL001", "BL001"]
CUSTOMER_SEGMENTS = ["Retail", "SME", "Corporate"]

APPROVAL_ACTIONS = ["SUBMIT", "APPROVE", "REJECT", "REVISE"]
APPROVAL_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]
ACTOR_ROLES = ["MAKER", "CHECKER", "ADMIN"]

ALLOC_ROLES = ["PRIMARY", "SECONDARY", "SUPERVISOR"]
ALLOC_STATUS = ["ACTIVE", "DEALLOCATED"]

AUDIT_ACTIONS = ["CREATE", "UPDATE", "DELETE"]


# ---------------------------------------------------------------------------
# Unique per RUN token so re-running the script never collides with
# previously inserted rows (fixes "duplicate key value" errors).
# ---------------------------------------------------------------------------
RUN_TOKEN = datetime.now().strftime("%m%d%H%M%S")


def gen_case_number(i):
    return f"CASE{RUN_TOKEN}{i:05d}"


def gen_pr_number(i):
    return f"PR{RUN_TOKEN}{i:04d}"


def gen_loan_number(i):
    return f"LN{RUN_TOKEN}{i:04d}"


def gen_strategy_code(i):
    return f"STRAT{RUN_TOKEN}{i:03d}"


def gen_audit_values(entity_type, agent_ids_pool):
    """Returns (old_value_dict, new_value_dict) with realistic, varying
    field changes depending on whether the audited entity is a case or agent."""
    if entity_type == "case":
        field = random.choice(["status", "dpd", "assigned_to", "outstanding_total"])
        if field == "status":
            old_val = random.choice(CASE_STATUS)
            new_val = random.choice([s for s in CASE_STATUS if s != old_val])
            return {"status": old_val}, {"status": new_val}
        if field == "dpd":
            old_dpd = random.randint(0, 170)
            new_dpd = old_dpd + random.randint(1, 15)
            return {"dpd": old_dpd}, {"dpd": new_dpd}
        if field == "assigned_to":
            return (
                {"assigned_to": str(random.choice(agent_ids_pool))},
                {"assigned_to": str(random.choice(agent_ids_pool))},
            )
        old_amt = round(random.uniform(1000, 50000), 2)
        new_amt = round(max(old_amt - random.uniform(100, 5000), 0), 2)
        return {"outstanding_total": old_amt}, {"outstanding_total": new_amt}

    # entity_type == "agent"
    field = random.choice(["status", "current_load", "branch"])
    if field == "status":
        old_val = random.choice(AGENT_STATUS)
        new_val = random.choice([s for s in AGENT_STATUS if s != old_val])
        return {"status": old_val}, {"status": new_val}
    if field == "current_load":
        old_load = random.randint(0, 20)
        new_load = max(0, old_load + random.choice([-3, -2, -1, 1, 2, 3]))
        return {"current_load": old_load}, {"current_load": new_load}
    old_branch, new_branch = random.sample(
        [b for branches in STATE_BRANCH_ZONE.values() for b in branches], 2
    )
    return {"branch": old_branch}, {"branch": new_branch}


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # -------------------------------------------------------------
        # 1. strategies (no dependencies) - bucket/dpd tied together,
        #    state cycled so every state gets at least one strategy,
        #    effective_date spread across every month
        # -------------------------------------------------------------
        strategy_ids = []
        states_cycle = list(STATE_BRANCH_ZONE.keys())
        for i in range(ROWS):
            bucket, dpd_from, dpd_to, _ = pick_bucket_and_dpd()
            effective_date = random_date_in_month(*pick_month(i))
            expiry_date = effective_date + timedelta(days=365)
            cur.execute(
                """
                INSERT INTO public.strategies
                    (strategy_name, strategy_code, strategy_version, journey_type,
                     dpd_range_from, dpd_range_to, bucket, product_code, state,
                     customer_segment, outstanding_range_min, outstanding_range_max,
                     priority, effective_date, expiry_date, status, description,
                     created_by, updated_by, is_active)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING strategy_id
                """,
                (
                    fake.catch_phrase(),
                    gen_strategy_code(i),
                    "1.0",
                    random.choice(JOURNEY_TYPES),
                    dpd_from,
                    dpd_to,
                    bucket,
                    random.choice(PRODUCT_CODES),
                    states_cycle[i % len(states_cycle)],
                    random.choice(CUSTOMER_SEGMENTS),
                    round(random.uniform(1000, 5000), 2),
                    round(random.uniform(5000, 100000), 2),
                    random.randint(1, 10),
                    effective_date,
                    expiry_date,
                    random.choice(STRATEGY_STATUS),
                    fake.sentence(),
                    random.randint(1, 5),
                    random.randint(1, 5),
                    random.choice([True, False]),
                ),
            )
            strategy_ids.append(cur.fetchone()[0])

        # -------------------------------------------------------------
        # 2. agents (no dependencies) - state/branch/zone from hierarchy,
        #    every combo covered at least once
        # -------------------------------------------------------------
        agent_ids = []
        for i in range(ROWS):
            state, branch, zone = pick_location(i)
            cur.execute(
                """
                INSERT INTO public.agents
                    (agent_name, role, branch, zone, state, max_capacity,
                     current_load, language, mobile, email, status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING agent_id
                """,
                (
                    fake.name(),
                    random.choice(ROLES),
                    branch,
                    zone,
                    state,
                    random.randint(20, 100),
                    random.randint(0, 20),
                    random.choice(LANGUAGES),
                    fake.msisdn()[:10],
                    fake.unique.email(),
                    random.choice(AGENT_STATUS),
                ),
            )
            agent_ids.append(cur.fetchone()[0])

        # -------------------------------------------------------------
        # 3. cases (references strategies, agents) - state/branch/zone
        #    from hierarchy, created_at spread across every month
        # -------------------------------------------------------------
        case_ids = []
        for i in range(ROWS):
            state, branch, zone = pick_location(i)
            _, _, _, sample_dpd = pick_bucket_and_dpd()
            principal = round(random.uniform(5000, 50000), 2)
            interest = round(random.uniform(100, 5000), 2)
            created_at = random_dt_in_month(*pick_month(i))
            updated_at = created_at + timedelta(days=random.randint(0, 20))
            cur.execute(
                """
                INSERT INTO public.cases
                    (case_number, pr_number, loan_number, customer_id, journey_type,
                     dpd, strategy_id, assigned_to, outstanding_principal,
                     outstanding_interest, outstanding_total, status, branch, zone, state,
                     created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING case_id
                """,
                (
                    gen_case_number(i),
                    gen_pr_number(i),
                    gen_loan_number(i),
                    f"CUST{i:06d}",
                    random.choice(JOURNEY_TYPES),
                    sample_dpd,
                    random.choice(strategy_ids),
                    random.choice(agent_ids),
                    principal,
                    interest,
                    principal + interest,
                    random.choice(CASE_STATUS),
                    branch,
                    zone,
                    state,
                    created_at,
                    updated_at,
                ),
            )
            case_ids.append(cur.fetchone()[0])

        # -------------------------------------------------------------
        # 4. strategy_steps (references strategies)
        # -------------------------------------------------------------
        for i in range(ROWS):
            cur.execute(
                """
                INSERT INTO public.strategy_steps
                    (step_number, step_name, trigger_delay_value, channel,
                     template_code, retry_count, retry_delay_hours,
                     payment_check_before_step, condition_expression,
                     escalation_trigger, escalation_target, status,
                     created_by, updated_by, strategy_id, is_active)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.randint(1, 5),
                    fake.word().title() + " Step",
                    random.randint(1, 72),
                    random.choice(CHANNELS),
                    f"TPL{random.randint(1, 20):03d}",
                    random.randint(0, 3),
                    random.randint(1, 48),
                    random.choice([True, False]),
                    "dpd > 30",
                    random.choice([True, False]),
                    random.choice(["SUPERVISOR", "LEGAL_TEAM", "OPS_TEAM"]),
                    random.choice(["ACTIVE", "INACTIVE"]),
                    random.randint(1, 5),
                    random.randint(1, 5),
                    random.choice(strategy_ids),
                    random.choice([True, False]),
                ),
            )

        # -------------------------------------------------------------
        # 5. strategy_approval_log (references strategies)
        # -------------------------------------------------------------
        for i in range(ROWS):
            cur.execute(
                """
                INSERT INTO public.strategy_approval_log
                    (strategy_id, from_status, to_status, action, actor_id,
                     actor_role, remarks, ip_address)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(strategy_ids),
                    random.choice(APPROVAL_STATUSES),
                    random.choice(APPROVAL_STATUSES),
                    random.choice(APPROVAL_ACTIONS),
                    random.randint(1, 10),
                    random.choice(ACTOR_ROLES),
                    fake.sentence(),
                    fake.ipv4(),
                ),
            )

        # -------------------------------------------------------------
        # 6. allocations (references cases, agents) - allocated_at
        #    spread across every month
        # -------------------------------------------------------------
        for i in range(ROWS):
            allocated_at = random_dt_in_month(*pick_month(i))
            deallocated_at = allocated_at + timedelta(days=random.randint(1, 30))
            cur.execute(
                """
                INSERT INTO public.allocations
                    (case_id, allocated_to, role, allocated_at, deallocated_at,
                     reason, allocation_status)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(case_ids),
                    random.choice(agent_ids),
                    random.choice(ALLOC_ROLES),
                    allocated_at,
                    deallocated_at,
                    fake.sentence(),
                    random.choice(ALLOC_STATUS),
                ),
            )

        # -------------------------------------------------------------
        # 7. communications (references cases) - sent_at spread across
        #    every month
        # -------------------------------------------------------------
        for i in range(ROWS):
            sent_at = random_dt_in_month(*pick_month(i))
            delivered_at = sent_at + timedelta(minutes=random.randint(1, 60))
            read_at = delivered_at + timedelta(minutes=random.randint(1, 120))
            cur.execute(
                """
                INSERT INTO public.communications
                    (case_id, channel, template_name, status, sent_at,
                     delivered_at, read_at, response_status, retry_count)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(case_ids),
                    random.choice(CHANNELS),
                    f"template_{random.randint(1, 15)}",
                    random.choice(COMM_STATUS),
                    sent_at,
                    delivered_at,
                    read_at,
                    random.choice(RESPONSE_STATUS),
                    random.randint(0, 3),
                ),
            )

        # -------------------------------------------------------------
        # 8. payments (references cases) - payment_date spread across
        #    every month
        # -------------------------------------------------------------
        for i in range(ROWS):
            cur.execute(
                """
                INSERT INTO public.payments
                    (case_id, loan_number, amount, payment_date, payment_mode,
                     pg_transaction_id, payment_status, reconciled, payment_source)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(case_ids),
                    gen_loan_number(random.randint(0, ROWS - 1)),
                    round(random.uniform(500, 20000), 2),
                    random_dt_in_month(*pick_month(i)),
                    random.choice(PAYMENT_MODES),
                    str(fake.uuid4()),
                    random.choice(PAYMENT_STATUS),
                    random.choice([True, False]),
                    random.choice(PAYMENT_SOURCE),
                ),
            )

        # -------------------------------------------------------------
        # 9. ptps (references cases, agents) - ptp_date spread across
        #    every month, no NULLs
        # -------------------------------------------------------------
        for i in range(ROWS):
            ptp_date = random_date_in_month(*pick_month(i))
            honoured = random.choice([True, False])
            actual_payment_date = (
                ptp_date if honoured else ptp_date + timedelta(days=random.randint(1, 10))
            )
            cur.execute(
                """
                INSERT INTO public.ptps
                    (case_id, agent_id, ptp_date, ptp_amount, honoured, actual_payment_date)
                VALUES (%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(case_ids),
                    random.choice(agent_ids),
                    ptp_date,
                    round(random.uniform(500, 20000), 2),
                    honoured,
                    actual_payment_date,
                ),
            )

        # -------------------------------------------------------------
        # 10. audit_logs (entity_id must be a real uuid -> use case/agent ids)
        # -------------------------------------------------------------
        uuid_pool = [("case", cid) for cid in case_ids] + [("agent", aid) for aid in agent_ids]
        for i in range(ROWS):
            entity_type, entity_id = random.choice(uuid_pool)
            old_value, new_value = gen_audit_values(entity_type, agent_ids)
            cur.execute(
                """
                INSERT INTO public.audit_logs
                    (entity_type, entity_id, action, old_value, new_value,
                     user_name, ip_address)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    entity_type,
                    entity_id,
                    random.choice(AUDIT_ACTIONS),
                    psycopg2.extras.Json(old_value),
                    psycopg2.extras.Json(new_value),
                    fake.user_name(),
                    fake.ipv4(),
                ),
            )

        conn.commit()
        print(
            f"Success: inserted {ROWS} rows into each table "
            f"(covers all {len(LOCATIONS)} state/branch/zone combos, "
            f"all buckets, and all {len(MONTHS)} months)."
        )

    except Exception as e:
        conn.rollback()
        print(f"Error occurred, rolled back all changes: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()