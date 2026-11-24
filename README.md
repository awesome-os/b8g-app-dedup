# b8g-app-dedup

Find duplicate installed apps, hidden Electron copies, and build-cache bloat across your Windows, Linux, and macOS drives — **100% offline and strictly read-only**.

## Key Features
- **Groups Scattered Duplicates:** Finds duplicate copies of the same app across Admin installs, per-user AppData installs, package managers, and old drive backups.
- **41.2 KB Offline Classifier:** Classifies install scope, bloat category, and recommended action in `< 1 ms` per path (`97.62%` held-out accuracy).
- **Active-Learning Proposals:** Ranks the largest unknown folders so you can teach your personal rules in `3 ms`.
- **Safe by Default:** Strictly read-only scanning — never deletes or modifies files.

## Quick Start
```bash
node src/cli.mts train
node src/cli.mts scan
node --test src/app-dedup.test.mts
```

## License
MIT

## Quick Install & Run (Windows / Linux / macOS)

```sh
# Download latest release assets (all platforms)
gh release download -R awesome-os/b8g-app-dedup --dir ./b8g-app-dedup-release

# Or clone source directly (all platforms)
git clone https://github.com/awesome-os/b8g-app-dedup.git && cd b8g-app-dedup
```
