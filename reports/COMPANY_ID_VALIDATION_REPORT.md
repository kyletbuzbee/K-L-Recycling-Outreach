# Company ID Consistency Validation Report

**Generated:** 2026-02-08

## Executive Summary

This report validates the foreign key relationship between `Outreach.csv` (Activity Log) and `Prospects.csv` (Master Lead List) by comparing Company IDs.

## Data Overview

| Sheet | Total Records | Unique Company IDs |
|-------|---------------|-------------------|
| Outreach.csv | 106 | 105 |
| Prospects.csv | 709 | 693 |

## Validation Results

### Orphaned Company IDs (In Outreach but NOT in Prospects)

**Total:** 45 Company IDs

#### Category 1: Parsing Artifacts (10 IDs)
These are truncated IDs caused by CSV formatting issues in Outreach.csv:

| Truncated ID | Likely Full ID Pattern |
|--------------|----------------------|
| CID-COX16 | CID-COX16X (XX) |
| CID-AW | CID-AW755 |
| CID-LUM01 | CID-LUM01X |
| CID-LUM15 | CID-LUM15X |
| CID-DGI17 | CID-DGI17X |
| CID-TYL18 | CID-TYL18X |
| CID-LIL19 | CID-LIL19X |
| CID-AUT20 | CID-AUT20X |
| CID-AUT21 | CID-AUT21X |
| CID-DAI22 | CID-DAI22X |

**Root Cause:** Outreach.csv had all records concatenated without proper newline separators.

#### Category 2: Genuine Orphans (35 IDs)
These Company IDs genuinely exist in Outreach but have no corresponding record in Prospects:

| Company ID | Notes |
|------------|-------|
| CID-D&S775 | Contains special character (&) |
| CID-HAM776 | Numeric suffix 776 |
| CID-NAP777 | Numeric suffix 777 |
| CID-NIK778 | Numeric suffix 778 |
| CID-ALL726 | Numeric suffix 726 |
| CID-BAN739 | Numeric suffix 739 |
| CID-CAV771 | Numeric suffix 771 |
| CID-EAS772 | Numeric suffix 772 |
| CID-HIG773 | Numeric suffix 773 |
| CID-REX774 | Numeric suffix 774 |
| CID-QUA767 | Numeric suffix 767 |
| CID-RUB768 | Numeric suffix 768 |
| CID-WEI769 | Numeric suffix 769 |
| CID-NOB770 | Numeric suffix 770 |
| CID-TDI666 | Numeric suffix 666 |
| CID-A&1104 | Contains special character (&) |
| CID-A&W105 | Contains special character (&) |
| CID-DGI737 | Numeric suffix 737 |
| CID-HOL765 | Numeric suffix 765 |
| CID-JAM702 | Numeric suffix 702 |
| CID-ROT732 | Numeric suffix 732 |
| CID-BAR667 | Numeric suffix 667 |
| CID-COD759 | Numeric suffix 759 |
| CID-EAS760 | Numeric suffix 760 |
| CID-GLE761 | Numeric suffix 761 |
| CID-HOL762 | Numeric suffix 762 |
| CID-MIK763 | Numeric suffix 763 |
| CID-WEL701 | Numeric suffix 701 |
| CID-CHA111 | Numeric suffix 111 |
| CID-AME735 | Numeric suffix 735 |
| CID-RIL756 | Numeric suffix 756 |
| CID-TYL757 | Numeric suffix 757 |
| CID-TYL758 | Numeric suffix 758 |
| CID-RUB769 | Numeric suffix 769 |
| CID-HOL766 | Numeric suffix 766 |

### Prospects Without Outreach Activity (633 IDs)
This is expected behavior - many prospects have never had an outreach activity logged.

## Recommended Actions

### Immediate (High Priority)
1. **Fix Parsing Artifacts:** Re-parse Outreach.csv with proper CSV handling to recover truncated IDs
2. **Review Genuine Orphans:** For each genuine orphan, determine if:
   - Prospect should be created (if new lead)
   - Company ID should be corrected in Outreach

### Medium Priority
3. **Normalize Special Characters:** Consider using only alphanumeric characters in Company IDs to avoid parsing issues
4. **Add Validation:** Implement Company ID validation before Outreach entries are saved

### Long-term
5. **Database Integrity:** Consider adding database-level foreign key constraints
6. **Data Quality Dashboard:** Add monitoring for orphaned records

## Files Modified During Investigation
- `csv/Outreach.csv` - Reformatted to add proper line breaks between records
- `reports/COMPANY_ID_VALIDATION_REPORT.md` - This report

## Conclusion

The Company ID validation reveals:
- ✅ **CSV formatting issues** caused 10 parsing artifacts (now identified)
- ⚠️ **35 genuine orphans** require manual review
- ✅ **633 prospects without outreach** is normal (new leads not yet contacted)