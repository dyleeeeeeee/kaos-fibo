"""
Huffman Coding Algorithm Implementation
Statistical compression algorithm that assigns variable-length codes based on frequency.

References:
- Huffman, D. A. (1952). A method for the construction of minimum-redundancy codes
"""

import heapq
from collections import Counter, defaultdict


class HuffmanNode:
    """
    Node class for Huffman tree
    
    Attributes:
        freq (int): Frequency of the character/value
        value: The actual character/value (None for internal nodes)
        left: Left child node
        right: Right child node
    """
    
    def __init__(self, freq, value=None, left=None, right=None):
        self.freq = freq
        self.value = value
        self.left = left
        self.right = right
    
    def __lt__(self, other):
        """
        Comparison operator for heap operations
        Nodes with lower frequency have higher priority
        """
        return self.freq < other.freq
    
    def is_leaf(self):
        """Check if this node is a leaf (has a value)"""
        return self.value is not None


def build_huffman_tree(frequencies):
    """
    Build Huffman tree from frequency dictionary
    
    Process:
    1. Create leaf node for each value with its frequency
    2. Build min-heap of all nodes
    3. Repeatedly:
       - Extract two nodes with minimum frequency
       - Create parent node with combined frequency
       - Add parent back to heap
    4. Last remaining node is the root
    
    Args:
        frequencies (dict): Dictionary mapping values to frequencies
        
    Returns:
        HuffmanNode: Root of Huffman tree
    """
    if not frequencies:
        return None
    
    # Create a min-heap of leaf nodes
    heap = [HuffmanNode(freq, value) for value, freq in frequencies.items()]
    heapq.heapify(heap)
    
    # Build tree by combining nodes
    while len(heap) > 1:
        # Extract two nodes with minimum frequency
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        
        # Create parent node with combined frequency
        parent = HuffmanNode(
            freq=left.freq + right.freq,
            left=left,
            right=right
        )
        
        # Add parent back to heap
        heapq.heappush(heap, parent)
    
    # Root is the last remaining node
    return heap[0]


def build_codebook(root):
    """
    Build codebook (mapping from values to binary codes) from Huffman tree
    
    Traverses tree and assigns codes:
    - '0' for left branch
    - '1' for right branch
    
    Args:
        root (HuffmanNode): Root of Huffman tree
        
    Returns:
        dict: Mapping from values to binary code strings
    """
    if not root:
        return {}
    
    codebook = {}
    
    def traverse(node, code=''):
        """Recursive tree traversal to build codes"""
        if node.is_leaf():
            # Leaf node - assign code
            codebook[node.value] = code if code else '0'  # Handle single-value case
        else:
            # Internal node - recurse
            if node.left:
                traverse(node.left, code + '0')
            if node.right:
                traverse(node.right, code + '1')
    
    traverse(root)
    return codebook


def huffman_compress(numbers):
    """
    Compress a list of integers using Huffman coding
    
    Process:
    1. Count frequency of each number
    2. Build Huffman tree based on frequencies
    3. Generate optimal codebook
    4. Encode each number using codebook
    5. Concatenate all codes
    
    Args:
        numbers (list): List of integers to compress
        
    Returns:
        str: Binary string of compressed data
        
    Note:
        In a real implementation, the codebook would need to be stored
        with the compressed data for decompression. This simplified version
        assumes the decoder has access to the codebook.
    """
    if not numbers:
        return ''
    
    # Count frequencies
    frequencies = Counter(numbers)
    
    # Handle single unique value case
    if len(frequencies) == 1:
        value = list(frequencies.keys())[0]
        # Use single bit per occurrence
        return '0' * len(numbers)
    
    # Build Huffman tree
    root = build_huffman_tree(frequencies)
    
    # Generate codebook
    codebook = build_codebook(root)
    
    # Encode data
    compressed = ''.join(codebook[num] for num in numbers)
    
    return compressed


def huffman_decompress(compressed_string, codebook_inverted, count):
    """
    Decompress Huffman-encoded data
    
    Args:
        compressed_string (str): Binary string of compressed data
        codebook_inverted (dict): Mapping from codes to values
        count (int): Number of values to decode
        
    Returns:
        list: Decompressed list of integers
    """
    if not compressed_string:
        return []
    
    numbers = []
    current_code = ''
    
    for bit in compressed_string:
        current_code += bit
        
        if current_code in codebook_inverted:
            numbers.append(codebook_inverted[current_code])
            current_code = ''
            
            if len(numbers) == count:
                break
    
    return numbers


def get_huffman_compression_info(numbers):
    """
    Get detailed information about Huffman compression
    
    Args:
        numbers (list): List of integers
        
    Returns:
        dict: Compression statistics and details
    """
    if not numbers:
        return {
            'original_bits': 0,
            'compressed_bits': 0,
            'compression_ratio': 0,
            'codebook': {}
        }
    
    # Calculate frequencies and build tree
    frequencies = Counter(numbers)
    root = build_huffman_tree(frequencies)
    codebook = build_codebook(root)
    
    # Compress
    compressed = huffman_compress(numbers)
    
    # Calculate original size (32-bit integers as baseline)
    original_bits = len(numbers) * 32
    compressed_bits = len(compressed)
    
    return {
        'original_bits': original_bits,
        'compressed_bits': compressed_bits,
        'compression_ratio': original_bits / compressed_bits if compressed_bits > 0 else 0,
        'savings_percentage': ((original_bits - compressed_bits) / original_bits * 100) if original_bits > 0 else 0,
        'codebook': codebook,
        'unique_values': len(frequencies),
        'frequencies': dict(frequencies)
    }


# ================================================
# TESTING
# ================================================

def test_huffman_coding():
    """Test Huffman coding implementation"""
    print("Testing Huffman Coding...")
    
    # Test case 1: Simple dataset
    test_data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
    
    print("\n1. Testing compression:")
    compressed = huffman_compress(test_data)
    print(f"   Original:    {test_data}")
    print(f"   Compressed:  {compressed}")
    print(f"   Length:      {len(compressed)} bits")
    
    print("\n2. Compression statistics:")
    info = get_huffman_compression_info(test_data)
    print(f"   Original bits:    {info['original_bits']}")
    print(f"   Compressed bits:  {info['compressed_bits']}")
    print(f"   Ratio:            {info['compression_ratio']:.2f}:1")
    print(f"   Savings:          {info['savings_percentage']:.2f}%")
    print(f"   Codebook:         {info['codebook']}")
    
    # Test case 2: Compare with Fibonacci dataset
    test_data2 = [1, 2, 3, 4, 5, 10, 20, 50, 100]
    print("\n3. Testing on varied dataset:")
    info2 = get_huffman_compression_info(test_data2)
    print(f"   Dataset:          {test_data2}")
    print(f"   Original bits:    {info2['original_bits']}")
    print(f"   Compressed bits:  {info2['compressed_bits']}")
    print(f"   Ratio:            {info2['compression_ratio']:.2f}:1")
    
    print("\nHuffman Coding Tests Complete!")


if __name__ == '__main__':
    test_huffman_coding()
