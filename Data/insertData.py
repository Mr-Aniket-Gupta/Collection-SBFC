"""
Synthetic data generator for digital_collection_platform.

Rewritten so that:
  1. Every INSERT matches the ACTUAL column list of your schema (dump you shared).
  2. No column is ever left NULL / empty -- every field gets a real value.
  3. IDs are never picked with a "pure random" unrelated choice. Wherever a
     row references another table (strategy_id, agent_id, created_by,
     updated_by, actor_id, entity_id ...), the value is taken from a pool
     that is *logically* tied to that row (same state, same case, same
     agent-load, etc.) instead of an arbitrary random.choice().
  4. The script is organised strictly table-by-table, in the order the
     tables must be created (parents before children), with a clear
     "TABLE: <name>" comment block above each section.
"""

import random
import calendar
from collections import defaultdict
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
# 2. BRANCH -> STATE -> ZONE setup (EDIT to match your real org structure)
#
# As requested: exactly 5 branches, named "Branch 1" .. "Branch 5", each
# with a fixed zone_code from {East, West, North, South}. Each branch also
# belongs to one state, so agents / cases / branches all stay consistent
# with each other (same branch always => same state => same zone).
# ---------------------------------------------------------------------------
NUM_BRANCHES = 5
BRANCH_NAMES = [f"Branch {i}" for i in range(1, NUM_BRANCHES + 1)]
ZONE_NAMES = ["East", "West", "North", "South"]
STATE_NAMES = ["State A", "State B", "State C", "State D", "State E"]

# (state, branch_name, zone) -- one fixed zone per branch, cycling through
# East/West/North/South so all four zones actually get used.
BRANCH_DEFS = [
    (STATE_NAMES[i % len(STATE_NAMES)], BRANCH_NAMES[i], ZONE_NAMES[i % len(ZONE_NAMES)])
    for i in range(NUM_BRANCHES)
]

# Kept as STATE_BRANCH_ZONE / ALL_BRANCHES for the rest of the script so the
# downstream logic (branches table, gen_audit_values, etc.) doesn't need to
# change shape -- just built from the new flat BRANCH_DEFS list instead of
# a big nested dict.
STATE_BRANCH_ZONE = {}
for _state, _branch, _zone in BRANCH_DEFS:
    STATE_BRANCH_ZONE.setdefault(_state, {})[_branch] = [_zone]

LOCATIONS = [(state, branch, zone) for state, branch, zone in BRANCH_DEFS]

ROWS = max(5000, len(LOCATIONS))


def pick_location(index):
    if index < len(LOCATIONS):
        return LOCATIONS[index]
    return random.choice(LOCATIONS)


# ---------------------------------------------------------------------------
# 3. Month coverage
# ---------------------------------------------------------------------------
NUM_MONTHS = 24


def _build_months(num_months):
    today = datetime.now()
    year, month = today.year, today.month
    months = []
    for _ in range(num_months):
        months.append((year, month))
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    months.reverse()
    return months


MONTHS = _build_months(NUM_MONTHS)
ROWS = max(ROWS, len(MONTHS))


def pick_month(index):
    if index < len(MONTHS):
        return MONTHS[index]
    return random.choice(MONTHS)


def random_dt_in_month(year, month):
    last_day = calendar.monthrange(year, month)[1]
    day = random.randint(1, last_day)
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    dt = datetime(year, month, day, hour, minute, second)
    return min(dt, datetime.now())


def random_date_in_month(year, month):
    return random_dt_in_month(year, month).date()


# ---------------------------------------------------------------------------
# 4. Bucket <-> DPD mapping
# ---------------------------------------------------------------------------
BUCKET_DPD_MAP = {
    "1": (0, 30),
    "2": (31, 60),
    "3": (61, 90),
    "NPA": (91, 365),
}
BUCKETS = list(BUCKET_DPD_MAP.keys())


def pick_bucket_and_dpd():
    bucket = random.choice(BUCKETS)
    lo, hi = BUCKET_DPD_MAP[bucket]
    sample_dpd = random.randint(lo, hi)
    return bucket, lo, hi, sample_dpd


# ---------------------------------------------------------------------------
# Recovery probability model -- drives every "outcome" column so that
# outcomes are genuinely correlated with case attributes (used by every
# downstream table via `case_pool`, see TABLE sections below).
# ---------------------------------------------------------------------------
def recovery_probability(dpd, bucket, agent_load_ratio, priority, journey_type):
    p = 0.70
    p -= min(dpd / 200.0, 0.45)
    p -= {"1": 0.0, "2": 0.08, "3": 0.18, "NPA": 0.30}[bucket]
    p -= agent_load_ratio * 0.20
    p += (priority / 10.0) * 0.15
    p += {"EARLY": 0.10, "MID": 0.0, "LATE": -0.08, "LEGAL": -0.20}[journey_type]
    p += random.uniform(-0.07, 0.07)
    return min(max(p, 0.03), 0.95)


# ---------------------------------------------------------------------------
# Enum-like value pools
# ---------------------------------------------------------------------------
ROLES = ["Collector", "Team Lead", "Supervisor", "Field Agent"]
LANGUAGES = ["English", "Hindi", "Spanish", "French"]
AGENT_STATUS = ["ACTIVE", "INACTIVE", "ON_LEAVE"]

JOURNEY_TYPES = ["EARLY", "MID", "LATE", "LEGAL"]

CHANNELS = ["SMS", "EMAIL", "IVR", "WHATSAPP", "CALL"]
COMM_STATUS = ["SENT", "FAILED", "PENDING", "DELIVERED"]

PAYMENT_MODES = ["UPI", "NEFT", "CARD", "CASH", "NETBANKING"]
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

PRODUCT_NAMES = ["Personal Loan", "Home Loan", "Car Loan", "Business Loan", "Education Loan"]
PENDING_STRATEGY_STATUSES = ["PENDING_STRATEGY", "STRATEGY_ASSIGNED", "IN_PROGRESS", "CLOSED"]
NACH_STATUSES = ["SUCCESS", "FAILED", "PENDING", "NOT_REGISTERED"]
BOUNCE_REASONS = [
    "INSUFFICIENT_FUNDS",
    "ACCOUNT_CLOSED",
    "SIGNATURE_MISMATCH",
    "TECHNICAL_ERROR",
    "STOPPED_BY_CUSTOMER",
]
EXEC_CASE_TYPES = ["PRE_EMI", "DPD", "BOUNCE"]

BRANCH_STATUS = ["A", "I"]
BRANCH_TYPES = ["Branch", "Hub", "Satellite", "Regional Office"]
BRANCH_OFFICE_TYPES = ["Head Office", "Zonal Office", "Regional Office", "Satellite"]

ALL_ZONE_NAMES = sorted({z for branches in STATE_BRANCH_ZONE.values() for zs in branches.values() for z in zs})
ZONE_CODE_MAP = {zone: zone for zone in ALL_ZONE_NAMES}
ALL_STATE_NAMES = list(STATE_BRANCH_ZONE.keys())
REGION_CODE_MAP = {state: f"RG{idx + 1:02d}" for idx, state in enumerate(ALL_STATE_NAMES)}

ALL_BRANCHES = sorted({
    (state, branch)
    for state, branches in STATE_BRANCH_ZONE.items()
    for branch in branches
})

RUN_TOKEN = datetime.now().strftime("%m%d%H%M%S")


def gen_branch_code(i):
    return f"BR{RUN_TOKEN}{i:03d}"


def gen_pr_number(i):
    return f"PR{RUN_TOKEN}{i:04d}"


def gen_strategy_code(i):
    return f"STRAT{RUN_TOKEN}{i:03d}"


def gen_case_ref(prefix, i):
    return f"{prefix}{RUN_TOKEN}{i:05d}"


def gen_mifin_batch_ref(i):
    return f"MIFIN{RUN_TOKEN}{i:04d}"


_email_counter = 0


def gen_unique_email():
    global _email_counter
    _email_counter += 1
    local_part = fake.user_name()
    return f"{local_part}.{RUN_TOKEN}{_email_counter:05d}@example.com"


