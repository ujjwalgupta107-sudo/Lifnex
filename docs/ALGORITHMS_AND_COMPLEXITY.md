# Lifnex — Algorithms & Computational Complexity

All algorithms documented below are verified directly against `backend/app/services/matching_engine.py`, `backend/app/services/matching_service.py`, `backend/app/routes/donors.py`, and `backend/app/routes/ai.py`.

---

## 1. ABO/Rh Biological Compatibility Filtering (`is_blood_compatible`, `is_donor_compatible`)
- **Source:** `backend/app/services/matching_engine.py` (`BLOOD_COMPATIBILITY_MAP`) & `backend/app/services/matching_service.py`
- **Data Structure:** Hash map (`Dict[str, Dict[str, List[str]]]`) keyed by the 8 ABO/Rh groups (`O-`, `O+`, `A-`, `A+`, `B-`, `B+`, `AB-`, `AB+`).
- **Complexity:**
  - Time: $O(1)$ average hash lookup + bounded list membership check ($\le 8$ elements).
  - Space: $O(1)$ constant static table.
- **Clinical Boundary:** Acts strictly as an initial candidate pre-filter. Never certifies clinical compatibility or replaces hospital cross-matching.

---

## 2. Haversine Great-Circle Distance (`calculate_haversine_distance`, `haversine_distance`)
- **Source:** `backend/app/services/matching_engine.py` (lines 48–63) & `backend/app/utils/geo_utils.py`
- **Formula:** Using Earth radius $R = 6371.0\text{ km}$:
  $$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$
  $$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
  $$d = R \cdot 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
- **Complexity:** $O(1)$ time and $O(1)$ space per coordinate pair.
- **Limitation:** Measures spherical great-circle distance rather than road-network driving distance; `estimated_driving_minutes` uses a synthetic heuristic (`round(dist_km * 2.2, 1)` assuming ~30 km/h city average).

---

## 3. Donor Discovery & Proximity Ranking (`match_donors_for_request`)
- **Source:** `backend/app/services/matching_service.py` (lines 26–79)
- **Steps:**
  1. Fetch available donors from `donor_profiles` (`availability_status = 'available'`).
  2. Linear scan over $N$ donor candidates: filter by availability, ABO/Rh compatibility ($O(1)$), Haversine distance ($O(1)$), and `dist_km <= travel_radius_km`.
  3. Sort $K$ matched candidates ($K \le N$) ascending by `distance_km`.
  4. Slice top `max_results` (default `20`).
- **Complexity:**
  - Time: $O(N + K \log K)$ where $N$ is the fetched available donor pool and $K$ is the compatible subset within radius.
  - Space: $O(K)$ for the matched list.
- **Practical Scale Limitation:** Currently loads available `donor_profiles` into Python memory before filtering. At high national scale (millions of donors), this should be pushed down to PostGIS bounding-box / `ST_DWithin` spatial queries.

---

## 4. Donor Emergency Feed Ranking (`rank_requests_for_donor`)
- **Source:** `backend/app/services/matching_service.py` (lines 81–123)
- **Steps:**
  1. Filter open/in-progress requests ($M$ records) by biological compatibility and donor `travel_radius_km`.
  2. Multi-key sort by `(URGENCY_RANK[urgency_level], distance_km)` where `critical=1`, `urgent=2`, `normal=3`.
- **Complexity:** $O(M + R \log R)$ time and $O(R)$ space, where $R \le M$ is the number of matching requests.

---

## 5. Sliding-Window AI Rate Limiter (`check_rate_limit`)
- **Source:** `backend/app/routes/ai.py` (lines 20–34)
- **Mechanism:** `defaultdict(list)` storing request timestamps per client IP; prunes timestamps older than `60` seconds and blocks if count $\ge 30$.
- **Complexity:** $O(W)$ per request where $W \le 30$ (effectively $O(1)$ bounded).
- **Limitation:** In-memory per worker process; multi-worker production deployments should migrate this state to Redis.
