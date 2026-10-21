# 玄机命理排盘 · Prompt 模板抽取器（Windows / PowerShell）
# ============================================================
# 作用：从 命理排盘.html 里自动抽出 5 个流派的 system prompt，把
#       「知识库」与「紫微块」替换成占位符，产出 worker/prompt-template.json。
#       该 JSON 供 worker 的 /v1/divine 端点使用，**不要提交到公开仓库**。
#
# 用法：  powershell -ExecutionPolicy Bypass -File worker\extract-prompt.ps1
# 依赖：  Chrome 或 Edge（用于无头执行页面内 JS，确保模板与源码零漂移）
# 自检：  脚本内置往返校验 —— 用模版还原出的 system 必须与原始输出逐字节相同，
#         5 个流派 × 开/关紫微 = 10 组全部通过才会写出文件。
# ============================================================
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$SRC = '命理排盘.html'
if (-not (Test-Path $SRC)) { Write-Host "✗ 找不到 $SRC" -ForegroundColor Red; exit 1 }

function Find-Browser {
  $cands = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
  )
  foreach ($c in $cands) { if (Test-Path $c) { return $c } }
  throw "未找到 Chrome / Edge，无法执行抽取。"
}

$chrome = Find-Browser
Write-Host "· 浏览器: $chrome"

# ---------- 构建注入用 harness ----------
$harness = @'
<div id="__out" style="display:none"></div>
<script>
(function(){
  function b64(str){
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i=0;i<bytes.length;i+=4096){
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i+4096));
    }
    return btoa(bin);
  }
  function commonPrefix(a,b){ var n=Math.min(a.length,b.length),i=0; while(i<n&&a[i]===b[i])i++; return i; }
  function commonSuffix(a,b,lim){ var n=Math.min(a.length,b.length,lim),i=0; while(i<n&&a[a.length-1-i]===b[b.length-1-i])i++; return i; }

  var report = { ok:true, errors:[], schools:{}, zwBlock:'', meta:{} };
  try{
    // 排一盘（模板里的动态部分都会被占位符替掉，具体盘面不影响结果）
    document.getElementById('zh-cal').value='0';
    document.getElementById('zh-solar').value='1990-05-15';
    document.getElementById('zh-hour').value='5';
    document.getElementById('zh-name').value='模板抽取';
    zhCast();

    setTimeout(function(){
      try{
        if(!lastZh) throw new Error('排盘失败：lastZh 为空');
        var knowledge = aiBuildKnowledge(lastZh);
        if(!knowledge || knowledge.length < 200) throw new Error('知识库为空，抽取会污染模板');
        report.meta.knowledgeLen = knowledge.length;

        var chk = document.getElementById('zh-zw-ref');
        var zwBlockGlobal = null;

        for (var s=0; s<5; s++){
          // 开紫微
          chk.checked = true;
          var withZw = aiBuildSchoolPrompt(s,'deep').system;
          // 关紫微
          chk.checked = false;
          var noZw   = aiBuildSchoolPrompt(s,'deep').system;

          // 切开：A + block + B   vs   A + B
          var p = commonPrefix(withZw, noZw);
          var suf = commonSuffix(withZw, noZw, Math.min(withZw.length,noZw.length)-p);
          var block = withZw.slice(p, withZw.length - suf);

          if (block.indexOf('紫微') < 0) throw new Error('流派'+s+'：紫微块定位失败（长度 '+block.length+'）');
          if (!block.trim()) throw new Error('流派'+s+'：紫微块为空');

          if (zwBlockGlobal === null) zwBlockGlobal = block;
          else if (zwBlockGlobal !== block) report.errors.push('流派'+s+'：紫微块与流派0不一致（长度 '+block.length+' vs '+zwBlockGlobal.length+'）');

          // 拆占位符
          var tpl = withZw.split(knowledge).join('{{KNOWLEDGE}}');
          if (tpl.split('{{KNOWLEDGE}}').length !== 2) throw new Error('流派'+s+'：知识库出现次数不是 1');
          tpl = tpl.split(block).join('{{ZW_BLOCK}}');
          if (tpl.split('{{ZW_BLOCK}}').length !== 2) throw new Error('流派'+s+'：紫微块出现次数不是 1');

          // ---------- 往返校验 ----------
          var rebuildWith = tpl.split('{{KNOWLEDGE}}').join(knowledge).split('{{ZW_BLOCK}}').join(block);
          var rebuildWithout = tpl.split('{{KNOWLEDGE}}').join(knowledge).split('{{ZW_BLOCK}}').join('');
          if (rebuildWith !== withZw) throw new Error('流派'+s+'：开紫微往返校验失败');
          if (rebuildWithout !== noZw) throw new Error('流派'+s+'：关紫微往返校验失败');

          report.schools[String(s)] = { template: tpl, len: withZw.length };
          report.meta['school'+s+'_len'] = withZw.length;
        }

        report.zwBlock = zwBlockGlobal;
        report.meta.zwBlockLen = zwBlockGlobal.length;
        report.meta.totalTemplateChars = Object.keys(report.schools).reduce(function(a,k){return a+report.schools[k].template.length;},0);
      }catch(e){
        report.ok = false; report.errors.push('抽取异常：'+(e&&e.message||e));
      }
      document.getElementById('__out').textContent = b64(JSON.stringify(report));
    }, 2600);
  }catch(e){
    report.ok=false; report.errors.push('初始化异常：'+(e&&e.message||e));
    document.getElementById('__out').textContent = b64(JSON.stringify(report));
  }
})();
</script>
'@

