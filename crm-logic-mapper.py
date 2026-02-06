import os
import re

class KL_CRM_Mapper:
    def __init__(self):
        self.files = [f for f in os.listdir('.') if f.endswith(('.js', '.gs', '.html'))]
        self.report = []

    def analyze(self):
        logic_groups = {
            "DATA_ENGINE": ["SharedUtils.js", "DataHelpers.js", "Config.js", "Normalization.js"],
            "BUSINESS_LOGIC": ["ProspectFunctions.js", "OutreachFunctions.js", "AccountFunction.js", "ProspectScoringService.js"],
            "VALIDATION": ["ValidationUtils.js", "BusinessValidation.js", "DataValidation.js"],
            "UI_BACKEND": ["DashboardBackend.gs", "MenuFunctions.gs"]
        }

        self.report.append("=== K&L RECYCLING CRM LOGIC ANALYSIS ===\n")
        
        # 1. Map Connections
        self.report.append("--- CROSS-FILE DEPENDENCIES ---")
        for file in self.files:
            with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                calls = re.findall(r'(SharedUtils|CONFIG|ProspectFunctions|OutreachFunctions|ValidationUtils)\.', content)
                if calls:
                    self.report.append(f"{file} calls: {list(set(calls))}")

        # 2. Identify the _rowIndex Bug
        self.report.append("\n--- CRITICAL BUG DETECTION: _rowIndex Injection ---")
        with open('SharedUtils.js', 'r', encoding='utf-8') as f:
            content = f.read()
            if '_rowIndex' in content:
                self.report.append("[PASS] SharedUtils.js contains _rowIndex injection.")
            else:
                self.report.append("[FAIL] SharedUtils.js is MISSING _rowIndex injection. This causes the 'undefined' errors.")

        # 3. Generate Consolidated Codebase
        self.report.append("\n--- CONSOLIDATED LOGIC GROUPS ---")
        for group, group_files in logic_groups.items():
            self.report.append(f"\n>> GROUP: {group}")
            for gf in group_files:
                if gf in self.files:
                    self.report.append(f"   - {gf}")

        with open('CRM_FULL_REPORT.txt', 'w', encoding='utf-8') as out:
            out.write("\n".join(self.report))
        print("Report generated: CRM_FULL_REPORT.txt")

if __name__ == "__main__":
    mapper = KL_CRM_Mapper()
    mapper.analyze()