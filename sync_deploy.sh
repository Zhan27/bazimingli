#!/bin/bash
# 命理排盘 - 一键同步部署脚本
# 用法: bash sync_deploy.sh   (把最新命理排盘.html同步到deploy目录)
# 说明: 同步后需在WorkBuddy对话中确认部署(调cloudstudio部署工具), 链接不变实时更新
cd "$(dirname "$0")"
cp "命理排盘.html" deploy/index.html
echo "✓ 已同步: 命理排盘.html -> deploy/index.html"
node -e "
const a=require('fs').readFileSync('命理排盘.html','utf8');
const b=require('fs').readFileSync('deploy/index.html','utf8');
console.log('版本一致:', a===b?'✓':'✗', '('+Math.round(a.length/1024)+'KB)');
"
