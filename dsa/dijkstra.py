import heapq

LAHORE_GRAPH = {
    "Model Town": {"Johar Town": 12, "Gulberg": 8, "Anarkali": 20, "Garden Town": 6, "Township": 5},
    "Johar Town": {"Model Town": 12, "Gulberg": 15, "DHA Phase 5": 25, "Iqbal Town": 10, "Wapda Town": 8, "Bahria Town": 22},
    "Gulberg": {"Model Town": 8, "Johar Town": 15, "DHA Phase 5": 10, "Anarkali": 14, "Garden Town": 5, "Cavalry Ground": 7},
    "DHA Phase 5": {"Johar Town": 25, "Gulberg": 10, "Anarkali": 30, "Cavalry Ground": 8},
    "Anarkali": {"Model Town": 20, "Gulberg": 14, "DHA Phase 5": 30, "Iqbal Town": 15},
    "Bahria Town": {"Wapda Town": 18, "Johar Town": 22},
    "Iqbal Town": {"Johar Town": 10, "Anarkali": 15, "Garden Town": 12},
    "Wapda Town": {"Johar Town": 8, "Bahria Town": 18, "Township": 10},
    "Township": {"Model Town": 5, "Wapda Town": 10},
    "Garden Town": {"Model Town": 6, "Gulberg": 5, "Iqbal Town": 12},
    "Cavalry Ground": {"Gulberg": 7, "DHA Phase 5": 8}
}

def dijkstra(graph: dict, start: str) -> dict[str, float]:
    """
    Computes the shortest travel time from start neighborhood to all other neighborhoods.
    Returns: dict of {neighborhood: time_in_minutes}
    """
    if start not in graph:
        return {start: 0.0}
        
    distances = {node: float('inf') for node in graph}
    distances[start] = 0.0
    
    # Priority queue stores tuples of (distance, node)
    pq = [(0.0, start)]
    
    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        # If we found a longer path already, skip
        if current_distance > distances[current_node]:
            continue
            
        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight
            
            # If we found a shorter path, update and push to queue
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(pq, (distance, neighbor))
                
    return distances
