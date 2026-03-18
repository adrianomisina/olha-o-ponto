import { test, expect } from '@playwright/test';

async function dismissDialogs(page: import('@playwright/test').Page) {
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
}

test('admin and employee critical navigation flows render without visible breakage', async ({ page }) => {
  await dismissDialogs(page);

  const stamp = Date.now();
  const adminEmail = `nav.admin.${stamp}@example.com`;
  const employeeEmail = `nav.employee.${stamp}@example.com`;

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /crie sua conta/i })).toBeVisible();

  await page.getByPlaceholder('Minha Empresa LTDA').fill('Navegacao Corp');
  await page.getByPlaceholder('Nome completo').fill('Admin Navegacao');
  await page.getByPlaceholder('seu@email.com').fill(adminEmail);
  await page.locator('input[type="password"]').nth(0).fill('Senha123!');
  await page.locator('input[type="password"]').nth(1).fill('Senha123!');
  await page.getByRole('button', { name: /iniciar teste grátis/i }).click();

  await page.waitForURL(/\/admin\/checkout\?plan=/);
  await expect(page.getByRole('heading', { name: /resumo do plano/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /pagamento/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /confirmar e iniciar teste/i })).toBeVisible();

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: /visão geral/i })).toBeVisible();

  await page.goto('/admin/employees');
  await expect(page.getByRole('heading', { name: /equipe/i })).toBeVisible();
  await expect(page.getByPlaceholder('Buscar funcionários...')).toBeVisible();

  await page.getByRole('button', { name: /adicionar/i }).click();
  await page.getByPlaceholder('Nome Completo').fill('Funcionario Navegacao');
  await page.getByPlaceholder('Email').fill(employeeEmail);
  await page.getByPlaceholder('Senha Provisória').fill('Senha123!');
  await page.getByPlaceholder('Cargo').fill('Operador');
  await page.getByPlaceholder('Departamento').fill('Ponto');
  await page.getByRole('button', { name: /^salvar$/i }).click();

  await expect(page.getByText('Funcionário adicionado com sucesso!')).toBeVisible();
  await expect(page.getByText(employeeEmail)).toBeVisible();

  await page.goto('/admin/reports');
  await expect(page.getByRole('heading', { name: /relatórios/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^filtrar$/i })).toBeVisible();
  await expect(page.getByText(/atividade nos últimos dias/i)).toBeVisible();

  await page.goto('/admin/approvals');
  await expect(page.getByRole('heading', { name: /aprovações de ponto/i })).toBeVisible();
  await expect(page.getByText(/solicitações de acesso/i)).toBeVisible();

  await page.goto('/admin/payments');
  await expect(page.getByRole('heading', { name: /histórico de pagamentos/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /simular pagamento/i })).toBeVisible();
  await page.getByRole('button', { name: /simular pagamento/i }).click();
  await expect(page.getByText(/simulação de pagamento enviada|pagamento simulado com sucesso/i)).toBeVisible();

  await page.goto('/admin/settings');
  await expect(page.getByRole('heading', { name: /configurações da empresa/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /salvar configurações/i })).toBeVisible();

  await page.goto('/login');
  await page.getByRole('button', { name: /funcionário/i }).click();
  await page.locator('#email').fill(employeeEmail);
  await page.locator('#password').fill('Senha123!');
  await page.getByRole('button', { name: /^entrar$/i }).click();

  await page.waitForURL(/\/app$/);
  await expect(page.getByRole('heading', { name: /página inicial/i })).toBeVisible();
  await expect(page.getByText(/horas trabalhadas/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /solicitar ajuste/i })).toBeVisible();

  await page.goto('/app/history');
  await expect(page.getByRole('heading', { name: /histórico/i })).toBeVisible();

  await page.goto('/app/adjustments');
  await expect(page.getByRole('heading', { name: /ajustes de ponto/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /novo ajuste/i })).toBeVisible();

  await page.goto('/app/todos');
  await expect(page.getByRole('heading', { name: /minhas tarefas/i })).toBeVisible();

  const layoutChecks = [
    page.locator('body'),
    page.getByRole('heading', { name: /minhas tarefas/i }),
  ];

  for (const locator of layoutChecks) {
    await expect(locator).toBeVisible();
  }
});
