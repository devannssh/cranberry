import { createContext, useContext } from 'react'
// The signed-in account ({id,email,username,avatar,profileStyle,createdAt}) and a setter, so deep components (folder faces, profile) can read it.
export const UserCtx = createContext({ user: null, setUser: () => {} })
export const useUser = () => useContext(UserCtx)
