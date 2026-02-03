#!/usr/bin/env bash
set -euo pipefail

# Run backend Jest tests, then frontend unit + e2e tests.
npm --prefix backend test -- --runInBand
npm --prefix frontend run test:all
