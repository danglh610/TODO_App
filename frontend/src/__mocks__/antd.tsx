/**
 * Mock Ant Design Components
 */

// Mock antd components
export const Button = ({ children, onClick, disabled, loading, type, icon, htmlType, ...props }: any) => (
  <button
    type={htmlType || 'button'}
    onClick={onClick}
    disabled={disabled || loading}
    data-type={type}
    {...props}
  >
    {loading && <span className="loading-spinner" />}
    {icon && <span className="icon">{icon}</span>}
    {children}
  </button>
);

export const Input = ({ placeholder, onChange, value, disabled, prefix, ...props }: any) => (
  <input
    type="text"
    placeholder={placeholder}
    onChange={onChange}
    value={value}
    disabled={disabled}
    data-prefix={prefix}
    {...props}
  />
);

Input.TextArea = ({ placeholder, onChange, value, rows, ...props }: any) => (
  <textarea
    placeholder={placeholder}
    onChange={onChange}
    value={value}
    rows={rows}
    {...props}
  />
);

export const Select = ({ options, value, onChange, placeholder, ...props }: any) => (
  <select value={value} onChange={(e: any) => onChange?.(e.target.value)} {...props}>
    {placeholder && <option value="">{placeholder}</option>}
    {options?.map((opt: any) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

Select.Option = ({ children, value }: any) => (
  <option value={value}>{children}</option>
);

export const DatePicker = ({ onChange, format, value, ...props }: any) => (
  <input
    type="date"
    onChange={(e: any) => onChange?.(e.target.value)}
    value={value}
    {...props}
  />
);

export const Form = ({ children, onFinish, onValuesChange, layout, ...props }: any) => (
  <form onSubmit={(e: any) => { e.preventDefault(); onFinish?.(); }} {...props}>
    {children}
  </form>
);

Form.Item = ({ children, name, label, rules, ...props }: any) => (
  <div data-field-name={name} data-label={label} {...props}>
    {children}
  </div>
);

Form.useForm = () => [
  {
    getFieldValue: () => '',
    setFieldsValue: () => {},
    validateFields: async () => ({}),
    resetFields: () => {},
  },
  { validateFields: async () => ({}) },
];

export const Checkbox = ({ checked, onChange, disabled, ...props }: any) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e: any) => onChange?.({ target: { checked: e.target.checked } })}
    disabled={disabled}
    {...props}
  />
);

export const Tag = ({ children, color, ...props }: any) => (
  <span className="ant-tag" data-color={color} {...props}>
    {children}
  </span>
);

export const Space = ({ children, size, ...props }: any) => (
  <div className="ant-space" data-size={size} {...props}>
    {children}
  </div>
);

export const Card = ({ children, bordered, hoverable, className, ...props }: any) => (
  <div className={`ant-card ${className || ''}`} data-bordered={bordered} data-hoverable={hoverable} {...props}>
    {children}
  </div>
);

export const Typography = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

Typography.Title = ({ children, level, ...props }: any) => {
  const TagName = `h${level || 2}`;
  return <TagName {...props}>{children}</TagName>;
};

Typography.Text = ({ children, delete: isDelete, type, ...props }: any) => (
  <span
    className={`ant-typography ${type ? `ant-typography-${type}` : ''}`}
    style={isDelete ? { textDecoration: 'line-through' } : undefined}
    {...props}
  >
    {children}
  </span>
);

export const Spin = ({ size, ...props }: any) => (
  <div className="ant-spin" data-size={size} {...props}>
    <span className="ant-spin-dot" />
  </div>
);

export const Alert = ({ type, message, description, showIcon, action, ...props }: any) => (
  <div className={`ant-alert ant-alert-${type}`} {...props}>
    {showIcon && <span className="ant-alert-icon" />}
    <span className="ant-alert-message">{message}</span>
    {description && <span className="ant-alert-description">{description}</span>}
    {action && <span className="ant-alert-action">{action}</span>}
  </div>
);

export const Empty = ({ description, children, ...props }: any) => (
  <div className="ant-empty" {...props}>
    <span className="ant-empty-description">{description}</span>
    {children && <div className="ant-empty-actions">{children}</div>}
  </div>
);

export const Pagination = ({ current, total, pageSize, onChange, showSizeChanger, showQuickJumper, ...props }: any) => (
  <div className="ant-pagination" {...props}>
    <button onClick={() => onChange?.(current - 1)} disabled={current <= 1}>Previous</button>
    <span>Page {current}</span>
    <button onClick={() => onChange?.(current + 1)} disabled={current >= Math.ceil(total / pageSize)}>Next</button>
  </div>
);

export const Tooltip = ({ title, children, ...props }: any) => (
  <span data-tooltip={title} {...props}>
    {children}
  </span>
);

export const Popconfirm = ({ title, description, onConfirm, okText, cancelText, okButtonProps, children, ...props }: any) => (
  <div className="ant-popconfirm" data-title={title} {...props}>
    {children}
  </div>
);

export const ConfigProvider = ({ children, theme: _theme, ...props }: any) => (
  <div data-config-provider {...props}>
    {children}
  </div>
);

// Mock theme
export const theme = {
  defaultAlgorithm: () => ({}),
  token: {},
};

export default {
  Button,
  Input,
  Select,
  DatePicker,
  Form,
  Checkbox,
  Tag,
  Space,
  Card,
  Typography,
  Spin,
  Alert,
  Empty,
  Pagination,
  Tooltip,
  Popconfirm,
  ConfigProvider,
  theme,
};
