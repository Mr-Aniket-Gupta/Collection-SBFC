import random
from datetime import date, datetime, timedelta
 
import psycopg2
 
# ---------------------------------------------------------------------
# 1. DB CONNECTION -- apni details yahan fill karein
# ---------------------------------------------------------------------
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "digital_collection_platform",
    "user": "postgres",
    "password": "postgres",
}
 
random.seed(42)  # reproducible dummy data (chaho to hata sakte ho)
 
# ---------------------------------------------------------------------
# 2. MASTER / REFERENCE DATA (ye hi values sab tables me reuse hongi)
# ---------------------------------------------------------------------
# 6 realistic branches -- real city/state/branch names, alag alag zones
# (branch / zone / state linking logic UNCHANGED — jaisa tha waisa hi hai)
# zone_code ab seedha East/West/North/South hi hai (koi prefix/number nahi)
ZONE_CODE_MAP = {"West": "West", "North": "North", "East": "East", "South": "South"}
 
BRANCH_SEED = [
    {"code": "BR001", "name": "Mumbai Andheri Branch", "city": "Mumbai",
     "state": "Maharashtra", "pincode": "400053", "zone": "West",
     "manager": "Rakesh Sharma",
     "address": "2nd Floor, Business Tower, Andheri East, Mumbai, Maharashtra"},
    {"code": "BR002", "name": "Delhi Karol Bagh Branch", "city": "Delhi",
     "state": "Delhi", "pincode": "110005", "zone": "North",
     "manager": "Suresh Iyer",
     "address": "Shop No. 12, Ajmal Khan Road, Karol Bagh, New Delhi"},
    {"code": "BR003", "name": "Kolkata Salt Lake Branch", "city": "Kolkata",
     "state": "West Bengal", "pincode": "700091", "zone": "East",
     "manager": "Priya Banerjee",
     "address": "Sector V, Salt Lake City, Kolkata, West Bengal"},
    {"code": "BR004", "name": "Chennai Anna Nagar Branch", "city": "Chennai",
     "state": "Tamil Nadu", "pincode": "600040", "zone": "South",
     "manager": "Karthik Subramaniam",
     "address": "3rd Avenue, Anna Nagar, Chennai, Tamil Nadu"},
    {"code": "BR005", "name": "Pune Camp Branch", "city": "Pune",
     "state": "Maharashtra", "pincode": "411001", "zone": "West",
     "manager": "Amit Kulkarni",
     "address": "MG Road, Camp Area, Pune, Maharashtra"},
    {"code": "BR006", "name": "Jaipur Malviya Nagar Branch", "city": "Jaipur",
     "state": "Rajasthan", "pincode": "302017", "zone": "North",
     "manager": "Neha Rathore",
     "address": "Central Spine, Malviya Nagar, Jaipur, Rajasthan"},
]
 
BRANCHES = []
for i, s in enumerate(BRANCH_SEED, start=1):
    BRANCHES.append(
        {
            "code": s["code"],
            "name": s["name"],
            "city": s["city"],
            "state": s["state"],
            "pincode": s["pincode"],
            "zone_code": ZONE_CODE_MAP[s["zone"]],
            "region_code": f"RG-{s['state'][:2].upper()}{i:02d}",
            "cost_center": f"CC-{1000 + i}",
            "status": "A",
            "branch_type": "RETAIL",
            "branch_office_type": "FULL_SERVICE",
            "location": s["city"],
            "hub_branch_id": f"HUB{random.randint(1, 3):02d}",
            "hub_branch_name": random.choice(
                ["Mumbai Regional Hub", "Delhi Regional Hub", "Chennai Regional Hub"]
            ),
            "branch_manager_name": s["manager"],
            "address": s["address"],
        }
    )
 
