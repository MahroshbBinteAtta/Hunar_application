def merge_sort(workers: list, key: str = "hourly_rate", descending: bool = False) -> list:
    """
    Stable O(n log n) sort of workers list by any key.
    key options: "hourly_rate", "rating_history", "travel_time_mins", "reliability_score"
    """
    if len(workers) <= 1:
        return workers
    mid = len(workers) // 2
    left = merge_sort(workers[:mid], key, descending)
    right = merge_sort(workers[mid:], key, descending)
    return merge(left, right, key, descending)

def merge(left: list, right: list, key: str, descending: bool) -> list:
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        # Retrieve properties with fallbacks for missing values
        val_l = left[i].get(key)
        val_r = right[j].get(key)
        
        # Standardize typing for proper comparison
        if val_l is None:
            val_l = 0.0
        if val_r is None:
            val_r = 0.0
            
        # Perform comparison preserving stability
        if descending:
            if val_l >= val_r:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        else:
            if val_l <= val_r:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
                
    result.extend(left[i:])
    result.extend(right[j:])
    return result
