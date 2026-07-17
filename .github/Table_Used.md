-- Report & Analytics page used table

CREATE TABLE IF NOT EXISTS col_db.branches
(
code character varying(20) COLLATE pg_catalog."default" NOT NULL,
name character varying(150) COLLATE pg_catalog."default",
city character varying(100) COLLATE pg_catalog."default",
state character varying(100) COLLATE pg_catalog."default",
pincode character varying(10) COLLATE pg_catalog."default",
zone_code character varying(20) COLLATE pg_catalog."default",
region_code character varying(20) COLLATE pg_catalog."default",
cost_center character varying(50) COLLATE pg_catalog."default",
status character(1) COLLATE pg_catalog."default",
created_at timestamp with time zone,
created_by bigint,
updated_at timestamp with time zone,
updated_by bigint,
branch_type character varying(50) COLLATE pg_catalog."default",
branch_office_type character varying(100) COLLATE pg_catalog."default",
location character varying(100) COLLATE pg_catalog."default",
hub_branch_id character varying(100) COLLATE pg_catalog."default",
hub_branch_name character varying(100) COLLATE pg_catalog."default",
branch_manager_name character varying(100) COLLATE pg_catalog."default",
address character varying(600) COLLATE pg_catalog."default",
CONSTRAINT branches_pkey PRIMARY KEY (code)
);

CREATE TABLE IF NOT EXISTS col_db.dpd_cases
(
dpd_case_id bigserial NOT NULL,
case_ref character varying(40) COLLATE pg_catalog."default" NOT NULL,
pr_number character varying(50) COLLATE pg_catalog."default" NOT NULL,
customer_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
customer_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
mobile_number character varying(15) COLLATE pg_catalog."default" NOT NULL,
alternate_mobile character varying(15) COLLATE pg_catalog."default",
email_id character varying(200) COLLATE pg_catalog."default",
state character varying(100) COLLATE pg_catalog."default" NOT NULL,
branch_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
product_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
disbursal_date date NOT NULL,
loan_amount numeric(18, 2),
emi_amount numeric(18, 2),
outstanding_principal numeric(18, 2),
outstanding_interest numeric(18, 2),
total_outstanding numeric(18, 2),
last_payment_date date,
last_payment_amount numeric(18, 2),
next_emi_date date,
dpd integer NOT NULL,
bucket character varying(20) COLLATE pg_catalog."default",
loan_status character varying(50) COLLATE pg_catalog."default",
strategy_id bigint,
status character varying(30) COLLATE pg_catalog."default" DEFAULT 'PENDING_STRATEGY'::character varying,
mifin_batch_ref character varying(100) COLLATE pg_catalog."default",
mifin_extraction_date date NOT NULL,
is_active boolean DEFAULT true,
created_at timestamp without time zone DEFAULT now(),
updated_at timestamp without time zone,
CONSTRAINT dpd_cases_pkey PRIMARY KEY (dpd_case_id),
CONSTRAINT dpd_cases_case_ref_key UNIQUE (case_ref)
);

CREATE TABLE IF NOT EXISTS col_db.communication_logs
(
communication_id bigserial NOT NULL,
case_id bigint,
strategy_id bigint,
queue_id bigint,
channel character varying(20) COLLATE pg_catalog."default" NOT NULL,
recipient character varying(200) COLLATE pg_catalog."default" NOT NULL,
status character varying(20) COLLATE pg_catalog."default" NOT NULL,
provider_message_id character varying(200) COLLATE pg_catalog."default",
created_on timestamp with time zone NOT NULL DEFAULT now(),
status_updated_on timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT communication_logs_pkey PRIMARY KEY (communication_id)
);

CREATE TABLE IF NOT EXISTS col_db.ptps
(
ptp_id bigserial NOT NULL,
strategy_id bigint NOT NULL,
agent_id bigint,
ptp_date date,
ptp_amount numeric(15, 2),
honoured boolean,
actual_payment_date date,
created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT ptps_pkey PRIMARY KEY (ptp_id)
);

CREATE TABLE IF NOT EXISTS col_db.strategies
(
strategy_id bigserial NOT NULL,
strategy_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
strategy_code character varying(50) COLLATE pg_catalog."default" NOT NULL,
strategy_version character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT '1.0'::character varying,
journey_type character varying(500) COLLATE pg_catalog."default" NOT NULL,
dpd_range_from integer,
dpd_range_to integer,
bucket character varying(500) COLLATE pg_catalog."default",
product_code character varying(1000) COLLATE pg_catalog."default",
state character varying(1000) COLLATE pg_catalog."default",
customer_segment character varying(500) COLLATE pg_catalog."default",
outstanding_range_min numeric(18, 2),
outstanding_range_max numeric(18, 2),
priority integer NOT NULL,
effective_date date NOT NULL,
expiry_date date,
status character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'DRAFT'::character varying,
description text COLLATE pg_catalog."default",
created_by bigint,
created_at timestamp without time zone DEFAULT now(),
updated_by bigint,
updated_at timestamp without time zone,
is_active boolean NOT NULL DEFAULT true,
source character varying(20) COLLATE pg_catalog."default" DEFAULT 'MANUAL'::character varying,
CONSTRAINT strategies_pkey PRIMARY KEY (strategy_id),
CONSTRAINT strategies_strategy_code_key UNIQUE (strategy_code)
);

CREATE TABLE IF NOT EXISTS auth.users
(
agent_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
username character varying(50) COLLATE pg_catalog."default" NOT NULL,
agent_name character varying(150) COLLATE pg_catalog."default" NOT NULL,
branch character varying(50) COLLATE pg_catalog."default",
password character varying(255) COLLATE pg_catalog."default",
email character varying(200) COLLATE pg_catalog."default",
mobile character varying(15) COLLATE pg_catalog."default",
is_password_reset boolean DEFAULT false,
password_last_updated timestamp with time zone,
failed_login_attempts integer DEFAULT 0,
account_locked_until timestamp with time zone,
password_reset_token character varying(255) COLLATE pg_catalog."default",
password_reset_token_expiry timestamp with time zone,
last_login_date timestamp with time zone,
mail_status boolean,
active_state_changed_at timestamp with time zone,
uuid_token character varying(220) COLLATE pg_catalog."default",
last_uuid_changed timestamp with time zone,
uuid_change_count integer DEFAULT 0,
account_status character varying(20) COLLATE pg_catalog."default",
current_token_id character varying(115) COLLATE pg_catalog."default",
deactivated_at timestamp with time zone,
zone character varying(50) COLLATE pg_catalog."default",
region character varying(50) COLLATE pg_catalog."default",
role_title character varying(50) COLLATE pg_catalog."default",
m1_code character varying(50) COLLATE pg_catalog."default",
m1_name character varying(50) COLLATE pg_catalog."default",
m1_email character varying(30) COLLATE pg_catalog."default",
m2_code character varying(50) COLLATE pg_catalog."default",
m2_name character varying(30) COLLATE pg_catalog."default",
m2_email character varying(200) COLLATE pg_catalog."default",
profile_image character varying(115) COLLATE pg_catalog."default",
email1 character varying(255) COLLATE pg_catalog."default",
role_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
is_active boolean DEFAULT false,
created_date timestamp with time zone,
application_type character varying(20) COLLATE pg_catalog."default",
app_token_id character varying(100) COLLATE pg_catalog."default",
system_ip character varying(50) COLLATE pg_catalog."default",
hostname character varying(150) COLLATE pg_catalog."default",
old_password text COLLATE pg_catalog."default",
user_deactivated_by bigint,
modified_by bigint,
created_by bigint,
CONSTRAINT users_pkey PRIMARY KEY (agent_id),
CONSTRAINT users_employee_code_key UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS col_db.payments
(
payment_id bigserial NOT NULL,
strategy_id bigint NOT NULL,
loan_number character varying(50) COLLATE pg_catalog."default",
amount numeric(15, 2) NOT NULL,
payment_date timestamp without time zone,
payment_mode character varying(50) COLLATE pg_catalog."default",
pg_transaction_id character varying(100) COLLATE pg_catalog."default",
payment_status character varying(30) COLLATE pg_catalog."default",
reconciled boolean DEFAULT false,
payment_source character varying(30) COLLATE pg_catalog."default",
created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT payments_pkey PRIMARY KEY (payment_id)
);

CREATE TABLE IF NOT EXISTS col_db.bounce_cases
(
bounce_case_id bigserial NOT NULL,
case_ref character varying(40) COLLATE pg_catalog."default" NOT NULL,
pr_number character varying(50) COLLATE pg_catalog."default" NOT NULL,
customer_id character varying(50) COLLATE pg_catalog."default" NOT NULL,
customer_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
mobile_number character varying(15) COLLATE pg_catalog."default" NOT NULL,
alternate_mobile character varying(15) COLLATE pg_catalog."default",
email_id character varying(200) COLLATE pg_catalog."default",
state character varying(100) COLLATE pg_catalog."default" NOT NULL,
branch_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
product_name character varying(200) COLLATE pg_catalog."default" NOT NULL,
disbursal_date date NOT NULL,
loan_amount numeric(18, 2),
emi_amount numeric(18, 2),
outstanding_principal numeric(18, 2),
outstanding_interest numeric(18, 2),
total_outstanding numeric(18, 2),
last_payment_date date,
last_payment_amount numeric(18, 2),
next_emi_date date,
dpd integer NOT NULL,
bucket character varying(20) COLLATE pg_catalog."default",
loan_status character varying(50) COLLATE pg_catalog."default",
bounce_date date NOT NULL,
bounce_reason character varying(250) COLLATE pg_catalog."default",
nach_status character varying(50) COLLATE pg_catalog."default",
bounce_cycle integer,
strategy_id bigint,
status character varying(30) COLLATE pg_catalog."default" DEFAULT 'PENDING_STRATEGY'::character varying,
mifin_batch_ref character varying(100) COLLATE pg_catalog."default",
mifin_extraction_date date NOT NULL,
is_active boolean DEFAULT true,
created_at timestamp without time zone DEFAULT now(),
updated_at timestamp without time zone,
CONSTRAINT bounce_cases_pkey PRIMARY KEY (bounce_case_id),
CONSTRAINT bounce_cases_case_ref_key UNIQUE (case_ref)
);

CREATE TABLE IF NOT EXISTS col_db.strategy_execution_log
(
execution_id bigserial NOT NULL,
case_type character varying(20) COLLATE pg_catalog."default" NOT NULL,
case_id bigint NOT NULL,
strategy_id bigint NOT NULL,
status character varying(20) COLLATE pg_catalog."default" DEFAULT 'RUNNING'::character varying,
assigned_at timestamp without time zone DEFAULT now(),
completed_at timestamp without time zone,
CONSTRAINT strategy_execution_log_pkey PRIMARY KEY (execution_id)
);

-- master table For Bucket
CREATE TABLE IF NOT EXISTS col_db.bucket_master
(
bucket_id BIGSERIAL NOT NULL,
bucket_code character varying(100) COLLATE pg_catalog."default" NOT NULL,
bucket_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT bucket_master_pkey PRIMARY KEY (bucket_id),
CONSTRAINT bucket_master_bucket_code_key UNIQUE (bucket_code)
)

-- master table for channel
CREATE TABLE col_db.channel_master (
channel_id BIGSERIAL PRIMARY KEY,
channel_code VARCHAR(50) NOT NULL UNIQUE,
channel_name VARCHAR(100) NOT NULL,
is_active BOOLEAN NOT NULL DEFAULT true,
created_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO col_db.channel_master (channel_code, channel_name, is_active) VALUES
('SMS', 'SMS', true),
('EMAIL', 'Email', true),
('MANUAL_CALL', 'Manual Call', true),
('AI_VOICE', 'AI Voice', true),
('FIELD_VISIT', 'Field Visit', true),
('WHATSAPP', 'Whatsapp', true);

ALTER TABLE col_db.strategy_steps
ADD CONSTRAINT fk_strategy_steps_channel
FOREIGN KEY (channel) REFERENCES col_db.channel_master(channel_code);
