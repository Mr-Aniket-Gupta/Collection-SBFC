import random
import uuid
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from faker import Faker

fake = Faker("en_IN")  # Indian-style fake data (names, etc.)

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "digital_collection_platform",
    "user": "postgres",
    "password": "postgres",
}

ROWS_PER_TABLE = 50

JOURNEY_TYPES = ["DIGITAL", "TELE", "FIELD", "LEGAL"]
BUCKETS = ["1", "2", "3", "NPA"]
STATUSES_CASE = ["OPEN", "CLOSED", "PENDING", "ESCALATED", "PTP_PENDING"]
STATES = ["Maharashtra", "Karnataka", "Delhi", "Gujarat", "Tamil Nadu", "UP"]
ZONES = ["North", "South", "East", "West", "Central"]
CHANNELS = ["SMS", "WHATSAPP", "EMAIL", "Field visit", "CALL"]
COMM_STATUSES = ["SENT", "DELIVERED", "FAILED", "READ"]
PAYMENT_MODES = ["UPI", "NEFT", "CASH", "CARD", "NET_BANKING"]
PAYMENT_STATUSES = ["SUCCESS", "FAILED", "PENDING"]
AGENT_ROLES = ["TELE_CALLER", "FIELD_AGENT", "SUPERVISOR", "LEGAL_OFFICER"]
ALLOC_STATUSES = ["ACTIVE", "CLOSED", "TRANSFERRED"]
STRATEGY_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]
APPROVAL_ACTIONS = ["SUBMITTED", "APPROVED", "REJECTED", "REVERTED"]
APPROVAL_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]
ACTOR_ROLES = ["MAKER", "CHECKER", "ADMIN"]

# (aaj se pichhle 6 mahine tak -- koi future date nahi)
WINDOW_DAYS_BACK = 182  # ~6 months
WINDOW_DAYS_FWD = 0

TODAY_PROB = 0.15  # ~15% rows aaj ki date/time lenge


def today_datetime():
    """
    Aaj ke din (00:00:00 se abhi tak) ka ek random datetime deta hai.
    """
    now = datetime.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    seconds_elapsed = int((now - start_of_day).total_seconds())
    return start_of_day + timedelta(seconds=random.randint(0, max(seconds_elapsed, 1)))


def rand_datetime(days_back=WINDOW_DAYS_BACK, days_fwd=WINDOW_DAYS_FWD):
    """
    Pure random datetime deta hai jo poore din (00:00 - 23:59:59) aur
    poore date-range (days_back se days_fwd tak) me kahin bhi gir sakta hai.
    Isse alag-alag dates AUR alag-alag time of day dono milte hain.
    ~TODAY_PROB chance hai ki seedhe "aaj" ki date mil jaaye.
    """
    if random.random() < TODAY_PROB:
        return today_datetime()
    start = datetime.now() - timedelta(days=days_back)
    end = datetime.now() + timedelta(days=days_fwd)
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def rand_datetime_after(base_dt, max_days_after=30):
    """
    Diye gaye base_dt ke baad (kabhi kabhi pehle bhi 1 din tak) ek random
    datetime deta hai -- ye dependent records (jaise payment ek case ke
    baad) ko realistic banata hai. Result kabhi bhi "today" (now) se
    aage nahi jaata, taaki poora data last-6-months window ke andar rahe.
    ~TODAY_PROB chance hai ki (agar possible ho) seedhe "aaj" ki date mil jaaye.
    """
    now = datetime.now()
    if random.random() < TODAY_PROB and base_dt <= now:
        return today_datetime()
    earliest = base_dt - timedelta(hours=random.randint(0, 24))
    latest = min(base_dt + timedelta(days=max_days_after), now)
    if latest <= earliest:
        latest = earliest + timedelta(seconds=1)
    delta = latest - earliest
    random_seconds = random.randint(0, max(int(delta.total_seconds()), 1))
    return earliest + timedelta(seconds=random_seconds)


