import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-ios-secondary uppercase tracking-wide px-1">
        {label}
      </label>
      {children}
    </div>
  );
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: string;
}

export function InputField({ label, suffix, ...props }: InputFieldProps) {
  return (
    <FormField label={label}>
      <div className="relative">
        <input {...props} className="bg-white rounded-xl px-4 py-3 text-[17px] w-full" />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ios-secondary text-[15px]">
            {suffix}
          </span>
        )}
      </div>
    </FormField>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function SelectField({ label, options, ...props }: SelectFieldProps) {
  return (
    <FormField label={label}>
      <select {...props} className="bg-white rounded-xl px-4 py-3 text-[17px] w-full">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
