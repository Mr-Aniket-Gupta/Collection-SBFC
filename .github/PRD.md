# Product Requirements Document (PRD)

# Digital Collection Strategy Platform (DCSP)

Version: 1.0  
Product Type: Enterprise Collection Management Platform  
Industry: NBFC / Banking  
Reference Document: BRD v1.0  
Prepared For: Product, Engineering, Architecture, QA, Operations Teams

---

# 1. Product Overview

The Digital Collection Strategy Platform (DCSP) is an enterprise-grade collection automation platform designed for NBFCs and Banks to digitize, automate, monitor, and optimize the entire loan collection lifecycle.

The platform eliminates manual intervention, reduces operational dependency, improves recovery efficiency, and provides a centralized strategy-driven collection ecosystem.

The system integrates directly with Core Loan Management Systems such as Mifin and supports complete lifecycle management from case creation to payment validation and case closure.

---

# 2. Product Vision

To become a fully automated, configurable, and auditable collection operating system capable of handling large-scale digital collections with minimal human intervention.

---

# 3. Business Goals

## Primary Goals

- Eliminate manual MIS preparation.
- Remove Excel-based operational workflows.
- Enable direct API-based LMS integrations.
- Increase digital recovery percentage.
- Reduce collection operational costs.
- Minimize dependency on manual telecalling.
- Automate payment reconciliation.
- Improve collection strategy effectiveness.

## Secondary Goals

- Support multi-tenant architecture.
- Support maker-checker approvals.
- Enable strategy versioning.
- Provide complete audit trails.
- Support regulatory compliance requirements.
- Deliver role-based dashboards.

---

# 4. Target Users

## Management Users

Require:

- Recovery KPIs
- Portfolio health monitoring
- Strategy performance monitoring
- Agency performance tracking

## Operations Users

Require:

- Case monitoring
- Data validation
- Strategy assignment
- Exception handling

## Collection Managers

Require:

- Strategy creation
- Performance tracking
- Escalation management
- Allocation management

## Telecallers

Require:

- Assigned cases
- Communication history
- PTP management

## Field Executives (FE)

Require:

- Visit assignments
- Collection tracking
- Resolution updates

## Group Collection Leaders (GCL)

Require:

- Team management
- Escalation handling

## External Agencies

Require:

- Allocated cases
- Performance dashboards

## System Administrators

Require:

- User management
- Configuration management
- Master data maintenance

---

# 5. Product Scope

## Included

- Dashboard Module
- Case Management
- Strategy Builder
- Strategy Execution Engine
- Communication Engine
- Payment Validation Engine
- Allocation Engine
- Escalation Engine
- Reporting and MIS
- Audit Logging
- User Access Management
- LMS Integration Layer
- Scheduler Framework

## Excluded

- Loan Origination
- Loan Servicing
- Credit Underwriting
- Customer Onboarding
- Disbursement Processing

---

# 6. Collection Journeys

## Journey 1: Pre-EMI Collection

Purpose:
Prevent delinquency before EMI due date.

Activities:

- SMS reminders
- WhatsApp reminders
- Email reminders
- AI Voice reminders
- Payment link generation

Expected Outcome:
Reduce early bucket delinquencies.

---

## Journey 2: DPD Collection

Purpose:
Recover overdue installments.

Supported Buckets:

- 1-30 DPD
- 31-60 DPD
- 61-90 DPD
- 91-180 DPD
- 180+ DPD

Supported Strategy Filters:

- Product
- State
- Branch
- Zone
- Bucket
- Risk Segment

Expected Outcome:
Maximize digital recovery before field allocation.

---

## Journey 3: Bounce Collection

Purpose:
Handle NACH and payment bounce cases.

Supported Activities:

- Bounce notification
- Retry payment collection
- Alternate payment link generation
- Escalation workflows

Expected Outcome:
Reduce repeat bounce percentage.

---

# 7. Functional Requirements

# 7.1 Dashboard Module

## Management Dashboard

KPIs:

- Total Outstanding Principal
- Total Outstanding
- Recovery Amount
- Recovery %
- Digital Recovery %
- Strategy Success Rate
- Allocation Efficiency
- Collection Efficiency

Charts:

- Recovery Trend
- Bucket Distribution
- Product Distribution
- State Wise Recovery
- Strategy Effectiveness
- Agency Performance

---

## Operations Dashboard

Features:

- Active Cases
- Pending Cases
- Failed Communications
- Pending Payments
- Escalated Cases
- Allocation Status

---

## Collection Manager Dashboard

Features:

- Strategy Performance
- Allocation Monitoring
- Agent Performance
- FE Productivity
- Recovery Trend

---

## Agency Dashboard

Features:

- Assigned Cases
- Collection Amount
- Resolution Rate
- Visit Status

---

## Strategy Dashboard

Features:

- Active Strategies
- Draft Strategies
- Version History
- Approval Queue

---

# 7.2 Case Management Module

Supported Statuses:

