# 玄机命理排盘 · 精简版构建（Prompt 剥离）
# ============================================================
# 作用：把主文件里的 18 维研判准则、5 流派人格、评分规则、命格原型等
#       全部剥离，输出一份「必须连服务端才能出解读」的精简版 HTML。
#
# 产出：dist/index.html（.gitignore 已忽略）
#
# ⚠️ 重要认知：**只有源仓库不公开时，本脚本才有意义。**
#    如果 bazimingli 仍然 public，别人直接读 命理排盘.html 就看到全部 Prompt，
#    发一份精简版出去等于白做。正确姿势：
#      · 源仓库 → Private（或把 命理排盘.html 从公开仓库移出）
#      · 公开仓库 / GitHub Pages → 只放 dist/index.html（精简版）
#      · Prompt 模板 → worker 部署产物（不进任何公开仓库）
#
# 用法： powershell -ExecutionPolicy Bypass -File worker\build-thin.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$SRC = '命理排盘.html'
if (-not (Test-Path $SRC)) { Write-Host "✗ 找不到 $SRC" -ForegroundColor Red; exit 1 }

$html = [IO.File]::ReadAllText((Resolve-Path $SRC), [Text.UTF8Encoding]::new($false))
$original = $html.Length

function Cut-Range {
  param([string]$Text, [string]$StartMarker, [string]$EndMarker, [string]$Replacement, [string]$Label)
  $i = $Text.IndexOf($StartMarker)
  if ($i -lt 0) { throw "找不到起始标记（$Label）：$StartMarker" }
  $j = $Text.IndexOf($EndMarker, $i)
  if ($j -lt 0) { throw "找不到结束标记（$Label）：$EndMarker" }
  Write-Host ("  · {0}: 剥离 {1:N0} 字符" -f $Label, ($j - $i))
  return $Text.Substring(0, $i) + $Replacement + "`n" + $Text.Substring($j)
}

Write-Host "· 剥离 Prompt 实体…"

# ---- 1. 5 流派人格 + 各维度研判指引 ----
$stubA = @'
function aiBuildSchool(schoolIdx){
  /* 精简版：流派人格与维度研判指引位于服务端（worker 的 /v1/divine），客户端不内置 */
  throw new Error('本版本已启用服务端 Prompt：流派研判准则不在本地。');
}
'@
$html = Cut-Range -Text $html -StartMarker '/* Source: data/school-prompts.json */' -EndMarker '/* Source: src/bazi/data.js */' -Replacement '' -Label '流派 Prompt 数据'
$html = Cut-Range -Text $html -StartMarker 'function aiBuildSchool(id){' -EndMarker 'function dayBoundaryLabel(rule){' -Replacement $stubA -Label 'aiBuildSchool（5 流派人格）'
$html = Cut-Range -Text $html -StartMarker '/* 按流派生成角色与 dimGuide(18 维解读侧重),返回{role,dimGuide} */' -EndMarker '/* 紫微斗数参考摘要' -Replacement '' -Label '旧版流派标记'

# ---- 2. 18 维输出框架 + 评分规则 + 研究纪律 + 命格原型 ----
$stubB = @'
function aiBuildSchoolPrompt(schoolIdx, mode){
  /* 精简版：18 维研判准则、独立评分标准、研究纪律、命格原型参照全部位于服务端 */
  throw new Error('本版本已启用服务端 Prompt：18 维研判准则不在本地。');
}
'@
$html = Cut-Range -Text $html -StartMarker 'function aiBuildSchoolPrompt(schoolIdx, mode){' -EndMarker '/* 提取 Prompt(无API Key时复制到任意AI对话使用) */' -Replacement $stubB -Label 'aiBuildSchoolPrompt（研判准则）'

# ---- 3. 关闭「提取 Prompt」通道（它依赖上面的函数）----
$extractAnchor = "const {system}=aiBuildSchoolPrompt(lastSchool,'extract');"
$anchorAt = $html.IndexOf($extractAnchor)
if ($anchorAt -lt 0) { throw "找不到 aiExtractPrompt 的锚点" }
$guard = "alert('本版本为「服务端 Prompt」精简版：研判准则不在本地，无法提取完整 Prompt。请直接使用「AI 深度解读」按钮。'); return; "
$html = $html.Substring(0, $anchorAt) + $guard + $html.Substring($anchorAt)
Write-Host "  · aiExtractPrompt: 已改为提示信息"