CUSTOMER_NAMES = [
    "Anita Desai", "Vikram Patel", "Sunita Reddy", "Rohan Mehta",
    "Kavita Joshi", "Arjun Nair", "Pooja Verma", "Sanjay Gupta",
    "Meera Iyer", "Rahul Choudhary", "Divya Menon", "Manoj Tiwari",
    "Shreya Kapoor", "Ajay Singh", "Ritu Malhotra", "Deepak Rao",
    "Nisha Agarwal", "Vivek Bhatt", "Swati Pillai", "Karan Chawla",
]
 
AGENT_NAMES = [s["manager"] for s in BRANCH_SEED]
 
PRODUCTS = ["Personal Loan", "Business Loan", "Gold Loan", "Vehicle Loan"]
BUCKETS = ["0-30", "31-60", "61-90", "NPA"]
 
 
def bucket_for_dpd(dpd):
    """DPD value ke hisaab se sahi bucket return karta hai, taaki dpd
    aur bucket hamesha ek dusre se consistent/logical rahein."""
    if dpd <= 30:
        return "0-30"
    elif dpd <= 60:
        return "31-60"
    elif dpd <= 90:
        return "61-90"
    else:
        return "NPA"
CHANNELS = ["SMS", "EMAIL", "MANUAL_CALL", "AI_VOICE", "FIELD_VISIT", "WHATSAPP"]
COMM_STATUS = ["SENT", "DELIVERED", "FAILED", "READ", "QUEUED", "Responded", "Converted"]
 
# --- Naya: extra variety lists (real-world jaisi range of values) ---
LOAN_STATUSES = ["ACTIVE", "NPA", "WRITTEN_OFF", "RESTRUCTURED", "CLOSED"]
CASE_STATUSES = [
    "PENDING_STRATEGY", "IN_PROGRESS", "ASSIGNED", "ESCALATED",
    "RESOLVED", "ON_HOLD", "PTP_TAKEN",
]
BOUNCE_REASONS = [
    "Insufficient Funds", "Account Closed", "Signature Mismatch",
    "Mandate Not Registered", "Payment Stopped by Customer",
    "Exceeds Payment Limit", "Account Frozen",
]
NACH_STATUSES = ["BOUNCED", "PENDING", "PROCESSED", "REPRESENTED"]
PAYMENT_STATUSES = ["SUCCESS", "FAILED", "PENDING", "REVERSED"]
PAYMENT_MODES = ["UPI", "NEFT", "IMPS", "CASH", "CARD", "CHEQUE"]
ACCOUNT_STATUSES = ["ACTIVE", "INACTIVE", "LOCKED", "SUSPENDED"]
ROLE_TITLES = [
    "Branch Manager", "Senior Collection Officer", "Field Agent",
    "Tele-caller", "Recovery Officer",
]
EXECUTION_STATUSES = [
    "RUNNING", "COMPLETED", "FAILED", "QUEUED", "PAUSED",
    "CLOSED_RESOLVED", "PAYMENT_RECEIVED",
]
CUSTOMER_SEGMENTS = ["RETAIL", "MSME", "PRIME", "SUBPRIME"]
JOURNEY_TYPES = ["SOFT_COLLECTION", "FIELD_COLLECTION", "LEGAL", "TELE_CALLING"]
STRATEGY_STATUSES = ["ACTIVE", "DRAFT", "PAUSED"]
CURRENT_YEAR = date.today().year
 
 
def rand_date(start_days_ago=400, end_days_ago=0):
    d = random.randint(end_days_ago, start_days_ago)
    return date.today() - timedelta(days=d)
 
 
def rand_dt(start_days_ago=60, end_days_ago=0):
    d = random.randint(end_days_ago, start_days_ago)
    return datetime.now() - timedelta(days=d, hours=random.randint(0, 23), minutes=random.randint(0, 59))
 
 
