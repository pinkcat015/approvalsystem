import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, message, Input, Select } from 'antd'
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { requestApi } from '../api/requests'
import { requestTypeApi } from '../api/admin'
import StatusTag from '../components/StatusTag'
import PageHeaderBanner from '../components/PageHeaderBanner'

const statusLabels = {
  DRAFT: 'Nháp',
  IN_PROGRESS: 'Đang duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  ON_HOLD: 'Tạm giữ',
  EXPIRED: 'Đã hủy (Quá hạn)',
  RETURNED: 'Bị trả lại'
}

function AdminRequestsPage() {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [data, setData] = useState([])
  const [requestTypes, setRequestTypes] = useState([])
  const navigate = useNavigate()

  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState(undefined)
  const [filterRequestType, setFilterRequestType] = useState(undefined)

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await requestApi.exportRequests(filterStatus)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'approval_requests.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('Xuất báo cáo thành công!')
    } catch (error) {
      message.error('Xuất báo cáo thất bại')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    loadData()
    loadRequestTypes()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await requestApi.getAll({ size: 100 })
      setData(res.content || [])
    } catch (error) {
      message.error('Không thể tải danh sách toàn bộ yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  const loadRequestTypes = async () => {
    try {
      const res = await requestTypeApi.getAll()
      setRequestTypes(res)
    } catch (error) {
      console.error(error)
    }
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = 
      !searchText || 
      item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.requestNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.requesterName?.toLowerCase().includes(searchText.toLowerCase())

    const matchesStatus = filterStatus === undefined || filterStatus === null || item.status === filterStatus
    const matchesRequestType = filterRequestType === undefined || filterRequestType === null || item.requestTypeId === filterRequestType

    return matchesSearch && matchesStatus && matchesRequestType
  })

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
      width: 140
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Người tạo',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 160
    },
    {
      title: 'Loại',
      dataIndex: 'requestTypeName',
      key: 'requestTypeName',
      width: 160
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => <StatusTag status={status} />
    },
    {
      title: 'Bước hiện tại',
      key: 'step',
      width: 180,
      render: (_, record) =>
        record.totalSteps
          ? `${record.currentStep}/${record.totalSteps} - ${record.currentStepName || ''}`
          : '-'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => navigate(`/requests/${record.id}`)} style={{ padding: 0 }}>
            Xem chi tiết
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <PageHeaderBanner
        title="Quản lý yêu cầu toàn hệ thống"
        description="Theo dõi tiến độ, xem xét chi tiết và giám sát toàn bộ tờ trình, đề xuất đang vận hành trong doanh nghiệp."
        icon={<FileTextOutlined />}
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined style={{ color: '#ffffff' }} />}
              onClick={handleExport}
              loading={exporting}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                height: 38,
                padding: '0 16px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                background: 'transparent'
              }}
            >
              Xuất báo cáo Excel
            </Button>
          </Space>
        }
      />

      <div style={{ 
        background: '#ffffff', 
        padding: '16px 20px', 
        borderRadius: 12, 
        border: '1px solid #e9ecef', 
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
      }}>
        <Space size="middle" wrap style={{ width: '100%' }}>
          <Input.Search
            placeholder="Tìm mã, tiêu đề hoặc người tạo..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            onChange={setFilterStatus}
            style={{ width: 180 }}
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Lọc theo loại yêu cầu"
            allowClear
            onChange={setFilterRequestType}
            style={{ width: 220 }}
          >
            {requestTypes.map((rt) => (
              <Select.Option key={rt.id} value={rt.id}>
                {rt.name}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 10, 
          showSizeChanger: true, 
          showTotal: (total) => `Tổng số: ${total} yêu cầu` 
        }}
        style={{
          boxShadow: '0 10px 30px rgba(38, 6, 10, 0.02)'
        }}
      />
    </div>
  )
}

export default AdminRequestsPage
