import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import LostReport from "./components/LostReport";
import FoundReport from "./components/FoundReport";
import Matches from "./components/Matches";
import MyLostItems from "./components/MyLostItems";
import MyFoundItems from "./components/MyFoundItems";
import Search from "./components/Search";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/lost-report" element={<LostReport />} />
        <Route path="/found-report" element={<FoundReport />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/my-lost-items" element={<MyLostItems />} />
        <Route path="/my-found-items" element={<MyFoundItems />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
