# 🐛 E2E Test Failures - Root Cause Analysis

## 📊 Current Status
- **Total Tests:** 104
- **Failed:** 100 
- **Passed:** 4
- **Success Rate:** 3.8%

## 🎯 Root Cause

### Problem 1: Login Endpoint Mismatch
**Location:** `backend/test/billing-catalog-flow.e2e-spec.ts` (line 14-19, 33)

**Issue:** Test sends `email` but AuthService expects `username`

```typescript
// ❌ WRONG - Test Code (line 14-19)
const USERS = {
  admin: { email: 'admin@clinic.local', password: 'Admin@123456' },
  //      ^^^^^ using email
};

// ✅ CORRECT - AuthService.login() (auth.service.ts:37-38)
async login(dto: LoginDto) {
  const user = await this.prisma.user.findUnique({
    where: { username: dto.username },  // expects username
  });
}
```

### Problem 2: Wrong HTTP Status Code
**Expected by Test:** 201 (Created)
**Actual Response:** 400 (Bad Request) / 200 (OK if successful)

**Issue:** Login endpoint should return 200, not 201
- 201 "Created" is for resource creation (POST /users)
- 200 "OK" is for successful authentication (POST /auth/login)

### Problem 3: Missing Username in Seed Data
**Location:** `backend/prisma/seed.ts`

**Issue:** Seed creates users WITHOUT username field
```typescript
// ❌ WRONG - Current seed.ts
const adminUser = await prisma.user.upsert({
  where: { email: 'admin@clinic.local' },
  create: {
    email: 'admin@clinic.local',
    // ❌ MISSING: username field
  },
});
```

---

## ✅ Solutions

### Fix 1: Update Seed Data - Add `username` Field

**File:** `backend/prisma/seed.ts` (Lines 47-55)

```typescript
// Add username for each user
const adminUser = await prisma.user.upsert({
  where: { email: 'admin@clinic.local' },
  update: {},
  create: {
    username: 'admin',           // ✅ ADD THIS
    email: 'admin@clinic.local',
    fullName: 'System Admin',
    passwordHash: await bcrypt.hash('Admin@123456', 10),
  },
});

const doctorUser = await prisma.user.upsert({
  where: { email: 'doctor@clinic.local' },
  update: {},
  create: {
    username: 'doctor',          // ✅ ADD THIS
    email: 'doctor@clinic.local',
    fullName: 'Bác sĩ Demo',
    passwordHash: await bcrypt.hash('Doctor@123456', 10),
  },
});

// ... same for other users
```

### Fix 2: Update E2E Tests - Use `username` Instead of `email`

**File:** `backend/test/billing-catalog-flow.e2e-spec.ts` (Lines 14-19)

```typescript
// ❌ WRONG
const USERS = {
  admin: { email: 'admin@clinic.local', password: 'Admin@123456' },
  doctor: { email: 'doctor@clinic.local', password: 'Doctor@123456' },
  // ...
};

async function login(app, email, password) {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/login`)
    .send({ email, password })      // ❌ WRONG FIELD
    .expect(201);                   // ❌ WRONG STATUS CODE
}

// ✅ CORRECT
const USERS = {
  admin: { username: 'admin', password: 'Admin@123456' },
  doctor: { username: 'doctor', password: 'Doctor@123456' },
  cashier: { username: 'cashier', password: 'Cashier@123456' },
  manager: { username: 'manager', password: 'Manager@123456' },
  receptionist: { username: 'receptionist', password: 'Reception@123456' },
};

async function login(app, username, password) {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/login`)
    .send({ username, password })   // ✅ USE USERNAME
    .expect(200);                   // ✅ CORRECT STATUS CODE
  return res.body.accessToken as string;
}
```

Also update all login calls in tests:
```typescript
// ❌ WRONG
adminToken = await login(app, USERS.admin.email, USERS.admin.password);

// ✅ CORRECT
adminToken = await login(app, USERS.admin.username, USERS.admin.password);
```

### Fix 3: Update Auth Controller - Return 200 Instead of 201

**File:** `backend/src/modules/auth/auth.controller.ts` (Lines 19-23)

```typescript
// Optional: If you want explicit status code
import { HttpCode } from '@nestjs/common';

@Post('login')
@HttpCode(200)  // ✅ ADD THIS
@ApiOperation({ summary: 'Đăng nhập' })
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

---

## 🔧 Implementation Steps

1. **Update seed.ts** - Add `username` field to all 5 users
2. **Reseed database** - Run `npm run prisma:seed`
3. **Update billing-catalog-flow.e2e-spec.ts** - Change `email` to `username`, `201` to `200`
4. **Update other E2E files** - Apply same changes to:
   - `auth.e2e-spec.ts`
   - `clinic-flow.e2e-spec.ts`
5. **Run tests again** - `npm run test:e2e`

---

## 📋 Files to Modify

| File | Line | Change | Priority |
|------|------|--------|----------|
| `seed.ts` | 47-100 | Add `username` field | 🔴 HIGH |
| `billing-catalog-flow.e2e-spec.ts` | 14-33 | email→username, 201→200 | 🔴 HIGH |
| `auth.e2e-spec.ts` | ? | Same changes | 🔴 HIGH |
| `clinic-flow.e2e-spec.ts` | ? | Same changes | 🔴 HIGH |
| `auth.controller.ts` | 19-23 | Add @HttpCode(200) | 🟡 MEDIUM |

---

## ✔️ Expected Outcome

After fixes:
- ✅ All E2E tests should pass (or show real business logic errors)
- ✅ Login returns 200 OK
- ✅ Users have username field
- ✅ Database is properly seeded

---

**Next Step:** Ready to apply these fixes? Start with seed.ts!