def rand_dt_between(start_dt, end_dt=None):
    """start_dt aur end_dt (default: abhi) ke BEECH ek random datetime
    deta hai -- taaki related columns (created_at -> updated_at,
    assigned_at -> completed_at, etc.) hamesha logically sahi order me
    rahein aur kabhi future date na aaye. start_dt date ya datetime dono
    ho sakta hai."""
    if isinstance(start_dt, datetime):
        start = start_dt
    else:
        start = datetime.combine(start_dt, datetime.min.time())
    end = end_dt or datetime.now()
    if start >= end:
        return end
    delta_seconds = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, delta_seconds))
 
 
def rand_mobile(seed):
    return f"98{seed:08d}"[:10]
 
 
# ---------------------------------------------------------------------
# 3. INSERT FUNCTIONS
# ---------------------------------------------------------------------
def insert_branches(cur):
    sql = """
        INSERT INTO col_db.branches
            (code, name, city, state, pincode, zone_code, region_code,
             cost_center, status, created_at, created_by, updated_at,
             updated_by, branch_type, branch_office_type, location,
             hub_branch_id, hub_branch_name, branch_manager_name, address)
        VALUES (%(code)s, %(name)s, %(city)s, %(state)s, %(pincode)s,
                %(zone_code)s, %(region_code)s, %(cost_center)s,
                %(status)s, %(created_at)s, %(created_by)s, %(updated_at)s,
                %(updated_by)s, %(branch_type)s, %(branch_office_type)s,
                %(location)s, %(hub_branch_id)s, %(hub_branch_name)s,
                %(branch_manager_name)s, %(address)s)
        ON CONFLICT (code) DO NOTHING;
    """
    for b in BRANCHES:
        b["created_at"] = rand_dt(700, 400)  # branch onboarding date, random
        # created_by/updated_by abhi None -- users insert hone ke baad
        # link_branch_audit() inhe branch ke apne manager agent_id se
        # link kar dega (logically connected: jisne branch banaya wahi
        # uska record bhi maintain karta hai)
        b["created_by"] = None
        b["updated_by"] = None
        b["updated_at"] = b["created_at"]
        cur.execute(sql, b)
    print(f"Inserted {len(BRANCHES)} branches.")
 
 
def link_branch_audit(cur, agent_ids):
    """Users insert hone ke baad chalta hai -- har branch ka
    created_by/updated_by uske apne manager agent_id se set karta hai,
    aur updated_at ko created_at ke baad (aaj tak) ek random date deta
    hai. Ye "same-meaning columns logically connected rahein" wali
    requirement fulfil karta hai (branch ka creator = uska manager)."""
    sql = """
        UPDATE col_db.branches
        SET created_by = %(agent_id)s,
            updated_by = %(agent_id)s,
            updated_at = %(updated_at)s
        WHERE code = %(code)s;
    """
    for b, agent_id in zip(BRANCHES, agent_ids):
        cur.execute(
            sql,
            {
                "agent_id": agent_id,
                "updated_at": rand_dt_between(b["created_at"]),
                "code": b["code"],
            },
        )
    print(f"Linked created_by/updated_by/updated_at for {len(BRANCHES)} branches.")
 
 
