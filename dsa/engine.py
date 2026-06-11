from dsa.trie import skill_trie
from dsa.dijkstra import dijkstra, LAHORE_GRAPH
from dsa.min_heap import WorkerPriorityQueue
from dsa.merge_sort import merge_sort
import logging

logger = logging.getLogger("hunar_algorithmic_engine")

class HunarAlgorithmicEngine:
    """
    4-stage pipeline:
    Stage 1: Trie  → prefix search → target skill
    Stage 2: Dijkstra → travel times from customer location
    Stage 3: Min-Heap → rank workers by proximity
    Stage 4: Merge Sort → multi-criteria final ranking
    """
    def __init__(self, workers: list[dict]):
        self.trie = skill_trie
        self.workers = workers  # List of all available worker profile dicts
        self.graph = LAHORE_GRAPH

    def run(self, skill_query: str, customer_location: str, sort_by: str = "hourly_rate") -> dict:
        trace = []
        trace.append(f"Starting pipeline with query: '{skill_query}', customer location: '{customer_location}', sorting by: '{sort_by}'")

        # Stage 1: Trie Match
        trace.append("Stage 1: Performing Trie Prefix Search...")
        is_empty_query = not skill_query.strip()
        if is_empty_query:
            matches = []
            target_skill = "All Skills"
            trace.append("Empty skill query. Skipping Trie filtering to show all workers.")
        else:
            matches = self.trie.search_prefix(skill_query)
            target_skill = matches[0] if matches else skill_query
            trace.append(f"Trie search finished. Matches found: {matches}. Target skill resolved to: '{target_skill}'")

        # Stage 2: Dijkstra Routing
        trace.append(f"Stage 2: Computing Dijkstra travel times from '{customer_location}'...")
        if customer_location not in self.graph:
            distances = {customer_location: 0.0}
            trace.append(f"Warning: Location '{customer_location}' not in Lahore graph. Setting travel time to 0.")
        else:
            distances = dijkstra(self.graph, customer_location)
            trace.append(f"Dijkstra computed routes. Nearby nodes found: {list(distances.keys())}")

        # Stage 3: Proximity Priority Queue via Min-Heap
        trace.append("Stage 3: Filtering workers by skill and ordering by proximity using Min-Heap...")
        pq = WorkerPriorityQueue()
        matched_workers_initial = []

        # GPS coordinates mapping for Lahore neighborhoods
        COORDINATES = {
            "Model Town": (31.4806, 74.3224),
            "Johar Town": (31.4697, 74.2728),
            "Gulberg": (31.5204, 74.3587),
            "DHA Phase 5": (31.4688, 74.4287),
            "Anarkali": (31.5724, 74.3108),
            "Bahria Town": (31.3664, 74.1843),
            "Iqbal Town": (31.5115, 74.2801),
            "Wapda Town": (31.4278, 74.2687),
            "Township": (31.4549, 74.3090),
            "Garden Town": (31.5031, 74.3275),
            "Cavalry Ground": (31.5073, 74.3734)
        }

        import math
        def calculate_haversine(lat1, lon1, lat2, lon2):
            R = 6371.0 # Radius of the earth in km
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return round(R * c, 2)

        for worker in self.workers:
            # Case-insensitive skill matching
            worker_skills = [s.lower() for s in worker.get("skills", [])]
            if is_empty_query or target_skill.lower() in worker_skills:
                loc = worker.get("location", "Unknown")
                # Fallback to high travel time if location is disconnected
                travel_time = distances.get(loc, 999.0)
                
                # Calculate Haversine straight-line distance
                cust_coords = COORDINATES.get(customer_location, (31.5204, 74.3587))
                worker_coords = COORDINATES.get(loc, (31.4806, 74.3224))
                gps_dist = calculate_haversine(cust_coords[0], cust_coords[1], worker_coords[0], worker_coords[1])
                
                # Clone worker dict to avoid mutating original state in database queries
                w_copy = dict(worker)
                w_copy["travel_time_mins"] = travel_time
                w_copy["gps_distance_km"] = gps_dist
                
                pq.add_worker(travel_time, w_copy)
                matched_workers_initial.append(w_copy)

        trace.append(f"Filtered {len(matched_workers_initial)} workers with skill '{target_skill}'. Added to Priority Queue.")

        # Extract all from Heap (natural proximity order)
        heap_ordered = []
        while not pq.is_empty():
            heap_ordered.append(pq.pop_closest())

        trace.append(f"Extracted workers from Min-Heap. Proximity order: {[w['name'] + ' (' + str(w['travel_time_mins']) + 'm)' for w in heap_ordered]}")

        # Stage 4: Multi-Criteria Stable Sort
        trace.append(f"Stage 4: Sorting proximity order with Merge Sort by key '{sort_by}'...")
        # For rating, reliability score, we want descending order (highest score first)
        # For hourly rate, travel time, we want ascending order (cheapest/closest first)
        descending = sort_by in ["rating_history", "reliability_score", "experience_years"]
        final_ranking = merge_sort(heap_ordered, key=sort_by, descending=descending)
        
        trace.append(f"Merge Sort completed. Final ranked workers count: {len(final_ranking)}")
        trace.append("Pipeline execution completed successfully.")

        # Convert float('inf') to 999.0 for JSON serialization
        serialized_distances = {}
        for k, v in distances.items():
            serialized_distances[k] = 999.0 if v == float('inf') else v

        return {
            "trie_matches": matches,
            "target_skill": target_skill,
            "dijkstra_distances": serialized_distances,
            "matched_workers_count": len(heap_ordered),
            "heap_order": heap_ordered,
            "final_ranking": final_ranking,
            "pipeline_trace": trace
        }
