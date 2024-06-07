import FileWatcher from "./screens/FileWatcher";
import Signup from "./screens/Signup";
import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Login from "./screens/Login";
import PrivateRoute from "./PrivateRoute";
import Splash from "./screens/Splash";

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route index element={<Splash />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route
            path="dashboard"
            element={
              <PrivateRoute>
                <FileWatcher />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
