import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  ApartmentOutlined,
  DeploymentUnitOutlined,
  OrderedListOutlined
} from '@ant-design/icons'
import { requestApi } from '../api/requests'
import { dashboardApi } from '../api/admin'
import { useAuthStore } from '../store/authStore'

function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    admin: false,
    totalUsers: 0,
    totalDepartments: 0,
    totalWorkflows: 0,
    totalRequests: 0,
    draftRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  })

  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      if (isAdmin) {
        const res = await dashboardApi.getStats()
        setStats({ ...res, admin: true })
      } else {
        const res = await requestApi.getMyRequests({ size: 100 })
        const list = res.content || []
        setStats({
          admin: false,
          totalUsers: 0,
          totalDepartments: 0,
          totalWorkflows: 0,
          totalRequests: list.length,
          draftRequests: list.filter((r) => r.status === 'DRAFT').length,
          pendingRequests: list.filter((r) => r.status === 'IN_PROGRESS').length,
          approvedRequests: list.filter((r) => r.status === 'APPROVED').length,
          rejectedRequests: list.filter((r) => r.status === 'REJECTED').length
        })
      }
    } catch (error) {
      console.error('Lỗi tải thống kê:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(238, 0, 51, 0.55) 0%, rgba(196, 0, 39, 0.6) 100%), url("https://media.vneconomy.vn/images/upload/2024/07/15/screenshot-2024-07-15-at-15-09-51.png?w=1200")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 12,
          marginBottom: 32,
          boxShadow: '0 4px 15px rgba(238, 0, 51, 0.15)',
          overflow: 'hidden',
          padding: '48px 48px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 24,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}
          >
            <InfoCircleOutlined />
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <h2 className="cake-title" style={{ margin: 0, color: '#ffffff', fontSize: 26, fontWeight: 700 }}>
              Chào mừng {user?.fullName || 'bạn'} đến với Viettel Approval System
            </h2>
            <p style={{ margin: '8px 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
              {isAdmin 
                ? 'Khu vực quản trị dành cho Quản trị viên hệ thống. Hỗ trợ giám sát chỉ số toàn diện, quản lý tài khoản người dùng, định nghĩa cấu trúc phòng ban và thiết lập quy trình luồng duyệt.' 
                : 'Hệ thống quản lý và phê duyệt yêu cầu nội bộ của doanh nghiệp. Hỗ trợ gửi và xử lý tờ trình, đề xuất hành chính nhanh chóng, bảo mật và chuẩn hóa quy trình.'
              }
            </p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          <h2 className="cake-title" style={{ fontSize: 24, marginBottom: 20, textAlign: 'left', color: '#212529' }}>
            Chỉ số quản trị hệ thống
          </h2>
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: 20 }}>
                    <UserOutlined />
                  </div>
                  <Statistic
                    title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Người dùng hoạt động</span>}
                    value={stats.totalUsers}
                    valueStyle={{ color: '#0f172a', fontWeight: 800 }}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7e22ce', fontSize: 20 }}>
                    <ApartmentOutlined />
                  </div>
                  <Statistic
                    title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Phòng ban</span>}
                    value={stats.totalDepartments}
                    valueStyle={{ color: '#0f172a', fontWeight: 800 }}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857', fontSize: 20 }}>
                    <DeploymentUnitOutlined />
                  </div>
                  <Statistic
                    title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Quy trình (Workflow)</span>}
                    value={stats.totalWorkflows}
                    valueStyle={{ color: '#0f172a', fontWeight: 800 }}
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2410c', fontSize: 20 }}>
                    <OrderedListOutlined />
                  </div>
                  <Statistic
                    title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Tổng số yêu cầu</span>}
                    value={stats.totalRequests}
                    valueStyle={{ color: '#0f172a', fontWeight: 800 }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <h2 className="cake-title" style={{ fontSize: 24, marginBottom: 20, textAlign: 'left', color: '#212529' }}>
        {isAdmin ? 'Tình trạng phê duyệt toàn hệ thống' : 'Tổng quan hoạt động của tôi'}
      </h2>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: '#f1f3f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#495057',
                  fontSize: 20
                }}
              >
                <FileTextOutlined />
              </div>
              <Statistic
                title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Nháp</span>}
                value={stats.draftRequests}
                valueStyle={{ color: '#495057', fontWeight: 800 }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: '#fff7ed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ea580c',
                  fontSize: 20
                }}
              >
                <ClockCircleOutlined />
              </div>
              <Statistic
                title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Chờ duyệt</span>}
                value={stats.pendingRequests}
                valueStyle={{ color: '#ea580c', fontWeight: 800 }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a',
                  fontSize: 20
                }}
              >
                <CheckCircleOutlined />
              </div>
              <Statistic
                title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Đã duyệt</span>}
                value={stats.approvedRequests}
                valueStyle={{ color: '#16a34a', fontWeight: 800 }}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  fontSize: 20
                }}
              >
                <CloseCircleOutlined />
              </div>
              <Statistic
                title={<span style={{ color: '#6c757d', fontWeight: 700 }}>Từ chối</span>}
                value={stats.rejectedRequests}
                valueStyle={{ color: '#dc2626', fontWeight: 800 }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage