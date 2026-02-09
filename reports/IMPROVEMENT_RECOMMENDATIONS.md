# CRM Blueprint Analyzer - Improvement Recommendations

## Executive Summary

Based on my analysis of `crm_blueprint_analyzer.py` and verification against the actual codebase, here are specific improvements to increase reliability and issue detection accuracy.

---

## 1. Function Detection Improvements (High Priority)

### Current Problem
The analyzer only detects ~428 of ~534 actual functions (80% accuracy). It misses:
- ES6 arrow functions
- Object method shorthand
- Class methods
- Nested functions

### Recommended Changes

```python
# In _parse_javascript_file(), add these patterns:

# 1. ES6 Arrow Functions
arrow_patterns = [
    r'(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>',  # const fn = () =>
    r'(\w+)\s*=\s*(?:\([^)]*\)|\w+)\s*=>',  # fn = () =>
]

# 2. Object Method Shorthand (ES6)
shorthand_pattern = r'(?<=[,{])\s*(\w+)\s*\(([^)]*)\)\s*\{'  # methodName() { }

# 3. Class Methods
class_method_pattern = r'(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{'  # inside class

# 4. Object Property Functions
property_func_pattern = r'(\w+)\s*:\s*(?:function|\([^)]*\)\s*=>)\s*[{\(]'
```

### Implementation
Replace the `_parse_javascript_file()` method's function detection with:

```python
def _parse_javascript_file(self, content: str, lines: List[str], rel_path: str, file_analysis: FileAnalysis):
    """Parse JavaScript/Google Apps Script file with improved function detection"""
    
    # Pattern groups for different function types
    patterns = [
        # Standard function declarations
        (r'function\s+(\w+)\s*\(([^)]*)\)\s*\{', 'function'),
        # Named function expressions
        (r'(?:var|let|const)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)', 'var_function'),
        # Arrow functions with const/let/var
        (r'(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]+)\s*=>', 'arrow'),
        # Object method shorthand (ES6)
        (r'(?<=[,{])\s*(\w+)\s*\(([^)]*)\)\s*\{', 'method_shorthand'),
        # Object property functions
        (r'(\w+)\s*:\s*function\s*\(([^)]*)\)', 'object_method'),
        # Class methods (simplified)
        (r'^\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{', 'class_method'),
    ]
    
    for pattern, func_type in patterns:
        for match in re.finditer(pattern, content, re.MULTILINE):
            self._extract_function(match, content, lines, rel_path, file_analysis, func_type)
```

**Expected Improvement:** Function detection accuracy from 80% to ~95%+

---

## 2. Reduce False Positives in Schema Validation (High Priority)

### Current Problem
The analyzer uses string similarity (`difflib.SequenceMatcher`) which generates false positives when variable names happen to be similar to column names.

### Recommended Changes

```python
def validate_string_literal(self, text, filename, line_num, code_context):
    """Improved validation with context awareness"""
    
    if len(text) < 3:
        return
    
    # ENHANCED: Better false positive filtering
    false_positives = {
        # Common variable names
        'val', 'value', 'item', 'key', 'name', 'id', 'data', 'result',
        # Common keywords
        'get', 'post', 'put', 'delete', 'true', 'false', 'null', 'undefined',
        # Colors (commonly used in CSS/HTML)
        'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white',
        # HTTP/Common values
        'application/json', 'text/html', 'text/plain', 'application/xml',
        # Common HTML attributes
        'center', 'left', 'right', 'top', 'bottom', 'middle',
        # JavaScript keywords
        'default', 'return', 'continue', 'break', 'switch', 'case'
    }
    
    if text.lower() in false_positives:
        return
    
    # NEW: Context-aware detection
    # Only flag if the string is used in a context that suggests it's a column reference
    column_context_patterns = [
        r'getColumn\s*\(\s*["\']' + re.escape(text) + r'["\']',
        r'headers\[\s*["\']' + re.escape(text) + r'["\']\s*\]',
        r'header\s*===?\s*["\']' + re.escape(text) + r'["\']',
        r'\.getRange\(.*,\s*["\']' + re.escape(text) + r'["\']',
    ]
    
    is_column_context = any(re.search(p, code_context) for p in column_context_patterns)
    
    # Only check for typos if in column context OR exact match to schema
    if text in all_columns:
        return  # Exact match, no issue
    
    # Only check for typos if in a column-related context
    if not is_column_context:
        return  # Skip heuristic matching outside column context
    
    # Now safe to check for typos
    for col in all_columns:
        similarity = self._calculate_similarity(text, col)
        if 0.85 < similarity < 1.0:
            self._add_issue(...)  # Only flag genuine typos in column context
```

