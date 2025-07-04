import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import LoginPage from './routes/LoginPage/LoginPage';
import Home from './routes/Home/Home';
import { Container } from '@mui/material';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';

function App() {
  return (
    <Container sx={{ mt: 4 }}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </Container>
  );
}

export default App;
