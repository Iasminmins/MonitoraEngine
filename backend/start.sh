#!/bin/bash
# Railway startup script
exec python -m uvicorn main_simple:app --host 0.0.0.0 --port "${PORT:-8080}"
