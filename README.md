# 🚨 New Git Commit & Code Format Rules (Please Read)

Hey team! 👋

To keep our codebase clean, consistent, and easier to maintain, we've added **Husky** to automate two important things:

✅ **Code Formatting** — using Prettier + ESLint on staged files before commit
✅ **Commit Message Validation** — using Conventional Commits

---

## 🔧 What You Need to Do (One-Time Setup)

Run these steps **after pulling the latest code**:

```bash
git pull
npm install
npm run prepare
```

This installs all hooks and tools you need locally.

---

## 💡 What Happens Now

- When you run `git commit`, it will:
  - Format and lint your staged files
  - Reject your commit if your message doesn't follow the correct format

---

## ✍️ Conventional Commit Format

Use this pattern for all commit messages:

```
type(scope): short description
```

### Examples:
```bash
feat(login): add Google login support
fix(cart): correct price rounding bug
docs(readme): update API documentation
style(header): fix spacing in logo
```

---

## 📚 Commit Types Cheat Sheet

| Type        | Use when you...                               | Example                                      |
|-------------|-----------------------------------------------|----------------------------------------------|
| `feat`      | Add a new feature                              | `feat(user): add profile page`               |
| `fix`       | Fix a bug                                      | `fix(auth): resolve token refresh bug`       |
| `docs`      | Change documentation only                      | `docs: update README with install steps`     |
| `style`     | Change formatting (no logic)                   | `style(nav): fix indentation`                |
| `refactor`  | Improve code (no bug or feature)               | `refactor(form): simplify input handling`    |
| `test`      | Add/update tests                               | `test(api): add unit tests for auth service` |
| `chore`     | Maintenance tasks (configs, deps, CI)          | `chore: update eslint config`                |

---

## ✅ Best Practices for Commit Messages

- Use **present tense** (e.g., `add`, not `added`)
- Limit to **50 characters** (summary line)
- **Do not end** with a period `.`
- Use the optional body for more details if needed

---

## 🔚 Quick Reference

| Scenario                        | Commit Example                          |
|---------------------------------|------------------------------------------|
| New Feature                     | `feat(dashboard): add activity widget`   |
| Bug Fix                         | `fix(api): correct 500 response format`  |
| Docs Change                     | `docs: add deployment instructions`      |
| Code Refactor                   | `refactor(auth): remove redundant checks`|
| Prettier/Style Update Only      | `style(button): fix tab spacing`         |
| Tooling or Config Change        | `chore: update Husky pre-commit hook`    |

---

> This workflow helps us write better Git history, automate changelogs, and avoid ugly diffs. Let's keep it consistent. 🙌
