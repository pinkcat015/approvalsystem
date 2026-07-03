import { Tag } from 'antd'

const statusConfig = {
  DRAFT: { className: 'cake-tag cake-tag-draft', label: 'Nháp' },
  IN_PROGRESS: { className: 'cake-tag cake-tag-pending', label: 'Đang duyệt' },
  ON_HOLD: { className: 'cake-tag cake-tag-pending', label: 'Chờ bổ sung' },
  APPROVED: { className: 'cake-tag cake-tag-approved', label: 'Đã duyệt' },
  REJECTED: { className: 'cake-tag cake-tag-rejected', label: 'Từ chối' },
  CANCELLED: { className: 'cake-tag cake-tag-draft', label: 'Đã hủy' },
  EXPIRED: { className: 'cake-tag cake-tag-rejected', label: 'Đã hủy (Quá hạn)' },
  RETURNED: { className: 'cake-tag cake-tag-pending', label: 'Bị trả lại' },
  
  // Actions history mappings
  SUBMIT: { className: 'cake-tag cake-tag-approved', label: 'Nộp yêu cầu' },
  APPROVE: { className: 'cake-tag cake-tag-approved', label: 'Đã duyệt' },
  REJECT: { className: 'cake-tag cake-tag-rejected', label: 'Từ chối' },
  REQUEST_INFO: { className: 'cake-tag cake-tag-pending', label: 'Yêu cầu bổ sung' },
  PROVIDE_INFO: { className: 'cake-tag cake-tag-approved', label: 'Đã bổ sung' },
  CANCEL: { className: 'cake-tag cake-tag-draft', label: 'Đã hủy' },
  AUTO_APPROVE: { className: 'cake-tag cake-tag-approved', label: 'Duyệt tự động' },
  ESCALATE: { className: 'cake-tag cake-tag-approved', label: 'Chuyển tiếp' },
  TIMEOUT_REJECT: { className: 'cake-tag cake-tag-rejected', label: 'Từ chối (Quá hạn)' }
}

function StatusTag({ status }) {
  const config = statusConfig[status] || { className: 'cake-tag cake-tag-draft', label: status }
  return (
    <span 
      className={config.className}
      style={{
        display: 'inline-block',
        textAlign: 'center',
        whiteSpace: 'nowrap'
      }}
    >
      {config.label}
    </span>
  )
}

export default StatusTag