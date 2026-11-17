// Port EatInformed's own static content. Does not import Expo motion or components.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../node_modules/typescript');
const root = path.resolve(__dirname, '../..');
function evaluate(source) {
 const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const context = {exports:{}};
 vm.runInNewContext(code, context, {timeout:1000});
 return context.exports;
}
const dictionary = evaluate(fs.readFileSync(path.join(root,'mobile/src/lib/additive-dictionary.ts'),'utf8')).ADDITIVE_DICTIONARY;
const samplesSource = fs.readFileSync(path.join(root,'mobile/src/lib/sample-products.ts'),'utf8').replace(/^import .*$/mg,'');
const samples = evaluate(samplesSource).SAMPLE_PRODUCTS;
const guide = ts.createSourceFile('Guide.tsx', fs.readFileSync(path.join(root,'mobile/src/screens/GuideScreen.tsx'),'utf8'), ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let nova;
function walk(node) {if(ts.isVariableDeclaration(node)&&node.name.getText(guide)==='NOVA_GROUPS')nova=evaluate('export const groups='+node.initializer.getText(guide)).groups;ts.forEachChild(node,walk);}
walk(guide);
const out = path.join(root,'flutter_app/assets/content');
fs.mkdirSync(out,{recursive:true});
for(const [name,data] of Object.entries({additives:dictionary,nova,samples})) fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({additives:dictionary.length,nova:nova.length,samples:samples.length}));
