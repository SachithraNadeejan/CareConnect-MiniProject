import {Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import EmailVarify from './pages/EmailVarify';
import ResetPassword from './pages/ResetPassword';
import { ToastContainer} from 'react-toastify';
import Gallery from './pages/Gallery';
import Donate from './pages/Donate';
import About from './pages/About';
import AdminPanel from './pages/AdminPanel';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Proceed from './pages/Proceed';
import OtherDonations from './pages/OtherDonations';

const App = () => {
  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/email-verify' element={<EmailVarify/>}/>
        <Route path='/reset-password' element={<ResetPassword />}/>
        <Route path='/gallery' element={<Gallery />}/>
        <Route path='/donate' element={<Donate />}/>
        <Route path='/about' element={<About />}/>
        <Route path="/proceed" element={<Proceed />} />
        <Route path='/otherDonations' element={<OtherDonations />}/>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App