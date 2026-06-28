import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Switch, InputNumber, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import PageHeaderBanner from '../../components/PageHeaderBanner'
import { requestTypeApi } from '../../api/admin'

function RequestTypePage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState(undefined)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await requestTypeApi.getAll()
      setData(res)
    } catch (error) {
      message.error('Không thể tải danh sách loại yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      category: record.category,
      description: record.description,
      icon: record.icon,
      color: record.color,
      requiresAttachment: record.requiresAttachment,
      autoApproveBelowAmount: record.autoApproveBelowAmount,
      active: record.active
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await requestTypeApi.delete(id)
      message.success('Xóa loại yêu cầu thành công')
      loadData()
    } catch (error) {
      message.error(error.response?.data || 'Xóa loại yêu cầu thất bại')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (editingItem) {
        await requestTypeApi.update(editingItem.id, values)
        message.success('Cập nhật loại yêu cầu thành công')
      } else {
        await requestTypeApi.create(values)
        message.success('Tạo loại yêu cầu thành công')
      }

      setModalOpen(false)
      loadData()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.response?.data || 'Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = 
      !searchText || 
      item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchText.toLowerCase())

    const matchesCategory = filterCategory === undefined || filterCategory === null || item.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const columns = [
    { 
      title: 'Mã', 
      dataIndex: 'code', 
      key: 'code',
      render: (code) => <strong style={{ color: '#ee0033' }}>{code}</strong>
    },
    { title: 'Tên loại yêu cầu', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Cần đính kèm',
      dataIndex: 'requiresAttachment',
      key: 'requiresAttachment',
      render: (req) => (req ? 'Có' : 'Không')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <span style={{ color: active ? '#16a34a' : '#999999', fontWeight: 600 }}>
          {active ? 'Hoạt động' : 'Đã khóa'}
        </span>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#ea580c' }} />} 
            onClick={() => openEditModal(record)} 
          />
          <Popconfirm
            title="Xác nhận xóa loại yêu cầu này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <PageHeaderBanner
        title="Quản lý Loại yêu cầu"
        description="Định nghĩa danh mục các loại đề xuất, thiết lập yêu cầu đính kèm tệp và chính sách duyệt tự động."
        icon={<SettingOutlined />}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={openCreateModal}
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
            Thêm loại yêu cầu
          </Button>
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
            placeholder="Tìm theo mã hoặc tên loại..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            placeholder="Lọc theo danh mục"
            allowClear
            onChange={setFilterCategory}
            style={{ width: 200 }}
          >
            <Select.Option value="HR">Nhân sự (HR)</Select.Option>
            <Select.Option value="FINANCE">Tài chính (FINANCE)</Select.Option>
            <Select.Option value="PROCUREMENT">Mua sắm (PROCUREMENT)</Select.Option>
            <Select.Option value="ADMIN">Hành chính (ADMIN)</Select.Option>
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
          showTotal: (total) => `Tổng số: ${total} loại yêu cầu` 
        }}
      />

      <Modal
        title={editingItem ? "Cập nhật loại yêu cầu" : "Thêm loại yêu cầu mới"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okButtonProps={{
          style: {
            background: '#ee0033',
            borderColor: 'transparent',
            borderRadius: 8,
            fontWeight: 600,
            height: 36
          }
        }}
        cancelButtonProps={{
          style: {
            borderRadius: 8,
            fontWeight: 600,
            height: 36
          }
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ active: true, requiresAttachment: false }}>
          {!editingItem && (
            <Form.Item
              name="code"
              label="Mã loại yêu cầu"
              rules={[
                { required: true, message: 'Vui lòng nhập mã loại yêu cầu' },
                { pattern: /^[A-Z_]+$/, message: 'Mã chỉ được chứa chữ hoa và gạch dưới, VD: LEAVE_OFF' }
              ]}
            >
              <Input placeholder="Ví dụ: LEAVE, ADVANCE, PAYMENT" />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Tên loại yêu cầu"
            rules={[{ required: true, message: 'Vui lòng nhập tên loại' }]}
          >
            <Input placeholder="Ví dụ: Đơn Xin Nghỉ Phép" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select placeholder="Chọn danh mục">
              <Select.Option value="HR">Nhân sự (HR)</Select.Option>
              <Select.Option value="FINANCE">Tài chính (FINANCE)</Select.Option>
              <Select.Option value="PROCUREMENT">Mua sắm (PROCUREMENT)</Select.Option>
              <Select.Option value="ADMIN">Hành chính (ADMIN)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả mục đích sử dụng..." />
          </Form.Item>

          <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Form.Item name="requiresAttachment" label="Yêu cầu đính kèm tài liệu" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="active" label="Trạng thái hoạt động" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item name="autoApproveBelowAmount" label="Tự động phê duyệt dưới số tiền">
            <InputNumber style={{ width: '100%' }} placeholder="0" min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RequestTypePage
