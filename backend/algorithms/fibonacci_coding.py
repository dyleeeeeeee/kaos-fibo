"""
Fibonacci Coding Algorithm Implementation
Based on Zeckendorf's Theorem for representing integers as sums of non-consecutive Fibonacci numbers.

References:
- Zeckendorf, E. (1972). Représentation des nombres naturels par une somme de nombres de Fibonacci
- Fraenkel, A. S., & Klein, S. T. (1996). Robust universal complete codes
"""


def generate_fibs(n):
    """
    Generate Fibonacci numbers up to n
    
    The Fibonacci sequence starts with 1, 2, 3, 5, 8, 13, 21...
    Each number is the sum of the two preceding ones.
    
    Args:
        n (int): Upper limit for Fibonacci generation
        
    Returns:
        list: List of Fibonacci numbers <= n
        
    Example:
        >>> generate_fibs(10)
        [1, 2, 3, 5, 8]
    """
    if n < 1:
        return []
    
    fibs = []
    a, b = 1, 2
    
    while a <= n:
        fibs.append(a)
        a, b = b, a + b
    
    return fibs


def fib_encode(n):
    """
    Encode a positive integer using Fibonacci coding
    
    Process:
    1. Find all Fibonacci numbers <= n
    2. Use greedy algorithm to find Zeckendorf representation
       (largest Fibonacci numbers first, no consecutive Fib numbers)
    3. Create binary string where '1' indicates Fibonacci number is used
    4. Append '1' as terminator (creates unique '11' ending)
    
    Args:
        n (int): Positive integer to encode
        
    Returns:
        str: Binary string representation (Fibonacci code)
        
    Raises:
        ValueError: If n is not a positive integer
        
    Examples:
        >>> fib_encode(1)
        '11'
        >>> fib_encode(2)
        '011'
        >>> fib_encode(3)
        '0011'
        >>> fib_encode(4)
        '1011'
        >>> fib_encode(5)
        '00011'
    """
    if n <= 0:
        raise ValueError("Only positive integers can be encoded. Got: {}".format(n))
    
    # Generate Fibonacci numbers up to n
    fibs = generate_fibs(n)
    
    if not fibs:
        # Edge case: n = 1
        return '11'
    
    # Initialize code array with zeros
    code = ['0'] * len(fibs)
    
    # Greedy algorithm: Start from largest Fibonacci number
    # and work backwards (Zeckendorf representation)
    i = len(fibs) - 1
    remainder = n
    
    while remainder > 0 and i >= 0:
        if remainder >= fibs[i]:
            code[i] = '1'
            remainder -= fibs[i]
        i -= 1
    
    # Join code and append '1' terminator
    # The terminator creates a unique '11' pattern that marks the end
    return ''.join(code) + '1'


def fib_decode(code):
    """
    Decode a Fibonacci-encoded binary string back to integer
    
    Process:
    1. Remove the terminating '1'
    2. Generate Fibonacci sequence of appropriate length
    3. Sum Fibonacci numbers where code has '1'
    
    Args:
        code (str): Fibonacci-encoded binary string (must end with '11')
        
    Returns:
        int: Decoded positive integer
        
    Raises:
        ValueError: If code is invalid or doesn't end with '11'
        
    Examples:
        >>> fib_decode('11')
        1
        >>> fib_decode('011')
        2
        >>> fib_decode('0011')
        3
        >>> fib_decode('1011')
        4
    """
    if not code or len(code) < 2:
        raise ValueError("Invalid Fibonacci code: too short")
    
    if not code.endswith('11'):
        raise ValueError("Invalid Fibonacci code: must end with '11'")
    
    # Remove terminating '1'
    code = code[:-1]
    
    if not code:
        # Special case: '11' decodes to 1
        return 1
    
    # Generate Fibonacci numbers
    # We need as many as there are bits in the code
    length = len(code)
    fibs = []
    a, b = 1, 2
    for _ in range(length):
        fibs.append(a)
        a, b = b, a + b
    
    # Calculate sum based on code bits
    result = 0
    for i, bit in enumerate(code):
        if bit == '1':
            result += fibs[i]
    
    return result


def compress_dataset(numbers):
    """
    Compress a list of positive integers using Fibonacci coding
    
    Each number is independently encoded using Fibonacci coding,
    and the results are concatenated. The '11' terminator of each
    codeword allows unambiguous parsing during decompression.
    
    Args:
        numbers (list): List of positive integers
        
    Returns:
        str: Concatenated binary string of all encoded numbers
        
    Raises:
        ValueError: If any number is not a positive integer
        
    Example:
        >>> compress_dataset([1, 2, 3])
        '110110011'
    """
    if not numbers:
        return ''
    
    compressed = []
    
    for num in numbers:
        if not isinstance(num, int) or num <= 0:
            raise ValueError(f"Invalid number in dataset: {num}. Only positive integers supported.")
        
        encoded = fib_encode(num)
        compressed.append(encoded)
    
    return ''.join(compressed)


