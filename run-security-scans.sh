#!/bin/bash

###############################################
# IMS Security Scanning - Quick Setup Script
###############################################

set -e

REPO_DIR=$(pwd)
REPORTS_DIR="$REPO_DIR/security-reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}🔐 IMS Security Scanning Tool${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

# Create reports directory
mkdir -p "$REPORTS_DIR"
echo -e "${GREEN}✓${NC} Created reports directory: $REPORTS_DIR"
echo ""

# Function to check if tool is installed
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to run security scan
run_scan() {
    local tool_name=$1
    local command=$2
    local output_file=$3
    
    echo -e "${BLUE}▶${NC} Running $tool_name..."
    
    if eval "$command" > "$output_file" 2>&1; then
        echo -e "${GREEN}✓${NC} $tool_name completed: $output_file"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $tool_name finished with warnings/errors (see: $output_file)"
        return 0
    fi
}

# ============================================
# 1. NPM AUDIT (Always available)
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Phase 1: NPM Audit${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}Installing dependencies...${NC}"
cd "$REPO_DIR/ims-backend-main" && npm install --silent 2>&1 | grep -v "added\|up to date" || true
cd "$REPO_DIR/ims-frontend-main" && npm install --silent 2>&1 | grep -v "added\|up to date" || true
cd "$REPO_DIR"
echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

run_scan "NPM Audit (Backend)" "cd $REPO_DIR/ims-backend-main && npm audit --json" "$REPORTS_DIR/01-npm-audit-backend.json"
run_scan "NPM Audit (Frontend)" "cd $REPO_DIR/ims-frontend-main && npm audit --json" "$REPORTS_DIR/01-npm-audit-frontend.json"
cd "$REPO_DIR"
echo ""

# ============================================
# 2. SNYK (if installed)
# ============================================
if command_exists snyk; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Phase 2: Snyk Analysis${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    run_scan "Snyk (Backend)" "cd $REPO_DIR/ims-backend-main && snyk test --json 2>&1" "$REPORTS_DIR/02-snyk-backend.json"
    run_scan "Snyk (Frontend)" "cd $REPO_DIR/ims-frontend-main && snyk test --json 2>&1" "$REPORTS_DIR/02-snyk-frontend.json"
    cd "$REPO_DIR"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} Snyk not installed. To install: ${BLUE}npm install -g snyk${NC}"
    echo ""
fi

# ============================================
# 3. ESLint Security Plugin
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Phase 3: ESLint Security Check${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}Installing ESLint Security Plugin...${NC}"
cd "$REPO_DIR/ims-backend-main"
npm install --save-dev eslint eslint-plugin-security 2>&1 | grep -v "added\|up to date" || true

cd "$REPO_DIR/ims-frontend-main"
npm install --save-dev eslint eslint-plugin-security 2>&1 | grep -v "added\|up to date" || true
cd "$REPO_DIR"
echo -e "${GREEN}✓${NC} ESLint and security plugin installed"
echo ""

# Create ESLint config if it doesn't exist
if [ ! -f "$REPO_DIR/ims-backend-main/.eslintrc.json" ]; then
    cat > "$REPO_DIR/ims-backend-main/.eslintrc.json" << 'EOF'
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "env": {
    "node": true,
    "es2021": true
  }
}
EOF
    echo -e "${GREEN}✓${NC} Created ESLint config for backend"
fi

if [ ! -f "$REPO_DIR/ims-frontend-main/.eslintrc.json" ]; then
    cat > "$REPO_DIR/ims-frontend-main/.eslintrc.json" << 'EOF'
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "env": {
    "browser": true,
    "es2021": true
  }
}
EOF
    echo -e "${GREEN}✓${NC} Created ESLint config for frontend"
fi

run_scan "ESLint Security (Backend)" "cd $REPO_DIR/ims-backend-main && npx eslint . --ext .js,.ts,.jsx,.tsx --format json 2>&1" "$REPORTS_DIR/03-eslint-backend.json"
run_scan "ESLint Security (Frontend)" "cd $REPO_DIR/ims-frontend-main && npx eslint . --ext .js,.ts,.jsx,.tsx --format json 2>&1" "$REPORTS_DIR/03-eslint-frontend.json"
cd "$REPO_DIR"
echo ""