def insert_users(cur):
    """Har branch ke liye ek agent (auth.users), branch se linked.
 
    NOTE: auth.users.branch par FK hai jo col_db.branches.code (PK) ko
    reference karta hai -- isliye yahan branch NAME nahi, branch CODE
    (e.g. 'BR001') jaata hai. (Ye FK-linking logic change nahi hui hai.)
    """
    sql = """
        INSERT INTO auth.users
            (username, agent_name, branch, password, email, mobile,
             is_password_reset, password_last_updated,
             failed_login_attempts, account_status, zone, region,
             role_title, m1_code, m1_name, m1_email, role_id,
             is_active, created_date, application_type, last_login_date)
        VALUES (%(username)s, %(agent_name)s, %(branch)s, %(password)s,
                %(email)s, %(mobile)s, %(is_password_reset)s,
                %(password_last_updated)s, %(failed_login_attempts)s,
                %(account_status)s, %(zone)s, %(region)s,
                %(role_title)s, %(m1_code)s, %(m1_name)s, %(m1_email)s,
                %(role_id)s, %(is_active)s, %(created_date)s,
                %(application_type)s, %(last_login_date)s)
        ON CONFLICT (username) DO UPDATE SET
            agent_name = EXCLUDED.agent_name,
            branch = EXCLUDED.branch
        RETURNING agent_id;
    """
    agent_ids = []
    for i, b in enumerate(BRANCHES, start=1):
        agent_name = AGENT_NAMES[i - 1]
        username = agent_name.split()[0][0].lower() + agent_name.split()[-1].lower()
        is_active = random.choice([True, True, True, False])  # mostly active
        # dates ek dusre se logically chained hain: account created ->
        # password kabhi update hua (created ke baad) -> last login
        # (password update ke baad), koi bhi future date nahi jaata
        created_date = rand_dt(600, 30)
        password_last_updated = rand_dt_between(created_date)
        last_login_date = rand_dt_between(password_last_updated) if is_active else None
        cur.execute(
            sql,
            {
                "username": username,
                "agent_name": agent_name,
                "branch": b["code"],  # <-- FK expects branches.code (unchanged)
                "password": "$2b$12$hashedpasswordvaluexxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                "email": f"{username}@example.com",
                "mobile": rand_mobile(random.randint(90000000, 99999999)),
                "is_password_reset": random.choice([True, False]),
                "password_last_updated": password_last_updated,
                "failed_login_attempts": random.randint(0, 5),
                "account_status": random.choice(ACCOUNT_STATUSES),
                "zone": b["zone_code"],       # branch/zone linking unchanged
                "region": b["region_code"],   # branch/region linking unchanged
                "role_title": random.choice(ROLE_TITLES),
                "m1_code": f"M{random.randint(1000, 9999)}",
                "m1_name": random.choice(AGENT_NAMES),
                "m1_email": f"{random.choice(AGENT_NAMES).split()[0].lower()}.regional@example.com",
                "role_id": f"ROLE_{random.choice(['MGR', 'AGT', 'SUP', 'ADM'])}",
                "is_active": is_active,
                "created_date": created_date,
                "application_type": random.choice(["WEB", "MOBILE", "DESKTOP"]),
                "last_login_date": last_login_date,
            },
        )
        agent_ids.append(cur.fetchone()[0])
    print(f"Inserted {len(agent_ids)} users. agent_ids={agent_ids}")
    return agent_ids
 
 
