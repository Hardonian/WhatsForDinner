import React, { useState, useEffect } from 'react';
import ExperimentationService from '@whats-for-dinner/utils/experimentation-service';

interface ExperimentDashboardProps {
  userId: string;
}

export const ExperimentDashboard: React.FC<ExperimentDashboardProps> = ({ userId }) => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [experimentationService] = useState(() => new ExperimentationService(userId));

  useEffect(() => {
    // Load experiments
    const experimentList = [
      { id: 'homepage-hero', name: 'Homepage Hero Test', status: 'active' },
      { id: 'checkout-flow', name: 'Checkout Flow Optimization', status: 'draft' }
    ];
    setExperiments(experimentList);
  }, []);

  const getExperimentStats = (experimentId: string) => {
    return experimentationService.getExperimentStats(experimentId);
  };

  return (
    <div className="experiment-dashboard">
      <h2>Experiment Dashboard</h2>
      
      <div className="experiments-list">
        {experiments.map(experiment => (
          <div key={experiment.id} className="experiment-card">
            <h3>{experiment.name}</h3>
            <p>Status: {experiment.status}</p>
            <button onClick={() => setSelectedExperiment(experiment.id)}>
              View Details
            </button>
          </div>
        ))}
      </div>

      {selectedExperiment && (
        <div className="experiment-details">
          <h3>Experiment Details</h3>
          <pre>{JSON.stringify(getExperimentStats(selectedExperiment), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ExperimentDashboard;