# ---- 4. 默认开启服务端 Prompt 模式 ----
if ($html.IndexOf('sessionOnly:true,divine:false}') -lt 0) { throw "找不到 AI_DEF 的 divine 字段" }
$html = $html.Replace('sessionOnly:true,divine:false}', 'sessionOnly:true,divine:true}')
Write-Host "  · AI_DEF: divine 默认 true"

# ---- 5. 移除「提取 Prompt」按钮，避免用户点了个必然失败的功能 ----
$btnPattern = '(?s)<button[^>]*onclick="aiExtractPrompt\(\)"[^>]*>.*?</button>'
$before = $html
$html = [regex]::Replace($html, $btnPattern, '')
if ($html -ne $before) { Write-Host "  · 已移除「提取 Prompt」按钮" } else { Write-Host "  ! 未找到「提取 Prompt」按钮（可忽略）" -ForegroundColor Yellow }

# ---- 6. 校验：被剥离的结构必须彻底消失 ----
# 注：这里只检查**代码标识符**，不检查 Prompt 正文 ——
#     否则校验脚本自己就把研判准则带进公开仓库了。
Write-Host ""
Write-Host "· 校验残留…"
$forbidden = @(
  @{ n = '流派 role 赋值';    s = 'sch.role' },
  @{ n = '维度指引表';        s = 'dimGuide' },
  @{ n = '评分规则';          s = 'const scoreRule' },
  @{ n = '研究纪律';          s = 'const researchDiscipline' },
  @{ n = '命格原型参照';      s = 'const mingGeRef' },
  @{ n = '维度兜底表';        s = 'const genGuide' },
  @{ n = '维度清单拼接';      s = 'const dimsLine' }
)
$leak = 0
foreach ($f in $forbidden) {
  if ($html.IndexOf($f.s) -ge 0) { Write-Host ("   ✗ 残留：{0}（{1}）" -f $f.n, $f.s) -ForegroundColor Red; $leak++ }
}
if ($leak -gt 0) { Write-Host "✗ 仍有 $leak 处结构残留，构建中止" -ForegroundColor Red; exit 2 }
Write-Host "   ✓ 8 项结构标记全部清除" -ForegroundColor Green

# ---- 7. 语法校验 ----
$scriptMatch = [regex]::Match($html, '(?s)<script[^>]*>(.*?)</script>')
if (-not $scriptMatch.Success) { throw "精简后找不到 <script> 块" }
$tmpJs = Join-Path $env:TEMP ("thin_"+[guid]::NewGuid().ToString('N')+".js")
[IO.File]::WriteAllText($tmpJs, $scriptMatch.Groups[1].Value, [Text.UTF8Encoding]::new($false))
$nodeOk = $false
try { $null = & node --check $tmpJs 2>&1; $nodeOk = ($LASTEXITCODE -eq 0) } catch { $nodeOk = $false }
Remove-Item -Force $tmpJs -ErrorAction SilentlyContinue
if (-not $nodeOk) { Write-Host "✗ 精简后 JS 语法校验失败" -ForegroundColor Red; exit 3 }
Write-Host "   ✓ JS 语法校验通过" -ForegroundColor Green

# ---- 8. 输出 ----
$dist = Join-Path $repo 'dist'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$out = Join-Path $dist 'index.html'
[IO.File]::WriteAllText($out, $html, [Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "✓ 精简版构建完成" -ForegroundColor Green
Write-Host ("  原始 {0:N0} 字符 → 精简 {1:N0} 字符（减少 {2:N0} 字符，{3:P1}）" -f $original, $html.Length, ($original-$html.Length), (($original-$html.Length)/$original))
Write-Host ("  输出：dist/index.html（{0:N0} 字节）" -f (Get-Item $out).Length) -ForegroundColor Green
Write-Host ""
Write-Host "别忘了：源仓库若仍公开，本文件没有任何保护意义 —— 见脚本顶部说明。" -ForegroundColor Yellow