def insert_strategies(cur, agent_ids):
    sql = """
        INSERT INTO col_db.strategies
            (strategy_name, strategy_code, strategy_version, journey_type,
             dpd_range_from, dpd_range_to, bucket, product_code, state,
             customer_segment, outstanding_range_min,
             outstanding_range_max, priority, effective_date,
             expiry_date, status, description, created_by, is_active,
             source)
        VALUES (%(strategy_name)s, %(strategy_code)s,
                %(strategy_version)s, %(journey_type)s,
                %(dpd_range_from)s, %(dpd_range_to)s, %(bucket)s,
                %(product_code)s, %(state)s, %(customer_segment)s,
                %(outstanding_range_min)s, %(outstanding_range_max)s,
                %(priority)s, %(effective_date)s, %(expiry_date)s,
                %(status)s, %(description)s, %(created_by)s,
                %(is_active)s, %(source)s)
        ON CONFLICT (strategy_code) DO UPDATE SET
            strategy_name = EXCLUDED.strategy_name,
            state = EXCLUDED.state,
            created_by = EXCLUDED.created_by
        RETURNING strategy_id;
    """
    STRATEGY_NAMES = [
        "Early Bucket Soft Collection", "Mid Bucket Field Visit",
        "Late Bucket Legal Follow-up", "Pre-due Reminder Outreach",
        "Bounce Recovery Drive", "NPA Settlement Track",
    ]
    strategy_ids = []
    for i, b in enumerate(BRANCHES, start=1):
        eff_date = rand_date(200, 30)
        min_out = round(random.uniform(2000, 20000), 2)
        max_out = round(min_out + random.uniform(50000, 800000), 2)
        cur.execute(
            sql,
            {
                "strategy_name": random.choice(STRATEGY_NAMES),
                "strategy_code": f"STRAT-{i:03d}",
                "strategy_version": random.choice(["1.0", "1.1", "2.0"]),
                "journey_type": random.choice(JOURNEY_TYPES),
                "dpd_range_from": (i - 1) * 30 + 1,
                "dpd_range_to": i * 30,
                "bucket": random.choice(BUCKETS),
                "product_code": random.choice(["PL", "BL", "GL", "VL", "PL,BL"]),
                "state": b["state"],  # branch/state linking unchanged
                "customer_segment": random.choice(CUSTOMER_SEGMENTS),
                "outstanding_range_min": min_out,
                "outstanding_range_max": max_out,
                "priority": random.randint(1, 6),
                "effective_date": eff_date,
                "expiry_date": eff_date + timedelta(days=random.randint(180, 540)),
                "status": random.choice(STRATEGY_STATUSES),
                "description": (
                    f"Strategy for {random.choice(BUCKETS)} bucket outreach via "
                    f"{random.choice(CHANNELS)} and calls, linked to {b['name']}"
                ),
                "created_by": agent_ids[(i - 1) % len(agent_ids)],
                "is_active": random.choice([True, True, False]),
                "source": random.choice(["MANUAL", "AUTO", "IMPORTED"]),
            },
        )
        strategy_ids.append(cur.fetchone()[0])
    print(f"Inserted {len(strategy_ids)} strategies. strategy_ids={strategy_ids}")
    return strategy_ids
 
 
