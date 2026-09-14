#!/bin/sh
# Run before every push. Fails if anything private is about to go public.
set -u
cd "$(dirname "$0")/.."
fail=0

command -v pdftotext >/dev/null || { echo "WARN: pdftotext not installed, skipping PDF check"; }

# 1. No phone number in any published PDF.
for pdf in $(git ls-files '*.pdf'); do
  if command -v pdftotext >/dev/null &&
     pdftotext "$pdf" - 2>/dev/null | grep -Eq '\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-][0-9]{4}'; then
    echo "FAIL: $pdf contains a phone number"
    fail=1
  fi
done

# 2. No private working notes in published text files (this script and .gitignore excluded).
if git ls-files | grep -vE '\.pdf$|^tools/prepublish-check\.sh$|^\.gitignore$' |
   xargs grep -nIiE 'double-blind|under review|braindump|local\.md'; then
  echo "FAIL: private notes found in the tracked files above"
  fail=1
fi

# 3. Palette still meets WCAG AA.
python3 tools/check-contrast.py >/dev/null || { echo "FAIL: contrast check"; fail=1; }

[ "$fail" -eq 0 ] && echo "OK: safe to push"
exit "$fail"
