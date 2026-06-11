SPAM_KEYWORDS = [
    "fake", "scam", "cheat", "frauds", "click here", "buy now", 
    "free money", "hack", "spam", "unreliable", "stole", "robbed"
]

def check_review_spam(review_text: str) -> dict:
    """
    Checks if a worker review is spam using a simple heuristic.
    Flags reviews < 5 chars, all caps, or containing spam keywords.
    """
    text = review_text.strip()
    
    # 1. Flag if too short
    if len(text) < 5:
        return {
            "is_spam": True,
            "confidence": 0.95,
            "reason": "Review is too short (less than 5 characters)."
        }
        
    # 2. Flag if all caps (indicates shouting/bot behavior)
    if text.isupper() and len(text) > 8:
        return {
            "is_spam": True,
            "confidence": 0.85,
            "reason": "Review is written entirely in CAPITAL letters."
        }
        
    # 3. Flag if containing spam keywords
    found_keywords = [kw for kw in SPAM_KEYWORDS if kw in text.lower()]
    if found_keywords:
        return {
            "is_spam": True,
            "confidence": 0.90,
            "reason": f"Review contains potential spam/restricted terms: {', '.join(found_keywords)}"
        }
        
    # Clean review
    return {
        "is_spam": False,
        "confidence": 0.05,
        "reason": "Review appears legitimate."
    }
