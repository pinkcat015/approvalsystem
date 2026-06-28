import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Card,
  Tabs,
  Tag,
  Popconfirm
} from 'antd'
import { PlusOutlined, DeleteOutlined, BranchesOutlined } from '@ant-design/icons'
import PageHeaderBanner from '../components/PageHeaderBanner'
import { delegationApi } from '../api/requests'
import { userApi } from '../api/admin'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

function DelegationPage() {
  const [activeTab, setActiveTab] = useState('my')
  const [loading, setLoading] = useState(false)
  const [myDelegations, setMyDelegations] = useState([])
  const [incomingDelegations, setIncomingDelegations] = useState([])
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadDelegations()
    loadUsers()
  }, [activeTab])

  const loadDelegations = async () => {
    setLoading(true)
    try {
      if (activeTab === 'my') {
        const res = await delegationApi.getMy()
        setMyDelegations(res)
      } else {
        const res = await delegationApi.getIncoming()
        setIncomingDelegations(res)
      }
    } catch (error) {
      message.error('Không thể tải danh sách ủy quyền')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await userApi.getAll()
      // Loại bỏ chính mình khỏi danh sách ủy quyền
      const currentUser = JSON.parse(localStorage.getItem('user'))
      const filtered = res.filter(u => u.username !== currentUser?.username)
      setUsers(filtered)
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const [start, end] = values.dateRange
      
      const payload = {
        toUserId: values.toUserId,
        startDate: start.startOf('day').toISOString(),
        endDate: end.endOf('day').toISOString()
      }

      setSubmitting(true)
      await delegationApi.create(payload)
      message.success('Thiết lập ủy quyền thành công')
      setModalOpen(false)
      form.resetFields()
      loadDelegations()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.response?.data || 'Thiết lập ủy quyền thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    try {
      await delegationApi.cancel(id)
      message.success('Đã hủy ủy quyền thành công')
      loadDelegations()
    } catch (error) {
      message.error('Không thể hủy ủy quyền')
    }
  }

  const getStatusTag = (record) => {
    if (!record.active) {
      return <Tag color="default">Đã hủy</Tag>
    }
    const now = dayjs()
    const start = dayjs(record.startDate)
    const end = dayjs(record.endDate)

    if (now.isBefore(start)) {
      return <Tag color="warning">Chưa bắt đầu</Tag>
    } else if (now.isAfter(end)) {
      return <Tag color="default">Hết hiệu lực</Tag>
    } else {
      return <Tag color="success">Đang hiệu lực</Tag>
    }
  }

  const myColumns = [
    { title: 'Người nhận ủy quyền', dataIndex: 'toUserName', key: 'toUserName' },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thời gian kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => getStatusTag(record)
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => record.active && dayjs().isBefore(dayjs(record.endDate)) ? (
        <Popconfirm
          title="Xác nhận hủy ủy quyền này?"
          onConfirm={() => handleCancel(record.id)}
          okText="Hủy ủy quyền"
          cancelText="Đóng"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ) : null
    }
  ]

  const incomingColumns = [
    { title: 'Người ủy quyền', dataIndex: 'fromUserName', key: 'fromUserName' },
    {
      title: 'Thời gian bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Thời gian kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => getStatusTag(record)
    }
  ]

  return (
    <div>
      <PageHeaderBanner
        title="Quản lý Ủy quyền Duyệt"
        description="Cấu hình người nhận ủy quyền phê duyệt thay thế bạn trong thời gian vắng mặt."
        icon={<BranchesOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            style={{
              background: '#ffffff',
              borderColor: '#ffffff',
              color: '#ee0033',
              borderRadius: 8,
              fontWeight: 700,
              height: 38,
              padding: '0 16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            Thêm ủy quyền mới
          </Button>
        }
      />
      
      <Card style={{ borderRadius: 12, border: '1px solid #e9ecef', padding: '8px 16px' }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Ủy quyền của tôi" key="my">
          <Table
            columns={myColumns}
            dataSource={myDelegations}
            rowKey="id"
            loading={loading}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Ủy quyền được nhận" key="incoming">
          <Table
            columns={incomingColumns}
            dataSource={incomingDelegations}
            rowKey="id"
            loading={loading}
          />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Thiết lập Ủy quyền mới"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okButtonProps={{ style: { background: '#ee0033', borderColor: 'transparent', borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="toUserId"
            label="Chọn người nhận ủy quyền"
            rules={[{ required: true, message: 'Vui lòng chọn người nhận ủy quyền' }]}
          >
            <Select placeholder="Chọn nhân sự" showSearch optionFilterProp="label">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id} label={u.fullName}>
                  {u.fullName} ({u.username}) - {u.position}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Thời gian ủy quyền"
            rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian ủy quyền' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%', borderRadius: 8 }}
              placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
            />
          </Form.Item>
        </Form>
      </Modal>
      </Card>
    </div>
  )
}

export default DelegationPage
