.PHONY: help install dev build preview clean clean-all lint format check

# Color definitions for better readability
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
RESET  := \033[0m

# Default target
help:
	@echo "$(GREEN)Photo Picker - Makefile Commands$(RESET)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "$(GREEN)Development:$(RESET)"
	@echo "  install     Install dependencies"
	@echo "  dev         Start development server"
	@echo "  build       Build for production"
	@echo "  preview     Preview production build"
	@echo ""
	@echo "$(GREEN)Code Quality:$(RESET)"
	@echo "  lint        Run ESLint"
	@echo "  format      Format code (placeholder)"
	@echo "  check       Run all checks (lint + build)"
	@echo ""
	@echo "$(GREEN)Cleanup:$(RESET)"
	@echo "  clean       Remove build artifacts and macOS junk"
	@echo "  clean-all   $(YELLOW)[DANGEROUS]$(RESET) Remove everything including node_modules"

# Install dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(RESET)"
	@npm install && echo "$(GREEN)✓ Dependencies installed$(RESET)"

# Start development server
dev:
	@echo "$(GREEN)Starting development server...$(RESET)"
	@npm run dev

# Build for production
build:
	@echo "$(GREEN)Building for production...$(RESET)"
	@npm run build && echo "$(GREEN)✓ Build completed$(RESET)"

# Preview production build
preview:
	@echo "$(GREEN)Previewing production build...$(RESET)"
	@npm run preview

# Run linter
lint:
	@echo "$(GREEN)Running ESLint...$(RESET)"
	@npm run lint && echo "$(GREEN)✓ Linting passed$(RESET)" || (echo "$(RED)✗ Linting failed$(RESET)" && exit 1)

# Format code (if you add prettier later)
format:
	@echo "$(YELLOW)No formatter configured yet. Consider adding Prettier.$(RESET)"

# Run all checks
check: lint build
	@echo "$(GREEN)✓ All checks passed$(RESET)"

# Clean build artifacts and system junk files
clean:
	@echo "$(YELLOW)Cleaning build artifacts and system files...$(RESET)"
	@rm -rf dist/ 2>/dev/null || true
	@rm -rf .cache/ 2>/dev/null || true
	@find . -name ".DS_Store" -type f -delete 2>/dev/null || true
	@find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
	@find . -name "._*" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Build artifacts cleaned$(RESET)"

# Clean everything including node_modules (requires confirmation)
clean-all:
	@echo "$(RED)⚠️  WARNING: This will delete:$(RESET)"
	@echo "  - dist/"
	@echo "  - .cache/"
	@echo "  - node_modules/"
	@echo "  - package-lock.json"
	@echo "  - All .DS_Store and Thumbs.db files"
	@echo ""
	@echo -n "$(YELLOW)Are you sure? [y/N]: $(RESET)" && read ans && [ $${ans:-N} = y ] || (echo "$(GREEN)Aborted.$(RESET)" && exit 1)
	@echo "$(YELLOW)Removing all artifacts and dependencies...$(RESET)"
	@rm -rf dist/ .cache/ node_modules/ 2>/dev/null || true
	@rm -f package-lock.json 2>/dev/null || true
	@find . -name ".DS_Store" -type f -delete 2>/dev/null || true
	@find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
	@find . -name "._*" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✓ All artifacts and dependencies removed$(RESET)"
	@echo "$(YELLOW)Run 'make install' to reinstall dependencies$(RESET)"