def insert_cases(cur, table_name, count, strategy_ids):
    """
    Generic inserter for dpd_cases / bounce_cases.
    Har case ek branch (=> uski state) aur ek strategy se linked hota hai
    (ye linking pehle jaisi hi hai). Baaki saari fields ab randomised hain.
    """
    base_cols = """
        case_ref, pr_number, customer_id, customer_name, mobile_number,
        alternate_mobile, email_id, state, branch_name, product_name,
        disbursal_date, loan_amount, emi_amount, outstanding_principal,
        outstanding_interest, total_outstanding, last_payment_date,
        last_payment_amount, next_emi_date, dpd, bucket, loan_status,
        strategy_id, status, mifin_batch_ref, mifin_extraction_date,
        created_at, updated_at
    """
    extra_cols = ""
    extra_vals = ""
    if table_name == "bounce_cases":
        extra_cols = ", bounce_date, bounce_reason, nach_status, bounce_cycle"
        extra_vals = (
            ", %(bounce_date)s, %(bounce_reason)s, %(nach_status)s, "
            "%(bounce_cycle)s"
        )
 
    sql = f"""
        INSERT INTO col_db.{table_name}
            ({base_cols}{extra_cols})
        VALUES (
            %(case_ref)s, %(pr_number)s, %(customer_id)s, %(customer_name)s,
            %(mobile_number)s, %(alternate_mobile)s, %(email_id)s,
            %(state)s, %(branch_name)s, %(product_name)s,
            %(disbursal_date)s, %(loan_amount)s, %(emi_amount)s,
            %(outstanding_principal)s, %(outstanding_interest)s,
            %(total_outstanding)s, %(last_payment_date)s,
            %(last_payment_amount)s, %(next_emi_date)s, %(dpd)s,
            %(bucket)s, %(loan_status)s, %(strategy_id)s, %(status)s,
            %(mifin_batch_ref)s, %(mifin_extraction_date)s,
            %(created_at)s, %(updated_at)s{extra_vals}
        )
        ON CONFLICT (case_ref) DO UPDATE SET
            customer_name = EXCLUDED.customer_name,
            strategy_id = EXCLUDED.strategy_id,
            branch_name = EXCLUDED.branch_name
        RETURNING {"dpd_case_id" if table_name == "dpd_cases" else "bounce_case_id"};
    """
 
    ids = []
    prefix = "DPD-CASE" if table_name == "dpd_cases" else "BNC-CASE"
    offset = 0 if table_name == "dpd_cases" else 1000  # keep pr_number/customer_id unique across both tables
    for i in range(1, count + 1):
        b = BRANCHES[(i - 1) % len(BRANCHES)]  # branch cycling unchanged
        strategy_id = random.choice(strategy_ids)  # randomised (still valid FK)
        customer_name = random.choice(CUSTOMER_NAMES)
        principal = round(random.uniform(15000, 500000), 2)
        tenure_months = random.choice([6, 12, 18, 24, 36, 48])
        emi = round(principal / tenure_months, 2)
        seq = i + offset
 
        # --- Poori timeline ek dusre se logically chained hai, koi bhi
        # date future me nahi jaati:
        #   dpd  ->  next_emi_date (jo EMI miss hui, wahi dpd ki wajah hai)
        #        ->  last_payment_date (usse pehle wala payment)
        #        ->  disbursal_date (loan tab liya gaya tha)
        #        ->  created_at (case system me tab aaya jab EMI miss hui)
        #        ->  updated_at (created_at ke baad, aaj tak, ya kabhi nahi)
        dpd_value = random.randint(0, 200)  # 200 tak taaki NPA bucket bhi achhi tarah cover ho
        next_emi_date = date.today() - timedelta(days=dpd_value)
        last_pay_date = next_emi_date - timedelta(days=random.randint(25, 35))
        disb_date = last_pay_date - timedelta(days=random.randint(60, 600))
 
        created_at = rand_dt_between(next_emi_date)  # case created after EMI miss hui, up to now
        updated_at = rand_dt_between(created_at) if random.random() < 0.6 else None  # kuch cases abhi tak update nahi hue
 
        row = {
            "case_ref": f"{prefix}-{i:04d}",
            "pr_number": f"PR{CURRENT_YEAR}{seq:04d}",
            "customer_id": f"CUST{1000 + seq}",
            "customer_name": customer_name,
            "mobile_number": rand_mobile(random.randint(90000000, 99999999)),
            "alternate_mobile": rand_mobile(random.randint(90000000, 99999999)),
            "email_id": f"{customer_name.lower().replace(' ', '.')}{random.randint(1,999)}@example.com",
            "state": b["state"],          # branch/state linking unchanged
            "branch_name": b["name"],     # branch linking unchanged
            "product_name": random.choice(PRODUCTS),
            "disbursal_date": disb_date,
            "loan_amount": principal,
            "emi_amount": emi,
            "outstanding_principal": round(principal * random.uniform(0.3, 0.95), 2),
            "outstanding_interest": round(principal * random.uniform(0.01, 0.06), 2),
            "total_outstanding": None,  # set below
            "last_payment_date": last_pay_date,
            "last_payment_amount": round(emi * random.uniform(0.5, 1.2), 2),
            "next_emi_date": next_emi_date,
        }
        row.update({
            "dpd": dpd_value,
            "bucket": bucket_for_dpd(dpd_value),
            "loan_status": random.choice(LOAN_STATUSES),
            "strategy_id": strategy_id,
            "status": random.choice(CASE_STATUSES),
            "mifin_batch_ref": f"MIFIN-BATCH-{created_at.strftime('%m%y')}-{random.randint(1,9)}",
            "mifin_extraction_date": created_at.date(),
            "created_at": created_at,
            "updated_at": updated_at,
        })
        row["total_outstanding"] = round(
            row["outstanding_principal"] + row["outstanding_interest"], 2
        )
        if table_name == "bounce_cases":
            # bounce EMI due date ke thode dino baad hota hai, aaj se aage nahi
            bounce_date = min(
                next_emi_date + timedelta(days=random.randint(1, 5)), date.today()
            )
            row.update(
                {
                    "bounce_date": bounce_date,
                    "bounce_reason": random.choice(BOUNCE_REASONS),
                    "nach_status": random.choice(NACH_STATUSES),
                    "bounce_cycle": random.randint(1, 5),
                }
            )
 
        cur.execute(sql, row)
        ids.append((cur.fetchone()[0], strategy_id, b, created_at))
 
    print(f"Inserted {count} rows into col_db.{table_name}.")
    return ids  # list of (case_id, strategy_id, branch_dict, created_at)
 
 
