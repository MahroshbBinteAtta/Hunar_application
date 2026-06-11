SKILL_CATEGORIES = [
    "Electrician", "Plumber", "Carpenter", "AC Technician",
    "Painter", "Tutor", "Driver", "Mason", "Welder",
    "Gardener", "Cook", "Security Guard"
]

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False
        self.original_word = None

class Trie:
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word: str):
        node = self.root
        for char in word.lower():
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True
        node.original_word = word
    
    def _dfs(self, node: TrieNode, results: list):
        if node.is_end_of_word and node.original_word:
            results.append(node.original_word)
        for char in sorted(node.children.keys()):
            self._dfs(node.children[char], results)

    def search_prefix(self, prefix: str) -> list[str]:
        node = self.root
        for char in prefix.lower():
            if char not in node.children:
                return []
            node = node.children[char]
        
        results = []
        self._dfs(node, results)
        return results

# Initialize global trie with all skill categories
skill_trie = Trie()
for skill in SKILL_CATEGORIES:
    skill_trie.insert(skill)
