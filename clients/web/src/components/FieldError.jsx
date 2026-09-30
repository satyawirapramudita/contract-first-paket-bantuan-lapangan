// clients/web/src/components/FieldError.jsx
import React from 'react';

export function FieldError({ errors, fieldName }) {
  if (!errors || errors.length === 0) return null;
  const match = errors.find((err) =>
    err.instancePath?.endsWith(`/${fieldName}`) ||
    err.params?.missingProperty === fieldName ||
    err.field === fieldName
  );

  if (!match) return null;
  return (
    <p className="mt-1 text-xs text-rose-600 font-medium">
      {match.message || 'Data yang dimasukkan tidak valid'}
    </p>
  );
}
