#!/bin/bash

# Ralph Loop Orchestrator Runner
# Starts the multi-agent Ralph Loop system

set -e

echo "🚀 Starting TubeRank Ralph Loop System"
echo "======================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ Git is required but not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if [ ! -f "PLAN.md" ]; then
    echo "❌ PLAN.md not found. Run setup first."
    exit 1
fi

if [ ! -f "PROGRESS.md" ]; then
    echo "❌ PROGRESS.md not found. Run setup first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "🔧 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ralph Loop system setup"
fi

# Start orchestrator
echo ""
echo "🎯 Starting Ralph Loop Orchestrator..."
echo "Monitor progress in PROGRESS.md"
echo "View agent activity in git log"
echo ""
echo "To stop the system: Ctrl+C"
echo "To monitor progress: tail -f PROGRESS.md"
echo ""

# This would typically call the orchestrator agent
# For now, we'll show the command structure
echo "Command to start orchestrator:"
echo "kiro-cli chat --agent orchestrator"
echo ""
echo "Or use your preferred agent runner with:"
echo "Agent: orchestrator"
echo "Task: Start Ralph Loop system for TubeRank project"
