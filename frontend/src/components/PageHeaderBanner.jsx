import React from 'react'

function PageHeaderBanner({ title, description, icon, extra }) {
  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(238, 0, 51, 0.6) 0%, rgba(196, 0, 39, 0.65) 100%), url("https://media.vneconomy.vn/images/upload/2024/07/15/screenshot-2024-07-15-at-15-09-51.png?w=1200")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: '0 4px 15px rgba(238, 0, 51, 0.1)',
        overflow: 'hidden',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 260 }}>
        {icon && (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 20,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ textAlign: 'left' }}>
          <h2 className="cake-title" style={{ margin: 0, color: '#ffffff', fontSize: 20, fontWeight: 700, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            {title}
          </h2>
          {description && (
            <p style={{ margin: '4px 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: 13, fontWeight: 500, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {extra && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {extra}
        </div>
      )}
    </div>
  )
}

export default PageHeaderBanner
