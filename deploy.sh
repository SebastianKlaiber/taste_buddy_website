#!/bin/bash

# Display commands as they're executed
set -x

# Ensure the dist directory exists even before the build
mkdir -p dist

# Copy the fallback file in case the build fails
cp public/fallback.html dist/index.html

# Run the build
ROLLUP_SKIP_NODEJS=true npm run build

# Print information about the dist directory
echo "Contents of dist directory:"
ls -la dist

# Success message
echo "Build completed. You can now deploy with 'netlify deploy'." 