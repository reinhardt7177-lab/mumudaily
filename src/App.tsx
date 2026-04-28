import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Today from './pages/Today'
import Roster from './pages/Roster'
import Homework from './pages/Homework'
import Memos from './pages/Memos'
import Checklist from './pages/Checklist'
import Picker from './pages/Picker'
import Timer from './pages/Timer'
import Groups from './pages/Groups'
import Timetable from './pages/Timetable'
import DDay from './pages/DDay'
import QR from './pages/QR'
import Settings from './pages/Settings'
import ChimeRunner from './components/ChimeRunner'

export default function App() {
  return (
    <BrowserRouter>
      <ChimeRunner />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Today />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="roster" element={<Roster />} />
          <Route path="homework" element={<Homework />} />
          <Route path="memos" element={<Memos />} />
          <Route path="checklist" element={<Checklist />} />
          <Route path="dday" element={<DDay />} />
          <Route path="picker" element={<Picker />} />
          <Route path="timer" element={<Timer />} />
          <Route path="groups" element={<Groups />} />
          <Route path="qr" element={<QR />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
