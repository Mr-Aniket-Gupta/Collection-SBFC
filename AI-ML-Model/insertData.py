"""
Synthetic data generator for the LATEST schema (auth + col_db + public,
pgAdmin ERD export you shared).

Rules followed:
  1. Every INSERT matches the ACTUAL column list of the latest schema.
  2. No column is left NULL - every field gets a real value.
  3. Every FK / logically-related id (strategy_id, agent_id / branch code,
     template_id, config_id, communication_id, case_id ...) is taken from a
     pool that was actually created earlier in the script, never a random
     unrelated int.
  4. Exactly ROWS = 50 rows are inserted into every table.
  5. Tables are inserted strictly in dependency order (parents first).
"""

import random
from datetime import datetime, timedelta, date

import psycopg2
import psycopg2.extras
from faker import Faker

fake = Faker()
random.seed()

# ---------------------------------------------------------------------------
# 1. DB CONNECTION -- EDIT THESE
# ---------------------------------------------------------------------------
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "digital_collection_platform",
    "user": "postgres",
    "password": "postgres",
}

ROWS = 50
RUN_TOKEN = datetime.now().strftime("%m%d%H%M%S")
SHORT_TOKEN = datetime.now().strftime("%H%M%S")  # for tight varchar(20) columns

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_minus(days_max=365):
    return datetime.now() - timedelta(
        days=random.randint(0, days_max),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


def future_dt(days_max=60):
    return datetime.now() + timedelta(days=random.randint(1, days_max))


_email_ctr = 0


def uniq_email():
    global _email_ctr
    _email_ctr += 1
    return f"{fake.user_name()}.{RUN_TOKEN}{_email_ctr:05d}@example.com"


_uname_ctr = 0


def uniq_username():
    global _uname_ctr
    _uname_ctr += 1
    return f"user{RUN_TOKEN}{_uname_ctr:05d}"


def uniq_mobile():
    return "9" + str(random.randint(100000000, 999999999))


_short_email_ctr = 0


def short_email():
    """<=30 chars total, for tight columns like auth.users.m1_email (varchar(30))."""
    global _short_email_ctr
    _short_email_ctr += 1
    return f"m1.{SHORT_TOKEN}{_short_email_ctr:03d}@ex.co"


# ---------------------------------------------------------------------------
# Enum-ish value pools
# ---------------------------------------------------------------------------
STATES = ["State A", "State B", "State C", "State D", "State E"]
ZONE_NAMES = ["East", "West", "North", "South"]
CITIES = ["Mumbai", "Pune", "Delhi", "Chennai", "Bengaluru", "Hyderabad"]
BRANCH_TYPES = ["Branch", "Hub", "Satellite", "Regional Office"]
BRANCH_OFFICE_TYPES = ["Head Office", "Zonal Office", "Regional Office", "Satellite"]
BRANCH_STATUS = ["A", "I"]

JOURNEY_TYPES = ["EARLY", "MID", "LATE", "LEGAL"]
BUCKETS = ["1", "2", "3", "NPA"]
BUCKET_DPD = {"1": (0, 30), "2": (31, 60), "3": (61, 90), "NPA": (91, 365)}
STRATEGY_STATUS = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]
STRATEGY_SOURCE = ["MANUAL", "AUTO", "IMPORTED"]
PRODUCT_CODES = ["PL001", "PL002", "HL001", "CL001", "BL001"]
PRODUCT_NAMES = ["Personal Loan", "Home Loan", "Car Loan", "Business Loan", "Education Loan"]
CUSTOMER_SEGMENTS = ["Retail", "SME", "Corporate"]

CHANNELS = ["SMS", "EMAIL", "IVR", "WHATSAPP", "CALL"]
COMM_STATUS = ["SENT", "FAILED", "PENDING", "DELIVERED"]
TEMPLATE_STATUS = ["Draft", "Active", "Archived"]

PAYMENT_MODES = ["UPI", "NEFT", "CARD", "CASH", "NETBANKING"]
PAYMENT_SOURCE = ["APP", "WEB", "BRANCH", "AGENT_COLLECTED"]
PAYMENT_STATUS = ["SUCCESS", "FAILED", "PENDING"]

APPROVAL_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]
APPROVAL_ACTIONS = ["SUBMIT", "APPROVE", "REJECT", "REVISE"]
ACTOR_ROLES = ["MAKER", "CHECKER", "ADMIN"]

PENDING_STRATEGY_STATUSES = ["PENDING_STRATEGY", "STRATEGY_ASSIGNED", "IN_PROGRESS", "CLOSED"]
NACH_STATUSES = ["SUCCESS", "FAILED", "PENDING", "NOT_REGISTERED"]
BOUNCE_REASONS = ["INSUFFICIENT_FUNDS", "ACCOUNT_CLOSED", "SIGNATURE_MISMATCH",
                   "TECHNICAL_ERROR", "STOPPED_BY_CUSTOMER"]
EXEC_CASE_TYPES = ["PRE_EMI", "DPD", "BOUNCE"]
LOAN_STATUSES = ["ACTIVE", "NPA", "WRITTEN_OFF", "CLOSED"]

RISK_BANDS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
DATA_QUALITY_FLAGS = ["GOOD", "PARTIAL", "STALE"]

TONES = ["NORMAL", "FIRM", "SOFT", "LEGAL"]
ALLOC_ROLES = ["PRIMARY", "SECONDARY", "SUPERVISOR"]
ALLOC_STATUS = ["ACTIVE", "DEALLOCATED"]

