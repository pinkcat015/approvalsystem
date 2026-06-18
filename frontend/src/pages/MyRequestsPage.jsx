import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, message, Popconfirm, Input, Select } from 'antd'
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { requestApi } from '../api/requests'
import { requestTypeApi } from '../api/admin'
import StatusTag from '../components/StatusTag'

const statusLabels = {
  DRAFT: 'Nháp',
  IN_PROGRESS: 'Đang duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  ON_HOLD: 'Tạm giữ'
}

function MyRequestsPage() {
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
      const res = await requestApi.getMyRequests({ size: 50 })
      setData(res.content || [])
    } catch (error) {
      message.error('Không thể tải danh sách yêu cầu')
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

  const handleCancel = async (id) => {
    setLoading(true)
    try {
      await requestApi.cancel(id, 'Người tạo hủy yêu cầu')
      message.success('Đã hủy yêu cầu thành công')
      loadData()
    } catch (error) {
      message.error(error.response?.data || 'Hủy yêu cầu thất bại')
    } finally {
      setLoading(false)
    }
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = 
      !searchText || 
      item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.requestNumber?.toLowerCase().includes(searchText.toLowerCase())

    const matchesStatus = filterStatus === undefined || filterStatus === null || item.status === filterStatus
    const matchesRequestType = filterRequestType === undefined || filterRequestType === null || item.requestTypeId === filterRequestType

    return matchesSearch && matchesStatus && matchesRequestType
  })

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber'
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Loại',
      dataIndex: 'requestTypeName',
      key: 'requestTypeName'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />
    },
    {
      title: 'Bước hiện tại',
      key: 'step',
      render: (_, record) =>
        record.totalSteps
          ? `${record.currentStep}/${record.totalSteps} - ${record.currentStepName || ''}`
          : '-'
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => navigate(`/requests/${record.id}`)} style={{ padding: 0 }}>
            Xem
          </Button>
          {record.status === 'DRAFT' && (
            <Button 
              type="link" 
              style={{ color: '#ea580c', padding: 0 }} 
              onClick={() => navigate(`/requests/${record.id}/edit`)}
            >
              Sửa
            </Button>
          )}
          {(record.status === 'DRAFT' || record.status === 'IN_PROGRESS' || record.status === 'ON_HOLD') && (
            <Popconfirm
              title="Xác nhận hủy yêu cầu này?"
              onConfirm={() => handleCancel(record.id)}
              okText="Hủy"
              cancelText="Không"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger style={{ padding: 0 }}>
                Hủy
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="cake-title" style={{ fontSize: 28, margin: 0, color: '#212529' }}>Yêu cầu của tôi</h2>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              height: 38,
              padding: '0 16px',
              border: '1px solid #d9d9d9',
              color: '#333333',
              background: '#ffffff'
            }}
          >
            Xuất báo cáo
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/requests/new')}
            style={{
              background: '#ee0033',
              borderColor: '#ee0033',
              borderRadius: 8,
              fontWeight: 600,
              height: 38,
              padding: '0 16px',
              boxShadow: '0 4px 12px rgba(238, 0, 51, 0.15)'
            }}
          >
            Tạo yêu cầu mới
          </Button>
        </Space>
      </div>

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
            placeholder="Tìm mã hoặc tiêu đề yêu cầu..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
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

export default MyRequestsPage