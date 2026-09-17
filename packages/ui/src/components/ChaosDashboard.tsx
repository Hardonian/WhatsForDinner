import React, { useState, useEffect } from 'react';
import ChaosService from '@whats-for-dinner/utils/chaos-service';

export const ChaosDashboard: React.FC = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [chaosService] = useState(() => new ChaosService());

  useEffect(() => {
    setExperiments(chaosService.getExperiments());
  }, [chaosService]);

  const runExperiment = async (experimentId: string) => {
    try {
      const result = await chaosService.runExperiment(experimentId);
          } catch (error) {
      // Error handled: Experiment failed:
    }
  };

  return (
    <div className="chaos-dashboard">
      <h2>Chaos Engineering Dashboard</h2>
      
      <div className="experiments-list">
        {experiments.map(experiment => (
          <div key={experiment.id} className="experiment-card">
            <h3>{experiment.name}</h3>
            <p>{experiment.description}</p>
            <p>Severity: {experiment.severity}</p>
            <p>Status: {experiment.status}</p>
            <button onClick={() => runExperiment(experiment.id)}>
              Run Experiment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChaosDashboard;
