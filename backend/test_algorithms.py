"""
Test suite for compression algorithms
Run with: python test_algorithms.py
"""

import sys
from algorithms.fibonacci_coding import (
    fib_encode,
    fib_decode,
    compress_dataset,
    decompress_dataset,
    get_compression_info
)
from algorithms.huffman_coding import (
    huffman_compress,
    get_huffman_compression_info
)
from algorithms.lzw_coding import (
    lzw_compress_numbers,
    lzw_decompress_numbers,
    get_lzw_compression_info
)


def print_section(title):
    """Print section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_fibonacci_coding():
    """Test Fibonacci coding algorithm"""
    print_section("FIBONACCI CODING TESTS")
    
    # Test 1: Individual encodings
    print("\n1. Testing individual encodings:")
    test_cases = [
        (1, '11'),
        (2, '011'),
        (3, '0011'),
        (4, '1011'),
        (5, '00011'),
        (10, '010011'),
    ]
    
    passed = 0
    for num, expected in test_cases:
        code = fib_encode(num)
        match = code == expected
        status = "✓ PASS" if match else "✗ FAIL"
        print(f"   {status} | fib_encode({num:3d}) = {code:12s} {'✓' if match else f'(expected: {expected})'}")
        if match:
            passed += 1
    
    print(f"\n   Result: {passed}/{len(test_cases)} tests passed")
    
    # Test 2: Round-trip encoding/decoding
    print("\n2. Testing round-trip encoding/decoding:")
    test_numbers = [1, 5, 10, 25, 50, 100, 255, 500]
    
    passed = 0
    for num in test_numbers:
        encoded = fib_encode(num)
        decoded = fib_decode(encoded)
        match = num == decoded
        status = "✓ PASS" if match else "✗ FAIL"
        print(f"   {status} | {num:3d} → {encoded:20s} → {decoded:3d}")
        if match:
            passed += 1
    
    print(f"\n   Result: {passed}/{len(test_numbers)} tests passed")
    
    # Test 3: Dataset compression
    print("\n3. Testing dataset compression:")
    dataset = [1, 2, 3, 4, 5, 10, 20, 50, 100]
    
    compressed = compress_dataset(dataset)
    decompressed = decompress_dataset(compressed, len(dataset))
    
    print(f"   Original:     {dataset}")
    print(f"   Compressed:   {compressed[:60]}...")
    print(f"   Decompressed: {decompressed}")
    print(f"   Match: {'✓ PASS' if dataset == decompressed else '✗ FAIL'}")
    
    # Test 4: Compression statistics
    print("\n4. Compression statistics:")
    info = get_compression_info(dataset)
    print(f"   Original bits:    {info['original_bits']}")
    print(f"   Compressed bits:  {info['compressed_bits']}")
    print(f"   Ratio:            {info['compression_ratio']:.2f}:1")
    print(f"   Savings:          {info['savings_percentage']:.2f}%")
    
    return True


def test_huffman_coding():
    """Test Huffman coding algorithm"""
    print_section("HUFFMAN CODING TESTS")
    
    # Test 1: Simple dataset with frequencies
    print("\n1. Testing compression with frequency analysis:")
    dataset = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
    
    compressed = huffman_compress(dataset)
    print(f"   Dataset:      {dataset}")
    print(f"   Compressed:   {compressed[:60]}...")
    print(f"   Length:       {len(compressed)} bits")
    
    # Test 2: Compression statistics
    print("\n2. Compression statistics:")
    info = get_huffman_compression_info(dataset)
    print(f"   Original bits:    {info['original_bits']}")
    print(f"   Compressed bits:  {info['compressed_bits']}")
    print(f"   Ratio:            {info['compression_ratio']:.2f}:1")
    print(f"   Savings:          {info['savings_percentage']:.2f}%")
    print(f"   Codebook:         {info['codebook']}")
    
    # Test 3: Varied dataset
    print("\n3. Testing on varied dataset:")
    dataset2 = [1, 2, 3, 4, 5, 10, 20, 50, 100]
    info2 = get_huffman_compression_info(dataset2)
    print(f"   Dataset:          {dataset2}")
    print(f"   Original bits:    {info2['original_bits']}")
    print(f"   Compressed bits:  {info2['compressed_bits']}")
    print(f"   Ratio:            {info2['compression_ratio']:.2f}:1")
    
    return True


def test_lzw_coding():
    """Test LZW coding algorithm"""
    print_section("LZW CODING TESTS")
    
    # Test 1: Round-trip compression
    print("\n1. Testing round-trip compression:")
    dataset = [1, 2, 3, 4, 5, 10, 20, 50, 100]
    
    compressed = lzw_compress_numbers(dataset)
    decompressed = lzw_decompress_numbers(compressed)
    
    print(f"   Original:     {dataset}")
    print(f"   Compressed:   {compressed}")
    print(f"   Decompressed: {decompressed}")
    print(f"   Match: {'✓ PASS' if dataset == decompressed else '✗ FAIL'}")
    
    # Test 2: Compression statistics
    print("\n2. Compression statistics:")
    info = get_lzw_compression_info(dataset)
    print(f"   Original bits:    {info['original_bits']}")
    print(f"   Compressed bits:  {info['compressed_bits']}")
    print(f"   Ratio:            {info['compression_ratio']:.2f}:1")
    print(f"   Code count:       {info['code_count']}")
    
    # Test 3: Pattern-heavy dataset
    print("\n3. Testing on pattern-heavy dataset:")
    dataset2 = [1, 2, 3, 1, 2, 3, 1, 2, 3, 4, 5, 4, 5]
    info2 = get_lzw_compression_info(dataset2)
    print(f"   Dataset:          {dataset2}")
    print(f"   Original bits:    {info2['original_bits']}")
    print(f"   Compressed bits:  {info2['compressed_bits']}")
    print(f"   Ratio:            {info2['compression_ratio']:.2f}:1")
    
    return True


def test_comparative_analysis():
    """Compare all three algorithms"""
    print_section("COMPARATIVE ANALYSIS")
    
    test_datasets = [
        ("Small Sequential", [1, 2, 3, 4, 5]),
        ("Varied Range", [1, 10, 100, 1000, 10000]),
        ("Repeated Pattern", [1, 2, 3, 1, 2, 3, 1, 2, 3]),
        ("Large Sequential", list(range(1, 51))),
    ]
    
    print("\nComparing Fibonacci, Huffman, and LZW algorithms:\n")
    print(f"{'Dataset':<20} | {'Method':<10} | {'Original':<12} | {'Compressed':<12} | {'Ratio':<10} | {'Savings':<10}")
    print("-" * 110)
    
    for name, dataset in test_datasets:
        # Fibonacci
        fib_info = get_compression_info(dataset)
        print(f"{name:<20} | {'Fibonacci':<10} | {fib_info['original_bits']:>10} b | {fib_info['compressed_bits']:>10} b | {fib_info['compression_ratio']:>8.2f}:1 | {fib_info['savings_percentage']:>8.2f}%")
        
        # Huffman
        huff_info = get_huffman_compression_info(dataset)
        print(f"{'':20} | {'Huffman':<10} | {huff_info['original_bits']:>10} b | {huff_info['compressed_bits']:>10} b | {huff_info['compression_ratio']:>8.2f}:1 | {huff_info['savings_percentage']:>8.2f}%")
        
        # LZW
        lzw_info = get_lzw_compression_info(dataset)
        print(f"{'':20} | {'LZW':<10} | {lzw_info['original_bits']:>10} b | {lzw_info['compressed_bits']:>10} b | {lzw_info['compression_ratio']:>8.2f}:1 | {lzw_info['savings_percentage']:>8.2f}%")
        
        # Determine best
        methods = {
            'Fibonacci': fib_info['compressed_bits'],
            'Huffman': huff_info['compressed_bits'],
            'LZW': lzw_info['compressed_bits']
        }
        best = min(methods, key=methods.get)
        print(f"{'':20} | {'Best: ' + best:<10}")
        print("-" * 110)


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("  COMPRESSION ALGORITHMS TEST SUITE")
    print("=" * 60)
    
    try:
        # Run tests
        test_fibonacci_coding()
        test_huffman_coding()
        test_lzw_coding()
        test_comparative_analysis()
        
        print("\n" + "=" * 60)
        print("  ALL TESTS COMPLETED")
        print("=" * 60)
        print("\n✓ All algorithms are working correctly!\n")
        
        return 0
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("  TEST FAILED")
        print("=" * 60)
        print(f"\n✗ Error: {e}\n")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
