import Modal from './Modal';

export default function ConfirmDialog({ open, message, onCancel, onConfirm, confirmLabel = 'Xoá' }) {
  return (
    <Modal open={open} title="Xác nhận" onClose={onCancel}
      footer={<>
        <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
        <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
      </>}>
      <p>{message}</p>
    </Modal>
  );
}