def insert_strategies(cur):
    ids = []
    created_dates = []
    for i in range(ROWS_PER_TABLE):
        created_at = rand_datetime(WINDOW_DAYS_BACK, 0)
        eff_date = created_at.date()
        cur.execute(
            """
            INSERT INTO strategies
                (strategy_name, strategy_code, strategy_version, journey_type,
                 dpd_range_from, dpd_range_to, bucket, product_code, state,
                 customer_segment, outstanding_range_min, outstanding_range_max,
                 priority, effective_date, expiry_date, status, description,
                 created_by, created_at, updated_by, updated_at, is_active)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING strategy_id
            """,
            (
                f"{random.choice(BUCKETS)} Bucket Strategy {i+1}",
                f"STRAT-{uuid.uuid4().hex[:8].upper()}",
                "1.0",
                random.choice(JOURNEY_TYPES),
                random.randint(0, 30),
                random.randint(31, 180),
                random.choice(BUCKETS),
                f"PROD-{random.randint(100,999)}",
                random.choice(STATES),
                random.choice(["RETAIL", "SME", "CORPORATE"]),
                round(random.uniform(1000, 5000), 2),
                round(random.uniform(50000, 500000), 2),
                random.randint(1, 10),
                eff_date,
                eff_date + timedelta(days=365),
                random.choice(STRATEGY_STATUSES),
                fake.sentence(nb_words=10),
                random.randint(1, 20),
                created_at,
                random.randint(1, 20) if random.random() > 0.5 else None,
                rand_datetime_after(created_at, 60) if random.random() > 0.5 else None,
                random.choice([True, False]),
            ),
        )
        ids.append(cur.fetchone()[0])
        created_dates.append(created_at)
    print(f"  -> {len(ids)} rows inserted into strategies")
    return ids, created_dates


def insert_agents(cur):
    ids = []
    for _ in range(ROWS_PER_TABLE):
        cur.execute(
            """
            INSERT INTO agents
                (agent_name, role, branch, zone, state, max_capacity,
                 current_load, language, mobile, email, status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING agent_id
            """,
            (
                fake.name(),
                random.choice(AGENT_ROLES),
                fake.city(),
                random.choice(ZONES),
                random.choice(STATES),
                random.randint(50, 200),
                random.randint(0, 50),
                random.choice(["Hindi", "English", "Marathi", "Tamil", "Telugu"]),
                fake.msisdn()[:10],
                fake.unique.email(),
                random.choice(["ACTIVE", "INACTIVE"]),
            ),
        )
        ids.append(cur.fetchone()[0])
    print(f"  -> {len(ids)} rows inserted into agents")
    return ids


def insert_cases(cur, strategy_ids, agent_ids):
    ids = []
    created_dates = []
    for _ in range(ROWS_PER_TABLE):
        principal = round(random.uniform(10000, 300000), 2)
        interest = round(principal * random.uniform(0.02, 0.15), 2)
        created_at = rand_datetime(WINDOW_DAYS_BACK, 0)
        updated_at = rand_datetime_after(created_at, 45)
        cur.execute(
            """
            INSERT INTO cases
                (case_number, pr_number, loan_number, customer_id, journey_type,
                 bucket, dpd, strategy_id, assigned_to, outstanding_principal,
                 outstanding_interest, outstanding_total, status, branch, zone, state,
                 created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING case_id
            """,
            (
                f"CASE-{uuid.uuid4().hex[:10].upper()}",
                f"PR-{random.randint(100000,999999)}",
                f"LN-{random.randint(1000000,9999999)}",
                f"CUST-{random.randint(10000,99999)}",
                random.choice(JOURNEY_TYPES),
                random.choice(BUCKETS),
                random.randint(0, 180),
                random.choice(strategy_ids),
                random.choice(agent_ids),
                principal,
                interest,
                round(principal + interest, 2),
                random.choice(STATUSES_CASE),
                fake.city(),
                random.choice(ZONES),
                random.choice(STATES),
                created_at,
                updated_at,
            ),
        )
        ids.append(cur.fetchone()[0])
        created_dates.append(created_at)
    print(f"  -> {len(ids)} rows inserted into cases")
    return ids, created_dates


