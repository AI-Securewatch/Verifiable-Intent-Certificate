const fs = require('fs');
const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const savePolicyAs = \(status\) =>/g, 'const savePolicyAs = (status: any) =>');
content = content.replace(/const loadExistingPolicy = \(policyToLoad\) =>/g, 'const loadExistingPolicy = (policyToLoad: any) =>');
content = content.replace(/const addRuleToPolicy = \(ruleId\) =>/g, 'const addRuleToPolicy = (ruleId: any) =>');
content = content.replace(/const removeRuleFromPolicy = \(ruleId\) =>/g, 'const removeRuleFromPolicy = (ruleId: any) =>');
content = content.replace(/const deletePolicy = \(policyId\) =>/g, 'const deletePolicy = (policyId: any) =>');
content = content.replace(/const handleDecisionTypeChange = \(newType\) =>/g, 'const handleDecisionTypeChange = (newType: any) =>');
content = content.replace(/const getDecisionLabel = \(type\) =>/g, 'const getDecisionLabel = (type: any) =>');
content = content.replace(/const TabButton = \(\{\s*id,\s*label\s*\}\) =>/g, 'const TabButton = ({ id, label }: any) =>');

fs.writeFileSync(file, content);
console.log('Fixed types in app/page.tsx');