- NEW
- PENDING_STRATEGY
- STRATEGY_ASSIGNED
- COMMUNICATION_PENDING
- COMMUNICATION_SENT
- PAYMENT_PENDING
- PAYMENT_RECEIVED
- PTP_CREATED
- ALLOCATED
- ESCALATED
- CLOSED
- WRITE_OFF

Case Screen Features:

- Customer Profile
- Loan Information
- Communication Timeline
- Payment History
- Strategy Timeline
- Allocation History
- Audit History

---

# 7.3 Strategy Builder

Features:

- No-code strategy creation
- Multi-step workflows
- Rule-based execution
- Multi-channel communication
- Bucket-specific rules

Supported Channels:

- SMS
- WhatsApp
- Email
- AI Voice
- Manual Call
- Field Visit

Strategy Configuration:

- Product
- State
- Branch
- DPD Bucket
- Bounce Type
- Risk Score

---

# 7.4 Strategy Approval Workflow

Maker Checker Model:

Draft
→ Submitted
→ Approved
→ Active

Rejected strategies return to Draft state.

---

# 7.5 Communication Engine

Supported Channels:

- SMS
- WhatsApp
- Email
- AI Voice

Capabilities:

- Template rendering
- Retry logic
- Delivery tracking
- Callback handling
- Channel prioritization

---

# 7.6 Payment Validation Engine

Features:

- LMS payment verification
- Auto reconciliation
- Duplicate detection
- Auto closure

Supported Statuses:

- SUCCESS
- FAILED
- PARTIAL
- PENDING

---

# 7.7 Allocation Engine

Allocation Targets:

- Telecaller
- Field Executive
- GCL
- Agency

Allocation Rules:

- Capacity based
- Geography based
- Product based
- Bucket based
- Workload based

---

# 7.8 Escalation Engine

Escalation Levels:

Level 1:
Digital Strategy

Level 2:
Telecaller

Level 3:
Field Executive

Level 4:
GCL

Level 5:
Agency

---

# 7.9 Reports & MIS

Reports:

- Recovery MIS
- Bounce MIS
- Strategy Performance Report
- Communication Report
- Agency Performance Report
- User Activity Report
- Allocation Report
- Digital Recovery Report
- PTP Report
- Payment Report

Filters:

- Date Range
- Zone
- State
- Branch
- Product
- DPD Bucket
- Strategy
- Channel

Export Formats:

- Excel
- CSV
- PDF

---

# 7.10 User Access Management

Roles:

- Super Admin
- Admin
- Operations
- Collection Manager
- Telecaller
- FE
- GCL
- Agency User
- Auditor

Authentication:

- JWT
- Refresh Tokens

Authorization:

- RBAC

---

# 7.11 Audit Module

Track:

- User Login
- Case Changes
- Strategy Changes
- Allocation Changes
- Payment Updates
- Approval Actions

Retention:

7 Years

---

# 7.12 Integration Layer

Integrations:

## Mifin LMS

APIs:

- Customer API
- Loan API
- Payment API
- DPD API
- Bounce API

---

# 7.13 Scheduler Framework

Schedulers:

- Pre EMI Pull
- DPD Pull
- Bounce Pull
- Communication Execution
- Payment Validation
- Escalation Processing

---

# 7.14 Configuration Masters

Master Tables:

- Product Master
- State Master
- Zone Master
- Branch Master
- Strategy Master
- Channel Master
- Template Master
- User Master
- Agency Master

---

# 8. Non Functional Requirements

## Scalability

- Support 30,000+ active cases monthly.
- Horizontally scalable architecture.

## Availability

- 99.9% uptime.

## Performance

- Dashboard API response < 3 seconds.
- Report API response < 10 seconds.

## Security

- JWT Authentication
- Role Based Access
- Audit Logging
- Encryption at Rest
- Encryption in Transit

## Compliance

- RBI Guidelines
- NBFC Regulations
- Internal Audit Requirements

---

# 9. Success Metrics

## Business KPIs

- Digital Recovery %
- Recovery Amount
- Collection Cost Reduction
- Strategy Conversion Rate
- Bounce Recovery Rate

## Technical KPIs

- API Response Time
- Scheduler Success Rate
- Communication Delivery Rate
- Payment Reconciliation Accuracy

---

# 10. Future Roadmap

Phase 2:

- Multi Tenant Architecture
- AI Strategy Recommendations
- Predictive Recovery Models
- AI Collection Agent
- GenAI Communication Optimization
- ML Based Allocation Engine
- Voice Bot Collections
- WhatsApp Bot Collections

---

# 11. Technology Recommendation

## Frontend

- React
- TypeScript
- Recharts

## Backend

- ASP.NET Core Web API
- Clean Architecture

## Database

- PostgreSQL

## Queue/Event Processing

- RabbitMQ

## Object Storage

- AWS S3

## Monitoring

- Prometheus
- Grafana

---

# 12. Expected Scale

- 30,000+ active cases per month
- 500+ concurrent users
- 1 Million+ communication events per month
- 100,000+ payment validations per month

---
