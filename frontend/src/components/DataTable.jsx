import s from './DataTable.module.scss';

export default function DataTable({ columns, data, actions, empty = 'Chưa có dữ liệu' }) {
  return (
    <div className={s.wrap}>
      <table className={s.table}>
        <thead>
          <tr>
            {columns.map(c => <th key={c.key}>{c.label}</th>)}
            {actions && <th style={{ width: 1, whiteSpace: 'nowrap' }}>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr><td colSpan={columns.length + (actions ? 1 : 0)} className={s.empty}>{empty}</td></tr>
          )}
          {data.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map(c => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
              {actions && <td className={s.actions}>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
