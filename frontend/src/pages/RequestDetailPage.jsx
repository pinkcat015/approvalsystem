import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Button,
  Space,
  Timeline,
  message,
  Popconfirm,
  Spin,
  Modal,
  Input,
  List
} from 'antd'
import { UploadOutlined, PaperClipOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { requestApi } from '../api/requests'
import StatusTag from '../components/StatusTag'
import { useAuthStore } from '../store/authStore'

const { TextArea } = Input

function RequestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [uploading, setUploading] = useState(false)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    loadData()
  }, [id])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await requestApi.uploadAttachment(id, formData)
      message.success('Tải lên tài liệu đính kèm thành công')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.message || 'Tải lên tài liệu đính kèm thất bại')
    } finally {
      setUploading(false)
      e.target.value = null
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await requestApi.deleteAttachment(attachmentId)
      message.success('Đã xóa tài liệu đính kèm')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.message || 'Xóa tài liệu đính kèm thất bại')
    }
  }

  const handleDownloadAttachment = async (item) => {
    try {
      const blob = await requestApi.downloadAttachment(item.id)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', item.originalName)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      message.error('Không thể tải tập tin này')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await requestApi.getById(id)
      setData(res)
    } catch (error) {
      message.error('Không thể tải chi tiết yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setActionLoading(true)
    try {
      await requestApi.submit(id)
      message.success('Nộp yêu cầu thành công')
      loadData()
    } catch (error) {
      message.error('Nộp yêu cầu thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      await requestApi.cancel(id, 'Người tạo hủy yêu cầu')
      message.success('Đã hủy yêu cầu')
      loadData()
    } catch (error) {
      message.error('Hủy yêu cầu thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await requestApi.processAction(id, { action: 'APPROVE', comment: 'Đồng ý' })
      message.success('Đã duyệt yêu cầu')
      loadData()
    } catch (error) {
      message.error('Duyệt thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('Vui lòng nhập lý do từ chối')
      return
    }
    setActionLoading(true)
    try {
      await requestApi.processAction(id, { action: 'REJECT', comment: rejectReason })
      message.success('Đã từ chối yêu cầu')
      setRejectModalOpen(false)
      setRejectReason('')
      loadData()
    } catch (error) {
      message.error('Từ chối thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!data) return null

  const isRequester = user && data && user.fullName === data.requesterName

  return (
    <div>
      <Button 
        style={{ 
          marginBottom: 20, 
          borderRadius: 8, 
          border: '1px solid #d9d9d9', 
          color: '#333333',
          fontWeight: 600,
          background: '#ffffff',
          height: 38,
          padding: '0 16px'
        }} 
        onClick={() => navigate('/requests')}
      >
        ← Quay lại danh sách
      </Button>

      <Card
        title={
          <Space size="middle">
            <span className="cake-title" style={{ fontSize: 20, color: '#1a1a1a' }}>{data.requestNumber}</span>
            <StatusTag status={data.status} />
          </Space>
        }
        style={{
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e9ecef'
        }}
        extra={
          <Space size="middle">
            {data.status === 'DRAFT' && (
              <>
                <Button 
                  onClick={() => navigate(`/requests/${data.id}/edit`)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 38,
                    padding: '0 16px',
                    background: '#ffffff',
                    border: '1px solid #d9d9d9',
                    color: '#212529'
                  }}
                >
                  Chỉnh sửa
                </Button>
                <Popconfirm title="Xác nhận nộp yêu cầu này?" onConfirm={handleSubmit}>
                  <Button 
                    type="primary" 
                    loading={actionLoading}
                    style={{
                      background: '#ee0033',
                      borderColor: '#ee0033',
                      fontWeight: 600,
                      borderRadius: 8,
                      height: 38,
                      padding: '0 16px',
                      boxShadow: '0 4px 12px rgba(238, 0, 51, 0.15)'
                    }}
                  >
                    Nộp yêu cầu
                  </Button>
                </Popconfirm>
                <Popconfirm title="Xác nhận hủy yêu cầu này?" onConfirm={handleCancel}>
                  <Button 
                    danger 
                    loading={actionLoading}
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                      height: 38,
                      padding: '0 16px'
                    }}
                  >
                    Hủy
                  </Button>
                </Popconfirm>
              </>
            )}

            {(data.status === 'IN_PROGRESS' || data.status === 'ON_HOLD') && isRequester && (
              <Popconfirm title="Xác nhận hủy yêu cầu này?" onConfirm={handleCancel}>
                <Button 
                  danger 
                  loading={actionLoading}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 38,
                    padding: '0 16px'
                  }}
                >
                  Hủy yêu cầu
                </Button>
              </Popconfirm>
            )}

            {data.status === 'IN_PROGRESS' && (
              <>
                <Button 
                  type="primary" 
                  onClick={handleApprove} 
                  loading={actionLoading}
                  style={{
                    background: '#16a34a',
                    borderColor: '#16a34a',
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 38,
                    padding: '0 16px',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
                  }}
                >
                  Duyệt
                </Button>
                <Button 
                  danger 
                  onClick={() => setRejectModalOpen(true)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 38,
                    padding: '0 16px'
                  }}
                >
                  Từ chối
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Descriptions 
          column={2} 
          bordered 
          style={{ 
            borderRadius: 12, 
            overflow: 'hidden',
            border: '1px solid #e9ecef'
          }}
          labelStyle={{
            background: '#f8f9fa',
            color: '#6c757d',
            fontWeight: 700,
            width: '180px',
            fontFamily: "'Manrope', sans-serif"
          }}
          contentStyle={{
            background: '#ffffff',
            color: '#212529',
            fontWeight: 600,
            fontFamily: "'Manrope', sans-serif"
          }}
        >
          <Descriptions.Item label="Tiêu đề" span={2}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#212529' }}>{data.title}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Loại yêu cầu">{data.requestTypeName}</Descriptions.Item>
          <Descriptions.Item label="Người tạo">{data.requesterName}</Descriptions.Item>
          <Descriptions.Item label="Mức ưu tiên">
            <span 
              className={`cake-tag ${
                data.priority === 'URGENT' || data.priority === 'HIGH' 
                  ? 'cake-tag-rejected' 
                  : data.priority === 'LOW' 
                    ? 'cake-tag-draft' 
                    : 'cake-tag-pending'
              }`}
            >
              {data.priority === 'URGENT' ? 'Khẩn cấp' : data.priority === 'HIGH' ? 'Cao' : data.priority === 'LOW' ? 'Thấp' : 'Bình thường'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Số tiền">
            <span style={{ fontWeight: 800, color: '#ee0033' }}>
              {data.amount ? data.amount.toLocaleString() + ' đ' : '-'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Bước hiện tại">
            {data.totalSteps
              ? `${data.currentStep}/${data.totalSteps} - ${data.currentStepName || ''}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {dayjs(data.createdAt).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>

          {data.formData &&
            Object.entries(data.formData).map(([key, value]) => (
              <Descriptions.Item label={key} key={key}>
                {String(value)}
              </Descriptions.Item>
            ))}

          {data.rejectionReason && (
            <Descriptions.Item 
              label="Lý do từ chối" 
              span={2} 
              contentStyle={{ background: '#fef2f2', color: '#dc2626', fontWeight: 700 }}
            >
              {data.rejectionReason}
            </Descriptions.Item>
          )}
        </Descriptions>

        <div style={{ marginTop: 32, borderTop: '1px solid #e9ecef', paddingTop: 24 }}>
          <h3 className="cake-title" style={{ fontSize: 18, marginBottom: 20, color: '#212529', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PaperClipOutlined /> Tài liệu đính kèm
          </h3>
          
          {data.status === 'DRAFT' && (
            <div style={{ marginBottom: 20 }}>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <Button 
                type="dashed" 
                icon={<UploadOutlined />} 
                onClick={() => document.getElementById('file-upload').click()}
                loading={uploading}
                style={{
                  borderRadius: 8,
                  height: 38,
                  fontWeight: 600,
                  color: '#ee0033',
                  borderColor: '#ee0033'
                }}
              >
                Tải lên tài liệu
              </Button>
            </div>
          )}

          {data.attachments && data.attachments.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={data.attachments}
              renderItem={item => (
                <List.Item
                  style={{
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: 8,
                    marginBottom: 8,
                    border: '1px solid #e9ecef'
                  }}
                  actions={[
                    <Button 
                      type="link" 
                      onClick={() => handleDownloadAttachment(item)}
                      style={{ fontWeight: 600, color: '#16a34a' }}
                    >
                      Tải về
                    </Button>,
                    data.status === 'DRAFT' && (
                      <Popconfirm
                        title="Xác nhận xóa tài liệu đính kèm này?"
                        onConfirm={() => handleDeleteAttachment(item.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="link" danger style={{ fontWeight: 600 }}>
                          Xóa
                        </Button>
                      </Popconfirm>
                    )
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={<span style={{ fontWeight: 700, color: '#212529' }}>{item.originalName}</span>}
                    description={
                      <span style={{ fontSize: 12, color: '#6c757d', fontWeight: 500 }}>
                        Dung lượng: {item.fileSize ? (item.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'} | Người tải: {item.uploadedBy || 'N/A'} | Ngày tải: {dayjs(item.uploadedAt).format('DD/MM/YYYY HH:mm')}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ color: '#6c757d', fontSize: 13, fontStyle: 'italic', padding: '16px 0', border: '1px dashed #d9d9d9', borderRadius: 8, textAlign: 'center', background: '#fafafa' }}>
              Chưa có tài liệu đính kèm nào.
            </div>
          )}
        </div>

        {data.actions?.length > 0 && (
          <div style={{ marginTop: 32, borderTop: '1px solid #e9ecef', paddingTop: 24 }}>
            <h3 className="cake-title" style={{ fontSize: 18, marginBottom: 20, color: '#212529' }}>
              Lịch sử xử lý
            </h3>
            <Timeline
              style={{ paddingLeft: 12 }}
              items={data.actions.map((a) => ({
                color: a.action === 'APPROVE' ? '#16a34a' : a.action === 'REJECT' ? '#dc2626' : '#ee0033',
                children: (
                  <div style={{ paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#212529' }}>{a.approverName}</strong>
                      <span style={{ color: '#6c757d', fontSize: 13, fontWeight: 500 }}>({a.stepName})</span>
                      <StatusTag status={a.action === 'APPROVE' ? 'APPROVED' : 'REJECTED'} />
                    </div>
                    {a.comment && (
                      <div 
                        style={{ 
                          marginTop: 6, 
                          padding: '8px 16px', 
                          background: '#f8f9fa', 
                          borderRadius: 8, 
                          border: '1px solid #e9ecef',
                          display: 'inline-block',
                          color: '#212529',
                          fontSize: 13,
                          fontWeight: 500
                        }}
                      >
                        {a.comment}
                      </div>
                    )}
                    <div style={{ color: '#6c757d', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                      {dayjs(a.actionAt).format('DD/MM/YYYY HH:mm')}
                    </div>
                  </div>
                )
              }))}
            />
          </div>
        )}
      </Card>

      <Modal
        title={<span className="cake-title" style={{ fontSize: 18, color: '#dc2626' }}>Lý do từ chối</span>}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={actionLoading}
        okButtonProps={{
          style: {
            background: '#dc2626',
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
        <TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối yêu cầu này"
          style={{
            borderRadius: 8,
            border: '1px solid #d9d9d9',
            background: '#ffffff',
            color: '#212529',
            marginTop: 16
          }}
        />
      </Modal>
    </div>
  )
}

export default RequestDetailPage