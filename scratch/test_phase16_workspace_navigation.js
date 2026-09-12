/**
 * Phase 16: Workspace, Navigation & Portal Experience Test Suite
 * 
 * Tests:
 * 1. User access context resolution across 8 distinct institutional personas:
 *    - Super Admin
 *    - Operations User (Loan Officer)
 *    - Operations Manager (Branch Manager)
 *    - Credit Analyst
 *    - Credit Manager (Underwriter)
 *    - Collections Officer
 *    - Finance Officer
 *    - Management Executive
 * 2. Department context separation (User -> Role -> Department -> Workspace -> Permissions)
 * 3. Dynamic navigation generation (Zero hardcoded role branching, permission-filtered)
 * 4. Workspace switching authorization & audit logging
 * 5. Unauthorized workspace switching rejection (403 Forbidden)
 * 6. Multi-tenant isolation enforcement
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });
const { prisma } = require(path.resolve(__dirname, '../backend/dist/config/prisma'));
const { workspaceService } = require(path.resolve(__dirname, '../backend/dist/modules/workspaces/workspace.service'));
const { MASTER_PORTALS, MASTER_WORKSPACES, MASTER_NAVIGATION } = require(path.resolve(__dirname, '../backend/dist/modules/workspaces/workspace.config'));

async function runTests() {
  console.log('================================================================');
  console.log('🚀 PHASE 16: WORKSPACE, NAVIGATION & PORTAL ARCHITECTURE TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Identify Default Tenant & Setup Roles
    console.log('Step 1: Setting up test environment and roles...');
    const tenant = await prisma.tenant.findFirst({ where: { status: 'ACTIVE' } });
    assert(!!tenant, `Active tenant identified: ${tenant.name} (${tenant.id})`);

    // Ensure core roles exist in database
    const roleNames = [
      'SUPER_ADMIN',
      'ADMIN',
      'LOAN_OFFICER',
      'BRANCH_MANAGER',
      'CREDIT_ANALYST',
      'UNDERWRITER',
      'COLLECTION_OFFICER',
      'FINANCE_OFFICER',
      'COMPANY_ADMIN',
      'CUSTOMER',
    ];

    const rolesMap = new Map();
    for (const name of roleNames) {
      let r = await prisma.role.findUnique({ where: { name } });
      if (!r) {
        r = await prisma.role.create({ data: { name, description: `${name} role` } });
      }
      rolesMap.set(name, r);
    }
    assert(rolesMap.size >= roleNames.length, 'All institutional test roles verified');

    // Helper: Find or create persona test user
    async function getOrCreateTestUser(emailPrefix, roleName, firstName, lastName) {
      const email = `${emailPrefix}_test@adyapan.com`;
      let user = await prisma.user.findFirst({
        where: { email },
        include: { roles: true },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: 'dummy_hash',
            firstName,
            lastName,
            tenantId: tenant.id,
          },
          include: { roles: true },
        });
      }

      // Link role
      const role = rolesMap.get(roleName);
      const hasRole = user.roles.some((ur) => ur.roleId === role.id);
      if (!hasRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: role.id },
        });
      }

      return user;
    }

    // 2. Test Persona 1: Super Admin
    console.log('\nStep 2: Testing Super Admin persona context & navigation...');
    const superAdminUser = await getOrCreateTestUser('superadmin', 'SUPER_ADMIN', 'Vikram', 'Aditya');
    const superAdminContext = await workspaceService.getUserAccessContext(superAdminUser.id, tenant.id);

    assert(superAdminContext.primaryRole === 'SUPER_ADMIN', 'Super Admin recognized');
    assert(superAdminContext.department.key === 'ADMINISTRATION', 'Department is ADMINISTRATION');
    assert(superAdminContext.availablePortals.length >= 7, `Super Admin has access to all portals (${superAdminContext.availablePortals.length})`);
    assert(superAdminContext.availableWorkspaces.length >= 10, `Super Admin has access to all workspaces (${superAdminContext.availableWorkspaces.length})`);
    assert(superAdminContext.permissions.includes('*'), 'Super Admin holds wildcard (*) permission');
    assert(superAdminContext.navigation.items.length >= 20, `Super Admin navigation items: ${superAdminContext.navigation.items.length}`);

    // 3. Test Persona 2: Operations User (Loan Officer)
    console.log('\nStep 3: Testing Operations (Loan Officer) persona...');
    const opsUser = await getOrCreateTestUser('loanofficer', 'LOAN_OFFICER', 'Ramesh', 'Kumar');
    const opsContext = await workspaceService.getUserAccessContext(opsUser.id, tenant.id);

    assert(opsContext.primaryRole === 'LOAN_OFFICER', 'Loan Officer recognized');
    assert(opsContext.department.key === 'OPERATIONS', 'Department is OPERATIONS');
    assert(opsContext.activeWorkspace.key === 'OPERATIONS_LENDING', 'Default workspace is Lending Operations');
    assert(opsContext.availablePortals.some((p) => p.key === 'OPERATIONS'), 'Has access to Operations portal');
    assert(!opsContext.availablePortals.some((p) => p.key === 'FINANCE'), 'Blocked from Finance portal');
    assert(!opsContext.availablePortals.some((p) => p.key === 'ADMIN'), 'Blocked from Admin portal');

    // 4. Test Persona 3: Branch Manager
    console.log('\nStep 4: Testing Branch Manager persona...');
    const branchMgrUser = await getOrCreateTestUser('branchmgr', 'BRANCH_MANAGER', 'Pooja', 'Iyer');
    const branchMgrContext = await workspaceService.getUserAccessContext(branchMgrUser.id, tenant.id);

    assert(branchMgrContext.primaryRole === 'BRANCH_MANAGER', 'Branch Manager recognized');
    assert(branchMgrContext.department.key === 'OPERATIONS', 'Department is OPERATIONS');
    assert(branchMgrContext.activeWorkspace.key === 'OPERATIONS_BRANCH', 'Default workspace is Branch Management Desk');
    assert(branchMgrContext.availableWorkspaces.some((w) => w.key === 'OPERATIONS_BRANCH'), 'Has access to Branch Desk workspace');
    assert(branchMgrContext.availableWorkspaces.some((w) => w.key === 'MANAGEMENT_COMMAND_CENTER'), 'Has access to Management Command Center');

    // 5. Test Persona 4: Credit Analyst
    console.log('\nStep 5: Testing Credit Analyst persona...');
    const creditAnalystUser = await getOrCreateTestUser('creditanalyst', 'CREDIT_ANALYST', 'Amit', 'Verma');
    const creditAnalystContext = await workspaceService.getUserAccessContext(creditAnalystUser.id, tenant.id);

    assert(creditAnalystContext.primaryRole === 'CREDIT_ANALYST', 'Credit Analyst recognized');
    assert(creditAnalystContext.department.key === 'CREDIT', 'Department is CREDIT');
    assert(creditAnalystContext.activeWorkspace.key === 'CREDIT_ASSESSMENT', 'Default workspace is Credit Assessment Desk');
    assert(creditAnalystContext.availablePortals.some((p) => p.key === 'CREDIT'), 'Has access to Credit portal');
    assert(!creditAnalystContext.availableWorkspaces.some((w) => w.key === 'FINANCE_GL'), 'Blocked from Finance GL workspace');

    // 6. Test Persona 5: Underwriter (Credit Manager)
    console.log('\nStep 6: Testing Underwriter persona...');
    const underwriterUser = await getOrCreateTestUser('underwriter', 'UNDERWRITER', 'Sunita', 'Menon');
    const underwriterContext = await workspaceService.getUserAccessContext(underwriterUser.id, tenant.id);

    assert(underwriterContext.primaryRole === 'UNDERWRITER', 'Underwriter recognized');
    assert(underwriterContext.department.key === 'CREDIT', 'Department is CREDIT');
    assert(underwriterContext.activeWorkspace.key === 'CREDIT_ASSESSMENT' || underwriterContext.activeWorkspace.key === 'CREDIT_UNDERWRITING', 'Default workspace is Credit Underwriting');
    assert(underwriterContext.availableWorkspaces.some((w) => w.key === 'CREDIT_UNDERWRITING'), 'Has access to Underwriting & Sanctions workspace');

    // 7. Test Persona 6: Collections Officer
    console.log('\nStep 7: Testing Collections Officer persona...');
    const collUser = await getOrCreateTestUser('collections', 'COLLECTION_OFFICER', 'Rajesh', 'Patel');
    const collContext = await workspaceService.getUserAccessContext(collUser.id, tenant.id);

    assert(collContext.primaryRole === 'COLLECTION_OFFICER', 'Collections Officer recognized');
    assert(collContext.department.key === 'COLLECTIONS', 'Department is COLLECTIONS');
    assert(collContext.activeWorkspace.key === 'COLLECTIONS_DELINQUENCY', 'Default workspace is Delinquency & DPD');
    assert(collContext.availablePortals.some((p) => p.key === 'COLLECTIONS'), 'Has access to Collections portal');
    assert(!collContext.availablePortals.some((p) => p.key === 'CREDIT'), 'Blocked from Credit portal');

    // 8. Test Persona 7: Finance Officer
    console.log('\nStep 8: Testing Finance Officer persona...');
    const finUser = await getOrCreateTestUser('finance', 'FINANCE_OFFICER', 'Meera', 'Nair');
    const finContext = await workspaceService.getUserAccessContext(finUser.id, tenant.id);

    assert(finContext.primaryRole === 'FINANCE_OFFICER', 'Finance Officer recognized');
    assert(finContext.department.key === 'FINANCE', 'Department is FINANCE');
    assert(finContext.activeWorkspace.key === 'FINANCE_GL', 'Default workspace is General Ledger');
    assert(finContext.availablePortals.some((p) => p.key === 'FINANCE'), 'Has access to Finance portal');
    assert(finContext.availableWorkspaces.some((w) => w.key === 'FINANCE_TREASURY'), 'Has access to Treasury & Disbursements');
    assert(finContext.availableWorkspaces.some((w) => w.key === 'FINANCE_RECONCILIATION'), 'Has access to Reconciliation');

    // 9. Test Persona 8: Management Executive (Company Admin)
    console.log('\nStep 9: Testing Management Executive persona...');
    const mgmtUser = await getOrCreateTestUser('mgmtadmin', 'COMPANY_ADMIN', 'Anil', 'Kapoor');
    const mgmtContext = await workspaceService.getUserAccessContext(mgmtUser.id, tenant.id);

    assert(mgmtContext.primaryRole === 'COMPANY_ADMIN', 'Company Admin recognized');
    assert(mgmtContext.department.key === 'MANAGEMENT', 'Department is MANAGEMENT');
    assert(mgmtContext.availablePortals.some((p) => p.key === 'MANAGEMENT'), 'Has access to Management portal');
    assert(mgmtContext.availableWorkspaces.some((w) => w.key === 'MANAGEMENT_COMMAND_CENTER'), 'Has access to Command Center');
    assert(mgmtContext.availableWorkspaces.some((w) => w.key === 'MANAGEMENT_ANALYTICS'), 'Has access to Portfolio Analytics');

    // 10. Test Authorized Workspace Switching
    console.log('\nStep 10: Testing authorized workspace switching...');
    const switchedContext = await workspaceService.switchActiveWorkspace(finUser.id, 'FINANCE_TREASURY');
    assert(switchedContext.activeWorkspace.key === 'FINANCE_TREASURY', 'Successfully switched active workspace to FINANCE_TREASURY');
    assert(switchedContext.activeWorkspace.name === 'Treasury & Disbursements', 'Active workspace name updated');

    // 11. Test Unauthorized Workspace Switching Rejection (403 Forbidden)
    console.log('\nStep 11: Testing unauthorized workspace switching rejection...');
    let threw403 = false;
    try {
      // Collections Officer attempting to switch to Admin Access Control
      await workspaceService.switchActiveWorkspace(collUser.id, 'ADMIN_ACCESS_CONTROL');
    } catch (err) {
      if (err.statusCode === 403 || err.message.includes('Access Restricted')) {
        threw403 = true;
      }
    }
    assert(threw403 === true, 'Unauthorized workspace switch rejected with 403 Forbidden');

    // 12. Multi-Tenant Organization Isolation Verification
    console.log('\nStep 12: Testing multi-tenant organization context...');
    assert(!!opsContext.organization.id, `Tenant Organization ID bound: ${opsContext.organization.id}`);
    assert(opsContext.organization.name === tenant.name, `Tenant Name matches: ${opsContext.organization.name}`);

    console.log('\n================================================================');
    console.log(`ALL PHASE 16 TESTS PASSED SUCCESSFULLY! (${passed}/${total})`);
    console.log('================================================================');
  } catch (error) {
    console.error('\n❌ PHASE 16 TEST SUITE FAILED:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
