import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Space, Popconfirm, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { userApi, departmentApi } from '../../api/admin'

const roleLabels = {
  ADMIN: 'Quản trị viên',
  DIRECTOR: 'Giám đốc',
  MANAGER: 'Trưởng phòng',
  HR_STAFF: 'Nhân viên HR',
  ACCOUNTANT: 'Kế toán',
  EMPLOYEE: 'Nhân viên'
}

function UserManagementPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [departments, setDepartments] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [searchText, setSearchText] = useState('')
  const [filterRole, setFilterRole] = useState(undefined)
  const [filterDept, setFilterDept] = useState(undefined)

  useEffect(() => {
    loadData()
    loadDepartments()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await userApi.getAll()
      setData(res)
    } catch (error) {
      message.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const res = await departmentApi.getAll()
      setDepartments(res)
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
      fullName: record.fullName,
      phone: record.phone || '',
      position: record.position || '',
      departmentId: record.departmentId || null,
      role: record.role,
      active: record.active
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await userApi.delete(id)
      message.success('Xóa người dùng thành công')
      loadData()
    } catch (error) {
      message.error(error.response?.data || 'Xóa người dùng thất bại')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      
      if (editingItem) {
        await userApi.update(editingItem.id, values)
        message.success('Cập nhật người dùng thành công')
      } else {
        await userApi.create(values)
        message.success('Tạo người dùng thành công')
      }
      
      setModalOpen(false)
      loadData()
    } catch (error) {
      if (error.errorFields) return // lỗi validate form
      message.error(error.response?.data || 'Thao tác thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredData = data.filter((item) => {
    const matchesSearch = 
      !searchText || 
      item.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchText.toLowerCase())

    const matchesRole = !filterRole || item.role === filterRole
    const matchesDept = filterDept === undefined || filterDept === null || item.departmentId === filterDept

    return matchesSearch && matchesRole && matchesDept
  })

  const columns = [
    { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phòng ban', dataIndex: 'departmentName', key: 'departmentName' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color="blue">{roleLabels[role] || role}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: record.username === 'admin' ? '#ccc' : '#ea580c' }} />} 
            onClick={() => openEditModal(record)} 
            disabled={record.username === 'admin'}
          />
          {record.username !== 'admin' ? (
            <Popconfirm
              title="Xác nhận xóa người dùng này?"
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
          ) : (
            <Button 
              type="text" 
              disabled 
              icon={<DeleteOutlined style={{ color: '#ccc' }} />} 
            />
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="cake-title" style={{ fontSize: 28, margin: 0, color: '#212529' }}>Quản lý người dùng</h2>
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
          Thêm người dùng
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
            placeholder="Tìm tên đăng nhập, họ tên, email..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            placeholder="Lọc theo vai trò"
            allowClear
            onChange={setFilterRole}
            style={{ width: 180 }}
          >
            {Object.entries(roleLabels).map(([key, label]) => (
              <Select.Option key={key} value={key}>
                {label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Lọc theo phòng ban"
            allowClear
            onChange={setFilterDept}
            style={{ width: 200 }}
          >
            {departments.map((d) => (
              <Select.Option key={d.id} value={d.id}>
                {d.name}
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
          showTotal: (total) => `Tổng số: ${total} người dùng` 
        }}
      />

      <Modal
        title={editingItem ? "Cập nhật người dùng" : "Thêm người dùng mới"}
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
        <Form form={form} layout="vertical" initialValues={{ active: true }}>
          {editingItem && (
            <>
              <Form.Item label="Tên đăng nhập">
                <Input value={editingItem.username} disabled />
              </Form.Item>
              <Form.Item label="Email">
                <Input value={editingItem.email} disabled />
              </Form.Item>
            </>
          )}

          {!editingItem && (
            <>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' }
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="employeeCode" label="Mã nhân viên">
            <Input disabled={!!editingItem} />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item name="position" label="Chức vụ">
            <Input />
          </Form.Item>

          <Form.Item name="departmentId" label="Phòng ban">
            <Select placeholder="Chọn phòng ban" allowClear>
              {departments.map((d) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn vai trò">
              {Object.entries(roleLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {editingItem && (
            <Form.Item name="active" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagementPage