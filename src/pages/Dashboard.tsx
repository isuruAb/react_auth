import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { isAuthenticated, logout } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        const response = await api.post("/auth/protected");
        setData(response.data);
      } catch (error) {
        console.error("Error fetching protected data:", error);
      }
    };

    if (isAuthenticated) fetchProtectedData();
  }, [isAuthenticated]);

  return (
    <div>
      <h1>Dashboard</h1>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Loading...</p>}
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

export default Dashboard;
