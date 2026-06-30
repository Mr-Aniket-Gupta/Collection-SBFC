import random
import uuid
from datetime import datetime, timedelta
 
import psycopg2
import psycopg2.extras
from faker import Faker
 
fake = Faker("en_IN")  # Indian-style fake data (names, etc.)
 
# ------------------------------------------------------------------
# 1. DATABASE CONNECTION SETTINGS -- apne hisaab se change karein
# ------------------------------------------------------------------
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "digital_collection_platform",
    "user": "postgres",            
    "password": "postgres",      
}
 
ROWS_PER_TABLE = 50
 
JOURNEY_TYPES = ["DIGITAL", "TELE", "FIELD", "LEGAL"]
BUCKETS = ["X", "1", "2", "3", "NPA"]
STATUSES_CASE = ["OPEN", "CLOSED", "PENDING", "ESCALATED", "PTP_PENDING"]
STATES = ["Maharashtra", "Karnataka", "Delhi", "Gujarat", "Tamil Nadu", "UP"]
ZONES = ["North", "South", "East", "West", "Central"]
CHANNELS = ["SMS", "WHATSAPP", "EMAIL", "IVR", "CALL"]
COMM_STATUSES = ["SENT", "DELIVERED", "FAILED", "READ"]
PAYMENT_MODES = ["UPI", "NEFT", "CASH", "CARD", "NET_BANKING"]
PAYMENT_STATUSES = ["SUCCESS", "FAILED", "PENDING"]
AGENT_ROLES = ["TELE_CALLER", "FIELD_AGENT", "SUPERVISOR", "LEGAL_OFFICER"]
ALLOC_STATUSES = ["ACTIVE", "CLOSED", "TRANSFERRED"]
STRATEGY_STATUSES = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]
APPROVAL_ACTIONS = ["SUBMITTED", "APPROVED", "REJECTED", "REVERTED"]
APPROVAL_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED"]
ACTOR_ROLES = ["MAKER", "CHECKER", "ADMIN"]
 
 
def rand_date(days_back=180, days_fwd=0):
    start = datetime.now() - timedelta(days=days_back)
    end = datetime.now() + timedelta(days=days_fwd)
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))
 
 
def insert_strategies(cur):
    ids = []
    for i in range(ROWS_PER_TABLE):
        eff_date = rand_date(60, 0).date()
        cur.execute(
            """
            INSERT INTO strategies
                (strategy_name, strategy_code, strategy_version, journey_type,
                 dpd_range_from, dpd_range_to, bucket, product_code, state,
                 customer_segment, outstanding_range_min, outstanding_range_max,
                 priority, effective_date, expiry_date, status, description,
                 created_by, is_active)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
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
                random.choice([True, False]),
            ),
        )
        ids.append(cur.fetchone()[0])
    print(f"  -> {len(ids)} rows inserted into strategies")
    return ids
 
 
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
    for _ in range(ROWS_PER_TABLE):
        principal = round(random.uniform(10000, 300000), 2)
        interest = round(principal * random.uniform(0.02, 0.15), 2)
        cur.execute(
            """
            INSERT INTO cases
                (case_number, pr_number, loan_number, customer_id, journey_type,
                 bucket, dpd, strategy_id, assigned_to, outstanding_principal,
                 outstanding_interest, outstanding_total, status, branch, zone, state)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
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
                random.choice(strategy_ids),  # ab cases.strategy_id BIGINT hai, strategies.strategy_id se real FK match karta hai
                random.choice(agent_ids),
                principal,
                interest,
                round(principal + interest, 2),
                random.choice(STATUSES_CASE),
                fake.city(),
                random.choice(ZONES),
                random.choice(STATES),
            ),
        )
        ids.append(cur.fetchone()[0])
    print(f"  -> {len(ids)} rows inserted into cases")
    return ids
 
 
