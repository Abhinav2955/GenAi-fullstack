import axios from 'axios'
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:3000',withCredentials:true})
export async function register(data){ return (await api.post('/api/v1/auth/register',data)).data }
export async function login(data){ return (await api.post('/api/v1/auth/login',data)).data }
export async function logout(){ return (await api.post('/api/v1/auth/logout')).data }
export async function getMe(){ return (await api.get('/api/v1/auth/me')).data }
