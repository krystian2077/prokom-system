# Production Branch Protection Checklist

Checklist for enforcing release safety on `main` (and optionally `develop`).

## 1) Prerequisites

- [ ] CI workflows exist and are green on latest commit:
  - [ ] `Backend CI / pytest`
  - [ ] `Frontend CI / build`
- [ ] No flaky checks in the last 10 PRs.
- [ ] Admin access to repository settings confirmed.

## 2) Branch Protection Rules (`main`)

Create/update rule for branch: `main`.

- [ ] **Require a pull request before merging**
  - [ ] Required approvals: `1` (minimum)
  - [ ] Dismiss stale approvals on new commits
  - [ ] Require review from Code Owners (if `CODEOWNERS` is used)
- [ ] **Require status checks to pass before merging**
  - [ ] Mark status checks as **required**:
    - [ ] `Backend CI / pytest`
    - [ ] `Frontend CI / build`
  - [ ] Require branches to be up to date before merging
- [ ] **Require conversation resolution before merging**
- [ ] **Require signed commits** (recommended)
- [ ] **Include administrators** (recommended for strict governance)
- [ ] **Restrict who can push to matching branches**
  - [ ] Direct push to `main` disabled (except emergency maintainers if needed)
- [ ] **Allow force pushes**: disabled
- [ ] **Allow deletions**: disabled

## 3) Merge Strategy

- [ ] Enable only approved merge methods:
  - [ ] Squash merge (recommended)
  - [ ] Merge commit (optional)
  - [ ] Rebase merge (optional)
- [ ] Disable auto-merge until policy is validated (optional during rollout week).

## 4) Rollout Validation

- [ ] Open a test PR to `main` with intentionally failing backend test.
  - [ ] Confirm merge is blocked.
- [ ] Open a test PR to `main` with intentionally failing frontend build.
  - [ ] Confirm merge is blocked.
- [ ] Open a passing PR.
  - [ ] Confirm merge is allowed only after approvals and green checks.

## 5) Operational Guardrails

- [ ] Protect deployment secrets (environment protection rules).
- [ ] Require manual approval for production deploy job (if CD exists).
- [ ] Add incident hotfix path (`hotfix/*` -> PR to `main` still requires checks).

## 6) CSP Report-Only Rollout Companion

- [ ] Set `NEXT_PUBLIC_CSP_REPORT_URI` in production environment (optional but recommended).
- [ ] Aggregate CSP reports for at least 7 days.
- [ ] Triage top violations and create follow-up hardening tasks.
- [ ] Move from `Content-Security-Policy-Report-Only` to enforced `Content-Security-Policy` in controlled release.