def insert_allocations(cur, case_ids, agent_ids):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        allocated_at = rand_date(90, 0)
        is_closed = random.choice([True, False])
        cur.execute(
            """
            INSERT INTO allocations
                (case_id, allocated_to, role, allocated_at, deallocated_at,
                 reason, allocation_status)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                random.choice(case_ids),
                random.choice(agent_ids),
                random.choice(AGENT_ROLES),
                allocated_at,
                allocated_at + timedelta(days=random.randint(1, 30)) if is_closed else None,
                fake.sentence(nb_words=6) if is_closed else None,
                random.choice(ALLOC_STATUSES),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into allocations")
 
 
def insert_payments(cur, case_ids):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        cur.execute(
            """
            INSERT INTO payments
                (case_id, loan_number, amount, payment_date, payment_mode,
                 pg_transaction_id, payment_status, reconciled, payment_source)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                random.choice(case_ids),
                f"LN-{random.randint(1000000,9999999)}",
                round(random.uniform(500, 50000), 2),
                rand_date(60, 0),
                random.choice(PAYMENT_MODES),
                f"TXN{uuid.uuid4().hex[:12].upper()}",
                random.choice(PAYMENT_STATUSES),
                random.choice([True, False]),
                random.choice(["APP", "WEB", "BRANCH", "AGENT"]),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into payments")
 
 
def insert_communications(cur, case_ids):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        sent_at = rand_date(60, 0)
        delivered = sent_at + timedelta(minutes=random.randint(1, 60))
        cur.execute(
            """
            INSERT INTO communications
                (case_id, channel, template_name, status, sent_at, delivered_at,
                 read_at, response_status, retry_count)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                random.choice(case_ids),
                random.choice(CHANNELS),
                f"TMPL_{random.choice(['REMINDER','PTP','OVERDUE','THANKYOU'])}",
                random.choice(COMM_STATUSES),
                sent_at,
                delivered,
                delivered + timedelta(minutes=random.randint(1, 120)) if random.random() > 0.3 else None,
                random.choice(["RESPONDED", "NO_RESPONSE", "OPT_OUT"]),
                random.randint(0, 3),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into communications")
 
 
def insert_ptps(cur, case_ids, agent_ids):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        ptp_date = rand_date(30, 30).date()
        honoured = random.choice([True, False, None])
        cur.execute(
            """
            INSERT INTO ptps
                (case_id, agent_id, ptp_date, ptp_amount, honoured, actual_payment_date)
            VALUES (%s,%s,%s,%s,%s,%s)
            """,
            (
                random.choice(case_ids),
                random.choice(agent_ids),
                ptp_date,
                round(random.uniform(1000, 80000), 2),
                honoured,
                ptp_date + timedelta(days=random.randint(0, 5)) if honoured else None,
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
                 user_name, ip_address)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                random.choice(entity_types),
                str(uuid.uuid4()),
                random.choice(actions),
                psycopg2.extras.Json({"status": "OLD_VALUE"}),
                psycopg2.extras.Json({"status": "NEW_VALUE"}),
                fake.user_name(),
                fake.ipv4(),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into audit_logs")
 
 
def insert_strategy_approval_log(cur, strategy_ids):
    count = 0
    for _ in range(ROWS_PER_TABLE):
        cur.execute(
            """
            INSERT INTO strategy_approval_log
                (strategy_id, from_status, to_status, action, actor_id,
                 actor_role, remarks, ip_address)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                random.choice(strategy_ids),
                random.choice(APPROVAL_STATUSES),
                random.choice(APPROVAL_STATUSES),
                random.choice(APPROVAL_ACTIONS),
                random.randint(1, 20),
                random.choice(ACTOR_ROLES),
                fake.sentence(nb_words=8),
                fake.ipv4(),
            ),
        )
        count += 1
    print(f"  -> {count} rows inserted into strategy_approval_log")
 
 
def insert_strategy_steps(cur, strategy_ids):
    count = 0
    for i in range(ROWS_PER_TABLE):
        escalation = random.choice([True, False])
        cur.execute(
            """
            INSERT INTO strategy_steps
                (step_number, step_name, trigger_delay_value, channel,
                 template_code, retry_count, retry_delay_hours,
                 payment_check_before_step, condition_expression,
                 escalation_trigger, escalation_target, status,
                 created_by, strategy_id, is_active)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
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
                random.choice(strategy_ids),
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
        strategy_ids = insert_strategies(cur)
 
        print("Inserting agents...")
        agent_ids = insert_agents(cur)
 
        print("Inserting cases...")
        case_ids = insert_cases(cur, strategy_ids, agent_ids)
 
        print("Inserting allocations...")
        insert_allocations(cur, case_ids, agent_ids)
 
        print("Inserting payments...")
        insert_payments(cur, case_ids)
 
        print("Inserting communications...")
        insert_communications(cur, case_ids)
 
        print("Inserting ptps...")
        insert_ptps(cur, case_ids, agent_ids)
 
        print("Inserting audit_logs...")
        insert_audit_logs(cur)
 
        print("Inserting strategy_approval_log...")
        insert_strategy_approval_log(cur, strategy_ids)
 
        print("Inserting strategy_steps...")
        insert_strategy_steps(cur, strategy_ids)
 
        conn.commit()
        print("\n✅ Sab tables me 50-50 random rows successfully insert ho gaye!")
 
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error aaya, sab changes rollback kar diye gaye: {e}")
        raise
    finally:
        cur.close()
        conn.close()
 
 
if __name__ == "__main__":
    main()