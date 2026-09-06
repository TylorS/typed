#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TOPO_ORDER=(
  # Level 0: no @typed/* dependencies
  packages/async-data
  packages/fx
  packages/guard
  packages/id
  packages/tsconfig
  # Level 1: depend only on level 0
  packages/navigation
  packages/template
  # Level 2
  packages/router
  # Level 3
  packages/react
  packages/svelte
  packages/vue
  packages/ui
  # Level 4: integrates Template and UI with Astro
  packages/astro
)

package_field() {
  node -p "require('./$1/package.json').$2"
}

is_published() {
  npm view "$1@$2" version --json >/dev/null 2>&1
}

echo -e "${CYAN}=== Typed beta publish ===${NC}"
echo ""

echo -e "${YELLOW}Step 1: Verifying npm authentication...${NC}"
NPM_USER=$(npm whoami 2>&1) || {
  echo -e "${RED}Not logged into npm.${NC}"
  echo "Run: npm login"
  exit 1
}
echo -e "  Logged in as: ${GREEN}${NPM_USER}${NC}"
echo ""

echo -e "${YELLOW}Step 2: Preparing one retry-safe beta version...${NC}"
published_count=0
unpublished_count=0
beta_number=""

for dir in "${TOPO_ORDER[@]}"; do
  name=$(package_field "$dir" name)
  version=$(package_field "$dir" version)
  current_beta=${version##*-beta.}

  if [[ "$version" != *-beta.* || ! "$current_beta" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}$name has unsupported release version $version; expected x.y.z-beta.N${NC}"
    exit 1
  fi
  if [[ -n "$beta_number" && "$current_beta" != "$beta_number" ]]; then
    echo -e "${RED}Package beta numbers are not aligned ($beta_number and $current_beta).${NC}"
    exit 1
  fi
  beta_number="$current_beta"

  if is_published "$name" "$version"; then
    ((published_count += 1))
  else
    ((unpublished_count += 1))
  fi
done

if (( published_count == ${#TOPO_ORDER[@]} )); then
  for dir in "${TOPO_ORDER[@]}"; do
    name=$(package_field "$dir" name)
    old_version=$(package_field "$dir" version)
    (cd "$dir" && npm version prerelease --preid=beta --no-git-tag-version >/dev/null)
    new_version=$(package_field "$dir" version)
    printf "  %-45s %s -> %s\n" "$name" "$old_version" "$new_version"
  done
elif (( unpublished_count == ${#TOPO_ORDER[@]} )); then
  echo "  Current package versions are unpublished; keeping beta.${beta_number}."
else
  echo -e "  ${YELLOW}Detected a partial previous publish; keeping beta.${beta_number} and resuming.${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Building all packages...${NC}"
pnpm build
echo -e "${GREEN}  Build complete.${NC}"
echo ""

echo -e "${YELLOW}Step 4: Verifying publish tarballs...${NC}"
for dir in "${TOPO_ORDER[@]}"; do
  name=$(package_field "$dir" name)
  version=$(package_field "$dir" version)
  output=$(cd "$dir" && pnpm publish --dry-run --tag beta --access public --no-git-checks 2>&1)
  if ! grep -q "Skip publishing .* (dry run)" <<<"$output"; then
    echo -e "${RED}Dry run failed for $name@$version${NC}"
    echo "$output"
    exit 1
  fi
  printf "  %-45s %s\n" "$name" "$version"
done
echo ""

echo -e "${YELLOW}Step 5: Publishing (tag=beta)...${NC}"
PUBLISHED=()
SKIPPED=()
STAGED=()

for dir in "${TOPO_ORDER[@]}"; do
  name=$(package_field "$dir" name)
  version=$(package_field "$dir" version)
  printf "  Publishing %-45s ... " "$name@$version"

  if is_published "$name" "$version"; then
    echo -e "${YELLOW}SKIP (already published)${NC}"
    SKIPPED+=("$name@$version")
    continue
  fi

  publish_log=$(mktemp)
  if (cd "$dir" && pnpm publish --tag beta --access public --no-git-checks 2>"$publish_log"); then
    rm -f "$publish_log"
    echo -e "${GREEN}OK${NC}"
    PUBLISHED+=("$name@$version")
  elif grep -q "previously staged version" "$publish_log"; then
    rm -f "$publish_log"
    echo -e "${YELLOW}STAGED (waiting for registry)${NC}"
    STAGED+=("$name@$version")
  else
    echo -e "${RED}FAILED${NC}"
    sed 's/^/    /' "$publish_log"
    rm -f "$publish_log"
    echo ""
    echo -e "${YELLOW}Re-run this script after resolving the error; it will resume the same beta safely.${NC}"
    exit 1
  fi
done
echo ""

echo -e "${YELLOW}Step 6: Verifying registry beta tags...${NC}"
# New packages can return 404 while the registry finishes staging their first release.
for attempt in {1..12}; do
  all_verified=true
  for dir in "${TOPO_ORDER[@]}"; do
    name=$(package_field "$dir" name)
    version=$(package_field "$dir" version)
    tagged_version=$(npm view "$name" dist-tags.beta --json 2>/dev/null | tr -d '"' || true)
    if [[ "$tagged_version" != "$version" ]]; then
      all_verified=false
    fi
  done
  if [[ "$all_verified" == true ]]; then
    break
  fi
  if (( attempt < 12 )); then
    echo "  Registry staging is still in progress (${attempt}/12); retrying in 5 seconds..."
    sleep 5
  fi
done

for dir in "${TOPO_ORDER[@]}"; do
  name=$(package_field "$dir" name)
  version=$(package_field "$dir" version)
  tagged_version=$(npm view "$name" dist-tags.beta --json 2>/dev/null | tr -d '"' || true)
  if [[ "$tagged_version" != "$version" ]]; then
    echo -e "${RED}$name has beta=$tagged_version; expected $version${NC}"
    exit 1
  fi
  printf "  %-45s %s\n" "$name" "$tagged_version"
done

echo ""
echo -e "${GREEN}Published ${#PUBLISHED[@]} package(s); resumed ${#STAGED[@]} staged and ${#SKIPPED[@]} public package(s).${NC}"
