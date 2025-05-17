import React from 'react';
import LabCard from './LabCard';
import './ComlabContainer.css';

const labData = [
  { labNumber: 1, currentUser: null },
  { labNumber: 2, currentUser: null },
  { labNumber: 3, currentUser: null },
  { labNumber: 4, currentUser: null },
  { labNumber: 5, currentUser: null },
  { labNumber: 6, currentUser: null },
  { labNumber: 7, currentUser: null },
  { labNumber: 8, currentUser: null },
  { labNumber: 9, currentUser: null },
  { labNumber: 10, currentUser: null },
];

const ComlabContainer = () => {
  return (
    <div className="comlab-container">
      {labData.map((lab) => (
        <LabCard key={lab.labNumber} labNumber={lab.labNumber} currentUser={lab.currentUser} />
      ))}
    </div>
  );
};

export default ComlabContainer;
