#!/bin/bash
# Reusable GitHub Repository Creation Script
# This script creates a GitHub repository with configurable options

set -e  # Exit on error

# Function to display usage
usage() {
    echo "Usage: $0 -n <repo-name> -o <org/owner> [OPTIONS]"
    echo ""
    echo "Required arguments:"
    echo "  -n, --name         Repository name"
    echo "  -o, --owner        GitHub organization or username"
    echo ""
    echo "Optional arguments:"
    echo "  -d, --description  Repository description (default: '')"
    echo "  -p, --private      Create private repository (default: true)"
    echo "  -u, --public       Create public repository"
    echo "  -t, --template     Template repository to use"
    echo "  -r, --remote       Add remote to current git repo (default: true)"
    echo "  --no-remote        Don't add remote to current git repo"
    echo "  -y, --yes          Skip confirmation prompts"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -n my-repo -o myorg -d 'My new repository'"
    echo "  $0 -n public-repo -o myuser --public"
    echo "  $0 -n from-template -o myorg -t myorg/template-repo"
}

# Default values
PRIVATE=true
ADD_REMOTE=true
DESCRIPTION=""
TEMPLATE=""
SKIP_CONFIRM=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            REPO_NAME="$2"
            shift 2
            ;;
        -o|--owner)
            OWNER="$2"
            shift 2
            ;;
        -d|--description)
            DESCRIPTION="$2"
            shift 2
            ;;
        -p|--private)
            PRIVATE=true
            shift
            ;;
        -u|--public)
            PRIVATE=false
            shift
            ;;
        -t|--template)
            TEMPLATE="$2"
            shift 2
            ;;
        -r|--remote)
            ADD_REMOTE=true
            shift
            ;;
        --no-remote)
            ADD_REMOTE=false
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Error: Unknown option $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$REPO_NAME" ]]; then
    echo "Error: Repository name is required"
    usage
    exit 1
fi

if [[ -z "$OWNER" ]]; then
    echo "Error: Owner/organization is required"
    usage
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI"
    echo "Please run: gh auth login"
    exit 1
fi

# Build gh repo create command
GH_CMD="gh repo create ${OWNER}/${REPO_NAME}"

# Add description if provided
if [[ -n "$DESCRIPTION" ]]; then
    GH_CMD="$GH_CMD --description '$DESCRIPTION'"
fi

# Add privacy flag
if $PRIVATE; then
    GH_CMD="$GH_CMD --private"
else
    GH_CMD="$GH_CMD --public"
fi

# Add template if provided
if [[ -n "$TEMPLATE" ]]; then
    GH_CMD="$GH_CMD --template $TEMPLATE"
fi

# Determine if we're in a git repository
IN_GIT_REPO=false
if git rev-parse --git-dir > /dev/null 2>&1; then
    IN_GIT_REPO=true
fi

# If not in a git repo, initialize one
if ! $IN_GIT_REPO; then
    echo "Initializing git repository..."
    git init
    IN_GIT_REPO=true
fi

# Add remote flag based on conditions
if $ADD_REMOTE && $IN_GIT_REPO; then
    # When in a git repo, use --source with current directory
    GH_CMD="$GH_CMD --source ."
    
    # Check if remote already exists
    if git remote get-url origin > /dev/null 2>&1; then
        echo "Warning: Remote 'origin' already exists"
        if ! $SKIP_CONFIRM; then
            read -p "Do you want to add as 'github' remote instead? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                GH_CMD="$GH_CMD --remote github"
            else
                ADD_REMOTE=false
            fi
        else
            # In auto mode, add as 'github' remote if 'origin' exists
            GH_CMD="$GH_CMD --remote github"
        fi
    else
        GH_CMD="$GH_CMD --remote origin"
    fi
else
    # Not adding remote, so don't add README either
    GH_CMD="$GH_CMD --add-readme=false"
fi

# Confirmation prompt
echo "About to create repository with the following settings:"
echo "  Owner/Org: $OWNER"
echo "  Repository: $REPO_NAME"
echo "  Visibility: $(if $PRIVATE; then echo "Private"; else echo "Public"; fi)"
if [[ -n "$DESCRIPTION" ]]; then
    echo "  Description: $DESCRIPTION"
fi
if [[ -n "$TEMPLATE" ]]; then
    echo "  Template: $TEMPLATE"
fi
if $IN_GIT_REPO && $ADD_REMOTE; then
    echo "  Will add remote to current git repository"
fi
echo ""

if ! $SKIP_CONFIRM; then
    read -p "Continue? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled"
        exit 0
    fi
fi

# Execute the command
echo "Creating repository..."
eval $GH_CMD

if [[ $? -eq 0 ]]; then
    echo ""
    echo "✓ Repository created successfully!"
    echo "  URL: https://github.com/${OWNER}/${REPO_NAME}"
    
    # Create .env file with repository URL
    echo "Creating .env file with repository URL..."
    echo "GITHUB_REPO_URL=https://github.com/${OWNER}/${REPO_NAME}" > .env
    echo "GITHUB_REPO_OWNER=${OWNER}" >> .env
    echo "GITHUB_REPO_NAME=${REPO_NAME}" >> .env
    
    # Add .env to git if it doesn't exist in .gitignore
    if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo ".env" >> .gitignore
    fi
    
    # Stage all files for initial commit
    echo "Staging files for initial commit..."
    git add .
    
    # Create initial commit if no commits exist
    if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
        echo "Creating initial commit..."
        git commit -m "Initial commit: ${REPO_NAME}"
    fi
    
    # Push commits if in git repo with remote
    if $IN_GIT_REPO && $ADD_REMOTE && git remote get-url origin > /dev/null 2>&1; then
        echo ""
        if ! $SKIP_CONFIRM; then
            read -p "Push commits to the new repository? (y/n): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push -u origin main || git push -u origin master || echo "Note: You may need to push manually with the correct branch name"
            fi
        else
            echo "Pushing commits..."
            git push -u origin main || git push -u origin master || echo "Note: You may need to push manually with the correct branch name"
        fi
    fi
else
    echo "Error: Failed to create repository"
    exit 1
fi
