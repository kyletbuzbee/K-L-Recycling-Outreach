/**
 * K&L CRM Test File Syntax Validator
 * Validates JavaScript syntax in test files
 */

const fs = require('fs');
const path = require('path');

// List of test files to validate
const testFiles = [
    'test_unit.js',
    'test_validation.js', 
    'test_integration.js',
    'test_workflow.js',
    'test_runner.js',
    'test_data_operations.js'
];

console.log('🔍 K&L CRM Test File Validator');
console.log('================================\n');

let allValid = true;

testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${file}: FILE NOT FOUND`);
        allValid = false;
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic syntax checks
    const issues = [];
    
    // Check for balanced braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
    }
    
    // Check for balanced parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        issues.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
    }
    
    // Check for balanced brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
        issues.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
    }
    
    // Check for common syntax errors
    if (content.includes('undefinedxxx') || content.includes('nullxxx')) {
        issues.push('Possible typo with undefined/null');
    }
    
    // Check for trailing commas in object literals (IE issue)
    const trailingCommaRegex = /,\s*[\}\]]/g;
    const trailingCommas = content.match(trailingCommaRegex);
    if (trailingCommas && trailingCommas.length > 0) {
        // Note: This is valid in modern JS but was an issue in older environments
        console.log(`⚠️ ${file}: ${trailingCommas.length} trailing comma(s) found (modern JS OK)`);
    }
    
    // Count test functions
    const testFunctionRegex = /test[A-Z][a-zA-Z0-9]*\s*:\s*function\s*\(/g;
    const testFunctions = content.match(testFunctionRegex) || [];
    
    if (issues.length > 0) {
        console.log(`❌ ${file}: ISSUES FOUND`);
        issues.forEach(issue => console.log(`   - ${issue}`));
        allValid = false;
    } else {
        console.log(`✅ ${file}: VALID (${testFunctions.length} tests)`);
    }
});

console.log('\n================================');
if (allValid) {
    console.log('🎉 All test files passed syntax validation!');
} else {
    console.log('🚨 Some test files have issues that need to be fixed.');
}
