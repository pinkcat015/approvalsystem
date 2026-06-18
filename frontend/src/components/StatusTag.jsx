import { Tag } from 'antd'

const statusConfig = {
  DRAFT: { className: 'cake-tag cake-tag-draft', label: 'Nháp' },
  IN_PROGRESS: { className: 'cake-tag cake-tag-pending', label: 'Đang chờ duyệt' },
  ON_HOLD: { className: 'cake-tag cake-tag-pending', label: 'Chờ bổ sung' },
  APPROVED: { className: 'cake-tag cake-tag-approved', label: 'Đã duyệt' },
  REJECTED: { className: 'cake-tag cake-tag-rejected', label: 'Từ chối' },
  CANCELLED: { className: 'cake-tag cake-tag-draft', label: 'Đã hủy' }
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