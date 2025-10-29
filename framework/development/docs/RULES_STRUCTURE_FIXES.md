# Rules Structure Fixes - Prevention Guide

## Issues Fixed

### 1. **Incorrect Rules Source Path**
**Problem**: Deployment scripts were reading from `.cursor/rules/` instead of `framework/external/rules/`

**Files Fixed**:
- `framework/development/scripts/deploy-framework.js`
- `framework/development/deployment/scripts/deploy-framework.js`

**Change**: Now reads from `framework/external/rules/` which is the source of truth

### 2. **Nested Directory Structure**
**Problem**: `pull-framework.js` was creating nested `.cursor/rules/` directories: `rules/purpose/.cursor/rules/file.mdc`

**File Fixed**: `framework/development/scripts/pull-framework.js`

**Change**: Now creates correct structure: `rules/purpose/file.mdc`

### 3. **Invalid Content Validation**
**Problem**: Downloaded rules could contain API documentation instead of actual rule content

**File Fixed**: `framework/development/scripts/setup-wizard.js`

**Change**: Added validation to check:
- Content is not empty
- Content doesn't contain "Rules Framework API"
- Content has proper frontmatter (`---`)

## Correct Structure

### Rules Source (for deployment)
```
framework/external/rules/
├── core/
│   ├── workflow.mdc
│   ├── code-hygiene.mdc
│   ├── engineering-practices.mdc
│   └── repo-creation.mdc
├── backend/
│   └── api-guidelines.mdc
├── docs/
│   ├── documentation.mdc
│   └── data-quality.mdc
├── testing/
│   └── testing.mdc
└── ci-cd/
    └── github.mdc
```

### Rules Installation (in projects)
```
.cursor/rules/
├── core/
│   ├── workflow.mdc
│   ├── code-hygiene.mdc
│   ├── engineering-practices.mdc
│   └── repo-creation.mdc
├── backend/
│   └── api-guidelines.mdc
├── docs/
│   ├── documentation.mdc
│   └── data-quality.mdc
├── testing/
│   └── testing.mdc
└── ci-cd/
    └── github.mdc
```

## Prevention Checklist

When modifying scripts that handle rules:

- [ ] **Deployment scripts** read from `framework/external/rules/` (not `.cursor/rules/`)
- [ ] **Pull scripts** create structure `rules/purpose/file.mdc` (not `rules/purpose/.cursor/rules/file.mdc`)
- [ ] **Download scripts** validate content before saving:
  - [ ] Content is not empty
  - [ ] Content doesn't contain "Rules Framework API"
  - [ ] Content has frontmatter (`---`)
- [ ] **Only `.mdc` files** are uploaded/deployed (skip README, docs, etc.)
- [ ] **No nested `.cursor/rules/` directories** are created

## Testing

After deployment, verify:

1. **Rules are uploaded correctly to R2**:
   ```bash
   wrangler r2 object list rules-framework-files --prefix rules/
   ```

2. **Rules can be downloaded correctly**:
   ```bash
   curl -s https://rules-framework.mikehenken.workers.dev/rules/core/workflow.mdc | head -5
   ```
   Should show frontmatter, not API documentation

3. **Setup wizard downloads correctly**:
   ```bash
   cd test-project
   curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash
   ```
   Check `.cursor/rules/` structure is correct

## Files Modified

1. `framework/development/scripts/deploy-framework.js` - Fixed source path
2. `framework/development/deployment/scripts/deploy-framework.js` - Fixed source path
3. `framework/development/scripts/pull-framework.js` - Fixed directory structure
4. `framework/development/scripts/setup-wizard.js` - Added content validation

## Key Principles

1. **Single Source of Truth**: `framework/external/rules/` is the only source for deployment
2. **Correct Structure**: Rules install to `.cursor/rules/purpose/file.mdc` (no nested dirs)
3. **Content Validation**: Always validate downloaded content before saving
4. **Filter Files**: Only deploy `.mdc` files, skip documentation files

