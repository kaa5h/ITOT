import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UNSConfig from './pages/UNSConfig';
import AssetSelection from './pages/create-request/AssetSelection';
import DataDescription from './pages/create-request/DataDescription';
import ReviewAndSend from './pages/create-request/ReviewAndSend';
import OTResponse from './pages/OTResponse';
import ITReview from './pages/ITReview';
import ExportData from './pages/ExportData';
import AdminTemplates from './pages/admin/Templates';
import AdminFleet from './pages/admin/Fleet';
import AdminAI from './pages/admin/AIConfig';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/uns-config" element={<UNSConfig />} />
        <Route path="/create-request/asset" element={<AssetSelection />} />
        <Route path="/create-request/describe" element={<DataDescription />} />
        <Route path="/create-request/review" element={<ReviewAndSend />} />
        <Route path="/request/:id/respond" element={<OTResponse />} />
        <Route path="/request/:id/review" element={<ITReview />} />
        <Route path="/request/:id/export" element={<ExportData />} />
        <Route path="/admin/templates" element={<AdminTemplates />} />
        <Route path="/admin/fleet" element={<AdminFleet />} />
        <Route path="/admin/ai-config" element={<AdminAI />} />
      </Routes>
    </Layout>
  );
}

export default App;
