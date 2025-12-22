.PHONY: help install dev build preview clean clean-all lint format

# Default target
help:
	@echo "Photo Picker - Makefile Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install     Install dependencies"
	@echo "  dev         Start development server"
	@echo "  build       Build for production"
	@echo "  preview     Preview production build"
	@echo "  lint        Run ESLint"
	@echo "  format      Format code"
	@echo "  clean       Remove build artifacts"
	@echo "  clean-all   Remove build artifacts and dependencies"

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Run linter
lint:
	npm run lint

# Format code (if you add prettier later)
format:
	@echo "No formatter configured yet. Consider adding Prettier."

# Clean build artifacts
clean:
	rm -rf dist/
	rm -rf .cache/
	find . -name ".DS_Store" -type f -delete
	@echo "Build artifacts cleaned"

# Clean everything including node_modules
clean-all: clean
	rm -rf node_modules/
	rm -f package-lock.json
	@echo "All artifacts and dependencies removed"
