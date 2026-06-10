# Security Specification: TWAWEZA DIGITAL

This document outlines the security rules, models, invariants, and payloads designed to protect SACCOS group records.

## 1. Data Invariants
- A Member, Contribution, Loan, Expense, AuditLog, and InternalUser document belongs under a specific group ID (`groupId`).
- Clients are authorized to read or write only to their own `groupId`, representing their community space.
- Users can only read/write documents where the parent `groupId` matches their authenticated account ID (or a group they are a member of).
- Timestamp and identity fields are immutable after creation.
- Field values and types must match their schemas.

## 2. Invalidation Test Scenarios ("Dirty Dozen")
1. **Unauthenticated Read**: Attempt to read SACCOS members without login.
2. **Cross-Tenant Access**: User `A` attempts to read user `B`'s SACCOS contributions.
3. **Identity Spoofing**: Attempt to write a Member document under groupId `A` using UID `B`.
4. **Invalid Transaction Type**: Save a Contribution with type `MaliciousType`.
5. **Negative Amount**: Save a Contribution or Expense with amount `-5000`.
6. **Immutable Field Altering**: Attempt to change `createdAt` of a Member.
7. **Bypassing Schema Integrity**: Create a Member without the required `memberNo` field.
8. **Malicious ID Injection**: Creating a document with a 1MB string or invalid characters as an ID.
9. **Rogue Internal User**: Attempting to register an unapproved administrator without validation.
10. **State Shortcutting**: Updating a Loan's status to `cleared` while ignoring `paidAmount` validations.
11. **Rogue Admin Spoofing**: Modifying internal user profile roles to gain global admin access.
12. **Mass Query Scraping**: Running arbitrary blanket queries on other tenants' data.
