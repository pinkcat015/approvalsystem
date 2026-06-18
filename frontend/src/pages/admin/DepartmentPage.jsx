import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { departmentApi, userApi } from '../../api/admin'

function DepartmentPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [searchText, setSearchText] = useState('')
  const [filterManager, setFilterManager] = useState(undefined)

  useEffect(() => {
    loadData()
    loadUsers()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await departmentApi.getAll()
      setData(res)
    } catch (error) {
      message.error('Không thể tải danh sách phòng ban')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await userApi.getAll()
      setUsers(res)
    } catch (error) {
      console.error(error)
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
      managerId: record.managerId,
      description: record.description
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await departmentApi.delete(id)
      message.success('Xóa phòng ban thành công')
      loadData()
    } catch (error) {
      message.error(error.response?.data || 'Xóa phòng ban thất bại')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (editingItem) {
        await departmentApi.update(editingItem.id, values)
        message.success('Cập nhật phòng ban thành công')
      } else {
        await departmentApi.create(values)
        message.success('Tạo phòng ban thành công')
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

    const matchesManager = filterManager === undefined || filterManager === null || item.managerId === filterManager

    return matchesSearch && matchesManager
  })

  const columns = [
    { 
      title: 'Mã', 
      dataIndex: 'code', 
      key: 'code',
      render: (code) => <strong style={{ color: '#ee0033' }}>{code}</strong>
    },
    { title: 'Tên phòng ban', dataIndex: 'name', key: 'name' },
    { title: 'Trưởng phòng', dataIndex: 'managerName', key: 'managerName' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
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
            title="Xác nhận xóa phòng ban này?"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="cake-title" style={{ fontSize: 28, margin: 0, color: '#212529' }}>Quản lý phòng ban</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={openCreateModal}
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
          Thêm phòng ban
        </Button>
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
            placeholder="Tìm theo mã hoặc tên phòng ban..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            placeholder="Lọc theo trưởng phòng"
            allowClear
            onChange={setFilterManager}
            style={{ width: 220 }}
          >
            {users.map((u) => (
              <Select.Option key={u.id} value={u.id}>
                {u.fullName}
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
          showTotal: (total) => `Tổng số: ${total} phòng ban` 
        }}
      />

      <Modal
        title={editingItem ? "Cập nhật phòng ban" : "Thêm phòng ban mới"}
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
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Mã phòng ban"
            rules={[{ required: true, message: 'Vui lòng nhập mã phòng ban' }]}
          >
            <Input placeholder="Ví dụ: SALE, IT, HR" disabled={!!editingItem} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên phòng ban"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="managerId" label="Trưởng phòng">
            <Select placeholder="Chọn trưởng phòng" allowClear>
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.fullName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DepartmentPage