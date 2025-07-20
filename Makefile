.PHONY: help dev build clean install test format check

help: ## Show this help message
	@echo "nuCMS Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development servers (backend + frontend)
	@echo "Starting development servers..."
	@./scripts/shoreman.sh

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	@cd backend && npm install
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

build: ## Build frontend for production
	@echo "Building frontend..."
	@cd frontend && npm run build

test: ## Run tests
	@echo "Running backend tests..."
	@cd backend && npm test
	@echo "Running frontend tests..."
	@cd frontend && npm test

format: ## Format code
	@echo "Formatting backend code..."
	@cd backend && npm run format
	@echo "Formatting frontend code..."
	@cd frontend && npm run format

check: ## Run linting and type checking
	@echo "Checking backend code..."
	@cd backend && npm run lint
	@echo "Checking frontend code..."
	@cd frontend && npm run lint

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf frontend/dist/
	@rm -rf frontend/node_modules/.cache/
	@rm -f dev.log
	@rm -f /tmp/shoreman.lock

setup: install ## Set up development environment
	@echo "Setting up development environment..."
	@echo "Creating database and admin user..."
	@cd backend && npm run setup

logs: ## Show development logs
	@tail -f dev.log

kill-dev: ## Kill any running development processes
	@pkill -f "uvicorn main:app" || true
	@pkill -f "webpack serve" || true
	@rm -f /tmp/shoreman.lock
	@echo "Development processes stopped"