#!/bin/bash
# Auto-Claude Runner
# Runs Claude Code every hour with a prompt from claude-prompt.txt

PROJECT_DIR="/Users/hessammehr/Code/nu_cms"

while true; do
    cd "$PROJECT_DIR"
    
    if [ -f claude-prompt.txt ]; then
        echo "$(date): Running Claude Code..."
        claude --print --dangerously-skip-permissions "$(cat claude-prompt.txt)"
        echo "$(date): Claude Code session completed"
        echo "---"
    else
        echo "$(date): claude-prompt.txt not found in $PROJECT_DIR"
    fi

    sleep 1800
done