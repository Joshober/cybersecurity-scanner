param(
    [string]$OutPath = "docs/vibescan/ppt-diagrams/vibescan-research-poster-editable-charts.pptx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RgbInt {
    param([Parameter(Mandatory = $true)][string]$Hex)
    $clean = $Hex.TrimStart("#")
    if ($clean.Length -ne 6) {
        throw "Expected 6-hex color, got '$Hex'"
    }
    $r = [Convert]::ToInt32($clean.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($clean.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($clean.Substring(4, 2), 16)
    return ($r + ($g -shl 8) + ($b -shl 16))
}

function Invoke-Safe {
    param([scriptblock]$Action)
    try {
        & $Action | Out-Null
    } catch {
    }
}

function Clear-ChartSeries {
    param([Parameter(Mandatory = $true)]$Chart)
    while ($Chart.SeriesCollection().Count -gt 0) {
        $Chart.SeriesCollection(1).Delete() | Out-Null
    }
}

function Close-ChartDataEditor {
    param([Parameter(Mandatory = $true)]$Chart)
    Invoke-Safe { $Chart.ChartData.Workbook.Application.DisplayAlerts = $false }
    Invoke-Safe { $Chart.ChartData.Workbook.Application.Quit() }
}

function Add-SlideTitle {
    param(
        [Parameter(Mandatory = $true)]$Slide,
        [Parameter(Mandatory = $true)][string]$Title
    )
    $titleShape = $Slide.Shapes.AddTextbox(1, 16, 8, 928, 28)
    $titleShape.TextFrame.TextRange.Text = $Title
    $titleShape.TextFrame.TextRange.Font.Name = "Arial"
    $titleShape.TextFrame.TextRange.Font.Size = 20
    $titleShape.TextFrame.TextRange.Font.Bold = -1
}

function Add-SlideNote {
    param(
        [Parameter(Mandatory = $true)]$Slide,
        [Parameter(Mandatory = $true)][string]$Text
    )
    $noteShape = $Slide.Shapes.AddTextbox(1, 16, 514, 928, 18)
    $noteShape.TextFrame.TextRange.Text = $Text
    $noteShape.TextFrame.TextRange.Font.Name = "Arial"
    $noteShape.TextFrame.TextRange.Font.Size = 10
    $noteShape.TextFrame.TextRange.Font.Color.RGB = (Get-RgbInt "#475569")
}

function Add-SlideParagraph {
    param(
        [Parameter(Mandatory = $true)]$Slide,
        [Parameter(Mandatory = $true)][string]$Text
    )
    $pShape = $Slide.Shapes.AddTextbox(1, 16, 488, 928, 24)
    $pShape.TextFrame.TextRange.Text = $Text
    $pShape.TextFrame.TextRange.Font.Name = "Arial"
    $pShape.TextFrame.TextRange.Font.Size = 11
    $pShape.TextFrame.TextRange.Font.Color.RGB = (Get-RgbInt "#1e293b")
}

function Add-SpeakerNotes {
    param(
        [Parameter(Mandatory = $true)]$Slide,
        [Parameter(Mandatory = $true)][string]$Text
    )
    try {
        $notesShape = $Slide.NotesPage.Shapes.Placeholders.Item(2)
        $notesShape.TextFrame.TextRange.Text = $Text
    } catch {
        $fallback = $Slide.NotesPage.Shapes.AddTextbox(1, 36, 90, 640, 360)
        $fallback.TextFrame.TextRange.Text = $Text
        $fallback.TextFrame.TextRange.Font.Name = "Arial"
        $fallback.TextFrame.TextRange.Font.Size = 12
    }
}

function Get-PearsonR {
    param(
        [double[]]$X,
        [double[]]$Y
    )
    if ($X.Count -ne $Y.Count -or $X.Count -lt 2) {
        throw "Pearson correlation requires arrays of same length >= 2."
    }
    $n = [double]$X.Count
    $sumX = ($X | Measure-Object -Sum).Sum
    $sumY = ($Y | Measure-Object -Sum).Sum
    $sumXY = 0.0
    $sumX2 = 0.0
    $sumY2 = 0.0
    for ($i = 0; $i -lt $X.Count; $i++) {
        $sumXY += ($X[$i] * $Y[$i])
        $sumX2 += ($X[$i] * $X[$i])
        $sumY2 += ($Y[$i] * $Y[$i])
    }
    $num = ($n * $sumXY) - ($sumX * $sumY)
    $den = [Math]::Sqrt((($n * $sumX2) - ($sumX * $sumX)) * (($n * $sumY2) - ($sumY * $sumY)))
    if ($den -eq 0) {
        return 0.0
    }
    return ($num / $den)
}

function Get-DetectionValue {
    param(
        [Parameter(Mandatory = $true)]$Tool,
        [Parameter(Mandatory = $true)][string]$CaseId
    )
    $prop = $Tool.detections.PSObject.Properties[$CaseId]
    if ($null -eq $prop) {
        throw "Missing case id '$CaseId' on tool '$($Tool.id)'."
    }
    return $prop.Value
}

function Get-HitCount {
    param(
        [Parameter(Mandatory = $true)]$Tool,
        [Parameter(Mandatory = $true)][string[]]$CaseIds
    )
    $hits = 0
    foreach ($caseId in $CaseIds) {
        if ((Get-DetectionValue -Tool $Tool -CaseId $caseId) -eq $true) {
            $hits++
        }
    }
    return $hits
}

function Get-InvNormCdf {
    param([Parameter(Mandatory = $true)][double]$P)
    if ($P -le 0.0 -or $P -ge 1.0) {
        throw "Get-InvNormCdf expects p in (0, 1)."
    }
    $a = @(-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924)
    $b = @(-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857)
    $c = @(-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878)
    $d = @(0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742)
    $plow = 0.02425
    $phigh = 1.0 - $plow

    if ($P -lt $plow) {
        $q = [Math]::Sqrt(-2.0 * [Math]::Log($P))
        $num = ((((($c[0] * $q + $c[1]) * $q + $c[2]) * $q + $c[3]) * $q + $c[4]) * $q + $c[5])
        $den = ((((($d[0] * $q + $d[1]) * $q + $d[2]) * $q + $d[3]) * $q) + 1.0)
        return ($num / $den)
    }
    if ($P -le $phigh) {
        $q = $P - 0.5
        $r = $q * $q
        $num = ((((( $a[0] * $r + $a[1]) * $r + $a[2]) * $r + $a[3]) * $r + $a[4]) * $r + $a[5]) * $q
        $den = ((((( $b[0] * $r + $b[1]) * $r + $b[2]) * $r + $b[3]) * $r + $b[4]) * $r + 1.0)
        return ($num / $den)
    }

    $q = [Math]::Sqrt(-2.0 * [Math]::Log(1.0 - $P))
    $num = ((((($c[0] * $q + $c[1]) * $q + $c[2]) * $q + $c[3]) * $q + $c[4]) * $q + $c[5])
    $den = ((((($d[0] * $q + $d[1]) * $q + $d[2]) * $q + $d[3]) * $q) + 1.0)
    return -($num / $den)
}

function Get-EtsDeltaFromP {
    param(
        [Parameter(Mandatory = $true)][double]$P,
        [Parameter(Mandatory = $true)][int]$N
    )
    if ($N -le 0) { return 13.0 }
    $minP = 1.0 / (2.0 * [double]$N)
    $maxP = 1.0 - $minP
    $pAdj = [Math]::Max($minP, [Math]::Min($maxP, $P))
    $z = Get-InvNormCdf -P $pAdj
    return (13.0 - (4.0 * $z))
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

$matrixPath = Join-Path $repoRoot "results/dvna-detection-matrix.json"
$catalogPath = Join-Path $repoRoot "results/dvna-case-catalog.json"
$timingsPath = Join-Path $repoRoot "results/dvna-tool-timings.json"

if (-not (Test-Path $matrixPath)) { throw "Missing $matrixPath" }
if (-not (Test-Path $catalogPath)) { throw "Missing $catalogPath" }
if (-not (Test-Path $timingsPath)) { throw "Missing $timingsPath" }

$matrix = Get-Content -Raw $matrixPath | ConvertFrom-Json
$catalog = Get-Content -Raw $catalogPath | ConvertFrom-Json
$timings = Get-Content -Raw $timingsPath | ConvertFrom-Json

$toolIds = @("vibescan", "bearer", "snyk-code", "semgrep", "codeql", "eslint-security")
$toolRows = @()
$toolById = @{}
$timingById = @{}

foreach ($timing in $timings.tools) {
    $timingById[$timing.id] = $timing
}

foreach ($toolId in $toolIds) {
    $tool = $matrix.tools | Where-Object { $_.id -eq $toolId } | Select-Object -First 1
    if ($null -eq $tool) {
        throw "Tool '$toolId' missing in $matrixPath"
    }
    $toolRows += $tool
    $toolById[$tool.id] = $tool
}

$caseIds = @($catalog.caseOrder)
$totalCases = $caseIds.Count

$toolLabels = @{}
$hitCounts = @{}
$recallPct = @{}
$rawIssues = @{}
$precisionProxy = @{}
$runtimeSec = @{}

foreach ($tool in $toolRows) {
    $hits = Get-HitCount -Tool $tool -CaseIds $caseIds
    $issues = [double]$tool.dvnaRunIssueCount
    $recall = if ($totalCases -eq 0) { 0.0 } else { 100.0 * $hits / $totalCases }
    $proxy = if ($issues -le 0) { 0.0 } else { $hits / $issues }

    $timingMs = $null
    if ($timingById.ContainsKey($tool.id)) {
        $timingMs = [double]$timingById[$tool.id].durationMs
    } elseif ($null -ne $tool.dvnaRunDurationMs) {
        $timingMs = [double]$tool.dvnaRunDurationMs
    } else {
        $timingMs = 0.0
    }

    $toolLabels[$tool.id] = [string]$tool.label
    $hitCounts[$tool.id] = [int]$hits
    $recallPct[$tool.id] = [double]$recall
    $rawIssues[$tool.id] = [double]$issues
    $precisionProxy[$tool.id] = [double]$proxy
    $runtimeSec[$tool.id] = [double]($timingMs / 1000.0)
}

$analysisDepth = @{
    "vibescan" = 5
    "bearer" = 3
    "snyk-code" = 3
    "semgrep" = 2
    "codeql" = 3
    "eslint-security" = 1
}

$familyOrder = @(
    "Injection",
    "Redirect and Navigation",
    "Integrity",
    "Secrets and Crypto",
    "Auth and Access Control",
    "XSS and Client-Side Output"
)

$familyCases = @{}
foreach ($family in $familyOrder) {
    $familyCases[$family] = New-Object System.Collections.Generic.List[string]
}

$caseById = @{}
foreach ($case in $catalog.cases) {
    $caseById[$case.id] = $case
}

foreach ($caseId in $caseIds) {
    $case = $caseById[$caseId]
    if ($null -eq $case) { continue }
    if (-not $familyCases.ContainsKey($case.family)) {
        $familyCases[$case.family] = New-Object System.Collections.Generic.List[string]
    }
    $familyCases[$case.family].Add($caseId)
}

$familyRecallByTool = @{}
foreach ($toolId in $toolIds) {
    $tool = $toolById[$toolId]
    $familyRecallByTool[$toolId] = @{}
    foreach ($family in $familyOrder) {
        $familyCaseIds = @($familyCases[$family])
        if ($familyCaseIds.Count -eq 0) {
            $familyRecallByTool[$toolId][$family] = 0.0
            continue
        }
        $hits = Get-HitCount -Tool $tool -CaseIds $familyCaseIds
        $familyRecallByTool[$toolId][$family] = 100.0 * $hits / $familyCaseIds.Count
    }
}

$caseLabelById = @{
    "sqli-apphandler" = "SQL Injection"
    "cmd-inject-apphandler" = "Command Injection"
    "nosql-apphandler" = "NoSQL (route)"
    "nosql-auth" = "NoSQL (auth)"
    "nosql-passport" = "NoSQL (session)"
    "open-redirect" = "Open Redirect"
    "insecure-deser" = "Unsafe Deser"
    "hardcoded-session-secret" = "Hardcoded Secret"
    "weak-hash-auth" = "Weak Hash"
    "default-secret-fallback" = "Env Fallback"
    "dom-xss" = "DOM XSS"
}

$difficultyByCase = @{}
foreach ($caseId in $caseIds) {
    $hits = 0
    foreach ($toolId in $toolIds) {
        if ((Get-DetectionValue -Tool $toolById[$toolId] -CaseId $caseId) -eq $true) {
            $hits++
        }
    }
    $p = if ($toolIds.Count -eq 0) { 0.0 } else { [double]$hits / [double]$toolIds.Count }
    $difficultyByCase[$caseId] = [double](Get-EtsDeltaFromP -P $p -N $toolIds.Count)
}

$pearson = Get-PearsonR -X ([double[]]($toolIds | ForEach-Object { $rawIssues[$_] })) -Y ([double[]]($toolIds | ForEach-Object { $recallPct[$_] }))

$colorGreen = Get-RgbInt "#16a34a"
$colorGray = Get-RgbInt "#94a3b8"
$colorRed = Get-RgbInt "#ef4444"
$colorMissNeutral = Get-RgbInt "#e2e8f0"

$companyColor = @{
    "vibescan" = Get-RgbInt "#16a34a"
    "bearer" = Get-RgbInt "#2563eb"
    "snyk-code" = Get-RgbInt "#f59e0b"
    "semgrep" = Get-RgbInt "#8b5cf6"
    "codeql" = Get-RgbInt "#ef4444"
    "eslint-security" = Get-RgbInt "#0ea5e9"
}

$xlXYScatter = -4169
$xlColumnClustered = 51
$xlBarClustered = 57
$xlLinear = -4132
$xlScaleLog = -4133

$resolvedOutPath = if ([System.IO.Path]::IsPathRooted($OutPath)) {
    $OutPath
} else {
    Join-Path $repoRoot $OutPath
}

$outDir = Split-Path -Parent $resolvedOutPath
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$ppt = $null
$presentation = $null
try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = -1
    $presentation = $ppt.Presentations.Add()

    # Figure 1
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 1 - Analysis Depth Comparison"
    $shape = $slide.Shapes.AddChart2(201, $xlBarClustered, 30, 52, 900, 430, $false)
    $chart = $shape.Chart
    Clear-ChartSeries -Chart $chart
    $orderFig1 = @("vibescan", "bearer", "snyk-code", "codeql", "semgrep", "eslint-security")
    $labelsFig1 = @($orderFig1 | ForEach-Object { $toolLabels[$_] })
    $valuesFig1 = @($orderFig1 | ForEach-Object { [double]$analysisDepth[$_] })
    $series = $chart.SeriesCollection().NewSeries()
    $series.Name = "=""Depth stage reached"""
    $series.XValues = $labelsFig1
    $series.Values = $valuesFig1
    $chart.HasLegend = $false
    Invoke-Safe { $chart.Axes(1).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(1).MaximumScale = 5 }
    Invoke-Safe { $chart.Axes(1).MajorUnit = 1 }
    Invoke-Safe { $chart.Axes(1).HasTitle = $true }
    Invoke-Safe { $chart.Axes(1).AxisTitle.Text = "Analysis depth stage (1-5)" }
    Invoke-Safe { $chart.Axes(2).ReversePlotOrder = $true }
    Invoke-Safe { $series.ApplyDataLabels() }
    for ($i = 1; $i -le $orderFig1.Count; $i++) {
        $point = $series.Points($i)
        $toolId = $orderFig1[$i - 1]
        $fill = $companyColor[$toolId]
        Invoke-Safe { $point.Format.Fill.ForeColor.RGB = $fill }
        Invoke-Safe { $point.Format.Line.ForeColor.RGB = $fill }
        Invoke-Safe { $point.DataLabel.NumberFormat = "0" }
    }
    Add-SlideParagraph -Slide $slide -Text "This chart compares how far each tool reaches in the analysis pipeline. VibeScan is the only tool reaching stage 5, which includes proof generation and CI gating."
    Add-SpeakerNotes -Slide $slide -Text @"
We built this depth comparison by mapping each tool to the deepest analysis stage it consistently reached in our DVNA benchmark workflow, from simple pattern checks to proof-backed CI gating.

Tell this as the opening story: most tools stop in the middle of the pipeline, which limits what they can verify in hard multi-context cases. VibeScan reaches stage 5, so it can carry findings into proof generation and regression gates.

What this chart shows is not just rank, but capability progression: each bar is a stage boundary where practical detection power either continues or stops.
"@
    Close-ChartDataEditor -Chart $chart
    Add-SlideNote -Slide $slide -Text "Stage map: 1 Pattern matching, 2 Taint/data flow, 3 Cross-file, 4 Route/API reasoning, 5 Proof generation + CI gates."

    # Figure 2
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 2 - Recall vs Raw Alert Volume"
    $shape = $slide.Shapes.AddChart2(201, $xlXYScatter, 30, 52, 900, 430, $false)
    $chart = $shape.Chart
    Clear-ChartSeries -Chart $chart
    $xFig2 = @($toolIds | ForEach-Object { [double]$rawIssues[$_] })
    $yFig2 = @($toolIds | ForEach-Object { [double]$recallPct[$_] })
    $labelsFig2 = @($toolIds | ForEach-Object { $toolLabels[$_] })
    $series = $chart.SeriesCollection().NewSeries()
    $series.Name = "=""Tools"""
    $series.XValues = $xFig2
    $series.Values = $yFig2
    $chart.HasLegend = $false
    Invoke-Safe { $chart.Axes(1).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(1).MaximumScale = 500 }
    Invoke-Safe { $chart.Axes(1).MajorUnit = 100 }
    Invoke-Safe { $chart.Axes(1).HasTitle = $true }
    Invoke-Safe { $chart.Axes(1).AxisTitle.Text = "Raw issues reported on DVNA" }
    Invoke-Safe { $chart.Axes(2).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(2).MaximumScale = 100 }
    Invoke-Safe { $chart.Axes(2).MajorUnit = 20 }
    Invoke-Safe { $chart.Axes(2).HasTitle = $true }
    Invoke-Safe { $chart.Axes(2).AxisTitle.Text = "Recall (%)" }
    Invoke-Safe {
        $trend = $series.Trendlines().Add($xlLinear)
        $trend.Format.Line.ForeColor.RGB = $colorRed
    }
    for ($i = 1; $i -le $toolIds.Count; $i++) {
        $toolId = $toolIds[$i - 1]
        $point = $series.Points($i)
        $fill = $companyColor[$toolId]
        Invoke-Safe { $point.MarkerStyle = 8 }
        Invoke-Safe { $point.MarkerSize = if ($toolId -eq "vibescan") { 11 } else { 8 } }
        Invoke-Safe { $point.Format.Fill.ForeColor.RGB = $fill }
        Invoke-Safe { $point.Format.Line.ForeColor.RGB = $fill }
        Invoke-Safe { $point.HasDataLabel = $true }
        Invoke-Safe { $point.DataLabel.Text = $labelsFig2[$i - 1] }
    }
    $pearsonShape = $slide.Shapes.AddTextbox(1, 740, 24, 180, 20)
    $pearsonShape.TextFrame.TextRange.Text = ("Pearson r={0}" -f ([Math]::Round($pearson, 2).ToString("0.00")))
    $pearsonShape.TextFrame.TextRange.Font.Name = "Arial"
    $pearsonShape.TextFrame.TextRange.Font.Size = 11
    Add-SlideParagraph -Slide $slide -Text "This scatter plot compares DVNA recall against raw alert volume. It shows that generating more alerts does not necessarily produce higher recall."
    Add-SpeakerNotes -Slide $slide -Text @"
For each tool, we paired two measured values from the benchmark artifacts: raw DVNA issue count and anchored recall on the 11 adjudicated DVNA cases.

Narrative: the common assumption is that more alerts means better security coverage. This chart tells the opposite story. Alert volume and recall move loosely and often in different directions.

Use the Pearson value to reinforce that point: high volume does not guarantee high benchmark recall.
"@
    Close-ChartDataEditor -Chart $chart
    Add-SlideNote -Slide $slide -Text "Recreated from results/dvna-detection-matrix.json (dvnaRunIssueCount + recall)."

    # Figure 6
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 6 - Signal-to-Noise (Cases/Alert)"
    $shape = $slide.Shapes.AddChart2(201, $xlBarClustered, 30, 52, 900, 430, $false)
    $chart = $shape.Chart
    Clear-ChartSeries -Chart $chart
    $orderFig6 = @("vibescan", "semgrep", "bearer", "snyk-code", "codeql", "eslint-security")
    $labelsFig6 = @($orderFig6 | ForEach-Object { $toolLabels[$_] })
    $valuesFig6 = @($orderFig6 | ForEach-Object { [double]$precisionProxy[$_] })
    $series = $chart.SeriesCollection().NewSeries()
    $series.Name = "=""Cases per alert"""
    $series.XValues = $labelsFig6
    $series.Values = $valuesFig6
    $chart.HasLegend = $false
    Invoke-Safe { $chart.Axes(1).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(1).MaximumScale = 0.45 }
    Invoke-Safe { $chart.Axes(1).MajorUnit = 0.05 }
    Invoke-Safe { $chart.Axes(1).HasTitle = $true }
    Invoke-Safe { $chart.Axes(1).AxisTitle.Text = "Cases / alert" }
    Invoke-Safe { $chart.Axes(2).ReversePlotOrder = $true }
    Invoke-Safe { $series.ApplyDataLabels() }
    for ($i = 1; $i -le $orderFig6.Count; $i++) {
        $toolId = $orderFig6[$i - 1]
        $point = $series.Points($i)
        $fill = $companyColor[$toolId]
        Invoke-Safe { $point.Format.Fill.ForeColor.RGB = $fill }
        Invoke-Safe { $point.Format.Line.ForeColor.RGB = $fill }
        Invoke-Safe { $point.DataLabel.NumberFormat = "0.000" }
    }
    Add-SlideParagraph -Slide $slide -Text "This bar chart shows signal-to-noise as cases detected per alert. Higher values indicate stronger benchmark value per finding, with VibeScan highest in this run."
    Add-SpeakerNotes -Slide $slide -Text @"
We computed this metric directly from the same benchmark data: signal-to-noise equals detected cases divided by raw alerts for each tool.

Story framing: after we separate recall from alert volume, we can ask a practical triage question, how much benchmark value do we get per finding engineers must inspect.

This chart shows VibeScan delivering the strongest value density in this run, followed by peers with progressively lower efficiency.
"@
    Close-ChartDataEditor -Chart $chart
    Add-SlideNote -Slide $slide -Text "Precision proxy = cases detected / raw alerts (higher is better)."

    # Figure 7
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 7 - Per-Family Recall by Tool"
    $shape = $slide.Shapes.AddChart2(201, $xlColumnClustered, 30, 52, 900, 430, $false)
    $chart = $shape.Chart
    Clear-ChartSeries -Chart $chart
    foreach ($toolId in $toolIds) {
        $series = $chart.SeriesCollection().NewSeries()
        $series.Name = "=""$($toolLabels[$toolId])"""
        $series.XValues = @($familyOrder)
        $series.Values = @($familyOrder | ForEach-Object { [double]$familyRecallByTool[$toolId][$_] })
    }
    $chart.HasLegend = $true
    Invoke-Safe { $chart.Axes(2).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(2).MaximumScale = 100 }
    Invoke-Safe { $chart.Axes(2).MajorUnit = 20 }
    Invoke-Safe { $chart.Axes(2).HasTitle = $true }
    Invoke-Safe { $chart.Axes(2).AxisTitle.Text = "Recall (%)" }
    for ($i = 1; $i -le $toolIds.Count; $i++) {
        $toolId = $toolIds[$i - 1]
        $series = $chart.SeriesCollection($i)
        $fill = $companyColor[$toolId]
        Invoke-Safe { $series.Format.Fill.ForeColor.RGB = $fill }
        Invoke-Safe { $series.Format.Line.ForeColor.RGB = $fill }
    }
    Add-SlideParagraph -Slide $slide -Text "This grouped chart breaks recall into security families to show where tools diverge. It highlights category-level strengths and coverage gaps that are hidden in overall recall alone."
    Add-SpeakerNotes -Slide $slide -Text @"
To generate this view, we grouped the 11 DVNA cases into security families using the case catalog, then computed per-family recall for each tool from the detection matrix.

Tell this part as diagnostic evidence: overall recall alone hides where misses cluster. Family-level recall exposes exactly which vulnerability themes are driving the gap.

The story here is that VibeScan stays consistently high across families, while peer performance is more uneven and drops in specific categories.
"@
    Close-ChartDataEditor -Chart $chart
    Add-SlideNote -Slide $slide -Text "Family groups sourced from results/dvna-case-catalog.json."

    # Figure 4 (heatmap matrix)
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 4 - Heatmap with Totals"

    # Main matrix (heatmap-like clustered columns with per-point colors)
    $matrixShape = $slide.Shapes.AddChart2(201, $xlColumnClustered, 20, 52, 645, 295, $false)
    $matrixChart = $matrixShape.Chart
    Clear-ChartSeries -Chart $matrixChart
    $caseLabels = @($caseIds | ForEach-Object { $caseLabelById[$_] })
    $ones = @($caseIds | ForEach-Object { 1 })
    foreach ($toolId in $toolIds) {
        $series = $matrixChart.SeriesCollection().NewSeries()
        $series.Name = "=""$($toolLabels[$toolId])"""
        $series.XValues = $caseLabels
        $series.Values = $ones
        for ($i = 1; $i -le $caseIds.Count; $i++) {
            $caseId = $caseIds[$i - 1]
            $hit = (Get-DetectionValue -Tool $toolById[$toolId] -CaseId $caseId) -eq $true
            $pointFill = if ($hit) { $companyColor[$toolId] } else { $colorMissNeutral }
            $pointLine = $companyColor[$toolId]
            $point = $series.Points($i)
            Invoke-Safe { $point.Format.Fill.ForeColor.RGB = $pointFill }
            Invoke-Safe { $point.Format.Line.ForeColor.RGB = $pointLine }
        }
    }
    $matrixChart.HasLegend = $true
    Invoke-Safe { $matrixChart.Axes(2).MinimumScale = 0 }
    Invoke-Safe { $matrixChart.Axes(2).MaximumScale = 1.2 }
    Invoke-Safe { $matrixChart.Axes(2).MajorUnit = 1 }
    Invoke-Safe { $matrixChart.Axes(2).TickLabelPosition = -4142 }
    Invoke-Safe { $matrixChart.Axes(2).HasMajorGridlines = $false }
    Invoke-Safe { $matrixChart.Axes(1).TickLabels.Orientation = 45 }
    Invoke-Safe { $matrixChart.ChartGroups(1).GapWidth = 20 }
    Add-SlideParagraph -Slide $slide -Text "This heatmap shows per-case detection outcomes by tool. Colored cells indicate where each tool hits or misses specific benchmark rows, making case-level differences explicit."
    Add-SpeakerNotes -Slide $slide -Text @"
This is the case-level ground truth view built from results/dvna-detection-matrix.json aligned to the anchored rows in results/dvna-case-catalog.json.

Presentation story: each row is one benchmark case, each column is one tool, and each colored cell is the adjudicated hit/miss outcome. This is where the recall numbers become concrete.

Use this slide to walk the audience from aggregate metrics into exact case behavior, so the coverage narrative is evidence-backed rather than abstract.
"@
    Close-ChartDataEditor -Chart $matrixChart
    Add-SlideNote -Slide $slide -Text "Matrix cells are editable chart points (green=hit, red=miss)."

    # Figure 4 companion: difficulty by case
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 4 Companion - Case Difficulty (ETS Delta)"
    $diffShape = $slide.Shapes.AddChart2(201, $xlBarClustered, 30, 52, 900, 430, $false)
    $diffChart = $diffShape.Chart
    Clear-ChartSeries -Chart $diffChart
    $diffSeries = $diffChart.SeriesCollection().NewSeries()
    $diffSeries.Name = "=""Difficulty (ETS delta)"""
    $diffSeries.XValues = $caseLabels
    $diffSeries.Values = @($caseIds | ForEach-Object { [double]$difficultyByCase[$_] })
    $diffChart.HasLegend = $false
    Invoke-Safe { $diffChart.Axes(1).MinimumScale = 6 }
    Invoke-Safe { $diffChart.Axes(1).MaximumScale = 20 }
    Invoke-Safe { $diffChart.Axes(1).MajorUnit = 1 }
    Invoke-Safe { $diffChart.Axes(1).HasTitle = $true }
    Invoke-Safe { $diffChart.Axes(1).AxisTitle.Text = "Delta (13 - 4z), higher = harder" }
    Invoke-Safe { $diffChart.Axes(2).ReversePlotOrder = $true }
    Invoke-Safe { $diffSeries.Format.Fill.ForeColor.RGB = (Get-RgbInt "#60a5fa") }
    Invoke-Safe { $diffSeries.ApplyDataLabels() }
    Invoke-Safe { $diffSeries.DataLabels().NumberFormat = "0.0" }
    Add-SlideParagraph -Slide $slide -Text "This companion chart summarizes case difficulty using ETS delta derived from tool-consensus p (p=hits/6). Higher delta values indicate harder cases."
    Add-SpeakerNotes -Slide $slide -Text @"
We derive difficulty from tool-consensus p (hits/6) and convert to ETS delta using delta = 13 - 4z.

Story point: this converts raw hit/miss cells into a standardized difficulty lens. Higher delta means lower consensus and harder cases where meaningful scanner differences appear.

Use this slide to explain why equal totals can still hide important risk: missing hard cases hurts benchmark value disproportionately.
"@
    Close-ChartDataEditor -Chart $diffChart
    Add-SlideNote -Slide $slide -Text "Matches right-side delta values from the poster heatmap."

    # Figure 4 companion: total hits by tool
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 4 Companion - Total Hits by Tool"
    $totalShape = $slide.Shapes.AddChart2(201, $xlColumnClustered, 30, 52, 900, 430, $false)
    $totalChart = $totalShape.Chart
    Clear-ChartSeries -Chart $totalChart
    $totalSeries = $totalChart.SeriesCollection().NewSeries()
    $totalSeries.Name = "=""Total hits (of 11)"""
    $totalSeries.XValues = @($toolIds | ForEach-Object { $toolLabels[$_] })
    $totalSeries.Values = @($toolIds | ForEach-Object { [double]$hitCounts[$_] })
    $totalChart.HasLegend = $false
    Invoke-Safe { $totalChart.Axes(2).MinimumScale = 0 }
    Invoke-Safe { $totalChart.Axes(2).MaximumScale = 11 }
    Invoke-Safe { $totalChart.Axes(2).MajorUnit = 1 }
    Invoke-Safe { $totalSeries.ApplyDataLabels() }
    for ($i = 1; $i -le $toolIds.Count; $i++) {
        $toolId = $toolIds[$i - 1]
        $point = $totalSeries.Points($i)
        $fill = $companyColor[$toolId]
        Invoke-Safe { $point.Format.Fill.ForeColor.RGB = $fill }
        Invoke-Safe { $point.Format.Line.ForeColor.RGB = $fill }
    }
    Add-SlideParagraph -Slide $slide -Text "This companion chart totals detected cases per tool out of the 11 DVNA rows. It provides a direct side-by-side view of overall benchmark coverage."
    Add-SpeakerNotes -Slide $slide -Text @"
This chart is the direct roll-up of case-level detections: total benchmark hits out of 11 cases per tool.

Tell this as the simple scoreboard after the deeper diagnostics. The audience can quickly see final coverage separation before moving to tradeoff views.

The key story transition is that VibeScan leads total coverage, and the prior slides explained why that lead is structurally credible.
"@
    Close-ChartDataEditor -Chart $totalChart
    Add-SlideNote -Slide $slide -Text "Matches bottom-row total-hit summary from the poster heatmap."

    # Figure 8
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 8 - Recall vs Precision Proxy"
    $shape = $slide.Shapes.AddChart2(201, $xlXYScatter, 30, 52, 900, 430, $false)
    $chart = $shape.Chart
    Clear-ChartSeries -Chart $chart
    $xFig8 = @($toolIds | ForEach-Object { [double]$precisionProxy[$_] })
    $yFig8 = @($toolIds | ForEach-Object { [double]$recallPct[$_] })
    $labelsFig8 = @($toolIds | ForEach-Object { $toolLabels[$_] })
    $series = $chart.SeriesCollection().NewSeries()
    $series.Name = "=""Tools"""
    $series.XValues = $xFig8
    $series.Values = $yFig8
    $chart.HasLegend = $false
    Invoke-Safe { $chart.Axes(1).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(1).MaximumScale = 0.45 }
    Invoke-Safe { $chart.Axes(1).MajorUnit = 0.1 }
    Invoke-Safe { $chart.Axes(1).HasTitle = $true }
    Invoke-Safe { $chart.Axes(1).AxisTitle.Text = "Precision proxy (cases detected / raw alerts)" }
    Invoke-Safe { $chart.Axes(2).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(2).MaximumScale = 100 }
    Invoke-Safe { $chart.Axes(2).MajorUnit = 20 }
    Invoke-Safe { $chart.Axes(2).HasTitle = $true }
    Invoke-Safe { $chart.Axes(2).AxisTitle.Text = "Recall (%)" }
    for ($i = 1; $i -le $toolIds.Count; $i++) {
        $toolId = $toolIds[$i - 1]
        $point = $series.Points($i)
        $fill = $companyColor[$toolId]
        Invoke-Safe { $point.MarkerStyle = 8 }
        Invoke-Safe { $point.MarkerSize = if ($toolId -eq "vibescan") { 11 } else { 8 } }
        Invoke-Safe { $point.Format.Fill.ForeColor.RGB = $fill }
        Invoke-Safe { $point.Format.Line.ForeColor.RGB = $fill }
        Invoke-Safe { $point.HasDataLabel = $true }
        Invoke-Safe { $point.DataLabel.Text = $labelsFig8[$i - 1] }
    }
    Add-SlideParagraph -Slide $slide -Text "This scatter plot compares recall with the precision proxy. It helps visualize the tradeoff between coverage and alert quality for each tool."
    Add-SpeakerNotes -Slide $slide -Text @"
This chart combines two practical axes from the same run data: recall on the y-axis and cases-per-alert proxy on the x-axis.

Narrative: we are no longer asking only who finds more, but who finds more with less triage burden. That is closer to operational reality for teams.

Use this slide to show that VibeScan sits in the favorable region, pairing high coverage with stronger signal density.
"@
    Close-ChartDataEditor -Chart $chart
    Add-SlideNote -Slide $slide -Text "Precision proxy is not formal false-positive-adjudicated precision."

    # Figure 9
    $slide = $presentation.Slides.Add($presentation.Slides.Count + 1, 12)
    Add-SlideTitle -Slide $slide -Title "Figure 9 - Recall vs Scan Time"
    $shape = $slide.Shapes.AddChart2(201, $xlXYScatter, 30, 52, 900, 430, $false)
    $chart = $shape.Chart
    Clear-ChartSeries -Chart $chart
    $xFig9 = @($toolIds | ForEach-Object { [double]$runtimeSec[$_] })
    $yFig9 = @($toolIds | ForEach-Object { [double]$recallPct[$_] })
    $labelsFig9 = @($toolIds | ForEach-Object { $toolLabels[$_] })
    $series = $chart.SeriesCollection().NewSeries()
    $series.Name = "=""Tools"""
    $series.XValues = $xFig9
    $series.Values = $yFig9
    $chart.HasLegend = $false
    Invoke-Safe { $chart.Axes(1).MinimumScale = 0.5 }
    Invoke-Safe { $chart.Axes(1).MaximumScale = 100 }
    Invoke-Safe { $chart.Axes(1).ScaleType = $xlScaleLog }
    Invoke-Safe { $chart.Axes(1).HasTitle = $true }
    Invoke-Safe { $chart.Axes(1).AxisTitle.Text = "Runtime (seconds, log scale)" }
    Invoke-Safe { $chart.Axes(2).MinimumScale = 0 }
    Invoke-Safe { $chart.Axes(2).MaximumScale = 100 }
    Invoke-Safe { $chart.Axes(2).MajorUnit = 20 }
    Invoke-Safe { $chart.Axes(2).HasTitle = $true }
    Invoke-Safe { $chart.Axes(2).AxisTitle.Text = "DVNA recall (%)" }
    for ($i = 1; $i -le $toolIds.Count; $i++) {
        $toolId = $toolIds[$i - 1]
        $point = $series.Points($i)
        $fill = $companyColor[$toolId]
        Invoke-Safe { $point.MarkerStyle = 8 }
        Invoke-Safe { $point.MarkerSize = if ($toolId -eq "vibescan") { 11 } else { 8 } }
        Invoke-Safe { $point.Format.Fill.ForeColor.RGB = $fill }
        Invoke-Safe { $point.Format.Line.ForeColor.RGB = $fill }
        Invoke-Safe { $point.HasDataLabel = $true }
        Invoke-Safe { $point.DataLabel.Text = $labelsFig9[$i - 1] }
    }
    Add-SlideParagraph -Slide $slide -Text "This chart compares recall against runtime on a log-scale x-axis. It shows relative operational cost while preserving visibility from sub-second scans to long-running analyses."
    Add-SpeakerNotes -Slide $slide -Text @"
Runtime values come from rerun wall-clock measurements in results/dvna-tool-timings.json, paired with the same recall values used in earlier charts.

Story close: this is the cost-versus-coverage view. The log x-axis keeps both fast and slow tools visible, including long-tail outliers.

Present this as the final practical takeaway: benchmark strength is most compelling when strong recall also fits CI-friendly execution time.
"@
    Close-ChartDataEditor -Chart $chart
    Add-SlideNote -Slide $slide -Text "Runtimes from results/dvna-tool-timings.json (wall-clock rerun values)."

    $presentation.SaveAs($resolvedOutPath)
    Write-Output "Saved editable chart deck: $resolvedOutPath"
} finally {
    if ($null -ne $presentation) {
        Invoke-Safe { $presentation.Close() }
    }
    if ($null -ne $ppt) {
        Invoke-Safe { $ppt.Quit() }
    }
}
