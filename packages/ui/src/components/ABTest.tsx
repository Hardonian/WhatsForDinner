import React, { useEffect, useState } from 'react';
import ExperimentationService from '@whats-for-dinner/utils/experimentation-service';

interface ABTestProps {
  experimentId: string;
  children: (variant: string) => React.ReactNode;
  fallback?: React.ReactNode;
}

export const ABTest: React.FC<ABTestProps> = ({ 
  experimentId, 
  children, 
  fallback = null 
}) => {
  const [variant, setVariant] = useState<string | null>(null);
  const [experimentationService] = useState(() => new ExperimentationService('user-id'));

  useEffect(() => {
    const experimentVariant = experimentationService.getVariant(experimentId);
    setVariant(experimentVariant);
  }, [experimentId, experimentationService]);

  if (!variant) {
    return <>{fallback}</>;
  }

  return <>{children(variant)}</>;
};

export default ABTest;
