import { AppShell, Group, NavLink, Title } from '@mantine/core'
import { Navigate, NavLink as RouterLink, Route, Routes, useLocation } from 'react-router'
import { EditEmployeePage } from './employees/EditEmployeePage.tsx'
import { EmployeeDetailPage } from './employees/EmployeeDetailPage.tsx'
import { EmployeesPage } from './employees/EmployeesPage.tsx'
import { NewEmployeePage } from './employees/NewEmployeePage.tsx'
import { InsightsPage } from './insights/InsightsPage.tsx'

const NAV_ITEMS = [
  { to: '/employees', label: 'Employees' },
  { to: '/insights', label: 'Insights' },
]

export default function App() {
  const { pathname } = useLocation()

  return (
    <AppShell header={{ height: 56 }} navbar={{ width: 200, breakpoint: 'sm' }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg">
          <Title order={1} size="h3">
            Salary Management
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            component={RouterLink}
            to={item.to}
            label={item.label}
            active={pathname.startsWith(item.to)}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/new" element={<NewEmployeePage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}