def insert_ptps(cur, strategy_ids, agent_ids, count=25):
    sql = """
        INSERT INTO col_db.ptps
            (strategy_id, agent_id, ptp_date, ptp_amount, honoured,
             actual_payment_date, created_at)
        VALUES (%(strategy_id)s, %(agent_id)s, %(ptp_date)s,
                %(ptp_amount)s, %(honoured)s, %(actual_payment_date)s,
                %(created_at)s);
    """
    count_done = 0
    for _ in range(count):
        strategy_id = random.choice(strategy_ids)
        agent_id = random.choice(agent_ids)
        honoured = random.choice([True, False])
        ptp_date = rand_date(25, 1)  # sirf past, koi future PTP nahi
        actual_payment_date = None
        if honoured:
            actual_payment_date = min(
                ptp_date + timedelta(days=random.randint(0, 5)), date.today()
            )
        cur.execute(
            sql,
            {
                "strategy_id": strategy_id,
                "agent_id": agent_id,
                "ptp_date": ptp_date,
                "ptp_amount": round(random.uniform(500, 50000), 2),
                "honoured": honoured,
                "actual_payment_date": actual_payment_date,
                "created_at": rand_dt_between(datetime.combine(ptp_date, datetime.min.time())),
            },
        )
        count_done += 1
    print(f"Inserted {count_done} rows into col_db.ptps.")
 
 
def insert_payments(cur, strategy_ids, count=40):
    sql = """
        INSERT INTO col_db.payments
            (strategy_id, loan_number, amount, payment_date, payment_mode,
             pg_transaction_id, payment_status, reconciled,
             payment_source, created_at)
        VALUES (%(strategy_id)s, %(loan_number)s, %(amount)s,
                %(payment_date)s, %(payment_mode)s, %(pg_transaction_id)s,
                %(payment_status)s, %(reconciled)s, %(payment_source)s,
                %(created_at)s);
    """
    count_done = 0
    for i in range(1, count + 1):
        strategy_id = random.choice(strategy_ids)
        pay_dt = rand_dt(45, 0)
        cur.execute(
            sql,
            {
                "strategy_id": strategy_id,
                "loan_number": f"LOAN{random.randint(1000, 9999)}",
                "amount": round(random.uniform(500, 50000), 2),
                "payment_date": pay_dt,
                "payment_mode": random.choice(PAYMENT_MODES),
                "pg_transaction_id": f"TXN{pay_dt.strftime('%Y%m%d')}{random.randint(100,999)}{i:03d}",
                "payment_status": random.choice(PAYMENT_STATUSES),
                "reconciled": random.choice([True, False]),
                "payment_source": random.choice(["ONLINE", "BRANCH", "FIELD_AGENT", "IVR"]),
                "created_at": pay_dt,
            },
        )
        count_done += 1
    print(f"Inserted {count_done} rows into col_db.payments.")
 
 
