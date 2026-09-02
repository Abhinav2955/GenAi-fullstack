import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', withCredentials:true })
export const generateInterviewReport = async ({jobDescription,selfDescription,resumeFile}) => {
  const formData=new FormData(); formData.append('jobDescription',jobDescription); formData.append('selfDescription',selfDescription||''); if(resumeFile) formData.append('resume',resumeFile)
  return (await api.post('/api/v1/interviews',formData)).data
}
export const getInterviewReportById = async id => (await api.get(`/api/v1/interviews/report/${id}`)).data
export const getAllInterviewReports = async () => (await api.get('/api/v1/interviews')).data
export const generateResumePdf = async ({interviewReportId}) => (await api.post(`/api/v1/interviews/resume/pdf/${interviewReportId}`,null,{responseType:'blob'})).data
export const askInterviewAssistant = async ({interviewReportId,question}) => (await api.post(`/api/v1/interviews/report/${interviewReportId}/assistant`,{question})).data
