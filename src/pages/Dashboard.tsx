import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
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
console.log("accessToken==>",accessToken)
    if (accessToken) {
      fetchProtectedData();
    }
  }, []);

  return <h2>Welcome to the Dashboard!
    <Link to="/dashboard2">nice</Link>
  </h2>;
};

export default Dashboard;