def insert_allocations(cur, case_ids_with_dates, agent_ids):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        case_id, case_created = random.choice(case_ids_with_dates)
        allocated_at = rand_datetime_after(case_created, 20)
        is_closed = random.choice([True, False])
        cur.execute(
            """
            INSERT INTO allocations
                (case_id, allocated_to, role, allocated_at, deallocated_at,
                 reason, allocation_status)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                case_id,
                random.choice(agent_ids),
                random.choice(AGENT_ROLES),
                allocated_at,
                rand_datetime_after(allocated_at, 25) if is_closed else None,
                fake.sentence(nb_words=6) if is_closed else None,
                random.choice(ALLOC_STATUSES),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into allocations")


def insert_payments(cur, case_ids_with_dates):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        case_id, case_created = random.choice(case_ids_with_dates)
        payment_date = rand_datetime_after(case_created, 60)
        cur.execute(
            """
            INSERT INTO payments
                (case_id, loan_number, amount, payment_date, payment_mode,
                 pg_transaction_id, payment_status, reconciled, payment_source,
                 created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                case_id,
                f"LN-{random.randint(1000000,9999999)}",
                round(random.uniform(500, 50000), 2),
                payment_date,
                random.choice(PAYMENT_MODES),
                f"TXN{uuid.uuid4().hex[:12].upper()}",
                random.choice(PAYMENT_STATUSES),
                random.choice([True, False]),
                random.choice(["APP", "WEB", "BRANCH", "AGENT"]),
                payment_date,
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into payments")


def insert_communications(cur, case_ids_with_dates):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        case_id, case_created = random.choice(case_ids_with_dates)
        sent_at = rand_datetime_after(case_created, 60)
        delivered = sent_at + timedelta(minutes=random.randint(1, 60))
        cur.execute(
            """
            INSERT INTO communications
                (case_id, channel, template_name, status, sent_at, delivered_at,
                 read_at, response_status, retry_count, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                case_id,
                random.choice(CHANNELS),
                f"TMPL_{random.choice(['REMINDER','PTP','OVERDUE','THANKYOU'])}",
                random.choice(COMM_STATUSES),
                sent_at,
                delivered,
                delivered + timedelta(minutes=random.randint(1, 120)) if random.random() > 0.3 else None,
                random.choice(["RESPONDED", "NO_RESPONSE", "OPT_OUT"]),
                random.randint(0, 3),
                sent_at,
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into communications")


def insert_ptps(cur, case_ids_with_dates, agent_ids):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        case_id, case_created = random.choice(case_ids_with_dates)
        created_at = rand_datetime_after(case_created, 60)
        ptp_date = created_at.date() + timedelta(days=random.randint(1, 20))
        honoured = random.choice([True, False, None])
        cur.execute(
            """
            INSERT INTO ptps
                (case_id, agent_id, ptp_date, ptp_amount, honoured,
                 actual_payment_date, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                case_id,
                random.choice(agent_ids),
                ptp_date,
                round(random.uniform(1000, 80000), 2),
                honoured,
                ptp_date + timedelta(days=random.randint(0, 5)) if honoured else None,
                created_at,
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into ptps")


def insert_audit_logs(cur):
    count = 0
    entity_types = ["CASE", "PAYMENT", "STRATEGY", "AGENT", "ALLOCATION"]
    actions = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"]
    for _ in range(ROWS_PER_TABLE):
        cur.execute(
            """
            INSERT INTO audit_logs
                (entity_type, entity_id, action, old_value, new_value,
                 user_name, ip_address, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                random.choice(entity_types),
                str(uuid.uuid4()),
                random.choice(actions),
                psycopg2.extras.Json({"status": "OLD_VALUE"}),
                psycopg2.extras.Json({"status": "NEW_VALUE"}),
                fake.user_name(),
                fake.ipv4(),
                rand_datetime(WINDOW_DAYS_BACK, 0),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into audit_logs")


def insert_strategy_approval_log(cur, strategy_ids_with_dates):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        strategy_id, strategy_created = random.choice(strategy_ids_with_dates)
        performed_at = rand_datetime_after(strategy_created, 30)
        cur.execute(
            """
            INSERT INTO strategy_approval_log
                (strategy_id, from_status, to_status, action, actor_id,
                 actor_role, remarks, performed_at, ip_address)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                strategy_id,
                random.choice(APPROVAL_STATUSES),
                random.choice(APPROVAL_STATUSES),
                random.choice(APPROVAL_ACTIONS),
                random.randint(1, 20),
                random.choice(ACTOR_ROLES),
                fake.sentence(nb_words=8),
                performed_at,
                fake.ipv4(),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into strategy_approval_log")


def insert_strategy_steps(cur, strategy_ids_with_dates):
    count = 0
    for i in range(ROWS_PER_TABLE):
        strategy_id, strategy_created = random.choice(strategy_ids_with_dates)
        created_at = rand_datetime_after(strategy_created, 15)
        escalation = random.choice([True, False])
        cur.execute(
            """
            INSERT INTO strategy_steps
                (step_number, step_name, trigger_delay_value, channel,
                 template_code, retry_count, retry_delay_hours,
                 payment_check_before_step, condition_expression,
                 escalation_trigger, escalation_target, status,
                 created_by, created_at, updated_by, updated_at,
                 strategy_id, is_active)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                random.randint(1, 10),
                f"Step {i+1} - {random.choice(['Reminder','Escalation','Followup','Final Notice'])}",
                random.randint(1, 72),
                random.choice(CHANNELS),
                f"TMPL_{random.randint(100,999)}",
                random.randint(0, 5),
                random.randint(1, 48),
                random.choice([True, False]),
                "dpd > 30",
                escalation,
                random.choice(["SUPERVISOR", "LEGAL", "FIELD_AGENT"]) if escalation else None,
                random.choice(["ACTIVE", "INACTIVE"]),
                random.randint(1, 20),
                created_at,
                random.randint(1, 20) if random.random() > 0.5 else None,
                rand_datetime_after(created_at, 30) if random.random() > 0.5 else None,
                strategy_id,
                random.choice([True, False]),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into strategy_steps")


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        print("Inserting strategies...")
        strategy_ids, strategy_dates = insert_strategies(cur)
        strategy_ids_with_dates = list(zip(strategy_ids, strategy_dates))

        print("Inserting agents...")
        agent_ids = insert_agents(cur)

        print("Inserting cases...")
        case_ids, case_dates = insert_cases(cur, strategy_ids, agent_ids)
        case_ids_with_dates = list(zip(case_ids, case_dates))

        print("Inserting allocations...")
        insert_allocations(cur, case_ids_with_dates, agent_ids)

        print("Inserting payments...")
        insert_payments(cur, case_ids_with_dates)

        print("Inserting communications...")
        insert_communications(cur, case_ids_with_dates)

        print("Inserting ptps...")
        insert_ptps(cur, case_ids_with_dates, agent_ids)

        print("Inserting audit_logs...")
        insert_audit_logs(cur)

        print("Inserting strategy_approval_log...")
        insert_strategy_approval_log(cur, strategy_ids_with_dates)

        print("Inserting strategy_steps...")
        insert_strategy_steps(cur, strategy_ids_with_dates)

        conn.commit()
        print("\n✅ Sab tables me 50-50 random rows (pichhle 6 mahine ke andar, alag-alag dates/times ke saath) successfully insert ho gaye!")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error aaya, sab changes rollback kar diye gaye: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()