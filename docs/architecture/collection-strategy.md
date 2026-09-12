# Multi-Factor Collection Strategy & Priority Scoring

## 1. 0–100 Priority Scoring Model

The strategy engine computes a real-time, composite **Collection Priority Score (0–100)** to determine queue priority, contact frequency, and automated routing:

$$\text{Priority Score} = \min\left(100, \sum (w_i \times s_i)\right)$$

### Factor Weights & Components:
1. **DPD Component (35% default)**: Scaled against $90\text{ DPD} = 100\text{ pts}$.
2. **Overdue Amount Component (25% default)**: Scaled by balance tiers ($\ge 100\text{k} \rightarrow 100$, $\ge 50\text{k} \rightarrow 80$, $\ge 25\text{k} \rightarrow 60$, $< 10\text{k} \rightarrow 20$).
3. **Phase 9 Risk & Fraud Grade (15% default)**: High-risk underwriting grades (`D`, `E`) or fraud flags (`HIGH_RISK`, `BLOCK`) immediately increase priority score.
4. **Broken PTP History (15% default)**: Each broken commitment adds escalating penalties ($\ge 3 \text{ broken} \rightarrow 100$).
5. **Contactability Penalty (10% default)**: Consecutive unanswered or unreachable attempts elevate case urgency.

---

## 2. Priority Bands & Strategy Phases

| Score Range | Priority Band | Strategy Phase | Action SLA |
| :--- | :--- | :--- | :--- |
| **0 – 34** | `LOW` | `REMINDER` | 48 Hours |
| **35 – 59** | `MEDIUM` | `REMINDER_AND_QUEUE` | 24 Hours |
| **60 – 79** | `HIGH` | `COLLECTOR_ASSIGNMENT` | 12 Hours |
| **80 – 100** | `CRITICAL` | `ESCALATED_COLLECTION` / `RECOVERY_LEGAL_REVIEW` | 4–6 Hours |

---

## 3. Strategy Versioning Lifecycle

- **`DRAFT`**: Strategies can be authored and tuned without impacting live cases.
- **`ACTIVE`**: Exactly one strategy per tenant/product scope is active at any time. Activating a draft automatically archives the existing active version.
- **`ARCHIVED`**: Preserved immutably for historical auditing and reproducibility.