# ============================================
# 4. RETIRE.JS (if installed)
# ============================================
if command_exists retire; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Phase 4: Retire.js Analysis${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    run_scan "Retire.js (Backend)" "cd $REPO_DIR/ims-backend-main && retire --json 2>&1" "$REPORTS_DIR/04-retire-backend.json"
    run_scan "Retire.js (Frontend)" "cd $REPO_DIR/ims-frontend-main && retire --json 2>&1" "$REPORTS_DIR/04-retire-frontend.json"
    cd "$REPO_DIR"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} Retire.js not installed. To install: ${BLUE}npm install -g retire${NC}"
    echo ""
fi

# ============================================
# 5. GENERATE SUMMARY REPORT
# ============================================
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Phase 5: Generating Summary Report${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SUMMARY_FILE="$REPORTS_DIR/SECURITY_SUMMARY.txt"

cat > "$SUMMARY_FILE" << 'EOF'
╔═══════════════════════════════════════════════════╗
║  IMS Project - Security Scanning Summary Report   ║
║  Generated: $(date)
╚═══════════════════════════════════════════════════╝

📊 SCANS PERFORMED:
===================

1. ✓ NPM Audit (Backend & Frontend)
   - Scans for known vulnerabilities in npm packages
   - Reports: npm-audit-backend.json, npm-audit-frontend.json

2. ✓ ESLint Security Plugin
   - Static analysis for security issues in code
   - Detects: XSS, injection, unsafe patterns
   - Reports: eslint-backend.json, eslint-frontend.json

3. ⚠ Snyk (if installed)
   - Detailed vulnerability analysis & remediation
   - Reports: snyk-backend.json, snyk-frontend.json

4. ⚠ Retire.js (if installed)
   - Detects vulnerable JavaScript libraries
   - Reports: retire-backend.json, retire-frontend.json

📁 REPORT LOCATIONS:
====================
All reports saved to: ./security-reports/

Key Files:
- 01-npm-audit-backend.json
- 01-npm-audit-frontend.json
- 03-eslint-backend.json
- 03-eslint-frontend.json
- 02-snyk-backend.json (if Snyk is installed)
- 04-retire-backend.json (if Retire.js is installed)

🔍 HOW TO READ THE REPORTS:
============================

NPM Audit JSON:
  "vulnerabilities" → Object with vulnerability details
  "severity" → critical | high | moderate | low
  
ESLint JSON:
  Each file → Array of issues found
  Check "messages" for security warnings

Snyk JSON:
  "vulnerabilities" → Detailed CVE information
  "remediation" → Suggested fixes

⚠️ NEXT STEPS:
==============

1. Review NPM Audit Results:
   npm audit fix          # Auto-fix lower severity issues
   
2. Check for Critical Issues:
   grep -i "critical" 01-npm-audit-*.json
   
3. Review Code Issues:
   cat 03-eslint-backend.json | jq '.[] | select(.messages[].severity==2)'

4. Install Additional Tools:
   npm install -g snyk    # For detailed vulnerability analysis
   npm install -g retire  # For JavaScript library scanning

5. Set Up CI/CD:
   Create .github/workflows/security.yml for automated scanning

📚 RESOURCES:
=============
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NPM Security: https://docs.npmjs.com/cli/v8/commands/npm-audit
- CWE Top 25: https://cwe.mitre.org/top25/

═══════════════════════════════════════════════════
EOF

sed -i "s|\$(date)|$(date)|g" "$SUMMARY_FILE"

echo -e "${GREEN}✓${NC} Summary report created: $SUMMARY_FILE"
echo ""

# ============================================
# FINAL OUTPUT
# ============================================
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Security Scans Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Reports Location:${NC}"
echo "   $REPORTS_DIR"
echo ""
echo -e "${BLUE}📄 Generated Reports:${NC}"
ls -lh "$REPORTS_DIR" | tail -n +2 | awk '{print "   ✓ " $9 " (" $5 ")"}'
echo ""
echo -e "${BLUE}🔍 Quick View Commands:${NC}"
echo "   View NPM Audit Summary:    cat $REPORTS_DIR/01-npm-audit-backend.json | jq '.metadata.vulnerabilities'"
echo "   View Critical Issues:      grep 'critical' $REPORTS_DIR/*.json"
echo "   View Summary Report:       cat $REPORTS_DIR/SECURITY_SUMMARY.txt"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   Review all critical and high-severity vulnerabilities"
echo "   Consider running 'npm audit fix' on fixable issues"
echo "   Set up automated scanning in your CI/CD pipeline"
echo ""
