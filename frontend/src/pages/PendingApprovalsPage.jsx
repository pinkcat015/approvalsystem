import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, message } from 'antd'
import { CheckSquareOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { requestApi } from '../api/requests'
import StatusTag from '../components/StatusTag'
import PageHeaderBanner from '../components/PageHeaderBanner'

function PendingApprovalsPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await requestApi.getPending({ size: 50 })
      setData(res.content || res || [])
    } catch (error) {
      message.error('Không thể tải danh sách chờ duyệt')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'Mã yêu cầu', dataIndex: 'requestNumber', key: 'requestNumber' },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Người tạo', dataIndex: 'requesterName', key: 'requesterName' },
    { title: 'Loại', dataIndex: 'requestTypeName', key: 'requestTypeName' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/requests/${record.id}`)}>
          Xử lý
        </Button>
      )
    }
  ]

  return (
    <div>
      <PageHeaderBanner
        title="Yêu cầu chờ tôi duyệt"
        description="Danh sách các hồ sơ, tờ trình cần bạn xem xét, xử lý và phê duyệt."
        icon={<CheckSquareOutlined />}
      />
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{
          boxShadow: '0 10px 30px rgba(38, 6, 10, 0.02)'
        }}
      />
    </div>
  )
}

export default PendingApprovalsPage