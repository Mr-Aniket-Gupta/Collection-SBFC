import random
import calendar
import uuid
from datetime import datetime, timedelta, time

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
# 3. Month coverage -- guarantees data spread across the last N months,
#    i.e. PAST dates as well as dates up to and including TODAY
#    (edit NUM_MONTHS to change how far back / how many months to cover)
# ---------------------------------------------------------------------------
NUM_MONTHS = 24  # last 24 months (2 years), including the current month


def _build_months(num_months):
    today = datetime.now()
    year, month = today.year, today.month
    months = []
    for _ in range(num_months):
        months.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    months.reverse()  # oldest first, current month last
    return months


MONTHS = _build_months(NUM_MONTHS)

# Rows now guarantee coverage of every location AND every month.
ROWS = max(ROWS, len(MONTHS))


def pick_month(index):
    """Round-robins through every (year, month) first (oldest to newest,
    ending at the current month), then falls back to random picks once
    all months are covered."""
    if index < len(MONTHS):
        return MONTHS[index]
    return random.choice(MONTHS)


def random_dt_in_month(year, month):
    """Random datetime that falls within the given calendar month.
    Never exceeds the current moment (so the current/latest month only
    yields dates up to 'now', not into the future)."""
    last_day = calendar.monthrange(year, month)[1]
    day = random.randint(1, last_day)
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    dt = datetime(year, month, day, hour, minute, second)
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

# --- New pools for pre_emi_cases / dpd_cases / bounce_cases / strategy_execution_log ---
PRODUCT_NAMES = ["Personal Loan", "Home Loan", "Car Loan", "Business Loan", "Education Loan"]
PENDING_STRATEGY_STATUSES = ["PENDING_STRATEGY", "STRATEGY_ASSIGNED", "IN_PROGRESS", "CLOSED"]
LOAN_STATUSES = ["ACTIVE", "NPA", "WRITTEN_OFF", "CLOSED"]
NACH_STATUSES = ["SUCCESS", "FAILED", "PENDING", "NOT_REGISTERED"]
BOUNCE_REASONS = [
    "INSUFFICIENT_FUNDS",
    "ACCOUNT_CLOSED",
    "SIGNATURE_MISMATCH",
    "TECHNICAL_ERROR",
    "STOPPED_BY_CUSTOMER",
]
EXEC_STATUSES = ["RUNNING", "COMPLETED", "FAILED", "CANCELLED"]
EXEC_CASE_TYPES = ["PRE_EMI", "DPD", "BOUNCE"]


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


def gen_case_ref(prefix, i):
    return f"{prefix}{RUN_TOKEN}{i:05d}"


