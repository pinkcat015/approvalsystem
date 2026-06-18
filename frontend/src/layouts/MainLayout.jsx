import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Popover, List, message, notification } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { notificationApi } from '../api/requests'
import { Client } from '@stomp/stompjs'

const { Header, Sider, Content } = Layout

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/api/ws`;

    const stompClient = new Client({
      brokerURL: socketUrl,
      reconnectDelay: 5000,
      onConnect: () => {
        stompClient.subscribe(`/user/queue/notifications`, (message) => {
          if (message.body) {
            const notif = JSON.parse(message.body);
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
            notification.info({
              message: notif.title,
              description: notif.content,
              placement: 'topRight'
            });
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await notificationApi.getAll()
      setNotifications(list)
      const count = await notificationApi.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Lỗi tải thông báo:', error)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error(error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      message.success('Đã đánh dấu đọc tất cả thông báo')
    } catch (error) {
      console.error(error)
    }
  }

  const notificationContent = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontWeight: 700 }}>Thông báo</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead} style={{ padding: 0 }}>
            Đọc tất cả
          </Button>
        )}
      </div>
      <List
        size="small"
        dataSource={notifications}
        style={{ overflowY: 'auto', maxHeight: 300 }}
        renderItem={item => (
          <List.Item
            onClick={() => {
              handleMarkAsRead(item.id)
              if (item.requestId) {
                navigate(`/requests/${item.requestId}`)
              }
            }}
            style={{
              cursor: 'pointer',
              background: item.read ? 'transparent' : '#f0fdf4',
              padding: '8px 12px',
              borderRadius: 4,
              marginBottom: 4,
              transition: 'background 0.2s'
            }}
          >
            <List.Item.Meta
              title={<span style={{ fontWeight: item.read ? 600 : 800, fontSize: 13 }}>{item.title}</span>}
              description={<span style={{ fontSize: 12 }}>{item.content}</span>}
            />
          </List.Item>
        )}
        locale={{ emptyText: 'Không có thông báo nào' }}
      />
    </div>
  )

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan' },
    { key: '/requests', icon: <FileTextOutlined />, label: 'Yêu cầu của tôi' },
    { key: '/approvals', icon: <CheckSquareOutlined />, label: 'Chờ duyệt' },
    { key: '/delegations', icon: <BranchesOutlined />, label: 'Ủy quyền' }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
            >
              <Badge count={unreadCount} overflowCount={99} size="small" style={{ backgroundColor: '#ff4d4f' }}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 20, color: '#ffffff' }} />}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                />
              </Badge>
            </Popover>

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
          </div>
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