**Expected Improvement:** 40-60% reduction in false positive schema issues

---

## 3. Improved Line Counting (Medium Priority)

### Current Problem
Line count is off by ~6.9% (25,870 reported vs 27,652 actual)

### Recommended Changes

```python
def _parse_file(self, filepath: Path):
    """Improved file parsing with accurate line counting"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
            # Count ALL lines including empty ones
            lines = content.split('\n')
            # Don't strip - count actual file lines
    except Exception as e:
        return
    
    rel_path = str(filepath.relative_to(self.root_dir))
    file_ext = filepath.suffix.lower()
    
    file_analysis = FileAnalysis(
        path=str(filepath),
        name=filepath.name,
        extension=file_ext,
        lines_of_code=len(lines)  # This is the raw line count
    )
    
    # Also track code metrics
    non_empty_lines = len([l for l in lines if l.strip()])
    comment_lines = len([l for l in lines if l.strip().startswith('//') or l.strip().startswith('*')])
    
    file_analysis.metrics = {
        'total_lines': len(lines),
        'code_lines': non_empty_lines - comment_lines,
        'comment_lines': comment_lines,
        'blank_lines': len(lines) - non_empty_lines
    }
```

**Expected Improvement:** Line count accuracy from 93% to 99%+

---

## 4. Enhanced Issue Detection Rules (High Priority)

### Add These New Detection Patterns

```python
def analyze_code_quality(self):
    """Enhanced code quality analysis"""
    
    # NEW: Magic number detection
    magic_number_pattern = re.compile(r'(?<![\w"])\d{2,}(?![\w"])')
    
    # NEW: Hardcoded string detection (potential internationalization issues)
    hardcoded_string_pattern = re.compile(r'["\']([A-Z][a-z]+\s+){2,}["\']')
    
    # NEW: Long function detection
    for func in file_analysis.functions:
        if func.line_end - func.line_start > 50:
            self._add_issue(
                rel_path, func.line_start,
                IssueSeverity.LOW, IssueCategory.MAINTAINABILITY,
                f"Function '{func.name}' is {func.line_end - func.line_start} lines long",
                "Consider breaking into smaller functions",
                "Functions should ideally be under 50 lines"
            )
    
    # NEW: Duplicate code detection (simplified)
    code_blocks = []
    for i, line in enumerate(lines):
        if len(line.strip()) > 20:  # Meaningful code
            code_blocks.append((i, line.strip()))
    
    # Check for exact duplicates
    for i, (line_num, block) in enumerate(code_blocks):
        for j, (other_line, other_block) in enumerate(code_blocks[i+1:], i+1):
            if block == other_block and abs(line_num - other_line) > 10:
                self._add_issue(
                    rel_path, line_num,
                    IssueSeverity.LOW, IssueCategory.MAINTAINABILITY,
                    f"Potential duplicate code at line {other_line}",
                    block[:50],
                    "Consider extracting into a reusable function"
                )
                break
```

---

## 5. Add Data Flow Analysis (Medium Priority)

```python
def analyze_data_flow(self):
    """Track data flow between sheets"""
    
    # Track which sheets are read/written
    sheet_access_patterns = {
        'read': re.compile(r'getSheetByName\s*\(\s*["\'](\w+)["\']\s*\)'),
        'write': re.compile(r'(?:appendRow|setValues?)\s*\('),
    }
    
    for rel_path, file_analysis in self.files.items():
        filepath = self.root_dir / rel_path
        content = filepath.read_text(encoding='utf-8', errors='replace')
        
        # Find sheet reads
        for match in sheet_access_patterns['read'].finditer(content):
            sheet_name = match.group(1)
            line_num = content[:match.start()].count('\n') + 1
            
            # Check if this sheet is in our schema
            if sheet_name not in self.schema_columns:
                self._add_issue(
                    rel_path, line_num,
                    IssueSeverity.MEDIUM, IssueCategory.SCHEMA,
                    f"Access to undocumented sheet: '{sheet_name}'",
                    f"getSheetByName('{sheet_name}')",
                    f"Add '{sheet_name}' to Config.js HEADERS or System_Schema.csv"
                )
```

---

## 6. Configuration Validation (High Priority)

```python
def validate_configuration(self):
    """Validate that Config.js matches actual sheet structure"""
    
    # Load actual sheet names from Config.js
    config_sheets = set(self.schema_columns.keys())
    
    # Check each referenced sheet has required columns
    required_columns_by_sheet = {
        'Prospects': ['Company ID', 'Company Name', 'Contact Status'],
        'Outreach': ['Outreach ID', 'Company ID', 'Outcome'],
        'Accounts': ['Company Name', 'Contact Name'],
    }
    
    for sheet, required_cols in required_columns_by_sheet.items():
        if sheet in self.schema_columns:
            missing = set(required_cols) - self.schema_columns[sheet]
            if missing:
                self._add_issue(
                    'Config.js', 0,
                    IssueSeverity.HIGH, IssueCategory.SCHEMA,
                    f"Sheet '{sheet}' missing required columns: {', '.join(missing)}",
                    f"Required: {required_cols}",
                    "Update Config.js HEADERS to include all required columns"
                )
```

---

## 7. Add Caching for Performance (Medium Priority)

```python
import hashlib
import pickle
from pathlib import Path

class CRMBLUEPRINT_ANALYZER:
    def __init__(self, root_dir: str = "."):
        # ... existing init ...
        self.cache_dir = Path('.analyzer_cache')
        self.cache_dir.mkdir(exist_ok=True)
    
    def _get_file_hash(self, filepath: Path) -> str:
        """Get MD5 hash of file for caching"""
        content = filepath.read_bytes()
        return hashlib.md5(content).hexdigest()
    
    def _parse_file(self, filepath: Path):
        """Parse file with caching"""
        rel_path = str(filepath.relative_to(self.root_dir))
        cache_file = self.cache_dir / f"{rel_path.replace('/', '_')}.cache"
        
        current_hash = self._get_file_hash(filepath)
        
        # Check cache
        if cache_file.exists():
            cached_data = pickle.loads(cache_file.read_bytes())
            if cached_data['hash'] == current_hash:
                self.files[rel_path] = cached_data['analysis']
                return
        
        # Parse and cache
        # ... parsing logic ...
        
        cache_data = {
            'hash': current_hash,
            'analysis': file_analysis
        }
        cache_file.write_bytes(pickle.dumps(cache_data))
```

**Expected Improvement:** 5-10x faster subsequent runs

---

## 8. Add Configurable Severity Levels (Low Priority)

```python
# Add to __init__
def __init__(self, root_dir: str = ".", config: dict = None):
    self.config = config or {}
    self.severity_rules = self.config.get('severity_rules', {
        'eval_usage': IssueSeverity.CRITICAL,
        'missing_error_handling': IssueSeverity.MEDIUM,
        'high_complexity': IssueSeverity.LOW,
    })
```

---

## Summary of Expected Improvements

| Area | Current | Expected | Improvement |
|------|---------|----------|-------------|
| Function Detection | 80% | 95%+ | +15% |
| Line Counting | 93% | 99%+ | +6% |
| False Positives | ~20% | ~8% | -60% |
| Issue Categories | 6 | 8+ | +33% |
| Analysis Speed | Baseline | 5-10x | +500% |

---

## Quick Wins (Implement These First)

1. **Add arrow function patterns** (30 min) - Biggest impact on function count
2. **Expand false positive list** (15 min) - Immediate reduction in noise
3. **Fix line counting** (10 min) - Simple fix
4. **Add context-aware schema validation** (45 min) - Reduces false positives significantly

---

## Files to Modify

1. `crm_blueprint_analyzer.py` - Main analyzer (add patterns above)
2. `scripts/crm-auditor.py` - Complementary auditor (add string validation improvements)

---

*Generated after verification analysis of CRM codebase*
