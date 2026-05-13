import s from './Modal.module.scss';

export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.header}>
          <h3>{title}</h3>
          <button className={s.close} onClick={onClose}>×</button>
        </div>
        <div className={s.body}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>
  );
}
