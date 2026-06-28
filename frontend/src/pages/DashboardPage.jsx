import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Spin, Table, Progress, Tag, Button, Divider, Space, Tooltip } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  ApartmentOutlined,
  DeploymentUnitOutlined,
  OrderedListOutlined,
  PlusOutlined,
  RightOutlined,
  SafetyOutlined,
  BranchesOutlined,
  CalendarOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { requestApi } from '../api/requests'
import { dashboardApi } from '../api/admin'
import { useAuthStore } from '../store/authStore'
import StatusTag from '../components/StatusTag'
import dayjs from 'dayjs'

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

  const [recentRequests, setRecentRequests] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const navigate = useNavigate()

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

      const recentRes = await requestApi.getMyRequests({ size: 5 })
      setRecentRequests(recentRes.content || [])

      const pendingRes = await requestApi.getPending({ size: 5 })
      const pendingList = pendingRes.content || pendingRes || []
      setPendingApprovals(pendingList)
    } catch (error) {
      console.error('Lỗi tải thống kê:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu tổng quan..." />
      </div>
    )
  }

  const total = stats.totalRequests || 0
  const approveRate = total > 0 ? Math.round((stats.approvedRequests / total) * 100) : 0
  const pendingRate = total > 0 ? Math.round((stats.pendingRequests / total) * 100) : 0
  const rejectRate = total > 0 ? Math.round((stats.rejectedRequests / total) * 100) : 0

  const pendingColumns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
      width: 140,
      render: (num) => <span style={{ fontWeight: 700, color: '#ee0033', letterSpacing: '-0.2px' }}>{num}</span>
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{text}</span>
    },
    {
      title: 'Người tạo',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 150
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: '',
      key: 'action',
      width: 100,
      align: 'right',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => navigate(`/requests/${record.id}`)}
          style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 6, fontWeight: 700, fontSize: 13 }}
        >
          Xử lý
        </Button>
      )
    }
  ]

  const recentColumns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
      width: 140,
      render: (num) => <span style={{ fontWeight: 600, color: '#475569' }}>{num}</span>
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{text}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => <StatusTag status={status} />
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: '',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          onClick={() => navigate(`/requests/${record.id}`)}
          style={{ fontWeight: 700, padding: 0 }}
        >
          Chi tiết
        </Button>
      )
    }
  ]

  return (
    <div style={{ background: '#f8fafc', minHeight: '100%', padding: '0 4px' }}>
      
      {/* ─── BANNER CHÀO MỪNG ─────────────────── */}
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

      {/* ─── SYSTEM KPI METRICS SECTION ──────────────────────── */}
      {isAdmin && (
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  title={<span style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nhân sự hoạt động</span>}
                  value={stats.totalUsers}
                  valueStyle={{ color: '#0f172a', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}
                />
                <div style={{ width: 42, height: 42, borderRadius: 8, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: 18 }}>
                  <UserOutlined />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  title={<span style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cơ cấu phòng ban</span>}
                  value={stats.totalDepartments}
                  valueStyle={{ color: '#0f172a', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}
                />
                <div style={{ width: 42, height: 42, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7e22ce', fontSize: 18 }}>
                  <ApartmentOutlined />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  title={<span style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Luồng quy trình</span>}
                  value={stats.totalWorkflows}
                  valueStyle={{ color: '#0f172a', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}
                />
                <div style={{ width: 42, height: 42, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: 18 }}>
                  <DeploymentUnitOutlined />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  title={<span style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng số yêu cầu</span>}
                  value={stats.totalRequests}
                  valueStyle={{ color: '#0f172a', fontWeight: 800, fontSize: 24, letterSpacing: '-0.5px' }}
                />
                <div style={{ width: 42, height: 42, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: 18 }}>
                  <OrderedListOutlined />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ─── REQUEST STATUSES SUBSECTION ─────────────────────── */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', borderLeft: '4px solid #94a3b8' }} bodyStyle={{ padding: '16px 20px' }}>
            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Hồ sơ nháp</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginTop: 4 }}>{stats.draftRequests}</div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', borderLeft: '4px solid #ea580c' }} bodyStyle={{ padding: '16px 20px' }}>
            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Đang chờ duyệt</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ea580c', marginTop: 4 }}>{stats.pendingRequests}</div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', borderLeft: '4px solid #16a34a' }} bodyStyle={{ padding: '16px 20px' }}>
            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Đã phê duyệt</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{stats.approvedRequests}</div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', borderLeft: '4px solid #dc2626' }} bodyStyle={{ padding: '16px 20px' }}>
            <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Bị từ chối</span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{stats.rejectedRequests}</div>
          </Card>
        </Col>
      </Row>

      {/* ─── TWO COLUMN DETAILED ROW ───────────────────────── */}
      <Row gutter={[24, 24]}>
        
        {/* LEFT COLUMN: ACTIVE TABLES */}
        <Col xs={24} lg={17}>
          {pendingApprovals.length > 0 && (
            <Card 
              title={<span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Yêu cầu chờ bạn phê duyệt</span>}
              bordered={false}
              style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: 24 }}
              extra={<Button type="link" onClick={() => navigate('/approvals')} style={{ fontWeight: 700, fontSize: 13, padding: 0 }}>Xem tất cả <RightOutlined style={{ fontSize: 10 }} /></Button>}
            >
              <Table 
                columns={pendingColumns} 
                dataSource={pendingApprovals} 
                rowKey="id" 
                pagination={false} 
                size="middle" 
                className="custom-table"
              />
            </Card>
          )}

          <Card 
            title={<span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Các yêu cầu gần đây của tôi</span>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}
            extra={<Button type="link" onClick={() => navigate('/requests')} style={{ fontWeight: 700, fontSize: 13, padding: 0 }}>Xem tất cả <RightOutlined style={{ fontSize: 10 }} /></Button>}
          >
            <Table 
              columns={recentColumns} 
              dataSource={recentRequests} 
              rowKey="id" 
              pagination={false} 
              size="middle"
              className="custom-table"
              locale={{ emptyText: 'Bạn chưa tạo yêu cầu nào.' }}
            />
          </Card>
        </Col>

        {/* RIGHT COLUMN: SHORTCUTS & CHARTS */}
        <Col xs={24} lg={7}>
          {/* ACTION BUTTON GRID */}
          <Card 
            title={<span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Thao tác nhanh</span>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: 24 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => navigate('/requests/new')}
                block
                style={{ height: 42, fontWeight: 700, background: '#ee0033', borderColor: '#ee0033', borderRadius: 8, fontSize: 14 }}
              >
                Tạo tờ trình mới
              </Button>
              <Button 
                onClick={() => navigate('/delegations')} 
                icon={<BranchesOutlined />}
                block
                style={{ height: 42, fontWeight: 700, borderRadius: 8, color: '#475569', border: '1px solid #cbd5e1' }}
              >
                Cấu hình ủy quyền duyệt
              </Button>
              {isAdmin && (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Button 
                    onClick={() => navigate('/admin/workflows')} 
                    icon={<BranchesOutlined style={{ color: '#ea580c' }} />}
                    block
                    style={{ height: 42, fontWeight: 700, borderRadius: 8, textAlign: 'left', border: '1px solid #e2e8f0', color: '#475569' }}
                  >
                    Cấu hình Quy trình (Workflow)
                  </Button>
                  <Button 
                    onClick={() => navigate('/admin/users')} 
                    icon={<UserOutlined style={{ color: '#0284c7' }} />}
                    block
                    style={{ height: 42, fontWeight: 700, borderRadius: 8, textAlign: 'left', border: '1px solid #e2e8f0', color: '#475569' }}
                  >
                    Quản lý tài khoản
                  </Button>
                </>
              )}
            </Space>
          </Card>

          {/* ELEGANT KPI PROGRESS */}
          <Card 
            title={<span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Tỷ lệ phê duyệt</span>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
              <Progress 
                type="circle" 
                percent={approveRate} 
                strokeColor="#16a34a" 
                width={110} 
                style={{ marginBottom: 24 }}
                format={(percent) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.5px' }}>{percent}%</span>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>ĐÃ PHÊ DUYỆT</span>
                  </div>
                )}
              />
              
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Đang chờ duyệt</span>
                  <span style={{ color: '#ea580c', fontWeight: 700, fontSize: 13 }}>{stats.pendingRequests} ({pendingRate}%)</span>
                </div>
                <Progress percent={pendingRate} strokeColor="#ea580c" showInfo={false} style={{ marginBottom: 16 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Bị từ chối</span>
                  <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 13 }}>{stats.rejectedRequests} ({rejectRate}%)</span>
                </div>
                <Progress percent={rejectRate} strokeColor="#dc2626" showInfo={false} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage