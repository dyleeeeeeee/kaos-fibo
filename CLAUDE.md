```markdown
# Claude Prompt for Implementing Fibonacci Coding Compression System

You are an expert full-stack web developer and data compression specialist tasked with creating a complete, functional web-based system for compressing large numerical datasets using Fibonacci coding, as detailed in the provided school project documents. This is for a student's school project, so ensure the implementation is thorough, professional, educational (with comments explaining code), and covers EVERY requirement, request, feature, objective, and detail outlined in the documents. Do not omit any part—be exhaustive.

## Key Instructions:
- **Base the Implementation on the Documents**: Use the content from the two provided documents as the blueprint. The first document ("Fibonacci Coding For Compressing Larger Numerical Datasets In Web-Based Systems.docx") is the main project thesis, including introduction, problem statement, aims/objectives, significance, scope/limitations, definitions, literature review, related works, conclusions, recommendations, references, and appendices. The second document ("File Compression Metrics and Display Options.docx") provides additional requirements for displaying compression metrics and options.
- **UI Template/Design**: Strictly use and build upon the provided UI template. The UI is a glassmorphic design with a blue gradient background (from light blue to purple-ish), rounded translucent panels with blur effect. It includes:
  - "USER DATA INPUT" header.
  - A rounded text input box with placeholder "Enter data string here... e.g., School Project, Data" (adapt to "e.g., 1,2,3,4,5" for numerical datasets as comma-separated integers).
  - A blue rounded "COMPRESS" button.
  - An empty area below the button (use for immediate compression result display, e.g., metrics).
  - A table below with columns: ID, Raw Input, Compressed Data, Time Taken to (complete the header as "Time Taken to Compress").
  - Table rows showing history, e.g., ID 1, Raw Input "1,2,3", Compressed Data (binary string or abbreviated), Time Taken "0.5s".
  - Footer "Powered by University of Port-Harcourt".
  - Use CSS for glassmorphism (backdrop-filter: blur, rgba background), responsive design.
  - Frontend interactivity with JavaScript to send input to backend API on button click, update table with history.
- **Deliver the Programmables**: Generate all programmable elements, including:
  - Frontend: HTML, CSS (for glassmorphism and gradient), JavaScript (vanilla JS with fetch for API calls).
  - Backend: Python with Flask for RESTful API, PyMongo for MongoDB Atlas connection.
  - Database: MongoDB Atlas (cloud), collection for compression logs (documents with id, raw_input, compressed_data, time_taken, timestamp, metrics).
  - Fibonacci coding algorithm implementation in Python (lossless, prefix-free, based on Zeckendorf's Theorem, ends with '11', no consecutive 1s except end; handle list of positive integers from input string, encode each, concatenate bits).
  - Integration of all metrics from the second document (display in the empty area after compression: size metrics, performance, file details - treat input as 'dataset.txt', comparative, batch stats if multiple, integrity checksum, resource usage, algorithm-specific like max Fib number, visual progress bar during compression).
  - Full functionality for compression, history display, metrics.
- **Cover Every Requirement/Feature**:
  - **From Document 1**:
    - Objectives: Study principles (include tooltips or about page with explanations), implement algorithm (use the correct one from Wikipedia: examples 1:'11', 2:'011', 3:'0011', 4:'1011'), integrate into web platform, compare with standard methods (implement Huffman, LZW in Python for comparison, show in metrics).
    - Scope: Lossless compression for integer numerical datasets (parse input string as comma-separated ints, reject non-integers).
    - Limitations: Comment in code (no floats, no security, prototype).
    - Algorithm: Use the Wikipedia method, educational comments with math.
    - Web System: Client-server, Flask API endpoints (/compress, /logs).
    - Evaluation Metrics: Ratio, time, integrity, network (simulate).
    - Definitions: Add glossary section in UI.
    - Literature/Related Works: Add "About" page with references.
    - System Design: Three-tier (UI, Flask logic, MongoDB).
    - Implementation: Handle input, parse to ints, compress each with fib_encode, concatenate, store bit string as string, display abbreviated if long (e.g., first 10 chars + ...).
    - Testing: Pytest for backend, JS tests if possible.
    - Conclusions/Recommendations: Reflect in README, implement extensions as TODOs (hybrid, ML, parallel).
    - References: In code and UI.
    - Appendices: Adapt the source code to this UI, ignore previous React, use vanilla.
  - **From Document 2**:
    - Display ALL metrics in UI after compression (in the empty area, use table or list): size (original bits vs compressed), reduction, ratio, %, performance time/speed, details (type 'numerical', method 'Fibonacci'), comparative (vs Huffman), batch if multiple numbers, integrity SHA-256 of raw/compressed, resource (approx CPU/memory), algorithm details (Fib count), visual progress bar, graph.
    - Example output format in UI.
    - Lossless only, verbosity (show advanced on click).
- **Technical Stack**:
  - Frontend: HTML/CSS/JS, use fetch for API, local storage if needed for temp.
  - Backend: Python 3, Flask, PyMongo, pymongo[srv] for Atlas.
  - Database: MongoDB Atlas, provide connection string placeholder.
  - Algorithm: Use this Python code (add comments):
```python
import time

def generate_fibs(n):
    if n < 1:
        return []
    fibs = []
    a, b = 1, 2
    while a <= n:
        fibs.append(a)
        a, b = b, a + b
    return fibs

def fib_encode(n):
    if n <= 0:
        raise ValueError("Only positive integers")
    fibs = generate_fibs(n)
    if not fibs:
        return '11'  # for n=1 if needed, but won't happen
    code = ['0'] * len(fibs)
    i = len(fibs) - 1
    while n > 0:
        if n >= fibs[i]:
            code[i] = '1'
            n -= fibs[i]
        i -= 1
        if i < 0:
            break
    return ''.join(code) + '1'

# For decoding, implement similarly.
# For dataset, def compress_dataset(data_list):
#   return ''.join(fib_encode(int(x)) for x in data_list)
```
  - File Handling: Input as string, parse split(','), compress.
  - Security: Basic, as per limitations.
  - Testing: Pytest.
  - Deployment: Heroku or Vercel for Flask, Atlas setup instructions.
- **Output Format**:
  - Structure as GitHub repo: README.md (overview, setup, how meets objectives, screenshots), code files (app.py for Flask, index.html, style.css, script.js), tests/.
  - Comments explaining everything.
  - Sample data, runnable.

## Provided Documents:
<DOCUMENT filename="Fibonacci Coding For Compressing Larger Numerical Datasets In Web-Based Systems.docx">
[Full content from user's message]
</DOCUMENT>

<DOCUMENT filename="File Compression Metrics and Display Options.docx">
[Full content from user's message]
</DOCUMENT>

Now, generate the complete implementation as described. Output the README.md first, followed by key code files, and any other necessary parts. Ensure everything is copy-paste ready.
```