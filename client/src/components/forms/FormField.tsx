import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BaseComponentProps } from '@/types';

interface BaseFieldProps extends BaseComponentProps {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  description?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}

type FormFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps;

const FormField: React.FC<FormFieldProps> = React.memo((props) => {
  const { label, id, error, required, description, className = '' } = props;

  const renderField = () => {
    switch (props.type) {
      case 'textarea':
        return (
          <Textarea
            id={id}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            disabled={props.disabled}
            rows={props.rows}
            className={error ? 'border-destructive focus:ring-destructive' : ''}
          />
        );

      case 'select':
        return (
          <Select
            value={props.value}
            onValueChange={props.onChange}
            disabled={props.disabled}
          >
            <SelectTrigger className={error ? 'border-destructive focus:ring-destructive' : ''}>
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            id={id}
            type={props.type}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            disabled={props.disabled}
            className={error ? 'border-destructive focus:ring-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {renderField()}
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;