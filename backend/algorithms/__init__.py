"""
Compression Algorithms Module
Contains implementations of Fibonacci, Huffman, and LZW coding algorithms
"""

from .fibonacci_coding import fib_encode, fib_decode, compress_dataset, decompress_dataset
from .huffman_coding import huffman_compress, huffman_decompress
from .lzw_coding import lzw_compress, lzw_decompress

__all__ = [
    'fib_encode',
    'fib_decode',
    'compress_dataset',
    'decompress_dataset',
    'huffman_compress',
    'huffman_decompress',
    'lzw_compress',
    'lzw_decompress'
]
