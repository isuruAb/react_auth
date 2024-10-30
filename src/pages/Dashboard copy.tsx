import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Dashboard2 = () => {
  const { accessToken,axios } = useAuth();

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        const response = await axios.post("/auth/protected", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log("Protected Data:", response.data);
      } catch (error) {
        console.error("Error fetching protected data:", error);
      }
    };

    if (accessToken) {
      fetchProtectedData();
    }
  }, [accessToken]);

  return <h2>Welcome to the Dashboard!</h2>;
};

export default Dashboard2;