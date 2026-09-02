import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { register, login, logout, getMe } from "../services/auth.api.js";

export const useAuth = () => {
    const Context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = Context

    const handleLogin = async (email, password) => {
    setLoading(true)
    try {
        const data = await login({ email, password })
        setUser(data.user)
        return true
    } catch (err) {
        console.error(err)
        return false
    } finally {
        setLoading(false)
    }
}
    const handleRegister = async (username, email, password) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
            return true
        } catch (err) {
            console.error(err)
            return false
        } finally {
            setLoading(false)
        }
    }
    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {

        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) { } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return { user, loading, handleLogin, handleRegister, handleLogout }
}