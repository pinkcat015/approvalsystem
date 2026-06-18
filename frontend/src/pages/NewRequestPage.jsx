import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Select, Button, Card, message, InputNumber } from 'antd'
import { requestTypeApi } from '../api/admin'
import { requestApi } from '../api/requests'

const { TextArea } = Input

function NewRequestPage() {
  const [form] = Form.useForm()
  const { id } = useParams()
  const [requestTypes, setRequestTypes] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadRequestTypes()
    if (id) {
      loadRequestDetails()
    }
  }, [id])

  const loadRequestTypes = async () => {
    try {
      const res = await requestTypeApi.getAll()
      setRequestTypes(res)
    } catch (error) {
      message.error('Không thể tải danh sách loại yêu cầu')
    }
  }

  const loadRequestDetails = async () => {
    try {
      const res = await requestApi.getById(id)
      if (res.status !== 'DRAFT') {
        message.error('Chỉ có thể chỉnh sửa yêu cầu ở trạng thái Nháp')
        navigate(`/requests/${id}`)
        return
      }
      form.setFieldsValue({
        requestTypeId: res.requestTypeId,
        title: res.title,
        amount: res.amount,
        priority: res.priority,
        note: res.note,
        reason: res.formData?.reason || ''
      })
    } catch (error) {
      message.error('Không thể tải chi tiết yêu cầu')
    }
  }

  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      const { requestTypeId, title, amount, priority, note, ...formData } = values

      const payload = {
        requestTypeId,
        title,
        amount,
        priority: priority || 'NORMAL',
        note,
        formData
      }

      if (id) {
        await requestApi.update(id, payload)
        message.success('Cập nhật yêu cầu thành công')
        navigate(`/requests/${id}`)
      } else {
        const created = await requestApi.create(payload)
        message.success('Tạo yêu cầu thành công')
        navigate(`/requests/${created.id}`)
      }
    } catch (error) {
      message.error(id ? 'Cập nhật yêu cầu thất bại' : 'Tạo yêu cầu thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card
      title={<span className="cake-title" style={{ fontSize: 22, color: '#ee0033' }}>{id ? 'Chỉnh sửa yêu cầu' : 'Tạo yêu cầu mới'}</span>}
      style={{
        maxWidth: 600,
        margin: '0 auto',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        border: '1px solid #e9ecef'
      }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="requestTypeId"
          label={<span style={{ fontWeight: 700, color: '#212529' }}>Loại yêu cầu</span>}
          rules={[{ required: true, message: 'Vui lòng chọn loại yêu cầu' }]}
        >
          <Select placeholder="Chọn loại yêu cầu">
            {requestTypes.map((rt) => (
              <Select.Option key={rt.id} value={rt.id}>
                {rt.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label={<span style={{ fontWeight: 700, color: '#212529' }}>Tiêu đề</span>}
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input placeholder="Ví dụ: Xin nghỉ phép 2 ngày" />
        </Form.Item>

        <Form.Item 
          name="reason" 
          label={<span style={{ fontWeight: 700, color: '#212529' }}>Lý do / Nội dung</span>}
        >
          <TextArea rows={4} placeholder="Mô tả chi tiết yêu cầu của bạn" />
        </Form.Item>

        <Form.Item 
          name="amount" 
          label={<span style={{ fontWeight: 700, color: '#212529' }}>Số tiền (nếu có)</span>}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="0"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          />
        </Form.Item>

        <Form.Item 
          name="priority" 
          label={<span style={{ fontWeight: 700, color: '#212529' }}>Mức ưu tiên</span>} 
          initialValue="NORMAL"
        >
          <Select>
            <Select.Option value="LOW">Thấp</Select.Option>
            <Select.Option value="NORMAL">Bình thường</Select.Option>
            <Select.Option value="HIGH">Cao</Select.Option>
            <Select.Option value="URGENT">Khẩn cấp</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          name="note" 
          label={<span style={{ fontWeight: 700, color: '#212529' }}>Ghi chú thêm</span>}
        >
          <TextArea rows={2} />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            style={{
              background: '#ee0033',
              borderColor: '#ee0033',
              height: 40,
              borderRadius: 8,
              width: '100%',
              fontSize: 15,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(238, 0, 51, 0.15)'
            }}
          >
            {id ? 'Cập nhật yêu cầu (Nháp)' : 'Tạo yêu cầu (Nháp)'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default NewRequestPage