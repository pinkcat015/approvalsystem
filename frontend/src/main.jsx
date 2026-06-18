import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import router from './router'
import './index.css'

const themeConfig = {
  token: {
    colorPrimary: '#ee0033', // Đỏ Viettel chuẩn
    colorInfo: '#0088ff',
    colorSuccess: '#16a34a', // Xanh lục thành công
    colorWarning: '#ea580c', // Cam cảnh báo
    colorError: '#ee0033',
    colorBgBase: '#ffffff',
    colorTextBase: '#1a1a1a', // Chữ màu tối chuẩn corporate
    borderRadius: 8,         // Bo góc 8px chuẩn doanh nghiệp
    fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      colorBgHeader: '#ffffff',
      colorBgBody: '#f4f6fa',    // Nền thân trang màu xám xanh văn phòng
      colorBgTrigger: '#ee0033',
      headerHeight: 64,
    },
    Menu: {
      colorBgContainer: '#ee0033', // Nền sidebar đỏ Viettel rực rỡ
      colorItemBg: '#ee0033',
      colorItemBgSelected: '#ffffff', // Chọn mục đổi sang màu trắng
      colorItemTextSelected: '#ee0033', // Chữ màu đỏ Viettel khi active
      colorItemIconSelected: '#ee0033', // Icon màu đỏ Viettel khi active
      colorItemText: '#ffffff', // Chữ thường màu trắng
      colorItemIcon: '#ffffff', // Icon thường màu trắng
      colorItemTextHover: '#ffffff',
      colorItemIconHover: '#ffffff',
      borderRadius: 8,
    },
    Card: {
      colorBgContainer: '#ffffff',
      borderRadiusLG: 12,
      boxShadowCard: '0 4px 20px rgba(0, 0, 0, 0.03)',
      boxShadowTertiary: '0 2px 10px rgba(0, 0, 0, 0.01)',
    },
    Button: {
      borderRadius: 8, // Nút bo tròn 8px chuyên nghiệp
      controlHeight: 38,
      fontWeight: 600,
      boxShadow: 'none',
      colorPrimaryHover: '#d0002b', // Hover đỏ đậm
    },
    Input: {
      borderRadius: 8,
      controlHeight: 38,
      colorBgContainer: '#ffffff',
    },
    Select: {
      borderRadius: 8,
      controlHeight: 38,
      colorBgContainer: '#ffffff',
    },
    InputNumber: {
      borderRadius: 8,
      controlHeight: 38,
      colorBgContainer: '#ffffff',
    },
    DatePicker: {
      borderRadius: 8,
      controlHeight: 38,
      colorBgContainer: '#ffffff',
    },
    Table: {
      borderRadius: 12,
      colorRowHover: '#f8f9fa',
    }
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={viVN} theme={themeConfig}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </StrictMode>
)