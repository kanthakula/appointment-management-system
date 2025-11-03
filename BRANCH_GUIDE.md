# 🌿 Git Branch Guide

## Branch Structure

### 📦 **main** (Production/Stable)
- **Purpose**: Production-ready, stable codebase
- **Status**: ✅ Current stable version
- **Last commit**: Backup with AI integration plans

### 🔒 **backup/pre-ai-integration** (Safety Backup)
- **Purpose**: Backup of codebase before AI integration work
- **Status**: ✅ Safely stored - do not modify
- **Use**: Reference point if you need to revert

### 🚀 **feature/ai-integration** (Active Development)
- **Purpose**: Working branch for AI/ML/LLM integrations
- **Status**: ✅ **CURRENT BRANCH** - Active development
- **Use**: All AI integration work happens here

---

## Current Status

✅ **Backup created**: `backup/pre-ai-integration`  
✅ **AI branch created**: `feature/ai-integration`  
✅ **Currently on**: `feature/ai-integration` branch

---

## Common Git Commands

### View all branches
```bash
git branch -a
```

### Switch branches
```bash
# Switch to main (production)
git checkout main

# Switch to AI integration branch
git checkout feature/ai-integration

# Switch to backup branch
git checkout backup/pre-ai-integration
```

### Compare branches
```bash
# See differences between main and AI branch
git diff main..feature/ai-integration

# See what files changed
git diff --name-only main..feature/ai-integration
```

### Save your AI work
```bash
# When working on feature/ai-integration branch
git add .
git commit -m "Add: AI feature description"
git push origin feature/ai-integration
```

### Merge AI work back to main (when ready)
```bash
# Switch to main
git checkout main

# Merge AI integration
git merge feature/ai-integration

# Push to remote
git push origin main
```

### Revert to backup (if needed)
```bash
# Switch to backup branch
git checkout backup/pre-ai-integration

# Create new branch from backup
git checkout -b recovery-from-backup
```

---

## Workflow Recommendation

1. **Develop AI features** on `feature/ai-integration` branch
2. **Test thoroughly** before merging
3. **Merge to main** when stable
4. **Keep backup** branch untouched (safety net)

---

## Branch Protection Tips

- ⚠️ **Never** delete `backup/pre-ai-integration` branch
- ✅ Always commit frequently when developing
- ✅ Push to remote regularly for cloud backup
- ✅ Test on feature branch before merging to main

---

**Created**: 2025-11-02  
**Last Updated**: 2025-11-02