def gen_mifin_batch_ref(i):
    return f"MIFIN{RUN_TOKEN}{i:04d}"


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
        #    effective_date/created_at/updated_at spread across every
        #    month (past through current)
        # -------------------------------------------------------------
        strategy_ids = []
        states_cycle = list(STATE_BRANCH_ZONE.keys())
        for i in range(ROWS):
            bucket, dpd_from, dpd_to, _ = pick_bucket_and_dpd()
            month_year, month_num = pick_month(i)
            effective_date = random_date_in_month(month_year, month_num)
            expiry_date = effective_date + timedelta(days=365)
            created_at = random_dt_in_month(month_year, month_num)
            updated_at = created_at + timedelta(
                hours=random.randint(0, 72), minutes=random.randint(0, 59)
            )
            updated_at = min(updated_at, datetime.now())
            cur.execute(
                """
                INSERT INTO public.strategies
                    (strategy_name, strategy_code, strategy_version, journey_type,
                     dpd_range_from, dpd_range_to, bucket, product_code, state,
                     customer_segment, outstanding_range_min, outstanding_range_max,
                     priority, effective_date, expiry_date, status, description,
                     created_by, created_at, updated_by, updated_at, is_active)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
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
                    created_at,
                    random.randint(1, 5),
                    updated_at,
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
        #    (past through current), updated_at after created_at
        # -------------------------------------------------------------
        case_ids = []
        for i in range(ROWS):
            state, branch, zone = pick_location(i)
            bucket, _, _, sample_dpd = pick_bucket_and_dpd()
            principal = round(random.uniform(5000, 50000), 2)
            interest = round(random.uniform(100, 5000), 2)
            created_at = random_dt_in_month(*pick_month(i))
            updated_at = min(
                created_at + timedelta(days=random.randint(0, 20)), datetime.now()
            )
            cur.execute(
                """
                INSERT INTO public.cases
                    (case_number, pr_number, loan_number, customer_id, journey_type,
                     bucket, dpd, strategy_id, assigned_to, outstanding_principal,
                     outstanding_interest, outstanding_total, status, branch, zone, state,
                     created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING case_id
                """,
                (
                    gen_case_number(i),
                    gen_pr_number(i),
                    gen_loan_number(i),
                    f"CUST{i:06d}",
                    random.choice(JOURNEY_TYPES),
                    bucket,
                    sample_dpd,
                    # FIX: cases.strategy_id is BIGINT in the schema (no FK
                    # constraint declared, but the column type is bigint,
                    # NOT uuid). Must use a real strategy_id from the
                    # strategies table we already inserted, otherwise
                    # Postgres raises: invalid input syntax for type bigint.
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
        # 4. strategy_steps (references strategies) - created_at spread
        #    across every month, updated_at after created_at
        # -------------------------------------------------------------
        for i in range(ROWS):
            created_at = random_dt_in_month(*pick_month(i))
            updated_at = min(
                created_at + timedelta(hours=random.randint(0, 240)), datetime.now()
            )
            cur.execute(
                """
                INSERT INTO public.strategy_steps
                    (step_number, step_name, trigger_delay_value, channel,
                     template_code, retry_count, retry_delay_hours,
                     payment_check_before_step, condition_expression,
                     escalation_trigger, escalation_target, status,
                     created_by, created_at, updated_by, updated_at,
                     strategy_id, is_active)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
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
                    created_at,
                    random.randint(1, 5),
                    updated_at,
                    random.choice(strategy_ids),
                    random.choice([True, False]),
                ),
            )

        # -------------------------------------------------------------
        # 5. strategy_approval_log (references strategies) - performed_at
        #    (NOT NULL) spread across every month, past through current
        # -------------------------------------------------------------
        for i in range(ROWS):
            performed_at = random_dt_in_month(*pick_month(i))
            cur.execute(
                """
                INSERT INTO public.strategy_approval_log
                    (strategy_id, from_status, to_status, action, actor_id,
                     actor_role, remarks, performed_at, ip_address)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(strategy_ids),
                    random.choice(APPROVAL_STATUSES),
                    random.choice(APPROVAL_STATUSES),
                    random.choice(APPROVAL_ACTIONS),
                    random.randint(1, 10),
                    random.choice(ACTOR_ROLES),
                    fake.sentence(),
                    performed_at,
                    fake.ipv4(),
                ),
            )

        # -------------------------------------------------------------
        # 6. allocations (references cases, agents) - allocated_at
        #    spread across every month
        # -------------------------------------------------------------
        for i in range(ROWS):
            allocated_at = random_dt_in_month(*pick_month(i))
            deallocated_at = min(
                allocated_at + timedelta(days=random.randint(1, 30)), datetime.now()
            )
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
        # 7. communications (references cases) - sent_at/created_at
        #    spread across every month
        # -------------------------------------------------------------
        for i in range(ROWS):
            sent_at = random_dt_in_month(*pick_month(i))
            delivered_at = min(
                sent_at + timedelta(minutes=random.randint(1, 60)), datetime.now()
            )
            read_at = min(
                delivered_at + timedelta(minutes=random.randint(1, 120)), datetime.now()
            )
            created_at = sent_at
            cur.execute(
                """
                INSERT INTO public.communications
                    (case_id, channel, template_name, status, sent_at,
                     delivered_at, read_at, response_status, retry_count, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
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
                    created_at,
                ),
            )

        # -------------------------------------------------------------
        # 8. payments (references cases) - payment_date/created_at
        #    spread across every month
        # -------------------------------------------------------------
        for i in range(ROWS):
            payment_date = random_dt_in_month(*pick_month(i))
            cur.execute(
                """
                INSERT INTO public.payments
                    (case_id, loan_number, amount, payment_date, payment_mode,
                     pg_transaction_id, payment_status, reconciled, payment_source,
                     created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(case_ids),
                    gen_loan_number(random.randint(0, ROWS - 1)),
                    round(random.uniform(500, 20000), 2),
                    payment_date,
                    random.choice(PAYMENT_MODES),
                    str(fake.uuid4()),
                    random.choice(PAYMENT_STATUS),
                    random.choice([True, False]),
                    random.choice(PAYMENT_SOURCE),
                    payment_date,
                ),
            )

        # -------------------------------------------------------------
        # 9. ptps (references cases, agents) - ptp_date/created_at
        #    spread across every month, no NULLs
        # -------------------------------------------------------------
        for i in range(ROWS):
            month_year, month_num = pick_month(i)
            ptp_date = random_date_in_month(month_year, month_num)
            honoured = random.choice([True, False])
            actual_payment_date = (
                ptp_date if honoured else ptp_date + timedelta(days=random.randint(1, 10))
            )
            created_at = min(
                datetime.combine(ptp_date, time(random.randint(0, 23), random.randint(0, 59))),
                datetime.now(),
            )
            cur.execute(
                """
                INSERT INTO public.ptps
                    (case_id, agent_id, ptp_date, ptp_amount, honoured,
                     actual_payment_date, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    random.choice(case_ids),
                    random.choice(agent_ids),
                    ptp_date,
                    round(random.uniform(500, 20000), 2),
                    honoured,
                    actual_payment_date,
                    created_at,
                ),
            )

        # -------------------------------------------------------------
        # 10. audit_logs (entity_id is bigint -> use real case/agent ids)
        #     created_at spread across every month
        # -------------------------------------------------------------
        uuid_pool = [("case", cid) for cid in case_ids] + [("agent", aid) for aid in agent_ids]
        for i in range(ROWS):
            entity_type, entity_id = random.choice(uuid_pool)
            old_value, new_value = gen_audit_values(entity_type, agent_ids)
            created_at = random_dt_in_month(*pick_month(i))
            cur.execute(
                """
                INSERT INTO public.audit_logs
                    (entity_type, entity_id, action, old_value, new_value,
                     user_name, ip_address, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    entity_type,
                    entity_id,
                    random.choice(AUDIT_ACTIONS),
                    psycopg2.extras.Json(old_value),
                    psycopg2.extras.Json(new_value),
                    fake.user_name(),
                    fake.ipv4(),
                    created_at,
                ),
            )

        # -------------------------------------------------------------
        # 11. pre_emi_cases (references strategies) - pre_emi_date /
        #     mifin_extraction_date / created_at / updated_at spread
        #     across every month, past through current
        # -------------------------------------------------------------
        pre_emi_ids = []
        for i in range(ROWS):
            month_year, month_num = pick_month(i)
            pre_emi_date = random_date_in_month(month_year, month_num)
            mifin_extraction_date = pre_emi_date
            created_at = random_dt_in_month(month_year, month_num)
            updated_at = min(
                created_at + timedelta(days=random.randint(0, 15)), datetime.now()
            )
            cur.execute(
                """
                INSERT INTO public.pre_emi_cases
                    (case_ref, pr_number, customer_id, customer_name, mobile_number,
                     alternate_mobile, email_id, product_name, pre_emi_amount,
                     pre_emi_date, strategy_id, status, mifin_batch_ref,
                     mifin_extraction_date, is_active, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING pre_emi_case_id
                """,
                (
                    gen_case_ref("PREEMI", i),
                    gen_pr_number(i),
                    f"CUST{i:06d}",
                    fake.name(),
                    fake.msisdn()[:10],
                    fake.msisdn()[:10],
                    fake.unique.email(),
                    random.choice(PRODUCT_NAMES),
                    round(random.uniform(1000, 20000), 2),
                    pre_emi_date,
                    random.choice(strategy_ids),
                    random.choice(PENDING_STRATEGY_STATUSES),
                    gen_mifin_batch_ref(i),
                    mifin_extraction_date,
                    random.choice([True, False]),
                    created_at,
                    updated_at,
                ),
            )
            pre_emi_ids.append(cur.fetchone()[0])

        # -------------------------------------------------------------
        # 12. dpd_cases (references strategies) - disbursal_date in the
        #     past, last_payment_date/next_emi_date derived from it,
        #     mifin_extraction_date/created_at/updated_at spread across
        #     every month, past through current
        # -------------------------------------------------------------
        dpd_case_ids = []
        for i in range(ROWS):
            state, branch, _zone = pick_location(i)
            month_year, month_num = pick_month(i)
            bucket, _, _, sample_dpd = pick_bucket_and_dpd()
            disbursal_date = random_date_in_month(
                *pick_month(max(0, i - 12) % len(MONTHS))
            ) - timedelta(days=random.randint(0, 365))
            last_payment_date = random_date_in_month(month_year, month_num)
            next_emi_date = last_payment_date + timedelta(days=30)
            principal = round(random.uniform(5000, 50000), 2)
            interest = round(random.uniform(100, 5000), 2)
            mifin_extraction_date = last_payment_date
            created_at = random_dt_in_month(month_year, month_num)
            updated_at = min(
                created_at + timedelta(days=random.randint(0, 15)), datetime.now()
            )
            cur.execute(
                """
                INSERT INTO public.dpd_cases
                    (case_ref, pr_number, customer_id, customer_name, mobile_number,
                     alternate_mobile, email_id, state, branch_name, product_name,
                     disbursal_date, loan_amount, emi_amount, outstanding_principal,
                     outstanding_interest, total_outstanding, last_payment_date,
                     last_payment_amount, next_emi_date, dpd, bucket, loan_status,
                     strategy_id, status, mifin_batch_ref, mifin_extraction_date,
                     is_active, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING dpd_case_id
                """,
                (
                    gen_case_ref("DPD", i),
                    gen_pr_number(i),
                    f"CUST{i:06d}",
                    fake.name(),
                    fake.msisdn()[:10],
                    fake.msisdn()[:10],
                    fake.unique.email(),
                    state,
                    branch,
                    random.choice(PRODUCT_NAMES),
                    disbursal_date,
                    principal,
                    round(random.uniform(500, 5000), 2),
                    principal,
                    interest,
                    principal + interest,
                    last_payment_date,
                    round(random.uniform(500, 20000), 2),
                    next_emi_date,
                    sample_dpd,
                    bucket,
                    random.choice(LOAN_STATUSES),
                    random.choice(strategy_ids),
                    random.choice(PENDING_STRATEGY_STATUSES),
                    gen_mifin_batch_ref(i),
                    mifin_extraction_date,
                    random.choice([True, False]),
                    created_at,
                    updated_at,
                ),
            )
            dpd_case_ids.append(cur.fetchone()[0])

        # -------------------------------------------------------------
        # 13. bounce_cases (references strategies) - disbursal_date in
        #     the past, bounce_date/last_payment_date/next_emi_date
        #     derived from it, mifin_extraction_date/created_at/
        #     updated_at spread across every month, past through current
        # -------------------------------------------------------------
        bounce_case_ids = []
        for i in range(ROWS):
            state, branch, _zone = pick_location(i)
            month_year, month_num = pick_month(i)
            bucket, _, _, sample_dpd = pick_bucket_and_dpd()
            disbursal_date = random_date_in_month(
                *pick_month(max(0, i - 12) % len(MONTHS))
            ) - timedelta(days=random.randint(0, 365))
            bounce_date = random_date_in_month(month_year, month_num)
            last_payment_date = bounce_date - timedelta(days=random.randint(1, 30))
            next_emi_date = bounce_date + timedelta(days=random.randint(1, 30))
            principal = round(random.uniform(5000, 50000), 2)
            interest = round(random.uniform(100, 5000), 2)
            mifin_extraction_date = bounce_date
            created_at = random_dt_in_month(month_year, month_num)
            updated_at = min(
                created_at + timedelta(days=random.randint(0, 15)), datetime.now()
            )
            cur.execute(
                """
                INSERT INTO public.bounce_cases
                    (case_ref, pr_number, customer_id, customer_name, mobile_number,
                     alternate_mobile, email_id, state, branch_name, product_name,
                     disbursal_date, loan_amount, emi_amount, outstanding_principal,
                     outstanding_interest, total_outstanding, last_payment_date,
                     last_payment_amount, next_emi_date, dpd, bucket, loan_status,
                     bounce_date, bounce_reason, nach_status, bounce_cycle,
                     strategy_id, status, mifin_batch_ref, mifin_extraction_date,
                     is_active, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING bounce_case_id
                """,
                (
                    gen_case_ref("BOUNCE", i),
                    gen_pr_number(i),
                    f"CUST{i:06d}",
                    fake.name(),
                    fake.msisdn()[:10],
                    fake.msisdn()[:10],
                    fake.unique.email(),
                    state,
                    branch,
                    random.choice(PRODUCT_NAMES),
                    disbursal_date,
                    principal,
                    round(random.uniform(500, 5000), 2),
                    principal,
                    interest,
                    principal + interest,
                    last_payment_date,
                    round(random.uniform(500, 20000), 2),
                    next_emi_date,
                    sample_dpd,
                    bucket,
                    random.choice(LOAN_STATUSES),
                    bounce_date,
                    random.choice(BOUNCE_REASONS),
                    random.choice(NACH_STATUSES),
                    random.randint(1, 5),
                    random.choice(strategy_ids),
                    random.choice(PENDING_STRATEGY_STATUSES),
                    gen_mifin_batch_ref(i),
                    mifin_extraction_date,
                    random.choice([True, False]),
                    created_at,
                    updated_at,
                ),
            )
            bounce_case_ids.append(cur.fetchone()[0])

        # -------------------------------------------------------------
        # 14. strategy_execution_log (references strategies, and one of
        #     pre_emi_cases/dpd_cases/bounce_cases depending on
        #     case_type) - assigned_at spread across every month,
        #     completed_at after assigned_at (for non-RUNNING rows)
        # -------------------------------------------------------------
        exec_case_pool = {
            "PRE_EMI": pre_emi_ids,
            "DPD": dpd_case_ids,
            "BOUNCE": bounce_case_ids,
        }
        for i in range(ROWS):
            case_type = random.choice(EXEC_CASE_TYPES)
            case_id_val = random.choice(exec_case_pool[case_type])
            assigned_at = random_dt_in_month(*pick_month(i))
            exec_status = random.choice(EXEC_STATUSES)
            # completed_at only makes sense once the run has finished;
            # leave it NULL while still RUNNING to match real-world data.
            completed_at = (
                None
                if exec_status == "RUNNING"
                else min(assigned_at + timedelta(hours=random.randint(1, 240)), datetime.now())
            )
            cur.execute(
                """
                INSERT INTO public.strategy_execution_log
                    (case_type, case_id, strategy_id, status, assigned_at, completed_at)
                VALUES (%s,%s,%s,%s,%s,%s)
                """,
                (
                    case_type,
                    case_id_val,
                    random.choice(strategy_ids),
                    exec_status,
                    assigned_at,
                    completed_at,
                ),
            )

        conn.commit()
        print(
            f"Success: inserted {ROWS} rows into each table "
            f"(covers all {len(LOCATIONS)} state/branch/zone combos, "
            f"all buckets, and all {len(MONTHS)} months from "
            f"{MONTHS[0][1]}/{MONTHS[0][0]} through the current month "
            f"{MONTHS[-1][1]}/{MONTHS[-1][0]}), including pre_emi_cases, "
            f"dpd_cases, bounce_cases, and strategy_execution_log."
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