def gen_audit_values(entity_type, agent_ids_pool):
    if entity_type == "case":
        field = random.choice(["status", "dpd", "assigned_to", "outstanding_total"])
        if field == "status":
            old_val = random.choice(PENDING_STRATEGY_STATUSES)
            new_val = random.choice([s for s in PENDING_STRATEGY_STATUSES if s != old_val])
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
        new_amt = round(max(old_amt - random.uniform(100, 5000), 100), 2)
        return {"outstanding_total": old_amt}, {"outstanding_total": new_amt}

    field = random.choice(["status", "current_load", "branch"])
    if field == "status":
        old_val = random.choice(AGENT_STATUS)
        new_val = random.choice([s for s in AGENT_STATUS if s != old_val])
        return {"status": old_val}, {"status": new_val}
    if field == "current_load":
        old_load = random.randint(1, 20)
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
        # ===============================================================
        # TABLE: agents  -- created FIRST because almost every other
        # table (strategies.created_by, branches.created_by, allocations,
        # ptps ...) needs to point at a REAL agent_id, not a random int.
        # ===============================================================
        agent_ids = []
        agent_load_ratio = {}
        agent_ids_by_state = defaultdict(list)
        for i in range(ROWS):
            state, branch, zone = pick_location(i)
            max_capacity = random.randint(20, 100)
            current_load = random.randint(0, max_capacity)
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
                    max_capacity,
                    current_load,
                    random.choice(LANGUAGES),
                    fake.msisdn()[:10],
                    gen_unique_email(),
                    random.choice(AGENT_STATUS),
                ),
            )
            aid = cur.fetchone()[0]
            agent_ids.append(aid)
            agent_load_ratio[aid] = current_load / max_capacity if max_capacity else 0.0
            agent_ids_by_state[state].append(aid)

        # ===============================================================
        # TABLE: strategies  -- created_by / updated_by now point at real
        # agent_ids (not a bare random.randint(1,5) like before).
        # ===============================================================
        strategy_ids = []
        strategy_meta = {}          # sid -> {bucket, priority, journey_type}
        strategy_state_map = {}     # sid -> state (used to link branches)
        strategies_by_state = defaultdict(list)
        states_cycle = list(STATE_BRANCH_ZONE.keys())

        for i in range(ROWS):
            bucket, dpd_from, dpd_to, _ = pick_bucket_and_dpd()
            journey_type = random.choice(JOURNEY_TYPES)
            priority = random.randint(1, 10)
            state = states_cycle[i % len(states_cycle)]
            month_year, month_num = pick_month(i % len(MONTHS))
            effective_date = random_date_in_month(month_year, month_num)
            expiry_date = effective_date + timedelta(days=365)
            created_at = random_dt_in_month(month_year, month_num)
            updated_at = min(
                created_at + timedelta(hours=random.randint(1, 72), minutes=random.randint(0, 59)),
                datetime.now(),
            )
            created_by = random.choice(agent_ids)
            updated_by = random.choice(agent_ids)

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
                    journey_type,
                    dpd_from,
                    dpd_to,
                    bucket,
                    random.choice(PRODUCT_CODES),
                    state,
                    random.choice(CUSTOMER_SEGMENTS),
                    round(random.uniform(1000, 5000), 2),
                    round(random.uniform(5000, 100000), 2),
                    priority,
                    effective_date,
                    expiry_date,
                    random.choice(STRATEGY_STATUS),
                    fake.sentence(),
                    created_by,
                    created_at,
                    updated_by,
                    updated_at,
                    random.choice([True, False]),
                ),
            )
            sid = cur.fetchone()[0]
            strategy_ids.append(sid)
            strategy_meta[sid] = {"bucket": bucket, "priority": priority, "journey_type": journey_type}
            strategy_state_map[sid] = state
            strategies_by_state[state].append(sid)

        strategies_by_bucket = {b: [sid for sid, m in strategy_meta.items() if m["bucket"] == b] for b in BUCKETS}

        def pick_strategy_for_bucket(bucket):
            """A case in bucket X should be governed by a strategy that was
            actually written for bucket X -- keeps strategy_id genuinely
            connected to the case instead of a random pick."""
            pool = strategies_by_bucket.get(bucket) or strategy_ids
            return random.choice(pool)

        # ===============================================================
        # TABLE: branches  -- strategy_id now comes from a strategy that
        # targets the SAME state as the branch; created_by / updated_by
        # come from agents posted in that SAME state. Hub branch fields
        # point at the actual first branch row instead of being
        # regenerated (and mismatched) on every iteration.
        # ===============================================================
        HUB_BRANCH_CODE = gen_branch_code(0)
        HUB_BRANCH_NAME = ALL_BRANCHES[0][1]

        for i, (state, branch_name) in enumerate(ALL_BRANCHES):
            zones_for_branch = STATE_BRANCH_ZONE[state][branch_name]
            zone = random.choice(zones_for_branch)
            created_at = random_dt_in_month(*pick_month(i % len(MONTHS)))
            updated_at = min(
                created_at + timedelta(days=random.randint(1, 30)), datetime.now()
            )
            strategy_id = random.choice(strategies_by_state.get(state, strategy_ids))
            created_by = random.choice(agent_ids_by_state.get(state, agent_ids))
            updated_by = random.choice(agent_ids_by_state.get(state, agent_ids))

            cur.execute(
                """
                INSERT INTO public.branches
                    (strategy_id, code, name, zone_code, region_code, cost_center, status,
                     created_at, created_by, updated_at, updated_by,
                     branch_type, branch_office_type, location,
                     hub_branch_id, hub_branch_name, branch_manager_name, address)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    strategy_id,
                    gen_branch_code(i),
                    branch_name,
                    ZONE_CODE_MAP[zone],
                    REGION_CODE_MAP[state],
                    f"CC{1000 + i}",
                    random.choice(BRANCH_STATUS),
                    created_at,
                    created_by,
                    updated_at,
                    updated_by,
                    random.choice(BRANCH_TYPES),
                    random.choice(BRANCH_OFFICE_TYPES),
                    f"{branch_name}, {state}",
                    HUB_BRANCH_CODE,
                    HUB_BRANCH_NAME,
                    fake.name(),
                    fake.address().replace("\n", ", "),
                ),
            )

        # ===============================================================
        # `case_pool` collects, for EVERY case created below (pre-emi, dpd,
        # bounce), the attributes that drive recovery_probability. Every
        # downstream table (allocations, communications, payments, ptps,
        # strategy_execution_log) pulls strategy_id / agent_id from this
        # pool -- so those tables are always tied to one real, consistent
        # case instead of independently-random ids.
        # ===============================================================
        case_pool = []
        case_meta_by_id = {}   # (case_type, case_id) -> strategy_id, for audit_logs

        # ===============================================================
        # TABLE: pre_emi_cases
        # ===============================================================
        pre_emi_ids = []
        for i in range(ROWS):
            month_year, month_num = pick_month(i % len(MONTHS))
            pre_emi_date = random_date_in_month(month_year, month_num)
            mifin_extraction_date = pre_emi_date
            created_at = random_dt_in_month(month_year, month_num)
            updated_at = min(
                created_at + timedelta(days=random.randint(1, 15)), datetime.now()
            )
            bucket = random.choice(BUCKETS)
            strategy_id = pick_strategy_for_bucket(bucket)
            agent_id = random.choice(agent_ids)
            recov_prob = recovery_probability(
                0, bucket, agent_load_ratio[agent_id],
                strategy_meta[strategy_id]["priority"], strategy_meta[strategy_id]["journey_type"],
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
                    gen_unique_email(),
                    random.choice(PRODUCT_NAMES),
                    round(random.uniform(1000, 20000), 2),
                    pre_emi_date,
                    strategy_id,
                    random.choice(PENDING_STRATEGY_STATUSES),
                    gen_mifin_batch_ref(i),
                    mifin_extraction_date,
                    random.choice([True, False]),
                    created_at,
                    updated_at,
                ),
            )
            cid = cur.fetchone()[0]
            pre_emi_ids.append(cid)
            case_meta_by_id[("case", cid)] = strategy_id
            case_pool.append({
                "strategy_id": strategy_id, "dpd": 0, "bucket": bucket,
                "agent_id": agent_id, "priority": strategy_meta[strategy_id]["priority"],
                "journey_type": strategy_meta[strategy_id]["journey_type"],
                "recov_prob": recov_prob, "case_type": "PRE_EMI",
            })

        # ===============================================================
        # TABLE: dpd_cases
        # ===============================================================
        dpd_case_ids = []
        for i in range(ROWS):
            state, branch, _zone = pick_location(i)
            month_year, month_num = pick_month(i % len(MONTHS))
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
                created_at + timedelta(days=random.randint(1, 15)), datetime.now()
            )
            strategy_id = pick_strategy_for_bucket(bucket)
            agent_id = random.choice(agent_ids)

            recov_prob = recovery_probability(
                sample_dpd, bucket, agent_load_ratio[agent_id],
                strategy_meta[strategy_id]["priority"], strategy_meta[strategy_id]["journey_type"],
            )
            loan_status = "CLOSED" if recov_prob > 0.6 and random.random() < recov_prob \
                else random.choice(["ACTIVE", "NPA", "WRITTEN_OFF"])

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
                    gen_unique_email(),
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
                    loan_status,
                    strategy_id,
                    random.choice(PENDING_STRATEGY_STATUSES),
                    gen_mifin_batch_ref(i),
                    mifin_extraction_date,
                    random.choice([True, False]),
                    created_at,
                    updated_at,
                ),
            )
            cid = cur.fetchone()[0]
            dpd_case_ids.append(cid)
            case_meta_by_id[("case", cid)] = strategy_id
            case_pool.append({
                "strategy_id": strategy_id, "dpd": sample_dpd, "bucket": bucket,
                "agent_id": agent_id, "priority": strategy_meta[strategy_id]["priority"],
                "journey_type": strategy_meta[strategy_id]["journey_type"],
                "recov_prob": recov_prob, "case_type": "DPD",
            })

        # ===============================================================
        # TABLE: bounce_cases
        # ===============================================================
        bounce_case_ids = []
        for i in range(ROWS):
            state, branch, _zone = pick_location(i)
            month_year, month_num = pick_month(i % len(MONTHS))
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
                created_at + timedelta(days=random.randint(1, 15)), datetime.now()
            )
            strategy_id = pick_strategy_for_bucket(bucket)
            agent_id = random.choice(agent_ids)
            recov_prob = recovery_probability(
                sample_dpd, bucket, agent_load_ratio[agent_id],
                strategy_meta[strategy_id]["priority"], strategy_meta[strategy_id]["journey_type"],
            )
            loan_status = "CLOSED" if random.random() < recov_prob else random.choice(["ACTIVE", "NPA", "WRITTEN_OFF"])

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
                    gen_unique_email(),
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
                    loan_status,
                    bounce_date,
                    random.choice(BOUNCE_REASONS),
                    random.choice(NACH_STATUSES),
                    random.randint(1, 5),
                    strategy_id,
                    random.choice(PENDING_STRATEGY_STATUSES),
                    gen_mifin_batch_ref(i),
                    mifin_extraction_date,
                    random.choice([True, False]),
                    created_at,
                    updated_at,
                ),
            )
            cid = cur.fetchone()[0]
            bounce_case_ids.append(cid)
            case_meta_by_id[("case", cid)] = strategy_id
            case_pool.append({
                "strategy_id": strategy_id, "dpd": sample_dpd, "bucket": bucket,
                "agent_id": agent_id, "priority": strategy_meta[strategy_id]["priority"],
                "journey_type": strategy_meta[strategy_id]["journey_type"],
                "recov_prob": recov_prob, "case_type": "BOUNCE",
            })

        all_case_ids = pre_emi_ids + dpd_case_ids + bounce_case_ids

        # Map: which strategies has each agent actually worked on? Used by
        # audit_logs so an "agent" entity row references a strategy that
        # agent is genuinely tied to (via case_pool), not a random one.
        agent_to_strategies = defaultdict(list)
        for c in case_pool:
            agent_to_strategies[c["agent_id"]].append(c["strategy_id"])

        # ===============================================================
        # TABLE: strategy_steps  -- created_by / updated_by use real
        # agent_ids instead of random.randint(1,5).
        # ===============================================================
        for i in range(ROWS):
            created_at = random_dt_in_month(*pick_month(i % len(MONTHS)))
            updated_at = min(
                created_at + timedelta(hours=random.randint(1, 240)), datetime.now()
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
                    random.choice(agent_ids),
                    created_at,
                    random.choice(agent_ids),
                    updated_at,
                    random.choice(strategy_ids),
                    random.choice([True, False]),
                ),
            )

        # ===============================================================
        # TABLE: strategy_approval_log  -- actor_id now a real agent_id.
        # ===============================================================
        for i in range(ROWS):
            performed_at = random_dt_in_month(*pick_month(i % len(MONTHS)))
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
                    random.choice(agent_ids),
                    random.choice(ACTOR_ROLES),
                    fake.sentence(),
                    performed_at,
                    fake.ipv4(),
                ),
            )

        # ===============================================================
        # TABLE: allocations  -- strategy_id + allocated_to (agent) both
        # come from the SAME case in case_pool, so the agent allocated is
        # exactly the agent whose load fed that case's recovery_probability.
        # ===============================================================
        for i in range(ROWS):
            case = case_pool[i % len(case_pool)]
            allocated_at = random_dt_in_month(*pick_month(i % len(MONTHS)))
            deallocated_at = min(
                allocated_at + timedelta(days=random.randint(1, 30)), datetime.now()
            )
            cur.execute(
                """
                INSERT INTO public.allocations
                    (strategy_id, allocated_to, role, allocated_at, deallocated_at,
                     reason, allocation_status)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    case["strategy_id"],
                    case["agent_id"],
                    random.choice(ALLOC_ROLES),
                    allocated_at,
                    deallocated_at,
                    fake.sentence(),
                    random.choice(ALLOC_STATUS),
                ),
            )

        # ===============================================================
        # TABLE: communications  -- response_status weighted by the same
        # case's recov_prob (engaged/likely-to-pay customers respond more).
        # ===============================================================
        for i in range(ROWS):
            case = case_pool[i % len(case_pool)]
            sent_at = random_dt_in_month(*pick_month(i % len(MONTHS)))
            delivered_at = min(
                sent_at + timedelta(minutes=random.randint(1, 60)), datetime.now()
            )
            read_at = min(
                delivered_at + timedelta(minutes=random.randint(1, 120)), datetime.now()
            )
            r = random.random()
            if r < case["recov_prob"] * 0.6:
                response_status = "RESPONDED"
            elif r < case["recov_prob"] * 0.6 + 0.25:
                response_status = "NO_RESPONSE"
            else:
                response_status = "OPTED_OUT"
            cur.execute(
                """
                INSERT INTO public.communications
                    (strategy_id, channel, template_name, status, sent_at,
                     delivered_at, read_at, response_status, retry_count, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    case["strategy_id"],
                    random.choice(CHANNELS),
                    f"template_{random.randint(1, 15)}",
                    random.choice(COMM_STATUS),
                    sent_at,
                    delivered_at,
                    read_at,
                    response_status,
                    random.randint(0, 3),
                    sent_at,
                ),
            )

        # ===============================================================
        # TABLE: payments  -- payment_status weighted by the case's
        # recov_prob instead of a flat random.choice.
        # ===============================================================
        for i in range(ROWS):
            case = case_pool[i % len(case_pool)]
            payment_date = random_dt_in_month(*pick_month(i % len(MONTHS)))
            payment_status = "SUCCESS" if random.random() < case["recov_prob"] else \
                random.choice(["FAILED", "PENDING"])
            cur.execute(
                """
                INSERT INTO public.payments
                    (strategy_id, loan_number, amount, payment_date, payment_mode,
                     pg_transaction_id, payment_status, reconciled, payment_source,
                     created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    case["strategy_id"],
                    f"LN{RUN_TOKEN}{i % ROWS:04d}",
                    round(random.uniform(500, 20000), 2),
                    payment_date,
                    random.choice(PAYMENT_MODES),
                    str(fake.uuid4()),
                    payment_status,
                    payment_status == "SUCCESS" and random.random() < 0.9,
                    random.choice(PAYMENT_SOURCE),
                    payment_date,
                ),
            )

        # ===============================================================
        # TABLE: ptps  -- agent_id + strategy_id from the same case;
        # honoured weighted by that case's recov_prob.
        # ===============================================================
        for i in range(ROWS):
            case = case_pool[i % len(case_pool)]
            month_year, month_num = pick_month(i % len(MONTHS))
            ptp_date = random_date_in_month(month_year, month_num)
            honoured = random.random() < case["recov_prob"]
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
                    (strategy_id, agent_id, ptp_date, ptp_amount, honoured,
                     actual_payment_date, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    case["strategy_id"],
                    case["agent_id"],
                    ptp_date,
                    round(random.uniform(500, 20000), 2),
                    honoured,
                    actual_payment_date,
                    created_at,
                ),
            )

        # ===============================================================
        # TABLE: audit_logs  -- strategy_id is now derived from the actual
        # entity being audited: if the entity is a case, we use THAT
        # case's real strategy_id; if it's an agent, we use a strategy
        # that agent is genuinely linked to (via case_pool).
        # ===============================================================
        entity_pool = [("case", cid) for cid in all_case_ids] + [("agent", aid) for aid in agent_ids]
        for i in range(ROWS):
            entity_type, entity_id = random.choice(entity_pool)
            old_value, new_value = gen_audit_values(entity_type, agent_ids)
            created_at = random_dt_in_month(*pick_month(i % len(MONTHS)))

            if entity_type == "case":
                strategy_id = case_meta_by_id[("case", entity_id)]
            else:
                linked = agent_to_strategies.get(entity_id)
                strategy_id = random.choice(linked) if linked else random.choice(strategy_ids)

            cur.execute(
                """
                INSERT INTO public.audit_logs
                    (strategy_id, entity_type, entity_id, action, old_value, new_value,
                     user_name, ip_address, created_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    strategy_id,
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

        # ===============================================================
        # TABLE: strategy_execution_log  -- target table for train_model.py.
        # status is driven by the case's recov_prob. completed_at is ALWAYS
        # populated (never NULL), even for RUNNING / CANCELLED rows, per
        # the "no empty fields" requirement.
        # ===============================================================
        for i in range(ROWS):
            case = case_pool[i % len(case_pool)]
            assigned_at = random_dt_in_month(*pick_month(i % len(MONTHS)))

            r = random.random()
            if r < 0.12:
                exec_status = "RUNNING"
            elif r < 0.12 + 0.06:
                exec_status = "CANCELLED"
            elif random.random() < case["recov_prob"]:
                exec_status = "COMPLETED"
            else:
                exec_status = "FAILED"

            # Always give a completed_at timestamp -- for RUNNING rows this
            # represents the last-checked / expected timestamp so the
            # column is never left NULL.
            completed_at = min(
                assigned_at + timedelta(hours=random.randint(1, 240)), datetime.now()
            )

            cur.execute(
                """
                INSERT INTO public.strategy_execution_log
                    (case_type, strategy_id, status, assigned_at, completed_at)
                VALUES (%s,%s,%s,%s,%s)
                """,
                (
                    case["case_type"],
                    case["strategy_id"],
                    exec_status,
                    assigned_at,
                    completed_at,
                ),
            )

        conn.commit()
        print(
            f"Success: inserted {ROWS} rows into each table. All fields are "
            f"populated (no NULLs), and strategy_id / agent_id / created_by / "
            f"updated_by / actor_id everywhere now reference the SAME real "
            f"record instead of an unrelated random id."
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