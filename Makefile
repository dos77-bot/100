build:
	@echo "Snake resources are ready in 100%/Shared (App)/Resources"

run:
	@echo "Serving Snake at http://127.0.0.1:8000"
	@python3 -m http.server 8000 --directory "100%/Shared (App)/Resources"
