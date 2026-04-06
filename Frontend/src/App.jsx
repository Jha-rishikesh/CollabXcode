import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import EditorPage from './pages/EditorPage';
import Login from './pages/Login'; // Naya import
import Signup from './pages/Signup'; // Naya import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Jab koi normal link kholega, toh Home dikhega */}
        <Route path="/" element={<Home />} />
        
        {/* Jab koi room join karega, toh Editor dikhega */}
        <Route path="/editor/:roomId" element={<EditorPage />} />

        {/* Login Page ka rasta */}
        <Route path="/login" element={<Login />} />

        {/* Signup Page ka rasta */}
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;