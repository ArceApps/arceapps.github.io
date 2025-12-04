
$sourceDir = "d:\ProyectosProgramacion\ArceApps\ArceAppsWeb\blog"
$destDir = "d:\ProyectosProgramacion\ArceApps\ArceAppsWeb\src\content\blog"

# Ensure destination directory exists
if (-not (Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

# Get all HTML files
$files = Get-ChildItem -Path $sourceDir -Filter "*.html"

foreach ($file in $files) {
    Write-Host "Processing $($file.Name)..."
    
    $content = Get-Content -Path $file.FullName -Raw
    
    # Extract Title
    $title = ""
    if ($content -match "<h1>(.*?)</h1>") {
        $title = $matches[1].Trim()
    }
    
    # Extract Description/Subtitle
    $description = ""
    if ($content -match "<p class=""article-subtitle"">(.*?)</p>") {
        $description = $matches[1].Trim()
    }
    
    # Extract Date
    $pubDate = "2025-01-01"
    if ($content -match "<span class=""article-date"">(.*?)</span>") {
        $dateStr = $matches[1].Trim()
        # Convert "20 de septiembre de 2025" to "2025-09-20"
        # Simple mapping for months
        $months = @{
            "enero"="01"; "febrero"="02"; "marzo"="03"; "abril"="04"; "mayo"="05"; "junio"="06";
            "julio"="07"; "agosto"="08"; "septiembre"="09"; "octubre"="10"; "noviembre"="11"; "diciembre"="12"
        }
        
        if ($dateStr -match "(\d+) de (\w+) de (\d{4})") {
            $day = $matches[1].PadLeft(2, '0')
            $monthName = $matches[2].ToLower()
            $year = $matches[3]
            
            if ($months.ContainsKey($monthName)) {
                $month = $months[$monthName]
                $pubDate = "$year-$month-$day"
            }
        }
    }
    
    # Extract Category/Tags
    $tags = @()
    if ($content -match "<span class=""article-category"">(.*?)</span>") {
        $tags += $matches[1].Trim()
    }
    
    # Extract Content
    $bodyContent = ""
    if ($content -match "(?s)<div class=""article-content"">(.*?)</div>\s*</div>\s*</article>") {
        $bodyContent = $matches[1].Trim()
        
        # Basic HTML to Markdown conversion
        $bodyContent = $bodyContent -replace "<h2>(.*?)</h2>", "`n## `$1`n"
        $bodyContent = $bodyContent -replace "<h3>(.*?)</h3>", "`n### `$1`n"
        $bodyContent = $bodyContent -replace "<h4>(.*?)</h4>", "`n#### `$1`n"
        $bodyContent = $bodyContent -replace "<p>(.*?)</p>", "`$1`n`n"
        $bodyContent = $bodyContent -replace "<ul>", ""
        $bodyContent = $bodyContent -replace "</ul>", "`n"
        $bodyContent = $bodyContent -replace "<li>(.*?)</li>", "- `$1`n"
        $bodyContent = $bodyContent -replace "<strong>(.*?)</strong>", "**`$1**"
        $bodyContent = $bodyContent -replace "<b>(.*?)</b>", "**`$1**"
        $bodyContent = $bodyContent -replace "<em>(.*?)</em>", "*`$1*"
        $bodyContent = $bodyContent -replace "<i>(.*?)</i>", "*`$1*"
        $bodyContent = $bodyContent -replace '<a href="(.*?)">(.*?)</a>', "[`$2](`$1)"
        $bodyContent = $bodyContent -replace '<pre><code class="language-kotlin">(.*?)</code></pre>', "`n```kotlin`n`$1`n````n"
        $bodyContent = $bodyContent -replace '<pre><code>(.*?)</code></pre>', "`n```kotlin`n`$1`n````n"
        $bodyContent = $bodyContent -replace '(?s)<div class="code-block">.*?<pre><code.*?>(.*?)</code></pre>.*?</div>', "`n```kotlin`n`$1`n````n"
        
        # Clean up HTML entities
        $bodyContent = $bodyContent -replace "&lt;", "<"
        $bodyContent = $bodyContent -replace "&gt;", ">"
        $bodyContent = $bodyContent -replace "&amp;", "&"
        
        # Remove remaining divs and classes
        $bodyContent = $bodyContent -replace '<div.*?>', ""
        $bodyContent = $bodyContent -replace '</div>', ""
        $bodyContent = $bodyContent -replace '<span.*?>', ""
        $bodyContent = $bodyContent -replace '</span>', ""
    }
    
    # Generate hero image path
    $heroImage = "/images/placeholder-article-" + $file.Name.Replace("blog-", "").Replace(".html", "") + ".svg"
    
    # Create Markdown content
    $mdContent = "---`n"
    $mdContent += "title: ""$title""`n"
    $mdContent += "description: ""$description""`n"
    $mdContent += "pubDate: ""$pubDate""`n"
    $mdContent += "heroImage: ""$heroImage""`n"
    $mdContent += "tags: [""Android"", ""$($tags -join '", "')""]`n"
    $mdContent += "---`n`n"
    $mdContent += $bodyContent
    
    # Save to file
    $outputFile = Join-Path $destDir ($file.Name.Replace(".html", ".md"))
    $mdContent | Set-Content -Path $outputFile -Encoding UTF8
}

Write-Host "Conversion complete!"
