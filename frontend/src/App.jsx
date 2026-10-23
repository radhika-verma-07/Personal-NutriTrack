import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FoodUpload from "./pages/FoodUpload";
import FoodVault from "./pages/FoodVault";
import ActivityTracker from "./pages/ActivityTracker";
import WeightTracker from "./pages/WeightTracker";
import WeeklyAnalysis from "./pages/WeeklyAnalysis";

import Navbar from "./components/Navbar";
import "./App.css";

function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />

        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/food-upload" element={<FoodUpload />} />
          <Route path="/food-vault" element={<FoodVault />} />
          <Route path="/activity" element={<ActivityTracker />} />
          <Route path="/weight" element={<WeightTracker />} />
          <Route path="/weekly" element={<WeeklyAnalysis />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
