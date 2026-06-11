# HUNAR (Skill)

*The Missing Layer Between Skill and Opportunity*

HUNAR is a 3-sided responsive web application that digitizes Pakistan's informal labor marketplace. It connects Customers, Workers, and Admins using custom algorithms and machine learning forecasting models.

---

## 🚀 Quick Start Setup

### 📦 Prerequisites
- **Python:** 3.12+
- **Node.js:** 18+
- **MongoDB:** (Optional) Will fall back to a local JSON database `hunar_db.json` automatically if MongoDB is not running locally.

---

## 🛠️ Installation & Execution

### 1. Backend Setup (Project Root)

The package dependencies have been installed on the `D:` drive inside `D:\python_libs` to bypass local disk space constraints on `C:`. 

To start the backend server:
```bash
# Verify you are in the project root directory
cd "D:\3rd sem\Project\Hunar by antigravity"

# Seed the database (populates hunar_db.json fallback and mock data)
python seed.py

# Launch the FastAPI uvicorn development server
python -m uvicorn main:app --reload --port 8000
```
- **API Health Check:** `http://127.0.0.1:8000/`
- **DSA Matching Demo Endpoint:** `http://127.0.0.1:8000/dsa/demo?skill=elect&location=Gulberg&sort_by=hourly_rate`

---

### 2. Frontend Setup (`/frontend` Subfolder)

```bash
# Navigate to the frontend directory
cd frontend

# Install package dependencies (redirecting caches to the D: drive)
New-Item -ItemType Directory -Force -Path D:\npm_cache
New-Item -ItemType Directory -Force -Path D:\npm_temp
$env:npm_config_cache="D:\npm_cache"
$env:TMP="D:\npm_temp"
$env:TEMP="D:\npm_temp"
npm install

# Start the Vite development server
npm run dev
```
- **Vite Local URL:** `http://localhost:5173/`

---

## 🔑 Demo Credentials

To test the role-based dashboards, use the following seeded login accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Customer** | `customer@hunar.pk` | `hunar123` | Can post jobs and request worker hires |
| **Worker** | `worker@hunar.pk` | `hunar123` | Connects via WebSockets to receive live job dispatch alerts |
| **Admin** | `admin@hunar.pk` | `hunar123` | Monitors platform stats, verify KYC, and runs model sandboxes |

---

## 🧠 Algorithmic Core (DSA & ML)

### Custom 4-Stage Matching Pipeline (DSA)
1. **Trie (`dsa/trie.py`):** Prefix autocomplete for skill categories (e.g. "elect" matches "Electrician").
2. **Dijkstra (`dsa/dijkstra.py`):** Bidirectional graph of Lahore neighborhoods weighted by real-world travel time (minutes).
3. **Min-Heap (`dsa/min_heap.py`):** Priority queue grouping matched workers by travel proximity.
4. **Merge Sort (`dsa/merge_sort.py`):** Multi-criteria stable O(n log n) sorting by rating, hourly rate, or badge level.

### Serialized ML Models (`ml/`)
- **Reliability Model (`ml/reliability_model.py`):** Trains a `LogisticRegression` classifier to score and assign badges (Gold/Silver/Bronze/Needs Review) using job completions, dispute histories, and ratings.
- **Price Predictor (`ml/price_model.py`):** Trains a `LinearRegression` model using category, region, and demand variables.
- **Demand Forecasting (`ml/demand_model.py`):** Cyclical sin/cos encoding of month bookings to project labor trends.
