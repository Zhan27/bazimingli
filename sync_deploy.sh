#!/bin/bash
# 命理排盘 - 一键同步部署脚本
# 用法: bash sync_deploy.sh   (把最新命理排盘.html同步到docs目录)
# 说明: docs/ 是 GitHub Pages 部署目录(Pages 设置选 main 分支 /docs), 本地直接打开根目录的命理排盘.html 也可
cd "$(dirname "$0")"
mkdir -p docs
cp "命理排盘.html" docs/index.html
echo "✓ 已同步: 命理排盘.html -> docs/index.html"
node -e "
const a=require('fs').readFileSync('命理排盘.html','utf8');
const b=require('fs').readFileSync('docs/index.html','utf8');
console.log('版本一致:', a===b?'✓':'✗', '('+Math.round(a.length/1024)+'KB)');
"
