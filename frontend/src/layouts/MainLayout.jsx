import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

const { Header, Sider, Content } = Layout

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/requests', icon: <FileTextOutlined />, label: 'Yêu cầu của tôi' },
    { key: '/approvals', icon: <CheckSquareOutlined />, label: 'Chờ duyệt' }
  ]

  // Chỉ Admin mới thấy menu quản trị
  if (user?.role === 'ADMIN') {
    menuItems.push(
      { type: 'divider' },
      { key: '/admin/users', icon: <TeamOutlined />, label: 'Người dùng' },
      { key: '/admin/departments', icon: <ApartmentOutlined />, label: 'Phòng ban' },
      { key: '/admin/request-types', icon: <SettingOutlined />, label: 'Loại yêu cầu' },
      { key: '/admin/workflows', icon: <BranchesOutlined />, label: 'Workflow' }
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f4f6fa' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          background: '#ee0033',
          borderRight: 'none',
          position: 'relative'
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
            margin: 0,
            padding: collapsed ? '0' : '0 16px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            background: '#c40027'
          }}
        >
          {collapsed ? (
            <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 950, fontSize: 22, color: '#ffffff' }}>V</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 950, fontSize: 18, letterSpacing: '0.5px', color: '#ffffff' }}>VIETTEL</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 12, color: '#ffd0d6', borderLeft: '1.5px solid rgba(255, 255, 255, 0.3)', paddingLeft: 6 }}>APPROVAL</span>
            </div>
          )}
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: '#ee0033',
            borderRight: 'none',
            padding: '16px 8px'
          }}
        />
      </Sider>

      <Layout style={{ background: '#f4f6fa' }}>
        <Header
          style={{
            background: '#ee0033',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 64,
            borderBottom: '1px solid #c40027',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', fontFamily: "'Manrope', sans-serif", letterSpacing: '0.2px' }}>
            HỆ THỐNG PHÊ DUYỆT NỘI BỘ
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button
              type="text"
              className="header-user-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 38,
                padding: '4px 12px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff'
              }}
            >
              <Avatar
                icon={<UserOutlined />}
                size="small"
                style={{ backgroundColor: '#ffffff', color: '#ee0033' }}
              />
              <span style={{ fontWeight: 600, color: '#ffffff', fontFamily: "'Manrope', sans-serif" }}>{user?.fullName}</span>
            </Button>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
            border: '1px solid #e9ecef',
            minHeight: 280
          }}
        >
          <div className="fade-in-el">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout