# Auto-Claude Runner
# Runs Claude Code every hour with a prompt from claude-prompt.txt

$PROJECT_DIR = "C:\Users\Mehr Research\Code\nuCMS"

while ($true) {
    Set-Location $PROJECT_DIR
    
    if (Test-Path "claude-prompt.txt") {
        Write-Host "$(Get-Date): Running Claude Code..."
        $prompt = Get-Content "claude-prompt.txt" -Raw
        npx @anthropic-ai/claude-code --print --dangerously-skip-permissions $prompt
        Write-Host "$(Get-Date): Claude Code session completed"
        Write-Host "---"
    } else {
        Write-Host "$(Get-Date): claude-prompt.txt not found in $PROJECT_DIR"
    }
    
    Start-Sleep 3600  # 1 hour (3600 seconds)
}