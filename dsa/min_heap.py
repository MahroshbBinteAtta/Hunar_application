import heapq

class WorkerPriorityQueue:
    def __init__(self):
        self._heap = []
        self._counter = 0  # Tiebreaker for when travel times are identical

    def add_worker(self, travel_time: float, worker: dict):
        # Push (travel_time, counter, worker)
        # O(log n) insertion time
        heapq.heappush(self._heap, (travel_time, self._counter, worker))
        self._counter += 1

    def pop_closest(self) -> dict:
        # Extract worker with minimum travel_time
        # O(log n) deletion time
        if self.is_empty():
            raise IndexError("pop from empty priority queue")
        travel_time, _, worker = heapq.heappop(self._heap)
        # We can attach the travel_time directly to worker if not already present
        worker["travel_time_mins"] = travel_time
        return worker

    def peek(self) -> dict:
        # View minimum without removing — O(1)
        if self.is_empty():
            raise IndexError("peek from empty priority queue")
        _, _, worker = self._heap[0]
        return worker

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def size(self) -> int:
        return len(self._heap)
