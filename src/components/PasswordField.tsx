import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName: string;
  labelClassName: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  hint?: string;
};

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  labelClassName,
  wrapperClassName,
  icon,
  autoComplete,
  required = false,
  maxLength = 128,
  hint,
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      <div className={wrapperClassName ?? 'relative'}>
        {icon}
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? `Ocultar ${label}` : `Mostrar ${label}`}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
      </div>
      {hint ? <p className="mt-2 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
};

export default PasswordField;
