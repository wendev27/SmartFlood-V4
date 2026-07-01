# SmartFlood V4 System Overview

## Purpose

SmartFlood V4 exists to help disaster response teams monitor flood conditions, understand affected communities, and generate relief allocation recommendations using structured data and AI-assisted decision logic.

## Input

The system receives:

- Flood sensor data from MongoDB
- Resident and family data from Supabase
- Relief inventory data
- Barangay information
- User account and role information
- Audit and security events
- AI recommendation request inputs

## Process

The system processes information through separated layers:

1. Frontend displays the user interface.
2. Backend validates requests, applies RBAC, and handles business logic.
3. Database stores residents, families, users, inventory, recommendations, and logs.
4. MongoDB stores sensor metadata and sensor readings.
5. AI engine computes relief allocation recommendations.
6. Security monitoring records suspicious events and Suricata-related detections.

## Output

The system produces:

- Flood dashboard summaries
- Street-level flood visualization
- Sensor status and history
- Resident and family records
- AI relief allocation recommendations
- Audit logs
- Security monitoring reports

## Reason

V3 proved the system can work. V4 focuses on clean architecture, maintainability, stronger security, and more realistic disaster-response workflows.
