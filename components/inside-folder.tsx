"use client";

import { useEffect, useState } from "react";

const InsideFolder = ( 
  params: { parentId: string }
) => {
  const { parentId } = params;
  const[data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/get/long-term-storage/${parentId}`, {
        method: "GET"
      });   
      const result = await response.json();
      if (result.error) {
        console.error("Error fetching data: " + result.error);
        return;
      }
      setData(result);
    } catch (error) {
      console.error("An error occurred while fetching data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [parentId]);
  
  return (
    <div>
      
    </div>
  )
}

export default InsideFolder