$html = [IO.File]::ReadAllText((Resolve-Path $SRC), [Text.UTF8Encoding]::new($false))
if ($html -notmatch '</body>') { Write-Host "✗ HTML 结构异常：无 </body>" -ForegroundColor Red; exit 1 }
$test = $html -replace '(?s)</body>', ($harness + '</body>')
$tmp = Join-Path $env:TEMP ("tpl_"+[guid]::NewGuid().ToString('N')+".html")
[IO.File]::WriteAllText($tmp, $test, [Text.UTF8Encoding]::new($false))

# ---------- 无头执行 ----------
$prof = Join-Path $env:TEMP ("chr_"+[guid]::NewGuid().ToString('N').Substring(0,8))
$dom  = Join-Path $env:TEMP ("dom_"+[guid]::NewGuid().ToString('N')+".txt")
$err  = Join-Path $env:TEMP ("err_"+[guid]::NewGuid().ToString('N')+".txt")
$uri  = "file:///" + ($tmp -replace '\\','/' -replace ' ','%20')
Write-Host "· 无头渲染中…"
$p = Start-Process -FilePath $chrome -ArgumentList @("--headless=new","--disable-gpu","--no-sandbox","--user-data-dir=$prof","--virtual-time-budget=20000","--dump-dom",$uri) -NoNewWindow -Wait -PassThru -RedirectStandardOutput $dom -RedirectStandardError $err
$dump = if (Test-Path $dom) { [IO.File]::ReadAllText($dom, [Text.UTF8Encoding]::new($false)) } else { '' }

Remove-Item -Recurse -Force $prof,$tmp,$err -ErrorAction SilentlyContinue
Remove-Item -Force $dom -ErrorAction SilentlyContinue

$m = [regex]::Match($dump, '(?s)<div id="__out"[^>]*>([A-Za-z0-9+/=]*)</div>')
if (-not $m.Success -or -not $m.Groups[1].Value) {
  Write-Host "✗ 未能取到抽取结果（无头浏览器可能未完成渲染）" -ForegroundColor Red
  exit 2
}

$json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($m.Groups[1].Value))
$rep = $json | ConvertFrom-Json

if (-not $rep.ok) {
  Write-Host "✗ 抽取失败：" -ForegroundColor Red
  $rep.errors | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
  exit 3
}
if ($rep.errors.Count -gt 0) {
  Write-Host "✗ 校验发现问题：" -ForegroundColor Red
  $rep.errors | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
  exit 3
}

$out = Join-Path $PSScriptRoot 'prompt-template.json'
[IO.File]::WriteAllText($out, $json, [Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "✓ 抽取完成，往返校验 10/10 通过" -ForegroundColor Green
Write-Host ("  · 知识库动态长度 : {0} 字符" -f $rep.meta.knowledgeLen)
Write-Host ("  · 紫微块长度     : {0} 字符" -f $rep.meta.zwBlockLen)
foreach ($k in 0..4) {
  Write-Host ("  · 流派{0} system : {1} 字符 → 模板 {2} 字符" -f $k, $rep.meta."school${k}_len", $rep.schools."$k".template.Length)
}
Write-Host ("  · 模板总量       : {0:N0} 字符" -f $rep.meta.totalTemplateChars)
Write-Host ("  · 输出文件       : worker/prompt-template.json ({0:N0} 字节)" -f (Get-Item $out).Length) -ForegroundColor Green
Write-Host ""
Write-Host "下一步：wrangler deploy（模板会随 worker 一起打包，不进公开仓库）" -ForegroundColor Yellow
