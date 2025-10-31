"""
LZW (Lempel-Ziv-Welch) Compression Algorithm Implementation
Dictionary-based compression that builds a dictionary of patterns dynamically.

References:
- Welch, T. A. (1984). A technique for high-performance data compression
- Ziv, J., & Lempel, A. (1977). A universal algorithm for sequential data compression
"""


def lzw_compress(data):
    """
    Compress data using LZW algorithm
    
    Process:
    1. Initialize dictionary with single-character strings
    2. Read input and find longest match in dictionary
    3. Output code for match and add new pattern to dictionary
    4. Continue until all input is processed
    
    Args:
        data (str): String data to compress
        
    Returns:
        list: List of integer codes representing compressed data
        
    Example:
        >>> lzw_compress("ABABABA")
        [65, 66, 256, 258, 65]
    """
    if not data:
        return []
    
    # Initialize dictionary with single characters
    # ASCII values 0-255 are reserved for single characters
    dictionary = {chr(i): i for i in range(256)}
    next_code = 256
    
    # Current string being processed
    current = ""
    result = []
    
    for char in data:
        combined = current + char
        
        if combined in dictionary:
            # Pattern exists in dictionary, continue building
            current = combined
        else:
            # Pattern not in dictionary
            # Output code for current pattern
            result.append(dictionary[current])
            
            # Add new pattern to dictionary
            dictionary[combined] = next_code
            next_code += 1
            
            # Start new pattern with current character
            current = char
    
    # Output code for remaining pattern
    if current:
        result.append(dictionary[current])
    
    return result


def lzw_decompress(codes):
    """
    Decompress LZW-encoded data
    
    Args:
        codes (list): List of integer codes
        
    Returns:
        str: Decompressed string
    """
    if not codes:
        return ""
    
    # Initialize dictionary with single characters
    dictionary = {i: chr(i) for i in range(256)}
    next_code = 256
    
    # Get first code
    result = [dictionary[codes[0]]]
    current = dictionary[codes[0]]
    
    for code in codes[1:]:
        if code in dictionary:
            entry = dictionary[code]
        elif code == next_code:
            # Special case: code not yet in dictionary
            entry = current + current[0]
        else:
            raise ValueError(f"Invalid LZW code: {code}")
        
        result.append(entry)
        
        # Add new entry to dictionary
        dictionary[next_code] = current + entry[0]
        next_code += 1
        
        current = entry
    
    return ''.join(result)


def lzw_compress_numbers(numbers):
    """
    Compress a list of numbers using LZW
    
    Converts numbers to comma-separated string first,
    then applies LZW compression.
    
    Args:
        numbers (list): List of integers
        
    Returns:
        list: List of LZW codes
    """
    if not numbers:
        return []
    
    # Convert numbers to string
    data_string = ','.join(map(str, numbers))
    
    # Apply LZW compression
    return lzw_compress(data_string)


def lzw_decompress_numbers(codes):
    """
    Decompress LZW-encoded numbers
    
    Args:
        codes (list): List of LZW codes
        
    Returns:
        list: List of integers
    """
    if not codes:
        return []
    
    # Decompress to string
    decompressed_string = lzw_decompress(codes)
    
    # Parse numbers
    try:
        numbers = [int(x) for x in decompressed_string.split(',')]
        return numbers
    except ValueError:
        raise ValueError("Failed to parse decompressed data as numbers")


def get_lzw_compression_info(numbers):
    """
    Get detailed information about LZW compression
    
    Args:
        numbers (list): List of integers
        
    Returns:
        dict: Compression statistics
    """
    if not numbers:
        return {
            'original_bits': 0,
            'compressed_bits': 0,
            'compression_ratio': 0
        }
    
    # Compress
    codes = lzw_compress_numbers(numbers)
    
    # Calculate sizes
    # Original: 32-bit integers (realistic storage baseline)
    original_bits = len(numbers) * 32
    
    # Compressed: each code typically uses 12-16 bits
    # For simplicity, we'll estimate 12 bits per code
    compressed_bits = len(codes) * 12
    
    return {
        'original_bits': original_bits,
        'compressed_bits': compressed_bits,
        'compression_ratio': original_bits / compressed_bits if compressed_bits > 0 else 0,
        'savings_percentage': ((original_bits - compressed_bits) / original_bits * 100) if original_bits > 0 else 0,
        'code_count': len(codes),
        'dictionary_size': 256 + len(codes)
    }


def convert_lzw_to_binary(codes):
    """
    Convert LZW codes to binary string for fair comparison
    
    Uses variable-length encoding based on dictionary size
    
    Args:
        codes (list): List of LZW codes
        
    Returns:
        str: Binary string representation
    """
    if not codes:
        return ''
    
    binary_parts = []
    
    # Start with 9 bits (256 initial codes + need for growth)
    current_bits = 9
    max_code = (1 << current_bits) - 1
    
    for code in codes:
        # Increase bit width if necessary
        while code > max_code:
            current_bits += 1
            max_code = (1 << current_bits) - 1
        
        # Convert code to binary with current bit width
        binary = format(code, f'0{current_bits}b')
        binary_parts.append(binary)
    
    return ''.join(binary_parts)


# ================================================
# TESTING
# ================================================

def test_lzw_coding():
    """Test LZW coding implementation"""
    print("Testing LZW Coding...")
    
    # Test case 1: String compression
    test_string = "ABABABA"
    print("\n1. Testing string compression:")
    compressed = lzw_compress(test_string)
    decompressed = lzw_decompress(compressed)
    print(f"   Original:      {test_string}")
    print(f"   Compressed:    {compressed}")
    print(f"   Decompressed:  {decompressed}")
    print(f"   Match: {'✓' if test_string == decompressed else '✗'}")
    
    # Test case 2: Number compression
    test_numbers = [1, 2, 3, 4, 5, 10, 20, 50, 100]
    print("\n2. Testing number compression:")
    compressed_nums = lzw_compress_numbers(test_numbers)
    decompressed_nums = lzw_decompress_numbers(compressed_nums)
    print(f"   Original:      {test_numbers}")
    print(f"   Compressed:    {compressed_nums}")
    print(f"   Decompressed:  {decompressed_nums}")
    print(f"   Match: {'✓' if test_numbers == decompressed_nums else '✗'}")
    
    # Test case 3: Compression statistics
    print("\n3. Compression statistics:")
    info = get_lzw_compression_info(test_numbers)
    print(f"   Original bits:    {info['original_bits']}")
    print(f"   Compressed bits:  {info['compressed_bits']}")
    print(f"   Ratio:            {info['compression_ratio']:.2f}:1")
    print(f"   Code count:       {info['code_count']}")
    
    # Test case 4: Binary conversion
    print("\n4. Binary representation:")
    binary = convert_lzw_to_binary(compressed_nums)
    print(f"   Binary length:    {len(binary)} bits")
    print(f"   Binary preview:   {binary[:50]}...")
    
    print("\nLZW Coding Tests Complete!")


if __name__ == '__main__':
    test_lzw_coding()
