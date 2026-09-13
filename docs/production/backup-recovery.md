# Backup & Disaster Recovery Architecture

This document specifies the institutional backup and data restoration procedures for Adyapan Lending OS.

---

## 1. Backup Schedule & Retention Policy

| Asset | Frequency | Retention | Storage Target |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Full Dump** | Daily (02:00 UTC) | 30 Days | Encrypted Cloud Storage (GCS / S3 Glacier) |
| **PostgreSQL WAL Archives** | Continuous (Point-in-Time) | 7 Days | Multi-Region Encrypted Bucket |
| **Document Vault** | Real-time Object Versioning | Indefinite | Cloudinary / S3 with Object Lock |
| **Audit Log Evidence Hash Chain** | Immutable Continuous Append | Statutory 7 Years | Tamper-Evident Read-Only Storage |

---

## 2. Database Backup & Restore Procedures

### A. Creating a Full Production Snapshot
```bash
pg_dump -Fc --no-acl --no-owner -h $DB_HOST -U $DB_USER $DB_NAME > /backups/adyapan_db_$(date +%Y%m%d_%H%M%S).dump
```

### B. Restoring Database from Backup
```bash
# 1. Create target clean database
createdb -h $DB_HOST -U $DB_USER adyapan_lms_restored

# 2. Restore schema and data
pg_restore -h $DB_HOST -U $DB_USER -d adyapan_lms_restored /backups/adyapan_db_snapshot.dump

# 3. Verify row counts and integrity
psql -h $DB_HOST -U $DB_USER -d adyapan_lms_restored -c "SELECT count(*) FROM \"Tenant\";"
```
