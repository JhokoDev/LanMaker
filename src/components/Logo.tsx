import React from 'react';
import { Laptop } from 'lucide-react';

export function Logo({ size = 24 }: { size?: number }) {
  return <Laptop size={size} className="text-teal-600" />;
}