def decompress_dataset(compressed_string, count):
    """
    Decompress a Fibonacci-encoded binary string back to list of integers
    
    The decompression process uses the '11' terminator pattern to identify
    boundaries between encoded numbers. This self-synchronizing property
    allows for reliable decompression.
    
    Args:
        compressed_string (str): Fibonacci-encoded binary string
        count (int): Expected number of integers (for validation)
        
    Returns:
        list: List of decoded integers
        
    Raises:
        ValueError: If decompression fails or count mismatch
        
    Example:
        >>> decompress_dataset('110110011', 3)
        [1, 2, 3]
    """
    if not compressed_string:
        return []
    
    numbers = []
    i = 0
    
    while i < len(compressed_string):
        # Find next '11' terminator
        j = i + 1
        
        while j < len(compressed_string):
            if compressed_string[j-1:j+1] == '11':
                # Found a complete codeword
                codeword = compressed_string[i:j+1]
                number = fib_decode(codeword)
                numbers.append(number)
                i = j + 1
                break
            j += 1
        else:
            # Reached end without finding terminator
            if i < len(compressed_string):
                raise ValueError(f"Invalid compressed data: no terminator found starting at position {i}")
            break
    
    # Validate count
    if len(numbers) != count:
        raise ValueError(f"Expected {count} numbers, but decoded {len(numbers)}")
    
    return numbers


def get_compression_info(numbers):
    """
    Get detailed information about Fibonacci compression for a dataset
    
    Useful for analysis and debugging purposes.
    
    Args:
        numbers (list): List of positive integers
        
    Returns:
        dict: Dictionary with compression details
    """
    compressed = compress_dataset(numbers)
    
    # Calculate individual encodings
    encodings = []
    for num in numbers:
        code = fib_encode(num)
        encodings.append({
            'number': num,
            'code': code,
            'length': len(code)
        })
    
    # Calculate statistics
    # Use 32-bit integers as baseline (realistic storage size)
    original_bits = len(numbers) * 32
    compressed_bits = len(compressed)
    
    return {
        'original_numbers': numbers,
        'compressed_string': compressed,
        'encodings': encodings,
        'original_bits': original_bits,
        'compressed_bits': compressed_bits,
        'compression_ratio': original_bits / compressed_bits if compressed_bits > 0 else 0,
        'savings_percentage': ((original_bits - compressed_bits) / original_bits * 100) if original_bits > 0 else 0
    }


# ================================================
# TESTING AND VALIDATION
# ================================================

def test_fibonacci_coding():
    """
    Test function to verify Fibonacci coding implementation
    
    Tests encoding, decoding, and round-trip conversion for various inputs.
    """
    print("Testing Fibonacci Coding...")
    
    # Test cases from Wikipedia
    test_cases = [
        (1, '11'),
        (2, '011'),
        (3, '0011'),
        (4, '1011'),
        (5, '00011'),
        (6, '10011'),
        (7, '01011'),
        (8, '000011'),
        (10, '010011'),
        (100, '0001010011')
    ]
    
    print("\n1. Testing individual encodings:")
    for num, expected_code in test_cases:
        code = fib_encode(num)
        success = "✓" if code == expected_code else "✗"
        print(f"   {success} fib_encode({num}) = {code} {'(expected: ' + expected_code + ')' if code != expected_code else ''}")
    
    print("\n2. Testing decoding:")
    for num, code in test_cases:
        decoded = fib_decode(code)
        success = "✓" if decoded == num else "✗"
        print(f"   {success} fib_decode({code}) = {decoded} {'(expected: ' + str(num) + ')' if decoded != num else ''}")
    
    print("\n3. Testing dataset compression:")
    test_dataset = [1, 2, 3, 4, 5, 10, 20, 50, 100]
    compressed = compress_dataset(test_dataset)
    decompressed = decompress_dataset(compressed, len(test_dataset))
    
    print(f"   Original:     {test_dataset}")
    print(f"   Compressed:   {compressed[:50]}{'...' if len(compressed) > 50 else ''}")
    print(f"   Decompressed: {decompressed}")
    print(f"   Match: {'✓' if test_dataset == decompressed else '✗'}")
    
    print("\n4. Compression statistics:")
    info = get_compression_info(test_dataset)
    print(f"   Original bits:    {info['original_bits']}")
    print(f"   Compressed bits:  {info['compressed_bits']}")
    print(f"   Ratio:            {info['compression_ratio']:.2f}:1")
    print(f"   Savings:          {info['savings_percentage']:.2f}%")
    
    print("\nFibonacci Coding Tests Complete!")


if __name__ == '__main__':
    # Run tests when module is executed directly
    test_fibonacci_coding()
