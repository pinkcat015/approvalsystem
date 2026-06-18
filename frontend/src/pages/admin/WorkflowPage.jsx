import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Space,
  Tag,
  Divider,
  Popconfirm,
  Switch
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { workflowApi, requestTypeApi, userApi, departmentApi } from '../../api/admin'

const approverTypeLabels = {
  ROLE: 'Theo vai trò',
  SPECIFIC_USER: 'Người cụ thể',
  DEPARTMENT_HEAD: 'Trưởng phòng',
  DYNAMIC: 'Tự động'
}

const roleOptions = [
  { value: 'MANAGER', label: 'Trưởng phòng' },
  { value: 'HR_STAFF', label: 'Nhân viên HR' },
  { value: 'ACCOUNTANT', label: 'Kế toán' },
  { value: 'DIRECTOR', label: 'Giám đốc' },
  { value: 'ADMIN', label: 'Quản trị viên' }
]

function WorkflowPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [requestTypes, setRequestTypes] = useState([])
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [searchText, setSearchText] = useState('')
  const [filterRequestType, setFilterRequestType] = useState(undefined)

  useEffect(() => {
    loadData()
    loadRequestTypes()
    loadUsers()
    loadDepartments()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await userApi.getAll()
      setUsers(res)
    } catch (error) {
      console.error(error)
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

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await workflowApi.getAll()
      setData(res)
    } catch (error) {
      message.error('Không thể tải danh sách workflow')
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

  const openCreateModal = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      steps: [{ stepOrder: 1, approverType: 'ROLE', timeoutHours: 48, allowDelegate: true }]
    })
    setModalOpen(true)
  }

  const openEditModal = (record) => {
    setEditingItem(record)
    form.resetFields()
    
    // Map existing workflow steps for the Form.List dynamic fields
    const stepsMapped = record.steps?.map((step) => ({
      stepOrder: step.stepOrder,
      stepName: step.stepName,
      approverType: step.approverType,
      approverRole: step.approverRole || undefined,
      approverUserId: step.approverUserId || undefined,
      approverDepartmentId: step.approverDepartmentId || undefined,
      timeoutHours: step.timeoutHours || 48,
      allowDelegate: step.allowDelegate,
      conditionExpression: step.conditionExpression || undefined
    })) || []

    form.setFieldsValue({
      requestTypeId: record.requestTypeId,
      name: record.name,
      description: record.description,
      active: record.active,
      steps: stepsMapped.length > 0 ? stepsMapped : [{ stepOrder: 1, approverType: 'ROLE', timeoutHours: 48, allowDelegate: true }]
    })
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await workflowApi.delete(id)
      message.success('Xóa workflow thành công')
      loadData()
    } catch (error) {
      message.error(error.response?.data || 'Xóa workflow thất bại')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // Tự động đánh số thứ tự bước theo vị trí trong mảng
      const steps = values.steps.map((s, index) => ({
        ...s,
        stepOrder: index + 1
      }))

      const payload = { ...values, steps }

      setSubmitting(true)
      
      if (editingItem) {
        await workflowApi.update(editingItem.id, payload)
        message.success('Cập nhật workflow thành công')
      } else {
        await workflowApi.create(payload)
        message.success('Tạo workflow thành công')
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
    const matchesSearch = !searchText || item.name?.toLowerCase().includes(searchText.toLowerCase())
    const matchesRequestType = filterRequestType === undefined || filterRequestType === null || item.requestTypeId === filterRequestType
    return matchesSearch && matchesRequestType
  })

  const columns = [
    { title: 'Tên workflow', dataIndex: 'name', key: 'name' },
    { title: 'Loại yêu cầu', dataIndex: 'requestTypeName', key: 'requestTypeName' },
    {
      title: 'Số bước',
      key: 'stepCount',
      render: (_, record) => record.steps?.length || 0
    },
    {
      title: 'Các bước',
      key: 'steps',
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          {record.steps?.map((s) => {
            let detail = '';
            if (s.approverType === 'ROLE' && s.approverRole) {
              detail = ` - ${roleOptions.find(r => r.value === s.approverRole)?.label || s.approverRole}`;
            } else if (s.approverType === 'SPECIFIC_USER' && s.approverUserName) {
              detail = ` - ${s.approverUserName}`;
            } else if (s.approverType === 'DEPARTMENT_HEAD' && s.approverDepartmentName) {
              detail = ` - Trưởng phòng ${s.approverDepartmentName}`;
            }
            return (
              <Tag key={s.id || s.stepOrder}>
                {s.stepOrder}. {s.stepName} ({approverTypeLabels[s.approverType] || s.approverType}{detail})
              </Tag>
            );
          })}
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? 'Đang dùng' : 'Tắt'}
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
            icon={<EditOutlined style={{ color: '#ea580c' }} />} 
            onClick={() => openEditModal(record)} 
          />
          <Popconfirm
            title="Xác nhận xóa workflow này?"
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
        <h2 className="cake-title" style={{ fontSize: 28, margin: 0, color: '#212529' }}>Cấu hình Workflow</h2>
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
          Thêm Workflow
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
            placeholder="Tìm theo tên workflow..."
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
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
          showTotal: (total) => `Tổng số: ${total} workflow` 
        }}
      />

      <Modal
        title={editingItem ? "Cập nhật Workflow" : "Tạo Workflow mới"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={700}
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
          <Form.Item
            name="requestTypeId"
            label="Loại yêu cầu áp dụng"
            rules={[{ required: true, message: 'Vui lòng chọn loại yêu cầu' }]}
          >
            <Select placeholder="Chọn loại yêu cầu" disabled={!!editingItem}>
              {requestTypes.map((rt) => (
                <Select.Option key={rt.id} value={rt.id}>
                  {rt.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên workflow"
            rules={[{ required: true, message: 'Vui lòng nhập tên workflow' }]}
          >
            <Input placeholder="Ví dụ: Quy trình duyệt nghỉ phép" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>

          {editingItem && (
            <Form.Item name="active" label="Trạng thái hoạt động" valuePropName="checked">
              <Switch checkedChildren="Đang dùng" unCheckedChildren="Tắt" />
            </Form.Item>
          )}

          <Divider>Các bước duyệt</Divider>

          <Form.List name="steps">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <div
                    key={field.key}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                      position: 'relative'
                    }}
                  >
                    <strong>Bước {index + 1}</strong>

                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        style={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() => remove(field.name)}
                      />
                    )}

                    <Form.Item
                      {...field}
                      name={[field.name, 'stepName']}
                      label="Tên bước"
                      rules={[{ required: true, message: 'Nhập tên bước' }]}
                      style={{ marginTop: 12 }}
                    >
                      <Input placeholder="Ví dụ: Trưởng phòng phê duyệt" />
                    </Form.Item>

                    <Space style={{ width: '100%' }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'approverType']}
                        label="Loại người duyệt"
                        rules={[{ required: true, message: 'Chọn loại' }]}
                      >
                        <Select style={{ width: 180 }}>
                          {Object.entries(approverTypeLabels).map(([key, label]) => (
                            <Select.Option key={key} value={key}>
                              {label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => {
                          return prevValues.steps?.[field.name]?.approverType !== currentValues.steps?.[field.name]?.approverType;
                        }}
                      >
                        {({ getFieldValue }) => {
                          const type = getFieldValue(['steps', field.name, 'approverType']);
                          if (type === 'SPECIFIC_USER') {
                            return (
                              <Form.Item
                                {...field}
                                name={[field.name, 'approverUserId']}
                                label="Người duyệt cụ thể"
                                rules={[{ required: true, message: 'Chọn nhân sự' }]}
                              >
                                <Select style={{ width: 180 }} placeholder="Chọn nhân sự" showSearch optionFilterProp="label">
                                  {users.map((u) => (
                                    <Select.Option key={u.id} value={u.id} label={u.fullName}>
                                      {u.fullName} ({u.username})
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            );
                          } else if (type === 'DEPARTMENT_HEAD') {
                            return (
                              <Form.Item
                                {...field}
                                name={[field.name, 'approverDepartmentId']}
                                label="Phòng ban duyệt"
                              >
                                <Select style={{ width: 180 }} placeholder="Mặc định phòng người gửi" allowClear>
                                  {departments.map((d) => (
                                    <Select.Option key={d.id} value={d.id}>
                                      {d.name}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            );
                          } else {
                            return (
                              <Form.Item
                                {...field}
                                name={[field.name, 'approverRole']}
                                label="Vai trò duyệt"
                                rules={[{ required: true, message: 'Chọn vai trò' }]}
                              >
                                <Select style={{ width: 180 }} placeholder="Chọn vai trò" allowClear>
                                  {roleOptions.map((r) => (
                                    <Select.Option key={r.value} value={r.value}>
                                      {r.label}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            );
                          }
                        }}
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'timeoutHours']}
                        label="Thời hạn (giờ)"
                        initialValue={48}
                      >
                        <InputNumber min={1} style={{ width: 120 }} />
                      </Form.Item>
                    </Space>

                    <Form.Item
                      {...field}
                      name={[field.name, 'conditionExpression']}
                      label="Biểu thức điều kiện (SpEL)"
                      tooltip="Ví dụ: amount > 5000000 hoặc priority == 'URGENT'. Để trống nếu bước này luôn được thực hiện."
                    >
                      <Input placeholder="Nhập biểu thức SpEL (ví dụ: amount > 2000000)" />
                    </Form.Item>
                  </div>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add({ approverType: 'ROLE', timeoutHours: 48, allowDelegate: true })}
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm bước
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkflowPage