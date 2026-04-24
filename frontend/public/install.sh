#!/usr/bin/env bash

set -e

echo "[Backport] Installing Backport CLI..."

# Ensure ~/.backport exists
mkdir -p ~/.backport

# Download the standalone JS file
curl -sSL https://backport.in/cli.js -o ~/.backport/cli.js

# Create the executable wrapper
echo '#!/usr/bin/env node' > ~/.backport/backport
cat ~/.backport/cli.js >> ~/.backport/backport
chmod +x ~/.backport/backport

# Setup the global path mapping
if [ -d "$HOME/.local/bin" ]; then
    ln -sf ~/.backport/backport ~/.local/bin/backport
    echo "[Backport] Successfully installed to ~/.local/bin/backport"
elif [ -d "/usr/local/bin" ]; then
    ln -sf ~/.backport/backport /usr/local/bin/backport
    echo "[Backport] Successfully installed to /usr/local/bin/backport"
else
    # Fallback to creating a symlink in a commonly used bin directory
    sudo ln -sf ~/.backport/backport /usr/bin/backport || echo "[Backport] Warning: Could not symlink to /usr/bin. You may need to add ~/.backport/backport to your PATH manually."
fi

echo ""
echo "=========================================="
echo "    Backport CLI Installed Successfully!   "
echo "=========================================="
echo "Run 'backport init' to get started."
echo ""