def insert_communication_logs(cur, cases):
    """cases = list of (case_id, strategy_id, branch_dict, case_created_at)."""
    sql = """
        INSERT INTO col_db.communication_logs
            (case_id, strategy_id, queue_id, channel, recipient, status,
             provider_message_id, created_on, status_updated_on)
        VALUES (%(case_id)s, %(strategy_id)s, %(queue_id)s, %(channel)s,
                %(recipient)s, %(status)s, %(provider_message_id)s,
                %(created_on)s, %(status_updated_on)s);
    """
    count = 0
    for case_id, strategy_id, b, case_created_at in cases:
        # har case ke liye random 1-3 communication attempts, taaki
        # "har possible data" ka variety zyada real lage. Attempts case
        # ke created_at ke BAAD hi hote hain (logically connected).
        for _ in range(random.randint(1, 3)):
            created_on = rand_dt_between(case_created_at)
            status = random.choice(COMM_STATUS)
            status_updated = min(
                created_on + timedelta(minutes=random.randint(1, 240)), datetime.now()
            )
            count += 1
            cur.execute(
                sql,
                {
                    "case_id": case_id,
                    "strategy_id": strategy_id,
                    "queue_id": strategy_id,  # queue linked to strategy for simplicity
                    "channel": random.choice(CHANNELS),
                    "recipient": rand_mobile(random.randint(90000000, 99999999)),
                    "status": status,
                    "provider_message_id": f"MSGID-{created_on.strftime('%Y%m%d%H%M%S')}-{count:04d}",
                    "created_on": created_on,
                    "status_updated_on": status_updated,
                },
            )
    print(f"Inserted {count} rows into col_db.communication_logs.")
 
 
def insert_execution_log(cur, cases, case_type):
    sql = """
        INSERT INTO col_db.strategy_execution_log
            (case_type, case_id, strategy_id, status, assigned_at, completed_at)
        VALUES (%(case_type)s, %(case_id)s, %(strategy_id)s, %(status)s,
                %(assigned_at)s, %(completed_at)s);
    """
    count = 0
    for case_id, strategy_id, _, case_created_at in cases:
        status = random.choice(EXECUTION_STATUSES)
        assigned_at = rand_dt_between(case_created_at)  # case create hone ke baad hi assign hua
        # completed_at sirf tab set hota hai jab execution actually khatam
        # ho chuka ho (terminal states) -- status field se logically
        # connected. RUNNING/QUEUED/PAUSED ke liye NULL rehta hai.
        TERMINAL_STATUSES = ("COMPLETED", "FAILED", "CLOSED_RESOLVED", "PAYMENT_RECEIVED")
        completed_at = (
            rand_dt_between(assigned_at) if status in TERMINAL_STATUSES else None
        )
        cur.execute(
            sql,
            {
                "case_type": case_type,
                "case_id": case_id,
                "strategy_id": strategy_id,
                "status": status,
                "assigned_at": assigned_at,
                "completed_at": completed_at,
            },
        )
        count += 1
    print(f"Inserted {count} rows into col_db.strategy_execution_log ({case_type}).")
 
 
# ---------------------------------------------------------------------
# 4. MAIN
# ---------------------------------------------------------------------
def main():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                insert_branches(cur)
                agent_ids = insert_users(cur)
                link_branch_audit(cur, agent_ids)
                strategy_ids = insert_strategies(cur, agent_ids)
 
                dpd_cases = insert_cases(cur, "dpd_cases", 30, strategy_ids)
                bounce_cases = insert_cases(cur, "bounce_cases", 20, strategy_ids)
                all_cases = dpd_cases + bounce_cases  # 50 total case rows
 
                insert_ptps(cur, strategy_ids, agent_ids, count=25)
                insert_payments(cur, strategy_ids, count=40)
                insert_communication_logs(cur, all_cases)
                insert_execution_log(cur, dpd_cases, "DPD")
                insert_execution_log(cur, bounce_cases, "BOUNCE")
 
        print("\nAll data inserted & committed successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error occurred, rolled back: {e}")
        raise
    finally:
        conn.close()
 
 
if __name__ == "__main__":
    main()
 