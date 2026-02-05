import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import App from './App'
import ProtectedRoute from './components/Layout/ProtectedRoute'
import Login from './routes/Login'
import Home from './routes/Home'
import ExamUpload from './routes/ExamUpload'
import ExamParsing from './routes/ExamParsing'
import ExamDashboard from './routes/ExamDashboard'
import QuestionDetail from './routes/QuestionDetail'
import Export from './routes/Export'
import MaterialUpload from './routes/MaterialUpload'
import GenerateSpec from './routes/GenerateSpec'
import GenerateReview from './routes/GenerateReview'

const router = createBrowserRouter(
  [
    {
      element: <App />,
      children: [
        { path: '/login', element: <Login /> },
        {
          element: <ProtectedRoute />,
          children: [
            { index: true, element: <Home /> },
            { path: 'exams/upload', element: <ExamUpload /> },
            { path: 'exams/:examId/parse', element: <ExamParsing /> },
            { path: 'exams/:examId', element: <ExamDashboard /> },
            { path: 'exams/:examId/questions/:questionId', element: <QuestionDetail /> },
            { path: 'exams/:examId/export', element: <Export /> },
            { path: 'materials/upload', element: <MaterialUpload /> },
            { path: 'generate', element: <GenerateSpec /> },
            { path: 'generate/:jobId/review', element: <GenerateReview /> },
          ],
        },
      ],
    },
  ],
  { basename: '/mc-toetsgenerator' }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
