'use client';

import React from 'react';
import { GoogleEmailInput, GoogleEmailInputProps } from '@/components/ui/google-email-input';

export interface AdminEmailInputProps extends Omit<GoogleEmailInputProps, 'targetRole'> {}

export function AdminEmailInput(props: AdminEmailInputProps) {
  return (
    <GoogleEmailInput
      {...props}
      targetRole="school_admin"
      label={props.label || 'Admin Google Email (For Sign-In)'}
      placeholder={props.placeholder || 'principal.name@gmail.com'}
      helperText={props.helperText || 'Google account the Principal uses to log in'}
      id={props.id || 'admin-google-email-input'}
    />
  );
}
