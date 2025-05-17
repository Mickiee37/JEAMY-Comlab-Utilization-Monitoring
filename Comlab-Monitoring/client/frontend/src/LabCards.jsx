import React, { useEffect, useState } from "react";
import LabCard from "./LabCard";
import axios from "axios";

const LabCards = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch labs from the database
        const labsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/labs`);
        
        // Sort labs by labNumber
        const sortedLabs = labsResponse.data.sort((a, b) => Number(a.labNumber) - Number(b.labNumber));
        
        // Log the data we received
        console.log("Labs data received:", sortedLabs);
        
        // Check if any labs are occupied
        const occupiedLabs = sortedLabs.filter(lab => lab.status === 'occupied');
        console.log(`${occupiedLabs.length} labs are currently occupied:`, 
          occupiedLabs.map(lab => `Lab ${lab.labNumber} (${lab.instructor})`).join(', '));
        
        // Set the labs data
        setLabs(sortedLabs);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Unable to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up a timer to refresh data every 5 seconds (more frequent updates)
    const intervalId = setInterval(() => {
      console.log("Refreshing labs data...");
      fetchData();
    }, 5000);
    
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading && labs.length === 0) return <div className="loading-spinner">Loading laboratories...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="lab-cards-container">
      {lastUpdate && <div className="last-update">Last updated: {lastUpdate}</div>}
      <div className="lab-cards">
        {labs.map((lab) => (
          <LabCard 
            key={lab.labNumber} 
            labNumber={lab.labNumber} 
            status={lab.status} 
            instructor={lab.instructor} 
            timeIn={lab.timeIn}
          />
        ))}
      </div>
    </div>
  );
};

export default LabCards; 