export const STATUS_LABEL = {
  moi: 'Mới',
  dang_xu_ly: 'Đang xử lý',
  da_xu_ly: 'Đã xử lý',
  luu_tru: 'Lưu trữ'
};
export const STATUS_COLOR = {
  moi: '#f59e0b',
  dang_xu_ly: '#3b82f6',
  da_xu_ly: '#16a34a',
  luu_tru: '#6b7280'
};
export const DO_KHAN = { thuong: 'Thường', khan: 'Khẩn', hoa_toc: 'Hoả tốc' };

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '';
export const formatDT = (d) => d ? new Date(d).toLocaleString('vi-VN') : '';
