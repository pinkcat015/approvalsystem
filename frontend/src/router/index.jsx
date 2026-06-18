import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import MyRequestsPage from '../pages/MyRequestsPage'
import NewRequestPage from '../pages/NewRequestPage'
import RequestDetailPage from '../pages/RequestDetailPage'
import PendingApprovalsPage from '../pages/PendingApprovalsPage'
import UserManagementPage from '../pages/admin/UserManagementPage'
import DepartmentPage from '../pages/admin/DepartmentPage'
import WorkflowPage from '../pages/admin/WorkflowPage'
import RequestTypePage from '../pages/admin/RequestTypePage'
import MainLayout from '../layouts/MainLayout'
import DelegationPage from '../pages/DelegationPage'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'requests', element: <MyRequestsPage /> },
      { path: 'requests/new', element: <NewRequestPage /> },
      { path: 'requests/:id/edit', element: <NewRequestPage /> },
      { path: 'requests/:id', element: <RequestDetailPage /> },
      { path: 'approvals', element: <PendingApprovalsPage /> },
      { path: 'delegations', element: <DelegationPage /> },
      { path: 'admin/users', element: <UserManagementPage /> },
      { path: 'admin/departments', element: <DepartmentPage /> },
      { path: 'admin/request-types', element: <RequestTypePage /> },
      { path: 'admin/workflows', element: <WorkflowPage /> }
    ]
  }
])

export default router