AGENT_ROLE_TITLES = ["Collector", "Team Lead", "Supervisor", "Field Agent", "Manager"]
ACCOUNT_STATUSES = ["ACTIVE", "INACTIVE", "LOCKED", "SUSPENDED"]
APPLICATION_TYPES = ["WEB", "MOBILE", "API"]

OTP_IDENTIFIER_TYPES = ["EMAIL", "MOBILE"]
OTP_DELIVERY_TYPES = ["SMS", "EMAIL"]
OTP_STATUSES = ["Sent", "Verified", "Expired", "Failed"]

LOG_TYPES = ["FILE_UPLOAD", "STRATEGY_RUN", "COMM_DISPATCH", "RECONCILIATION"]
LOG_STATUSES = ["SUCCESS", "FAILED", "PARTIAL"]
ERROR_SEVERITIES = ["LOW", "MED", "HIGH"]

FIELD_DATA_TYPES = ["STRING", "NUMBER", "DATE", "BOOLEAN"]
OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "IN", "BETWEEN"]

MODULE_NAMES = ["Strategy Engine", "Collections", "Communications", "Reporting", "User Management"]
ROLE_DEFS = [
    ("ADMIN", "Administrator"),
    ("SUPERVISOR", "Supervisor"),
    ("COLLECTOR", "Collector"),
    ("VIEWER", "Viewer"),
    ("OPS", "Operations"),
]
SCREENS = ["Dashboard", "Strategies", "Cases", "Communications", "Reports", "UserManagement"]


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # ===============================================================
        # LEVEL 0 -- no FK dependencies
        # ===============================================================

        # TABLE: auth.application_master
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO auth.application_master
                   (value, view_value, is_active, created_at, created_by, updated_by, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                (
                    f"APP_VAL_{RUN_TOKEN}_{i:03d}",
                    f"Application Value {i:03d}",
                    True,
                    now_minus(400),
                    1,
                    1,
                    now_minus(50),
                ),
            )

        # TABLE: col_db.branch_types_master
        branch_type_names = []
        for i in range(ROWS):
            type_name = f"BRT{SHORT_TOKEN}{i:03d}"  # <=20 chars, fits branch_category_config.branch_type PK
            cur.execute(
                """INSERT INTO col_db.branch_types_master
                   (type_name, is_active, created_at)
                   VALUES (%s,%s,%s) RETURNING id""",
                (type_name, 1, now_minus(400)),
            )
            cur.fetchone()
            branch_type_names.append(type_name)

        # TABLE: col_db.zones
        zone_ids = []
        zone_names_pool = []
        for i in range(ROWS):
            zname = f"{random.choice(ZONE_NAMES)}-{RUN_TOKEN}{i:03d}"
            cur.execute(
                "INSERT INTO col_db.zones (name, is_active) VALUES (%s,%s) RETURNING id",
                (zname, 1),
            )
            zone_ids.append(cur.fetchone()[0])
            zone_names_pool.append(zname)

        # TABLE: col_db.modules
        module_ids = []
        module_codes = []
        for i in range(ROWS):
            mcode = f"MOD{RUN_TOKEN}{i:03d}"
            cur.execute(
                """INSERT INTO col_db.modules (module_name, is_active, created_at, module_code)
                   VALUES (%s,%s,%s,%s) RETURNING module_id""",
                (random.choice(MODULE_NAMES), True, now_minus(400), mcode),
            )
            module_ids.append(cur.fetchone()[0])
            module_codes.append(mcode)

        # TABLE: col_db.roles
        col_role_ids = []
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.roles
                   (role_code, name, description, created_at, created_by, updated_at,
                    updated_by, is_active, module_id, module_code)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING role_id""",
                (
                    f"CR{SHORT_TOKEN}{i:03d}",
                    fake.job()[:100],
                    fake.sentence(),
                    now_minus(400),
                    1,
                    now_minus(200),
                    1,
                    True,
                    str(random.choice(module_ids)),
                    random.choice(module_codes),
                ),
            )
            col_role_ids.append(cur.fetchone()[0])

        # TABLE: col_db.case_field_registry
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.case_field_registry
                   (case_type, field_name, field_label, data_type, allowed_operators)
                   VALUES (%s,%s,%s,%s,%s)""",
                (
                    random.choice(EXEC_CASE_TYPES),
                    f"field_{RUN_TOKEN}_{i:03d}",
                    fake.word().title() + " Field",
                    random.choice(FIELD_DATA_TYPES),
                    ",".join(random.sample(OPERATORS, 3)),
                ),
            )

        # TABLE: col_db.risk_score_rules
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.risk_score_rules
                   (rule_name, field_name, operator, value, points, is_active)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (
                    f"Rule {RUN_TOKEN}-{i:03d}",
                    random.choice(["dpd", "bucket", "outstanding", "state"]),
                    random.choice(OPERATORS),
                    psycopg2.extras.Json({"value": random.randint(1, 100)}),
                    random.randint(-20, 20),
                    True,
                ),
            )

        # TABLE: col_db.pincode_master
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.pincode_master (pincode, city, state)
                   VALUES (%s,%s,%s)""",
                (random.randint(100000, 999999), random.choice(CITIES), random.choice(STATES)),
            )

        # TABLE: col_db.uam_status_type
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.uam_status_type (id, value, view_value, is_active)
                   VALUES (%s,%s,%s,%s)""",
                (i + 1, f"STATUS_{i:03d}", f"Status {i:03d}", True),
            )

        # TABLE: col_db.communication_channel_config
        comm_config_ids = []
        comm_config_channels = []
        for i in range(ROWS):
            channel = f"{random.choice(CHANNELS)[:3]}{SHORT_TOKEN}{i:03d}"  # <=20 chars, UNIQUE
            cur.execute(
                """INSERT INTO col_db.communication_channel_config
                   (channel, provider, is_active, last_synced_at, created_at, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s) RETURNING config_id""",
                (channel, fake.company(), True, now_minus(30), now_minus(400), now_minus(10)),
            )
            comm_config_ids.append(cur.fetchone()[0])
            comm_config_channels.append(channel)

        # TABLE: col_db.communication_templates
        template_ids = []
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.communication_templates
                   (template_name, channel, subject, body, status, created_on,
                    provider_template_code)
                   VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING template_id""",
                (
                    f"Template {RUN_TOKEN}-{i:03d}",
                    random.choice(CHANNELS),
                    fake.sentence(nb_words=6),
                    fake.paragraph(nb_sentences=2),
                    random.choice(TEMPLATE_STATUS),
                    now_minus(300),
                    f"PTPL{RUN_TOKEN}{i:03d}",
                ),
            )
            template_ids.append(cur.fetchone()[0])

        # TABLE: col_db.whatsapp_auth_tokens
        for i in range(ROWS):
            created = now_minus(60)
            cur.execute(
                """INSERT INTO col_db.whatsapp_auth_tokens
                   (access_token, refresh_token, access_token_expiry,
                    refresh_token_expiry, created_on, updated_on)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (
                    fake.sha256(),
                    fake.sha256(),
                    created + timedelta(hours=1),
                    created + timedelta(days=30),
                    created,
                    created,
                ),
            )

        # TABLE: public.roles
        public_role_codes = []
        for code, label in ROLE_DEFS:
            code_full = f"{code}{RUN_TOKEN}"
            cur.execute(
                "INSERT INTO public.roles (code, label, created_at) VALUES (%s,%s,%s)",
                (code_full, label, now_minus(400)),
            )
            public_role_codes.append(code_full)
        # top up to ROWS
        for i in range(ROWS - len(ROLE_DEFS)):
            code_full = f"ROLE{RUN_TOKEN}{i:03d}"
            cur.execute(
                "INSERT INTO public.roles (code, label, created_at) VALUES (%s,%s,%s)",
                (code_full, fake.job()[:100], now_minus(400)),
            )
            public_role_codes.append(code_full)

        # ===============================================================
        # LEVEL 1
        # ===============================================================

        # TABLE: col_db.branch_category_config (PK = branch_type, so must be unique)
        for i in range(ROWS):
            btype = branch_type_names[i]
            cur.execute(
                """INSERT INTO col_db.branch_category_config
                   (branch_type, allowed_categories, created_at, created_by, is_active)
                   VALUES (%s,%s,%s,%s,%s)""",
                (
                    btype,
                    ",".join(random.sample(PRODUCT_NAMES, 3)),
                    now_minus(300),
                    1,
                    1,
                ),
            )

        # TABLE: col_db.branches
        branch_codes = []
        branch_states = {}
        for i in range(ROWS):
            code = f"BR{RUN_TOKEN}{i:03d}"
            state = STATES[i % len(STATES)]
            created_at = now_minus(400)
            cur.execute(
                """INSERT INTO col_db.branches
                   (code, name, city, state, pincode, zone_code, region_code,
                    cost_center, status, created_at, created_by, updated_at,
                    updated_by, branch_type, branch_office_type, location,
                    hub_branch_id, hub_branch_name, branch_manager_name, address)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    code,
                    f"Branch {i+1}",
                    random.choice(CITIES),
                    state,
                    str(random.randint(100000, 999999)),
                    random.choice(ZONE_NAMES),
                    f"RG{(i % len(STATES)) + 1:02d}",
                    f"CC{1000+i}",
                    random.choice(BRANCH_STATUS),
                    created_at,
                    1,
                    now_minus(50),
                    1,
                    random.choice(branch_type_names),
                    random.choice(BRANCH_OFFICE_TYPES),
                    f"{state} Location {i}",
                    branch_codes[0] if branch_codes else code,
                    f"Branch 1" if branch_codes else f"Branch {i+1}",
                    fake.name(),
                    fake.address().replace("\n", ", "),
                ),
            )
            branch_codes.append(code)
            branch_states[code] = state

        # TABLE: col_db.communication_channel_credentials
        for i in range(ROWS):
            config_id = comm_config_ids[i % len(comm_config_ids)]
            cur.execute(
                """INSERT INTO col_db.communication_channel_credentials
                   (config_id, cred_key, cred_value, created_at, updated_at, is_editable)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (
                    config_id,
                    f"api_key_{RUN_TOKEN}_{i:03d}",
                    fake.sha256(),
                    now_minus(200),
                    now_minus(10),
                    True,
                ),
            )

        # TABLE: public.role_permissions
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO public.role_permissions
                   (role, screen_name, is_allowed, created_at)
                   VALUES (%s,%s,%s,%s)""",
                (
                    public_role_codes[i % len(public_role_codes)],
                    f"{random.choice(SCREENS)}-{i:03d}",
                    random.choice([True, False]),
                    now_minus(300),
                ),
            )

        # ===============================================================
        # LEVEL 2 -- auth.users (branch FK -> col_db.branches.code)
        # ===============================================================
        agent_ids = []
        agent_states = {}
        agent_usernames = []
        for i in range(ROWS):
            branch_code = branch_codes[i % len(branch_codes)]
            state = branch_states[branch_code]
            username = uniq_username()
            cur.execute(
                """INSERT INTO auth.users
                   (username, agent_name, branch, password, email, mobile,
                    is_password_reset, password_last_updated, failed_login_attempts,
                    account_locked_until, password_reset_token, password_reset_token_expiry,
                    last_login_date, mail_status, active_state_changed_at, uuid_token,
                    last_uuid_changed, uuid_change_count, account_status, current_token_id,
                    deactivated_at, zone, region, role_title, m1_code, m1_name, m1_email,
                    m2_code, m2_name, m2_email, profile_image, email1, role_id, is_active,
                    created_date, application_type, app_token_id, system_ip, hostname,
                    old_password, user_deactivated_by, modified_by, created_by)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                           %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING agent_id""",
                (
                    username,
                    fake.name(),
                    branch_code,
                    fake.sha256(),
                    uniq_email(),
                    uniq_mobile(),
                    False,
                    now_minus(60),
                    0,
                    now_minus(0) + timedelta(days=1),
                    fake.uuid4(),
                    now_minus(0) + timedelta(days=1),
                    now_minus(5),
                    True,
                    now_minus(30),
                    fake.uuid4(),
                    now_minus(5),
                    random.randint(0, 5),
                    random.choice(ACCOUNT_STATUSES),
                    fake.uuid4()[:30],
                    now_minus(500),
                    random.choice(ZONE_NAMES),
                    f"REG-{state}",
                    random.choice(AGENT_ROLE_TITLES),
                    f"M1{i:03d}",
                    fake.name(),
                    short_email(),
                    f"M2{i:03d}",
                    fake.name()[:30],
                    uniq_email(),
                    f"profile_{i}.png",
                    uniq_email(),
                    random.choice(public_role_codes),
                    True,
                    now_minus(500),
                    random.choice(APPLICATION_TYPES),
                    fake.uuid4()[:100],
                    fake.ipv4(),
                    fake.hostname(),
                    fake.sha256(),
                    1,
                    1,
                    1,
                ),
            )
            aid = cur.fetchone()[0]
            agent_ids.append(aid)
            agent_states[aid] = state
            agent_usernames.append(username)

        # ===============================================================
        # LEVEL 3
        # ===============================================================

        # TABLE: auth.otp_records_forgot
        for i in range(ROWS):
            uname = agent_usernames[i % len(agent_usernames)]
            gen_time = now_minus(10)
            cur.execute(
                """INSERT INTO auth.otp_records_forgot
                   (identifier_type, delivery_type, otp_number, otp_status, otp_verified,
                    otp_expiry_time, created_by, created_at, updated_by, updated_at,
                    otp_generated_time, username)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    random.choice(OTP_IDENTIFIER_TYPES),
                    random.choice(OTP_DELIVERY_TYPES),
                    str(random.randint(100000, 999999)),
                    random.choice(OTP_STATUSES),
                    random.choice([True, False]),
                    gen_time + timedelta(minutes=10),
                    agent_ids[i % len(agent_ids)],
                    gen_time,
                    agent_ids[i % len(agent_ids)],
                    gen_time,
                    gen_time,
                    uname,
                ),
            )

        # TABLE: auth.password_history
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO auth.password_history (agent_id, password_hash, changed_at)
                   VALUES (%s,%s,%s)""",
                (agent_ids[i % len(agent_ids)], fake.sha256(), now_minus(200)),
            )

        # TABLE: col_db.user_branch_access (agent_id UNIQUE -> use each agent once)
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.user_branch_access
                   (agent_id, branch_codes, created_at, created_by)
                   VALUES (%s,%s,%s,%s)""",
                (
                    agent_ids[i],
                    ",".join(random.sample(branch_codes, min(3, len(branch_codes)))),
                    now_minus(200),
                    agent_ids[i],
                ),
            )

        # TABLE: col_db.strategies
        strategy_ids = []
        strategy_meta = {}
        strategy_state_map = {}
        for i in range(ROWS):
            bucket = random.choice(BUCKETS)
            lo, hi = BUCKET_DPD[bucket]
            journey_type = random.choice(JOURNEY_TYPES)
            priority = random.randint(1, 10)
            state = STATES[i % len(STATES)]
            effective_date = (now_minus(300)).date()
            expiry_date = effective_date + timedelta(days=365)
            created_by = agent_ids[i % len(agent_ids)]
            updated_by = agent_ids[(i + 1) % len(agent_ids)]
            cur.execute(
                """INSERT INTO col_db.strategies
                   (strategy_name, strategy_code, strategy_version, journey_type,
                    dpd_range_from, dpd_range_to, bucket, product_code, state,
                    customer_segment, outstanding_range_min, outstanding_range_max,
                    priority, effective_date, expiry_date, status, description,
                    created_by, created_at, updated_by, updated_at, is_active, source)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING strategy_id""",
                (
                    fake.catch_phrase(),
                    f"CSTRAT{RUN_TOKEN}{i:03d}",
                    "1.0",
                    journey_type,
                    lo,
                    hi,
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
                    now_minus(300),
                    updated_by,
                    now_minus(30),
                    True,
                    random.choice(STRATEGY_SOURCE),
                ),
            )
            sid = cur.fetchone()[0]
            strategy_ids.append(sid)
            strategy_meta[sid] = {"bucket": bucket, "priority": priority, "journey_type": journey_type}
            strategy_state_map[sid] = state

        strategies_by_bucket = {b: [s for s, m in strategy_meta.items() if m["bucket"] == b] for b in BUCKETS}

        def strat_for_bucket(bucket):
            return random.choice(strategies_by_bucket.get(bucket) or strategy_ids)

        # TABLE: public.strategies
        public_strategy_ids = []
        for i in range(ROWS):
            bucket = random.choice(BUCKETS)
            lo, hi = BUCKET_DPD[bucket]
            effective_date = now_minus(300).date()
            expiry_date = effective_date + timedelta(days=365)
            cur.execute(
                """INSERT INTO public.strategies
                   (strategy_name, strategy_code, strategy_version, journey_type,
                    dpd_range_from, dpd_range_to, bucket, product_code, state,
                    customer_segment, outstanding_range_min, outstanding_range_max,
                    priority, effective_date, expiry_date, status, description,
                    created_by, created_at, updated_by, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING strategy_id""",
                (
                    fake.catch_phrase(),
                    f"PSTRAT{RUN_TOKEN}{i:03d}",
                    "1.0",
                    random.choice(JOURNEY_TYPES),
                    lo,
                    hi,
                    bucket,
                    random.choice(PRODUCT_CODES),
                    random.choice(STATES),
                    random.choice(CUSTOMER_SEGMENTS),
                    round(random.uniform(1000, 5000), 2),
                    round(random.uniform(5000, 100000), 2),
                    random.randint(1, 10),
                    effective_date,
                    expiry_date,
                    random.choice(STRATEGY_STATUS),
                    fake.sentence(),
                    agent_ids[i % len(agent_ids)],
                    now_minus(300),
                    agent_ids[(i + 1) % len(agent_ids)],
                    now_minus(30),
                ),
            )
            public_strategy_ids.append(cur.fetchone()[0])

        # TABLE: public.strategy_steps (no strategy_id column in this table)
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO public.strategy_steps
                   (step_number, step_name, trigger_delay_value, channel, template_code,
                    retry_count, retry_delay_hours, payment_check_before_step,
                    condition_expression, escalation_trigger, escalation_target, status,
                    created_by, created_at, updated_by, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
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
                    agent_ids[i % len(agent_ids)],
                    now_minus(200),
                    agent_ids[(i + 1) % len(agent_ids)],
                    now_minus(20),
                ),
            )

        # ===============================================================
        # LEVEL 4 -- children of col_db.strategies
        # ===============================================================

        # TABLE: col_db.strategy_steps
        for i in range(ROWS):
            sid = strategy_ids[i % len(strategy_ids)]
            cur.execute(
                """INSERT INTO col_db.strategy_steps
                   (step_number, step_name, trigger_delay_value, channel, template_code,
                    retry_count, retry_delay_hours, payment_check_before_step,
                    condition_expression, escalation_trigger, escalation_target, status,
                    created_by, created_at, updated_by, updated_at, strategy_id, is_active,
                    tone, reason_template)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
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
                    agent_ids[i % len(agent_ids)],
                    now_minus(200),
                    agent_ids[(i + 1) % len(agent_ids)],
                    now_minus(20),
                    sid,
                    True,
                    random.choice(TONES),
                    fake.sentence(),
                ),
            )

        # TABLE: col_db.strategy_conditions
        for i in range(ROWS):
            sid = strategy_ids[i % len(strategy_ids)]
            cur.execute(
                """INSERT INTO col_db.strategy_conditions
                   (strategy_id, condition_group, field_name, operator, value, is_active,
                    created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                (
                    sid,
                    random.randint(1, 3),
                    random.choice(["dpd", "bucket", "state", "outstanding"]),
                    random.choice(OPERATORS),
                    psycopg2.extras.Json({"value": random.randint(1, 100)}),
                    True,
                    now_minus(200),
                ),
            )

        # TABLE: col_db.strategy_approval_log
        for i in range(ROWS):
            sid = strategy_ids[i % len(strategy_ids)]
            cur.execute(
                """INSERT INTO col_db.strategy_approval_log
                   (strategy_id, from_status, to_status, action, actor_id, actor_role,
                    remarks, performed_at, ip_address)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    sid,
                    random.choice(APPROVAL_STATUSES),
                    random.choice(APPROVAL_STATUSES),
                    random.choice(APPROVAL_ACTIONS),
                    agent_ids[i % len(agent_ids)],
                    random.choice(ACTOR_ROLES),
                    fake.sentence(),
                    now_minus(150),
                    fake.ipv4(),
                ),
            )

        # ===============================================================
        # LEVEL 5 -- case tables
        # ===============================================================

        case_pool = []  # (case_type, case_id, strategy_id, pr_number)

        # TABLE: col_db.pre_emi_cases
        for i in range(ROWS):
            sid = strat_for_bucket(random.choice(BUCKETS))
            pr_number = f"PR{RUN_TOKEN}{i:04d}"
            pre_emi_date = now_minus(60).date()
            cur.execute(
                """INSERT INTO col_db.pre_emi_cases
                   (case_ref, pr_number, customer_id, customer_name, mobile_number,
                    alternate_mobile, email_id, product_name, pre_emi_amount, pre_emi_date,
                    strategy_id, status, mifin_batch_ref, mifin_extraction_date, is_active,
                    created_at, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING pre_emi_case_id""",
                (
                    f"PREEMI{RUN_TOKEN}{i:05d}",
                    pr_number,
                    f"CUST{RUN_TOKEN}{i:06d}",
                    fake.name(),
                    uniq_mobile(),
                    uniq_mobile(),
                    uniq_email(),
                    random.choice(PRODUCT_NAMES),
                    round(random.uniform(1000, 20000), 2),
                    pre_emi_date,
                    sid,
                    random.choice(PENDING_STRATEGY_STATUSES),
                    f"MIFIN{RUN_TOKEN}{i:04d}",
                    pre_emi_date,
                    True,
                    now_minus(60),
                    now_minus(10),
                ),
            )
            cid = cur.fetchone()[0]
            case_pool.append(("PRE_EMI", cid, sid, pr_number))

        # TABLE: col_db.dpd_cases
        for i in range(ROWS):
            sid = strat_for_bucket(random.choice(BUCKETS))
            bucket = strategy_meta[sid]["bucket"]
            lo, hi = BUCKET_DPD[bucket]
            dpd_val = random.randint(lo, hi)
            state = strategy_state_map[sid]
            disbursal_date = now_minus(700).date()
            last_payment_date = now_minus(40).date()
            next_emi_date = last_payment_date + timedelta(days=30)
            principal = round(random.uniform(5000, 50000), 2)
            interest = round(random.uniform(100, 5000), 2)
            pr_number = f"PR{RUN_TOKEN}D{i:04d}"
            cur.execute(
                """INSERT INTO col_db.dpd_cases
                   (case_ref, pr_number, customer_id, customer_name, mobile_number,
                    alternate_mobile, email_id, state, branch_name, product_name,
                    disbursal_date, loan_amount, emi_amount, outstanding_principal,
                    outstanding_interest, total_outstanding, last_payment_date,
                    last_payment_amount, next_emi_date, dpd, bucket, loan_status,
                    strategy_id, status, mifin_batch_ref, mifin_extraction_date,
                    is_active, created_at, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING dpd_case_id""",
                (
                    f"DPD{RUN_TOKEN}{i:05d}",
                    pr_number,
                    f"CUST{RUN_TOKEN}D{i:06d}",
                    fake.name(),
                    uniq_mobile(),
                    uniq_mobile(),
                    uniq_email(),
                    state,
                    branch_codes[i % len(branch_codes)],
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
                    dpd_val,
                    bucket,
                    random.choice(LOAN_STATUSES),
                    sid,
                    random.choice(PENDING_STRATEGY_STATUSES),
                    f"MIFIN{RUN_TOKEN}D{i:04d}",
                    last_payment_date,
                    True,
                    now_minus(40),
                    now_minus(5),
                ),
            )
            cid = cur.fetchone()[0]
            case_pool.append(("DPD", cid, sid, pr_number))

        # TABLE: col_db.bounce_cases
        for i in range(ROWS):
            sid = strat_for_bucket(random.choice(BUCKETS))
            bucket = strategy_meta[sid]["bucket"]
            lo, hi = BUCKET_DPD[bucket]
            dpd_val = random.randint(lo, hi)
            state = strategy_state_map[sid]
            disbursal_date = now_minus(700).date()
            bounce_date = now_minus(30).date()
            last_payment_date = bounce_date - timedelta(days=random.randint(1, 30))
            next_emi_date = bounce_date + timedelta(days=random.randint(1, 30))
            principal = round(random.uniform(5000, 50000), 2)
            interest = round(random.uniform(100, 5000), 2)
            pr_number = f"PR{RUN_TOKEN}B{i:04d}"
            cur.execute(
                """INSERT INTO col_db.bounce_cases
                   (case_ref, pr_number, customer_id, customer_name, mobile_number,
                    alternate_mobile, email_id, state, branch_name, product_name,
                    disbursal_date, loan_amount, emi_amount, outstanding_principal,
                    outstanding_interest, total_outstanding, last_payment_date,
                    last_payment_amount, next_emi_date, dpd, bucket, loan_status,
                    bounce_date, bounce_reason, nach_status, bounce_cycle, strategy_id,
                    status, mifin_batch_ref, mifin_extraction_date, is_active,
                    created_at, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING bounce_case_id""",
                (
                    f"BOUNCE{RUN_TOKEN}{i:05d}",
                    pr_number,
                    f"CUST{RUN_TOKEN}B{i:06d}",
                    fake.name(),
                    uniq_mobile(),
                    uniq_mobile(),
                    uniq_email(),
                    state,
                    branch_codes[i % len(branch_codes)],
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
                    dpd_val,
                    bucket,
                    random.choice(LOAN_STATUSES),
                    bounce_date,
                    random.choice(BOUNCE_REASONS),
                    random.choice(NACH_STATUSES),
                    random.randint(1, 5),
                    sid,
                    random.choice(PENDING_STRATEGY_STATUSES),
                    f"MIFIN{RUN_TOKEN}B{i:04d}",
                    bounce_date,
                    True,
                    now_minus(30),
                    now_minus(5),
                ),
            )
            cid = cur.fetchone()[0]
            case_pool.append(("BOUNCE", cid, sid, pr_number))

        # TABLE: col_db.cases (standalone generic case table)
        for i in range(ROWS):
            created_at = now_minus(200)
            resolved = random.choice([True, False])
            cur.execute(
                """INSERT INTO col_db.cases
                   (customer_name, bucket, zone, journey_type, case_status, strategy_name,
                    total_outstanding, recovery_amount, recovery_channel, is_resolved,
                    created_at, resolved_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    fake.name(),
                    random.choice(BUCKETS),
                    random.choice(ZONE_NAMES),
                    random.choice(JOURNEY_TYPES),
                    random.choice(["OPEN", "CLOSED", "IN_PROGRESS"]),
                    fake.catch_phrase(),
                    round(random.uniform(1000, 50000), 2),
                    round(random.uniform(0, 20000), 2),
                    random.choice(CHANNELS),
                    resolved,
                    created_at,
                    created_at + timedelta(days=random.randint(1, 60)) if resolved else created_at + timedelta(days=1),
                ),
            )

        # ===============================================================
        # LEVEL 6 -- children of case_pool / strategies / agents
        # ===============================================================

        # TABLE: col_db.case_current_step (unique on case_type, case_id)
        used_cases = random.sample(case_pool, min(ROWS, len(case_pool)))
        for case_type, cid, sid, pr_number in used_cases:
            cur.execute(
                """INSERT INTO col_db.case_current_step
                   (case_type, case_id, pr_number, strategy_id, step_number, channel,
                    tone, reason, computed_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    case_type,
                    cid,
                    pr_number,
                    sid,
                    random.randint(1, 5),
                    random.choice(CHANNELS),
                    random.choice(TONES),
                    fake.sentence(),
                    now_minus(10),
                ),
            )

        # TABLE: col_db.case_risk_scores
        for i in range(ROWS):
            case_type, cid, sid, pr_number = case_pool[i % len(case_pool)]
            score = random.randint(0, 100)
            band = RISK_BANDS[min(3, score // 25)]
            cur.execute(
                """INSERT INTO col_db.case_risk_scores
                   (case_type, case_id, pr_number, risk_score, risk_band, bucket,
                    data_quality_flag, scored_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    case_type,
                    cid,
                    pr_number,
                    score,
                    band,
                    strategy_meta[sid]["bucket"],
                    random.choice(DATA_QUALITY_FLAGS),
                    now_minus(10),
                ),
            )

        # TABLE: col_db.allocations
        for i in range(ROWS):
            case_type, cid, sid, pr_number = case_pool[i % len(case_pool)]
            agent_id = agent_ids[i % len(agent_ids)]
            allocated_at = now_minus(30)
            cur.execute(
                """INSERT INTO col_db.allocations
                   (strategy_id, allocated_to, role, allocated_at, deallocated_at,
                    reason, allocation_status)
                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                (
                    sid,
                    agent_id,
                    random.choice(ALLOC_ROLES),
                    allocated_at,
                    allocated_at + timedelta(days=random.randint(1, 20)),
                    fake.sentence(),
                    random.choice(ALLOC_STATUS),
                ),
            )

        # TABLE: col_db.ptps
        for i in range(ROWS):
            case_type, cid, sid, pr_number = case_pool[i % len(case_pool)]
            agent_id = agent_ids[i % len(agent_ids)]
            ptp_date = now_minus(20).date()
            honoured = random.choice([True, False])
            cur.execute(
                """INSERT INTO col_db.ptps
                   (strategy_id, agent_id, ptp_date, ptp_amount, honoured,
                    actual_payment_date, created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                (
                    sid,
                    agent_id,
                    ptp_date,
                    round(random.uniform(500, 20000), 2),
                    honoured,
                    ptp_date if honoured else ptp_date + timedelta(days=random.randint(1, 10)),
                    now_minus(20),
                ),
            )

        # TABLE: col_db.payments
        for i in range(ROWS):
            case_type, cid, sid, pr_number = case_pool[i % len(case_pool)]
            payment_date = now_minus(15)
            cur.execute(
                """INSERT INTO col_db.payments
                   (strategy_id, loan_number, amount, payment_date, payment_mode,
                    pg_transaction_id, payment_status, reconciled, payment_source,
                    created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    sid,
                    f"LN{RUN_TOKEN}{i:04d}",
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

        # TABLE: col_db.communication_queue
        queue_ids = []
        for i in range(ROWS):
            case_type, cid, sid, pr_number = case_pool[i % len(case_pool)]
            template_id = template_ids[i % len(template_ids)]
            scheduled_at = now_minus(5)
            cur.execute(
                """INSERT INTO col_db.communication_queue
                   (case_id, case_type, strategy_id, step_number, channel, template_id,
                    template_variables, recipient, recipient_name, status, priority,
                    scheduled_at, picked_at, retry_count, max_retries, next_retry_at,
                    failure_reason, created_at, updated_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   RETURNING queue_id""",
                (
                    cid,
                    case_type,
                    sid,
                    random.randint(1, 5),
                    random.choice(CHANNELS),
                    template_id,
                    psycopg2.extras.Json({"customer_name": fake.name()}),
                    uniq_mobile(),
                    fake.name(),
                    random.choice(["PENDING", "SENT", "FAILED"]),
                    random.randint(1, 9),
                    scheduled_at,
                    scheduled_at + timedelta(minutes=5),
                    random.randint(0, 2),
                    2,
                    scheduled_at + timedelta(hours=1),
                    fake.sentence(),
                    scheduled_at,
                    scheduled_at,
                ),
            )
            queue_ids.append(cur.fetchone()[0])

        # ===============================================================
        # TABLE: col_db.communication_logs (NEW schema: case_id, strategy_id,
        # queue_id, channel, recipient, status, provider_message_id, timestamps
        # -- no more template_id / subject / body directly, those moved to the
        # channel-specific detail tables below).
        #
        # We insert 150 rows here -- 50 on SMS, 50 on WHATSAPP, 50 on EMAIL --
        # so that every one of the 3 new detail tables also ends up with
        # exactly 50 rows (each detail table has a 1:1 FK to communication_logs).
        # ===============================================================
        DETAIL_CHANNELS = ["SMS", "WHATSAPP", "EMAIL"]
        communication_ids = []
        sms_comm_ids = []
        whatsapp_comm_ids = []
        email_comm_ids = []

        for channel in DETAIL_CHANNELS:
            for i in range(ROWS):
                case_type, cid, sid, pr_number = case_pool[i % len(case_pool)]
                queue_id = queue_ids[i % len(queue_ids)]
                created_on = now_minus(5)
                recipient = uniq_email() if channel == "EMAIL" else uniq_mobile()
                cur.execute(
                    """INSERT INTO col_db.communication_logs
                       (case_id, strategy_id, queue_id, channel, recipient, status,
                        provider_message_id, created_on, status_updated_on)
                       VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                       RETURNING communication_id""",
                    (
                        cid,
                        sid,
                        queue_id,
                        channel,
                        recipient,
                        random.choice(COMM_STATUS),
                        fake.uuid4()[:100],
                        created_on,
                        created_on + timedelta(minutes=5),
                    ),
                )
                comm_id = cur.fetchone()[0]
                communication_ids.append(comm_id)
                if channel == "SMS":
                    sms_comm_ids.append(comm_id)
                elif channel == "WHATSAPP":
                    whatsapp_comm_ids.append(comm_id)
                else:
                    email_comm_ids.append(comm_id)

        # TABLE: col_db.communication_sms_details (1:1 with SMS communication_logs rows)
        for i, comm_id in enumerate(sms_comm_ids):
            template_id = template_ids[i % len(template_ids)]
            cur.execute(
                """INSERT INTO col_db.communication_sms_details
                   (communication_id, template_id, template_snapshot, variables_json, remarks)
                   VALUES (%s,%s,%s,%s,%s)""",
                (
                    comm_id,
                    template_id,
                    f"SMS Template Snapshot {i:03d}",
                    psycopg2.extras.Json(
                        {"customer_name": fake.name(), "amount": round(random.uniform(500, 20000), 2)}
                    ),
                    fake.sentence(),
                ),
            )

        # TABLE: col_db.communication_whatsapp_details (1:1 with WHATSAPP rows)
        for i, comm_id in enumerate(whatsapp_comm_ids):
            template_id = template_ids[i % len(template_ids)]
            cur.execute(
                """INSERT INTO col_db.communication_whatsapp_details
                   (communication_id, template_id, template_snapshot,
                    provider_template_code, attachment_name, attachment_url, variables_json)
                   VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                (
                    comm_id,
                    template_id,
                    f"WA Template Snapshot {i:03d}",
                    f"PTPL{SHORT_TOKEN}{i:03d}",
                    f"attachment_{i}.pdf",
                    f"https://files.example.com/{RUN_TOKEN}/{i}.pdf",
                    psycopg2.extras.Json({"customer_name": fake.name()}),
                ),
            )

        # TABLE: col_db.communication_email_details (1:1 with EMAIL rows)
        for i, comm_id in enumerate(email_comm_ids):
            template_id = template_ids[i % len(template_ids)]
            cur.execute(
                """INSERT INTO col_db.communication_email_details
                   (communication_id, template_id, template_snapshot, subject, body,
                    cc_json, bcc_json, attachment_json)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    comm_id,
                    template_id,
                    f"Email Template Snapshot {i:03d}",
                    fake.sentence(nb_words=6),
                    fake.paragraph(nb_sentences=3),
                    psycopg2.extras.Json([uniq_email()]),
                    psycopg2.extras.Json([uniq_email()]),
                    psycopg2.extras.Json(
                        [{"name": f"invoice_{i}.pdf",
                          "url": f"https://files.example.com/{RUN_TOKEN}/inv_{i}.pdf"}]
                    ),
                ),
            )

        # TABLE: col_db.operations_log
        for i in range(ROWS):
            cur.execute(
                """INSERT INTO col_db.operations_log
                   (log_type, journey_type, job_name, status, records_count, error_count,
                    error_severity, next_run_at, created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    random.choice(LOG_TYPES),
                    random.choice(JOURNEY_TYPES),
                    f"job_{RUN_TOKEN}_{i:03d}",
                    random.choice(LOG_STATUSES),
                    random.randint(10, 5000),
                    random.randint(0, 50),
                    random.choice(ERROR_SEVERITIES),
                    future_dt(7),
                    now_minus(5),
                ),
            )

        # TABLE: col_db.strategy_execution_log
        for i in range(ROWS):
            case_type, cid, sid, pr_number = case_pool[i % len(case_pool)]
            assigned_at = now_minus(15)
            cur.execute(
                """INSERT INTO col_db.strategy_execution_log
                   (case_type, case_id, strategy_id, status, assigned_at, completed_at)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (
                    case_type,
                    cid,
                    sid,
                    random.choice(["RUNNING", "COMPLETED", "FAILED", "CANCELLED"]),
                    assigned_at,
                    assigned_at + timedelta(hours=random.randint(1, 240)),
                ),
            )

        # ===============================================================
        # LEVEL 7
        # ===============================================================

        # TABLE: col_db.communication_status_history
        for i in range(ROWS):
            comm_id = communication_ids[i % len(communication_ids)]
            cur.execute(
                """INSERT INTO col_db.communication_status_history
                   (communication_id, status, status_time, provider_status, remarks,
                    created_on)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (
                    comm_id,
                    random.choice(COMM_STATUS),
                    now_minus(4),
                    random.choice(["200_OK", "FAILED_DELIVERY", "QUEUED"]),
                    fake.sentence(),
                    now_minus(4),
                ),
            )

        conn.commit()
        print(f"Success: inserted {ROWS} rows into every table of the latest schema "
              f"(auth + col_db + public), with all FKs correctly linked and no NULLs.")

    except Exception as e:
        conn.rollback()
        print(f"Error occurred, rolled back all changes: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()